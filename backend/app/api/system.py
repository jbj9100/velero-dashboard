"""
Velero Dashboard Backend - System API

시스템 상태 모니터링 엔드포인트 (Repositories, Node Agents)
"""

from fastapi import APIRouter, HTTPException
from typing import List
import logging

from app.services.k8s_client import k8s_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["system"])


@router.get("/repositories")
async def get_repositories():
    """
    Get Velero Backup Repositories status
    
    Returns:
        List of backup repository objects with status
    """
    try:
        logger.info("Getting backup repositories")
        repos_raw = k8s_client.list_backup_repositories()
        
        repos = []
        for repo in repos_raw:
            metadata = repo.get("metadata", {})
            spec = repo.get("spec", {})
            status = repo.get("status", {})
            
            repos.append({
                "name": metadata.get("name", ""),
                "phase": status.get("phase", "Unknown"),
                "maintenanceFrequency": spec.get("maintenanceFrequency"),
                "lastMaintenanceTime": status.get("lastMaintenanceTime"),
                "message": status.get("message", "")
            })
        
        logger.info(f"Found {len(repos)} repositories")
        return repos
    
    except Exception as e:
        logger.error(f"Error getting repositories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/node-agents")
async def get_node_agents():
    """
    Get Velero Node Agent pods status
    
    Returns:
        List of node agent pods with status
    """
    try:
        logger.info("Getting node agent pods")
        pods = k8s_client.list_node_agent_pods()
        
        agents = []
        for pod in pods:
            metadata = pod.get("metadata", {})
            spec = pod.get("spec", {})
            status = pod.get("status", {})
            
            # Get container statuses
            container_statuses = status.get("containerStatuses", [])
            restart_count = container_statuses[0].get("restartCount", 0) if container_statuses else 0
            
            agents.append({
                "name": metadata.get("name", ""),
                "nodeName": spec.get("nodeName", ""),
                "status": status.get("phase", "Unknown"),
                "restartCount": restart_count
            })
        
        logger.info(f"Found {len(agents)} node agents")
        return agents
    
    except Exception as e:
        logger.error(f"Error getting node agents: {e}")
        raise HTTPException(status_code=500, detail=str(e))
