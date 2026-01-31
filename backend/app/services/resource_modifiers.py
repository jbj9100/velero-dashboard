"""
Velero Dashboard Backend - Resource Modifiers Helper

ConfigMap 생성 및 관리 for Velero Resource Modifiers
"""

from typing import List, Dict, Any
import yaml
import logging

from kubernetes import client
from kubernetes.client.rest import ApiException

from app.models.velero import ResourceModifierRule
from app.config import settings

logger = logging.getLogger(__name__)


def build_resource_modifiers_yaml(rules: List[ResourceModifierRule]) -> str:
    """
    Build resource-modifiers.yaml content from rules
    
    Args:
        rules: List of ResourceModifierRule objects
        
    Returns:
        YAML string for resource modifiers
    """
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


def create_resource_modifiers_configmap(
    core_api: client.CoreV1Api,
    namespace: str,
    restore_name: str,
    rules: List[ResourceModifierRule]
) -> str:
    """
    Create a ConfigMap with resource modifier rules
    
    Args:
        core_api: Kubernetes CoreV1Api client
        namespace: Namespace to create ConfigMap in
        restore_name: Name of the restore (used for ConfigMap naming)
        rules: List of ResourceModifierRule objects
        
    Returns:
        Name of the created ConfigMap
    """
    configmap_name = f"restore-resource-modifiers-{restore_name}"
    
    # Build YAML content
    modifiers_yaml = build_resource_modifiers_yaml(rules)
    
    # Create ConfigMap
    configmap = client.V1ConfigMap(
        api_version="v1",
        kind="ConfigMap",
        metadata=client.V1ObjectMeta(
            name=configmap_name,
            namespace=namespace,
            labels={
                "velero.io/restore-name": restore_name,
                "app.kubernetes.io/managed-by": "velero-dashboard"
            }
        ),
        data={
            "resource-modifiers.yaml": modifiers_yaml
        }
    )
    
    try:
        core_api.create_namespaced_config_map(
            namespace=namespace,
            body=configmap
        )
        logger.info(f"Created ConfigMap {configmap_name} for restore {restore_name}")
        return configmap_name
    
    except ApiException as e:
        logger.error(f"Error creating ConfigMap: {e}")
        raise


def delete_resource_modifiers_configmap(
    core_api: client.CoreV1Api,
    namespace: str,
    configmap_name: str
) -> None:
    """
    Delete a resource modifiers ConfigMap
    
    Args:
        core_api: Kubernetes CoreV1Api client
        namespace: Namespace of the ConfigMap
        configmap_name: Name of the ConfigMap to delete
    """
    try:
        core_api.delete_namespaced_config_map(
            name=configmap_name,
            namespace=namespace
        )
        logger.info(f"Deleted ConfigMap {configmap_name}")
    
    except ApiException as e:
        if e.status == 404:
            logger.warning(f"ConfigMap {configmap_name} not found, already deleted")
        else:
            logger.error(f"Error deleting ConfigMap: {e}")
            raise
