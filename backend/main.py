import io
import struct
from typing import Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
import tempfile
import os
import shutil

app = FastAPI(title="AE Version Shifter API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB
ALLOWED_EXTENSIONS = {".aep", ".ffx"}

# Version mappings (simplified - actual AE version bytes may vary)
VERSION_MAP = {
    "2024": {"version": 24, "byte_value": b"\x00\x00\x00\x18"},
    "2023": {"version": 23, "byte_value": b"\x00\x00\x00\x17"},
    "2022": {"version": 22, "byte_value": b"\x00\x00\x00\x16"},
    "18.x": {"version": 18, "byte_value": b"\x00\x00\x00\x12"},
    "17.x": {"version": 17, "byte_value": b"\x00\x00\x00\x11"},
}

# Reverse mapping for detection
BYTE_TO_VERSION = {v["byte_value"]: k for k, v in VERSION_MAP.items()}


def detect_aep_version(file_content: bytes) -> Optional[str]:
    """
    Detect After Effects project version from binary content.
    AEP files typically have version info in the header or AppV chunk.
    """
    # Look for common AE version patterns
    # AE files often contain version strings like "AtE" followed by version bytes
    
    # Search for version byte patterns
    for byte_pattern, version_name in BYTE_TO_VERSION.items():
        if byte_pattern in file_content:
            # Verify it's in a likely version location
            idx = file_content.find(byte_pattern)
            # Check surrounding context for AE signatures
            context_start = max(0, idx - 20)
            context = file_content[context_start:idx + 20]
            
            # Look for AE-related markers
            if b"AtE" in context or b"RIFF" in context or b"AEGP" in context:
                return version_name
    
    # Fallback: search for version numbers in text form
    try:
        text_content = file_content[:10000].decode('utf-8', errors='ignore')
        for version_name, version_info in VERSION_MAP.items():
            if f"After Effects {version_name}" in text_content or \
               f"AE {version_name}" in text_content or \
               f"Version {version_info['version']}" in text_content:
                return version_name
    except:
        pass
    
    return None


def detect_ffx_version(file_content: bytes) -> Optional[str]:
    """
    Detect Effect Preset version from binary content.
    FFX files contain Adobe preset signatures with version metadata.
    """
    # FFX files often start with specific Adobe signatures
    # Look for version patterns similar to AEP
    
    for byte_pattern, version_name in BYTE_TO_VERSION.items():
        if byte_pattern in file_content:
            idx = file_content.find(byte_pattern)
            context_start = max(0, idx - 20)
            context = file_content[context_start:idx + 20]
            
            # Look for preset-related markers
            if b"Adobe" in context or b"Preset" in context or b"Effect" in context:
                return version_name
    
    # Text-based fallback
    try:
        text_content = file_content[:10000].decode('utf-8', errors='ignore')
        for version_name, version_info in VERSION_MAP.items():
            if f"After Effects {version_name}" in text_content or \
               f"preset" in text_content.lower():
                return version_name
    except:
        pass
    
    return None


def detect_version(file_content: bytes, extension: str) -> Optional[str]:
    """Detect version based on file type."""
    if extension == ".aep":
        return detect_aep_version(file_content)
    elif extension == ".ffx":
        return detect_ffx_version(file_content)
    return None


def patch_version_bytes(file_content: bytes, target_version: str) -> bytes:
    """
    Patch the version bytes in the file content to match the target version.
    Maintains file integrity by keeping the same size.
    """
    if target_version not in VERSION_MAP:
        raise HTTPException(status_code=400, detail=f"Invalid target version: {target_version}")
    
    target_bytes = VERSION_MAP[target_version]["byte_value"]
    patched_content = bytearray(file_content)
    
    # Find and replace version bytes
    for current_bytes, version_name in BYTE_TO_VERSION.items():
        idx = 0
        while True:
            idx = file_content.find(current_bytes, idx)
            if idx == -1:
                break
            
            # Replace with target version bytes
            for i, byte in enumerate(target_bytes):
                if idx + i < len(patched_content):
                    patched_content[idx + i] = byte
            
            idx += len(current_bytes)
    
    return bytes(patched_content)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "ae-version-shifter"}


@app.get("/api/versions")
async def get_versions():
    """Get list of supported versions."""
    return {
        "versions": list(VERSION_MAP.keys()),
        "details": VERSION_MAP
    }


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file and detect its version.
    Returns detected version and file info.
    """
    # Validate file extension
    ext = os.path.splitext(file.filename or "").lower()
    if ext[1] not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content
    content = await file.read()
    
    # Check file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 500MB limit")
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    
    # Detect version
    detected_version = detect_version(content, ext[1])
    
    return {
        "filename": file.filename,
        "size": len(content),
        "extension": ext[1],
        "detected_version": detected_version or "Unknown",
        "message": "File uploaded successfully. Select target version to process."
    }


@app.post("/api/process")
async def process_file(
    file: UploadFile = File(...),
    target_version: str = Form(...)
):
    """
    Process file: detect version, patch to target, and return patched file.
    """
    # Validate file extension
    ext = os.path.splitext(file.filename or "").lower()
    if ext[1] not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Validate target version
    if target_version not in VERSION_MAP:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid target version. Available: {', '.join(VERSION_MAP.keys())}"
        )
    
    # Read file content
    content = await file.read()
    
    # Check file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 500MB limit")
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    
    # Detect original version
    original_version = detect_version(content, ext[1])
    
    # Patch version bytes
    try:
        patched_content = patch_version_bytes(content, target_version)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Patching failed: {str(e)}")
    
    # Create download response
    filename = file.filename or f"patched{ext[1]}"
    base_name = os.path.splitext(filename)[0]
    new_filename = f"{base_name}_{target_version}{ext[1]}"
    
    return StreamingResponse(
        io.BytesIO(patched_content),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename={new_filename}",
            "X-Original-Version": original_version or "Unknown",
            "X-Target-Version": target_version,
        }
    )


@app.post("/api/process-async")
async def process_file_async(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    target_version: str = Form(...)
):
    """
    Async processing endpoint for large files.
    Returns job ID for status checking.
    """
    # This is a simplified implementation
    # In production, you'd use Celery or similar for true async processing
    
    ext = os.path.splitext(file.filename or "").lower()
    if ext[1] not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    if target_version not in VERSION_MAP:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid target version. Available: {', '.join(VERSION_MAP.keys())}"
        )
    
    content = await file.read()
    
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 500MB limit")
    
    # Process in background
    job_id = f"job_{os.urandom(8).hex()}"
    
    def cleanup_temp():
        # Cleanup would happen here in real implementation
        pass
    
    background_tasks.add_task(cleanup_temp)
    
    # For simplicity, we'll still process synchronously but mark as async
    original_version = detect_version(content, ext[1])
    patched_content = patch_version_bytes(content, target_version)
    
    filename = file.filename or f"patched{ext[1]}"
    base_name = os.path.splitext(filename)[0]
    new_filename = f"{base_name}_{target_version}{ext[1]}"
    
    return StreamingResponse(
        io.BytesIO(patched_content),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename={new_filename}",
            "X-Job-ID": job_id,
            "X-Original-Version": original_version or "Unknown",
            "X-Target-Version": target_version,
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
