"""
Velero Dashboard Backend - Pydantic Models

Frontend와 호환되는 API 응답 모델
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ===== VELERO PHASE ENUM =====
VeleroPhase = str  # "Completed", "InProgress", "Failed", "PartiallyFailed", "New"


# ===== BACKUP MODELS =====
class Backup(BaseModel):
    """Backup resource response"""
    name: str
    phase: VeleroPhase
    start_timestamp: str = Field(alias="startTimestamp")
    completion_timestamp: Optional[str] = Field(None, alias="completionTimestamp")
    warnings: int = 0
    errors: int = 0
    backup_storage: Optional[str] = Field(None, alias="backupStorage")
    
    model_config = {"populate_by_name": True}


class CreateBackupRequest(BaseModel):
    """Request body for creating a backup"""
    name: str
    included_namespaces: Optional[List[str]] = Field(None, alias="includedNamespaces")
    excluded_namespaces: Optional[List[str]] = Field(None, alias="excludedNamespaces")
    ttl: Optional[str] = None  # e.g., "720h0m0s"
    
    model_config = {"populate_by_name": True}


# ===== RESTORE MODELS =====
class Restore(BaseModel):
    """Restore resource response"""
    name: str
    phase: VeleroPhase
    backup_name: str = Field(alias="backupName")
    start_timestamp: str = Field(alias="startTimestamp")
    completion_timestamp: Optional[str] = Field(None, alias="completionTimestamp")
    warnings: int = 0
    errors: int = 0
    
    model_config = {"populate_by_name": True}


class CreateRestoreRequest(BaseModel):
    """Request body for creating a restore"""
    name: str
    backup_name: str = Field(alias="backupName")
    included_namespaces: Optional[List[str]] = Field(None, alias="includedNamespaces")
    excluded_namespaces: Optional[List[str]] = Field(None, alias="excludedNamespaces")
    
    model_config = {"populate_by_name": True}


# ===== RESTORE WITH MODIFIERS MODELS =====
class JSONPatch(BaseModel):
    """JSON Patch operation for resource modification"""
    operation: str  # "add", "remove", "replace", "copy", "move", "test"
    path: str  # JSON path, e.g., "/spec/replicas"
    value: Optional[Any] = None  # Value for add/replace operations
    from_path: Optional[str] = Field(None, alias="from")  # For copy/move operations
    
    model_config = {"populate_by_name": True}


class ResourceModifierConditions(BaseModel):
    """Conditions to match resources for modification"""
    group_resource: Optional[str] = Field(None, alias="groupResource")  # e.g., "deployments.apps"
    resource_name_regex: Optional[str] = Field(None, alias="resourceNameRegex")
    namespaces: Optional[List[str]] = None
    label_selector: Optional[Dict[str, str]] = Field(None, alias="labelSelector")
    
    model_config = {"populate_by_name": True}


class ResourceModifierRule(BaseModel):
    """Resource modification rule"""
    conditions: ResourceModifierConditions
    patches: List[JSONPatch]
    
    model_config = {"populate_by_name": True}


class CreateRestoreWithModificationsRequest(BaseModel):
    """Request body for creating a restore with resource modifications"""
    name: str
    backup_name: str = Field(alias="backupName")
    included_namespaces: Optional[List[str]] = Field(None, alias="includedNamespaces")
    excluded_namespaces: Optional[List[str]] = Field(None, alias="excludedNamespaces")
    resource_modifier_rules: List[ResourceModifierRule] = Field(alias="resourceModifierRules")
    
    model_config = {"populate_by_name": True}


# ===== SCHEDULE MODELS =====
class ScheduleTemplate(BaseModel):
    """Schedule template configuration"""
    included_namespaces: Optional[List[str]] = Field(None, alias="includedNamespaces")
    excluded_namespaces: Optional[List[str]] = Field(None, alias="excludedNamespaces")
    ttl: Optional[str] = None
    
    model_config = {"populate_by_name": True}


class Schedule(BaseModel):
    """Schedule resource response"""
    name: str
    schedule: str  # cron expression
    last_backup: Optional[str] = Field(None, alias="lastBackup")
    enabled: bool = True
    template: Optional[ScheduleTemplate] = None
    
    model_config = {"populate_by_name": True}


class CreateScheduleRequest(BaseModel):
    """Request body for creating a schedule"""
    name: str
    schedule: str  # cron expression
    included_namespaces: Optional[List[str]] = Field(None, alias="includedNamespaces")
    excluded_namespaces: Optional[List[str]] = Field(None, alias="excludedNamespaces")
    ttl: Optional[str] = None
    
    model_config = {"populate_by_name": True}


# ===== BACKUP STORAGE LOCATION MODELS =====
class BSLConfig(BaseModel):
    """BackupStorageLocation configuration"""
    region: Optional[str] = None
    s3_url: Optional[str] = Field(None, alias="s3Url")
    
    model_config = {"populate_by_name": True, "extra": "allow"}


class BackupStorageLocation(BaseModel):
    """BackupStorageLocation resource response"""
    name: str
    provider: str
    bucket: str
    prefix: Optional[str] = None
    access_mode: str = Field(alias="accessMode")  # "ReadWrite" or "ReadOnly"
    phase: str  # "Available" or "Unavailable"
    last_validation_time: Optional[str] = Field(None, alias="lastValidationTime")
    message: Optional[str] = None
    config: Optional[BSLConfig] = None
    
    model_config = {"populate_by_name": True}


class UpdateBSLRequest(BaseModel):
    """Request body for updating BSL"""
    name: str
    provider: Optional[str] = None
    bucket: Optional[str] = None
    prefix: Optional[str] = None
    config: Optional[BSLConfig] = None
    
    model_config = {"populate_by_name": True}


# ===== STORAGE VALIDATION MODELS =====
class ValidateStorageRequest(BaseModel):
    """Request body for validating S3 storage"""
    s3_url: str = Field(alias="s3Url")
    bucket: str
    prefix: Optional[str] = None
    region: Optional[str] = None
    access_key: Optional[str] = Field(None, alias="accessKey")
    secret_key: Optional[str] = Field(None, alias="secretKey")
    
    model_config = {"populate_by_name": True}


class ValidateStorageResponse(BaseModel):
    """Response for storage validation"""
    success: bool
    message: str
    object_count: Optional[int] = Field(None, alias="objectCount")
    latest_backup: Optional[str] = Field(None, alias="latestBackup")
    
    model_config = {"populate_by_name": True}
