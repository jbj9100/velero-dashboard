"""
Velero Dashboard Backend - Configuration

환경변수로 모든 설정을 관리합니다. (NO HARDCODING!)
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # Kubernetes Configuration
    kubeconfig_path: Optional[str] = None
    """Path to kubeconfig file. If None, uses in-cluster config."""
    
    # Velero Configuration
    velero_namespace: str = "velero"
    """Namespace where Velero is installed"""
    
    # Cluster Identification
    cluster_name: str = "cluster1"
    """Name of this cluster (cluster1 or cluster2)"""
    
    # API Server Configuration
    host: str = "0.0.0.0"
    port: int = 8001
    
    # CORS Configuration
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    """Comma-separated list of allowed CORS origins"""
    
    # S3 Configuration (optional, for validation)
    s3_access_key: Optional[str] = None
    s3_secret_key: Optional[str] = None
    
    # Logging
    log_level: str = "INFO"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins as list"""
        return [origin.strip() for origin in self.cors_origins.split(",")]


# Global settings instance
settings = Settings()
