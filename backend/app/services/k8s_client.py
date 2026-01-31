"""
Velero Dashboard Backend - Kubernetes Client Wrapper

Velero Custom Resources와 통신하는 클라이언트
"""

from kubernetes import client, config as k8s_config
from kubernetes.client.rest import ApiException
from typing import Optional, List, Dict, Any
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class KubernetesClient:
    """Kubernetes API client wrapper for Velero CRs"""
    
    def __init__(self):
        """Initialize Kubernetes client"""
        self._load_kube_config()
        self.custom_api = client.CustomObjectsApi()
        self.core_api = client.CoreV1Api()
        
        # Velero API group and version
        self.velero_group = "velero.io"
        self.velero_version = "v1"
        self.namespace = settings.velero_namespace
    
    def _load_kube_config(self):
        """Load Kubernetes configuration"""
        try:
            if settings.kubeconfig_path:
                # Load from kubeconfig file
                k8s_config.load_kube_config(config_file=settings.kubeconfig_path)
                logger.info(f"Loaded kubeconfig from: {settings.kubeconfig_path}")
            else:
                # Load in-cluster config (for Pod deployment)
                k8s_config.load_incluster_config()
                logger.info("Loaded in-cluster Kubernetes config")
        except Exception as e:
            logger.error(f"Failed to load Kubernetes config: {e}")
            raise
    
    # ===== BACKUP OPERATIONS =====
    
    def list_backups(self) -> List[Dict[str, Any]]:
        """List all Velero Backups"""
        try:
            response = self.custom_api.list_namespaced_custom_object(
                group=self.velero_group,
                version=self.velero_version,
                namespace=self.namespace,
                plural="backups"
            )
            return response.get("items", [])
        except ApiException as e:
            logger.error(f"Error listing backups: {e}")
            raise
    
    def get_backup(self, name: str) -> Dict[str, Any]:
        """Get a specific Backup"""
        try:
            return self.custom_api.get_namespaced_custom_object(
                group=self.velero_group,
                version=self.velero_version,
                namespace=self.namespace,
                plural="backups",
                name=name
            )
        except ApiException as e:
            logger.error(f"Error getting backup {name}: {e}")
            raise
    
    def create_backup(self, backup_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new Backup"""
        try:
            return self.custom_api.create_namespaced_custom_object(
                group=self.velero_group,
                version=self.velero_version,
                namespace=self.namespace,
                plural="backups",
                body=backup_spec
            )
        except ApiException as e:
            logger.error(f"Error creating backup: {e}")
            raise
    
    # ===== RESTORE OPERATIONS =====
    
    def list_restores(self) -> List[Dict[str, Any]]:
        """List all Velero Restores"""
        try:
            response = self.custom_api.list_namespaced_custom_object(
                group=self.velero_group,
                version=self.velero_version,
                namespace=self.namespace,
                plural="restores"
            )
            return response.get("items", [])
        except ApiException as e:
            logger.error(f"Error listing restores: {e}")
            raise
    
    def get_restore(self, name: str) -> Dict[str, Any]:
        """Get a specific Restore"""
        try:
            return self.custom_api.get_namespaced_custom_object(
                group=self.velero_group,
                version=self.velero_version,
                namespace=self.namespace,
                plural="restores",
                name=name
            )
        except ApiException as e:
            logger.error(f"Error getting restore {name}: {e}")
            raise
    
    def create_restore(self, restore_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new Restore"""
        try:
            return self.custom_api.create_namespaced_custom_object(
                group=self.velero_group,
                version=self.velero_version,
                namespace=self.namespace,
                plural="restores",
                body=restore_spec
            )
        except ApiException as e:
            logger.error(f"Error creating restore: {e}")
            raise
    
    # ===== SCHEDULE OPERATIONS =====
    
    def list_schedules(self) -> List[Dict[str, Any]]:
        """List all Velero Schedules"""
        try:
            response = self.custom_api.list_namespaced_custom_object(
                group=self.velero_group,
                version=self.velero_version,
                namespace=self.namespace,
                plural="schedules"
            )
            return response.get("items", [])
        except ApiException as e:
            logger.error(f"Error listing schedules: {e}")
            raise
    
    def get_schedule(self, name: str) -> Dict[str, Any]:
        """Get a specific Schedule"""
        try:
            return self.custom_api.get_namespaced_custom_object(
                group=self.velero_group,
                version=self.velero_version,
                namespace=self.namespace,
                plural="schedules",
                name=name
            )
        except ApiException as e:
            logger.error(f"Error getting schedule {name}: {e}")
            raise
    
    def create_schedule(self, schedule_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new Schedule"""
        try:
            return self.custom_api.create_namespaced_custom_object(
                group=self.velero_group,
                version=self.velero_version,
                namespace=self.namespace,
                plural="schedules",
                body=schedule_spec
            )
        except ApiException as e:
            logger.error(f"Error creating schedule: {e}")
            raise
    
    def delete_schedule(self, name: str) -> Dict[str, Any]:
        """Delete a Schedule"""
        try:
            return self.custom_api.delete_namespaced_custom_object(
                group=self.velero_group,
                version=self.velero_version,
                namespace=self.namespace,
                plural="schedules",
                name=name
            )
        except ApiException as e:
            logger.error(f"Error deleting schedule {name}: {e}")
            raise
    
    # ===== BACKUP STORAGE LOCATION OPERATIONS =====
    
    def list_backup_storage_locations(self) -> List[Dict[str, Any]]:
        """List all BackupStorageLocations"""
        try:
            response = self.custom_api.list_namespaced_custom_object(
                group=self.velero_group,
                version=self.velero_version,
                namespace=self.namespace,
                plural="backupstoragelocations"
            )
            return response.get("items", [])
        except ApiException as e:
            logger.error(f"Error listing BSLs: {e}")
            raise
    
    def get_backup_storage_location(self, name: str) -> Dict[str, Any]:
        """Get a specific BackupStorageLocation"""
        try:
            return self.custom_api.get_namespaced_custom_object(
                group=self.velero_group,
                version=self.velero_version,
                namespace=self.namespace,
                plural="backupstoragelocations",
                name=name
            )
        except ApiException as e:
            logger.error(f"Error getting BSL {name}: {e}")
            raise
    
    def patch_backup_storage_location(
        self, 
        name: str, 
        patch: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Patch a BackupStorageLocation"""
        try:
            return self.custom_api.patch_namespaced_custom_object(
                group=self.velero_group,
                version=self.velero_version,
                namespace=self.namespace,
                plural="backupstoragelocations",
                name=name,
                body=patch
            )
        except ApiException as e:
            logger.error(f"Error patching BSL {name}: {e}")
            raise
    
    # ===== CONFIGMAP OPERATIONS =====
    
    def create_config_map(
        self,
        name: str,
        data: Dict[str, str],
        labels: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Create a ConfigMap in Velero namespace"""
        try:
            configmap_body = {
                "apiVersion": "v1",
                "kind": "ConfigMap",
                "metadata": {
                    "name": name,
                    "namespace": self.namespace
                },
                "data": data
            }
            
            if labels:
                configmap_body["metadata"]["labels"] = labels
            
            return self.core_api.create_namespaced_config_map(
                namespace=self.namespace,
                body=configmap_body
            )
        except ApiException as e:
            logger.error(f"Error creating ConfigMap {name}: {e}")
            raise
    
    def delete_config_map(self, name: str) -> None:
        """Delete a ConfigMap from Velero namespace"""
        try:
            self.core_api.delete_namespaced_config_map(
                name=name,
                namespace=self.namespace
            )
            logger.info(f"Deleted ConfigMap {name}")
        except ApiException as e:
            if e.status == 404:
                logger.warning(f"ConfigMap {name} not found")
            else:
                logger.error(f"Error deleting ConfigMap {name}: {e}")
                raise


# Global Kubernetes client instance
k8s_client = KubernetesClient()
