"""
Velero Dashboard Backend - Main FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import sys

from app.config import settings
from app.api import backups, restores, schedules, storage

# Configure logging
logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Velero Dashboard API",
    description="Backend API for Velero backup/restore management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(backups.router)
app.include_router(restores.router)
app.include_router(schedules.router)
app.include_router(storage.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Velero Dashboard API",
        "version": "1.0.0",
        "cluster": settings.cluster_name,
        "velero_namespace": settings.velero_namespace,
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"Starting Velero Dashboard API")
    logger.info(f"Cluster: {settings.cluster_name}")
    logger.info(f"Velero Namespace: {settings.velero_namespace}")
    logger.info(f"CORS Origins: {settings.cors_origins_list}")
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,  # Development mode
        log_level=settings.log_level.lower()
    )
