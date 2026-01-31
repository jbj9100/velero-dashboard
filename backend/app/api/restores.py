"""
Velero Dashboard Backend - Restores API

Restore 생성 및 조회 엔드포인트
"""

from fastapi import APIRouter, HTTPException
from typing import List
import logging
import yaml

from app.models.velero import (
    Restore, 
    CreateRestoreRequest,
    CreateRestoreWithModificationsRequest,
    ResourceModifierRule
)
from app.services.k8s_client import k8s_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/restores", tags=["restores"])


def _build_resource_modifiers_yaml(rules: List[ResourceModifierRule]) -> str:
    """Build resource-modifiers.yaml content from rules"""
    modifiers_dict = {
        "version": "v1",
        "resourceModifierRules": []
    }
    
    for rule in rules:
        rule_dict = {
            "conditions": {},
            "patches": []
        }
        
        # Build conditions
        if rule.conditions.group_resource:
            rule_dict["conditions"]["groupResource"] = rule.conditions.group_resource
        
        if rule.conditions.resource_name_regex:
            rule_dict["conditions"]["resourceNameRegex"] = rule.conditions.resource_name_regex
        
        if rule.conditions.namespaces:
            rule_dict["conditions"]["namespaces"] = rule.conditions.namespaces
        
        if rule.conditions.label_selector:
            rule_dict["conditions"]["labelSelector"] = rule.conditions.label_selector
        
        # Build patches
        for patch in rule.patches:
            patch_dict = {
                "operation": patch.operation,
                "path": patch.path
            }
            
            if patch.value is not None:
                patch_dict["value"] = patch.value
            
            if patch.from_path:
                patch_dict["from"] = patch.from_path
            
            rule_dict["patches"].append(patch_dict)
        
        modifiers_dict["resourceModifierRules"].append(rule_dict)
    
    return yaml.dump(modifiers_dict, default_flow_style=False, sort_keys=False)


def _convert_restore_to_model(restore_cr: dict) -> Restore:
    """Convert Kubernetes Restore CR to Pydantic model"""
    metadata = restore_cr.get("metadata", {})
    spec = restore_cr.get("spec", {})
    status = restore_cr.get("status", {})
    
    return Restore(
        name=metadata.get("name", ""),
        phase=status.get("phase", "New"),
        backup_name=spec.get("backupName", ""),
        start_timestamp=status.get("startTimestamp", metadata.get("creationTimestamp", "")),
        completion_timestamp=status.get("completionTimestamp"),
        warnings=status.get("warnings", 0),
        errors=status.get("errors", 0)
    )


@router.get("", response_model=List[Restore])
async def list_restores():
    """
    List all Velero Restores
    
    Returns:
        List of Restore objects
    """
    try:
        logger.info("Listing restores")
        restores_cr = k8s_client.list_restores()
        restores = [_convert_restore_to_model(r) for r in restores_cr]
        
        # Sort by start timestamp (descending)
        restores.sort(
            key=lambda x: x.start_timestamp if x.start_timestamp else "",
            reverse=True
        )
        
        logger.info(f"Found {len(restores)} restores")
        return restores
    
    except Exception as e:
        logger.error(f"Error listing restores: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=Restore)
async def create_restore(request: CreateRestoreRequest):
    """
    Create a new Velero Restore
    
    Args:
        request: Restore creation request
    
    Returns:
        Created Restore object
    """
    try:
        logger.info(f"Creating restore: {request.name} from backup: {request.backup_name}")
        
        # Build Restore CR spec
        restore_spec = {
            "apiVersion": "velero.io/v1",
            "kind": "Restore",
            "metadata": {
                "name": request.name,
            },
            "spec": {
                "backupName": request.backup_name,
            }
        }
        
        # Add optional fields
        if request.included_namespaces:
            restore_spec["spec"]["includedNamespaces"] = request.included_namespaces
        
        if request.excluded_namespaces:
            restore_spec["spec"]["excludedNamespaces"] = request.excluded_namespaces
        
        # Create restore
        created_restore_cr = k8s_client.create_restore(restore_spec)
        restore = _convert_restore_to_model(created_restore_cr)
        
        logger.info(f"Restore created successfully: {restore.name}")
        return restore
    
    except Exception as e:
        logger.error(f"Error creating restore: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/with-modifications", response_model=Restore)
async def create_restore_with_modifications(request: CreateRestoreWithModificationsRequest):
    """
    Create a Velero Restore with resource modifications
    
    This endpoint creates a ConfigMap with resource modifier rules,
    then creates a Restore that references this ConfigMap.
    
    Args:
        request: Restore creation request with modification rules
    
    Returns:
        Created Restore object
    
    Example:
        {
            "name": "restore-prod-to-staging",
            "backupName": "prod-backup-20240131",
            "includedNamespaces": ["production"],
            "resourceModifierRules": [
                {
                    "conditions": {
                        "groupResource": "deployments.apps",
                        "namespaces": ["production"]
                    },
                    "patches": [
                        {
                            "operation": "replace",
                            "path": "/spec/replicas",
                            "value": 1
                        }
                    ]
                }
            ]
        }
    """
    try:
        logger.info(f"Creating restore with modifications: {request.name} from backup: {request.backup_name}")
        
        # 1. Create ConfigMap with resource modifiers
        configmap_name = f"restore-resource-modifiers-{request.name}"
        modifiers_yaml = _build_resource_modifiers_yaml(request.resource_modifier_rules)
        
        k8s_client.create_config_map(
            name=configmap_name,
            data={"resource-modifiers.yaml": modifiers_yaml},
            labels={
                "velero.io/restore-name": request.name,
                "app.kubernetes.io/managed-by": "velero-dashboard"
            }
        )
        
        logger.info(f"Created ConfigMap {configmap_name} for restore {request.name}")
        
        # 2. Build Restore CR spec with resourceModifier reference
        restore_spec = {
            "apiVersion": "velero.io/v1",
            "kind": "Restore",
            "metadata": {
                "name": request.name,
            },
            "spec": {
                "backupName": request.backup_name,
                "resourceModifier": {
                    "kind": "ConfigMap",
                    "name": configmap_name
                }
            }
        }
        
        # Add optional fields
        if request.included_namespaces:
            restore_spec["spec"]["includedNamespaces"] = request.included_namespaces
        
        if request.excluded_namespaces:
            restore_spec["spec"]["excludedNamespaces"] = request.excluded_namespaces
        
        # 3. Create restore
        created_restore_cr = k8s_client.create_restore(restore_spec)
        restore = _convert_restore_to_model(created_restore_cr)
        
        logger.info(f"Restore with modifications created successfully: {restore.name}")
        logger.info(f"Resource modifier ConfigMap: {configmap_name}")
        
        return restore
    
    except Exception as e:
        logger.error(f"Error creating restore with modifications: {e}")
        # Try to cleanup ConfigMap if restore creation failed
        if configmap_name:
            try:
                k8s_client.delete_config_map(configmap_name)
                logger.info(f"Cleaned up ConfigMap {configmap_name} after failure")
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup ConfigMap: {cleanup_error}")
        
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{name}", response_model=Restore)
async def get_restore(name: str):
    """
    Get a specific Restore
    
    Args:
        name: Restore name
    
    Returns:
        Restore object
    """
    try:
        logger.info(f"Getting restore: {name}")
        restore_cr = k8s_client.get_restore(name)
        restore = _convert_restore_to_model(restore_cr)
        return restore
    
    except Exception as e:
        logger.error(f"Error getting restore {name}: {e}")
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=f"Restore '{name}' not found")
        raise HTTPException(status_code=500, detail=str(e))
