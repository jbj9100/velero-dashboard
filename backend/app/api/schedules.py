"""
Velero Dashboard Backend - Schedules API

Schedule 생성, 조회, 삭제 엔드포인트
"""

from fastapi import APIRouter, HTTPException
from typing import List
import logging

from app.models.velero import Schedule, CreateScheduleRequest, ScheduleTemplate
from app.services.k8s_client import k8s_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/schedules", tags=["schedules"])


def _convert_schedule_to_model(schedule_cr: dict) -> Schedule:
    """Convert Kubernetes Schedule CR to Pydantic model"""
    metadata = schedule_cr.get("metadata", {})
    spec = schedule_cr.get("spec", {})
    status = schedule_cr.get("status", {})
    
    # Parse template if exists
    template_spec = spec.get("template", {})
    template = None
    if template_spec:
        template = ScheduleTemplate(
            included_namespaces=template_spec.get("includedNamespaces"),
            excluded_namespaces=template_spec.get("excludedNamespaces"),
            ttl=template_spec.get("ttl")
        )
    
    return Schedule(
        name=metadata.get("name", ""),
        schedule=spec.get("schedule", ""),
        last_backup=status.get("lastBackup"),
        enabled=not spec.get("paused", False),
        template=template
    )


@router.get("", response_model=List[Schedule])
async def list_schedules():
    """
    List all Velero Schedules
    
    Returns:
        List of Schedule objects
    """
    try:
        logger.info("Listing schedules")
        schedules_cr = k8s_client.list_schedules()
        schedules = [_convert_schedule_to_model(s) for s in schedules_cr]
        
        logger.info(f"Found {len(schedules)} schedules")
        return schedules
    
    except Exception as e:
        logger.error(f"Error listing schedules: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=Schedule)
async def create_schedule(request: CreateScheduleRequest):
    """
    Create a new Velero Schedule
    
    Args:
        request: Schedule creation request
    
    Returns:
        Created Schedule object
    """
    try:
        logger.info(f"Creating schedule: {request.name}")
        
        # Build Schedule CR spec
        schedule_spec = {
            "apiVersion": "velero.io/v1",
            "kind": "Schedule",
            "metadata": {
                "name": request.name,
            },
            "spec": {
                "schedule": request.schedule,
                "template": {}
            }
        }
        
        # Add optional template fields
        if request.included_namespaces:
            schedule_spec["spec"]["template"]["includedNamespaces"] = request.included_namespaces
        
        if request.excluded_namespaces:
            schedule_spec["spec"]["template"]["excludedNamespaces"] = request.excluded_namespaces
        
        if request.ttl:
            schedule_spec["spec"]["template"]["ttl"] = request.ttl
        
        # Create schedule
        created_schedule_cr = k8s_client.create_schedule(schedule_spec)
        schedule = _convert_schedule_to_model(created_schedule_cr)
        
        logger.info(f"Schedule created successfully: {schedule.name}")
        return schedule
    
    except Exception as e:
        logger.error(f"Error creating schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{name}")
async def delete_schedule(name: str):
    """
    Delete a Schedule
    
    Args:
        name: Schedule name
    
    Returns:
        Success message
    """
    try:
        logger.info(f"Deleting schedule: {name}")
        k8s_client.delete_schedule(name)
        logger.info(f"Schedule deleted successfully: {name}")
        return {"message": f"Schedule '{name}' deleted successfully"}
    
    except Exception as e:
        logger.error(f"Error deleting schedule {name}: {e}")
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=f"Schedule '{name}' not found")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{name}", response_model=Schedule)
async def get_schedule(name: str):
    """
    Get a specific Schedule
    
    Args:
        name: Schedule name
    
    Returns:
        Schedule object
    """
    try:
        logger.info(f"Getting schedule: {name}")
        schedule_cr = k8s_client.get_schedule(name)
        schedule = _convert_schedule_to_model(schedule_cr)
        return schedule
    
    except Exception as e:
        logger.error(f"Error getting schedule {name}: {e}")
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=f"Schedule '{name}' not found")
        raise HTTPException(status_code=500, detail=str(e))
