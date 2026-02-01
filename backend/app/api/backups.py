"""
Velero Dashboard Backend - Backups API

Backup 생성 및 조회 엔드포인트
"""

from fastapi import APIRouter, HTTPException
from typing import List
import logging
from datetime import datetime

from app.models.velero import Backup, CreateBackupRequest
from app.services.k8s_client import k8s_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/backups", tags=["backups"])


def _convert_backup_to_model(backup_cr: dict) -> Backup:
    """Convert Kubernetes Backup CR to Pydantic model"""
    metadata = backup_cr.get("metadata", {})
    spec = backup_cr.get("spec", {})
    status = backup_cr.get("status", {})
    
    return Backup(
        name=metadata.get("name", ""),
        phase=status.get("phase", "New"),
        start_timestamp=status.get("startTimestamp", metadata.get("creationTimestamp", "")),
        completion_timestamp=status.get("completionTimestamp"),
        warnings=status.get("warnings", 0),
        errors=status.get("errors", 0),
        backup_storage=spec.get("storageLocation", "default")
    )


@router.get("", response_model=List[Backup])
async def list_backups():
    """
    List all Velero Backups
    
    Returns:
        List of Backup objects
    """
    try:
        logger.info("Listing backups")
        backups_cr = k8s_client.list_backups()
        backups = [_convert_backup_to_model(b) for b in backups_cr]
        
        # Sort by start timestamp (descending)
        backups.sort(
            key=lambda x: x.start_timestamp if x.start_timestamp else "",
            reverse=True
        )
        
        logger.info(f"Found {len(backups)} backups")
        return backups
    
    except Exception as e:
        logger.error(f"Error listing backups: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=Backup)
async def create_backup(request: CreateBackupRequest):
    """
    Create a new Velero Backup
    
    Args:
        request: Backup creation request
    
    Returns:
        Created Backup object
    """
    try:
        logger.info(f"Creating backup: {request.name}")
        
        # Build Backup CR spec
        backup_spec = {
            "apiVersion": "velero.io/v1",
            "kind": "Backup",
            "metadata": {
                "name": request.name,
            },
            "spec": {}
        }
        
        # Add optional fields
        if request.included_namespaces:
            backup_spec["spec"]["includedNamespaces"] = request.included_namespaces
        
        if request.excluded_namespaces:
            backup_spec["spec"]["excludedNamespaces"] = request.excluded_namespaces
        
        if request.ttl:
            backup_spec["spec"]["ttl"] = request.ttl
        
        # Create backup
        created_backup_cr = k8s_client.create_backup(backup_spec)
        backup = _convert_backup_to_model(created_backup_cr)
        
        logger.info(f"Backup created successfully: {backup.name}")
        return backup
    
    except Exception as e:
        logger.error(f"Error creating backup: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{name}", response_model=Backup)
async def get_backup(name: str):
    """
    Get aspecific Backup
    
    Args:
        name: Backup name
    
    Returns:
        Backup object
    """
    try:
        logger.info(f"Getting backup: {name}")
        backup_cr = k8s_client.get_backup(name)
        backup = _convert_backup_to_model(backup_cr)
        return backup
    
    except Exception as e:
        logger.error(f"Error getting backup {name}: {e}")
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=f"Backup '{name}' not found")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{name}")
async def delete_backup(name: str):
    """
    Delete a Backup
    
    Args:
        name: Backup name
    
    Returns:
        Success message
    """
    try:
        logger.info(f"Deleting backup: {name}")
        k8s_client.delete_backup(name)
        return {"message": f"Backup '{name}' deleted successfully"}
    
    except Exception as e:
        logger.error(f"Error deleting backup {name}: {e}")
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=f"Backup '{name}' not found")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{name}/logs")
async def get_backup_logs(name: str):
    """
    Get Backup logs (download request)
    
    Args:
        name: Backup name
    
    Returns:
        Download URL or logs content
    """
    try:
        logger.info(f"Getting backup logs: {name}")
        logs = k8s_client.get_backup_logs(name)
        return {"downloadUrl": logs} if logs else {"message": "Logs not available yet"}
    
    except Exception as e:
        logger.error(f"Error getting backup logs {name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{name}/volume-backups")
async def get_backup_volume_backups(name: str):
    """
    Get PodVolumeBackups for a Backup
    
    Args:
        name: Backup name
    
    Returns:
        List of PodVolumeBackup objects
    """
    try:
        logger.info(f"Getting volume backups for: {name}")
        pvbs_raw = k8s_client.list_pod_volume_backups(backup_name=name)
        
        pvbs = []
        for pvb in pvbs_raw:
            metadata = pvb.get("metadata", {})
            spec = pvb.get("spec", {})
            status = pvb.get("status", {})
            
            pvbs.append({
                "name": metadata.get("name", ""),
                "pvcName": spec.get("pod", {}).get("volumes", [{}])[0].get("pvcName", ""),
                "volumeName": spec.get("volume", ""),
                "phase": status.get("phase", "New"),
                "message": status.get("message", ""),
                "progress": status.get("progress", {})
            })
        
        return pvbs
    
    except Exception as e:
        logger.error(f"Error getting volume backups {name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
