"""
Velero Dashboard Backend - Storage API

BackupStorageLocation 조회, 수정, S3 검증 엔드포인트
"""

from fastapi import APIRouter, HTTPException
from typing import List
import logging

from app.models.velero import (
    BackupStorageLocation,
    UpdateBSLRequest,
    ValidateStorageRequest,
    ValidateStorageResponse,
    BSLConfig
)
from app.services.k8s_client import k8s_client
from app.services.s3_client import s3_validation_service
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/storage", tags=["storage"])


def _convert_bsl_to_model(bsl_cr: dict) -> BackupStorageLocation:
    """Convert Kubernetes BSL CR to Pydantic model"""
    metadata = bsl_cr.get("metadata", {})
    spec = bsl_cr.get("spec", {})
    status = bsl_cr.get("status", {})
    
    # Parse config
    config_data = spec.get("config", {})
    config = BSLConfig(
        region=config_data.get("region"),
        s3_url=config_data.get("s3Url"),
        **{k: v for k, v in config_data.items() if k not in ["region", "s3Url"]}
    )
    
    return BackupStorageLocation(
        name=metadata.get("name", ""),
        provider=spec.get("provider", ""),
        bucket=spec.get("objectStorage", {}).get("bucket", ""),
        prefix=spec.get("objectStorage", {}).get("prefix"),
        access_mode=spec.get("accessMode", "ReadWrite"),
        phase=status.get("phase", "Unknown"),
        last_validation_time=status.get("lastValidationTime"),
        message=status.get("message"),
        config=config
    )


@router.get("/bsl", response_model=List[BackupStorageLocation])
async def list_backup_storage_locations():
    """
    List all BackupStorageLocations
    
    Returns:
        List of BSL objects
    """
    try:
        logger.info("Listing BackupStorageLocations")
        bsls_cr = k8s_client.list_backup_storage_locations()
        bsls = [_convert_bsl_to_model(b) for b in bsls_cr]
        
        logger.info(f"Found {len(bsls)} BackupStorageLocations")
        return bsls
    
    except Exception as e:
        logger.error(f"Error listing BSLs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/bsl", response_model=BackupStorageLocation)
async def update_backup_storage_location(request: UpdateBSLRequest):
    """
    Update a BackupStorageLocation
    
    Args:
        request: BSL update request
    
    Returns:
        Updated BSL object
    """
    try:
        logger.info(f"Updating BSL: {request.name}")
        
        # Build patch
        patch = {
            "spec": {}
        }
        
        if request.bucket:
            patch["spec"]["objectStorage"] = {
                "bucket": request.bucket
            }
            if request.prefix:
                patch["spec"]["objectStorage"]["prefix"] = request.prefix
        
        if request.provider:
            patch["spec"]["provider"] = request.provider
        
        if request.config:
            config_dict = {}
            if request.config.region:
                config_dict["region"] = request.config.region
            if request.config.s3_url:
                config_dict["s3Url"] = request.config.s3_url
            
            if config_dict:
                patch["spec"]["config"] = config_dict
        
        # Apply patch
        updated_bsl_cr = k8s_client.patch_backup_storage_location(
            name=request.name,
            patch=patch
        )
        
        bsl = _convert_bsl_to_model(updated_bsl_cr)
        logger.info(f"BSL updated successfully: {bsl.name}")
        return bsl
    
    except Exception as e:
        logger.error(f"Error updating BSL: {e}")
        if "not found" in str(e).lower():
            raise HTTPException(
                status_code=404,
                detail=f"BSL '{request.name}' not found"
            )
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate", response_model=ValidateStorageResponse)
async def validate_storage(request: ValidateStorageRequest):
    """
    Validate S3 storage connection
    
    Args:
        request: Storage validation request
    
    Returns:
        Validation result
    """
    try:
        logger.info(f"Validating S3 storage: {request.s3_url}/{request.bucket}")
        
        # Use credentials from request or fall back to settings
        access_key = request.access_key or settings.s3_access_key
        secret_key = request.secret_key or settings.s3_secret_key
        
        success, message, object_count, latest_backup = (
            s3_validation_service.validate_storage(
                s3_url=request.s3_url,
                bucket=request.bucket,
                region=request.region,
                access_key=access_key,
                secret_key=secret_key,
                prefix=request.prefix
            )
        )
        
        logger.info(f"Validation result: success={success}, message={message}")
        
        return ValidateStorageResponse(
            success=success,
            message=message,
            object_count=object_count,
            latest_backup=latest_backup
        )
    
    except Exception as e:
        logger.error(f"Error validating storage: {e}")
        raise HTTPException(status_code=500, detail=str(e))
