# Velero Dashboard Backend

> FastAPI backend for Velero backup/restore management

## Features

- **Backups API**: Create and list Velero backups
- **Restores API**: Create and list restores (Failover)
- **Schedules API**: Manage backup schedules
- **Storage API**: BSL management and S3 validation
- **Environment Variables**: NO HARDCODING - all config via .env
- **RBAC**: Kubernetes ServiceAccount with minimal permissions
- **Auto Documentation**: Swagger UI at `/docs`

## Quick Start

### Prerequisites

- Python 3.11+
- Access to Kubernetes cluster with Velero installed
- `kubeconfig` file or in-cluster config

### Installation

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Configuration

Create `.env` file:

```bash
# Kubernetes Configuration
KUBECONFIG_PATH=~/.kube/config  # or leave empty for in-cluster mode

# Velero Configuration
VELERO_NAMESPACE=velero

# Cluster Identification
CLUSTER_NAME=cluster1

# API Server
HOST=0.0.0.0
PORT=8001

# CORS Origins
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Logging
LOG_LEVEL=INFO
```

### Run Development Server

```bash
python app/main.py
```

Or with uvicorn:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

API will be available at:
- `http://localhost:8001`
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Environment variables config
│   ├── api/
│   │   ├── backups.py       # Backups endpoints
│   │   ├── restores.py      # Restores endpoints
│   │   ├── schedules.py     # Schedules endpoints
│   │   └── storage.py       # Storage endpoints
│   ├── models/
│   │   └── velero.py        # Pydantic models
│   └── services/
│       ├── k8s_client.py    # Kubernetes client
│       └── s3_client.py     # S3 validation
├── k8s/
│   └── deployment.yaml      # Kubernetes manifests
├── .env                     # Environment variables
├── .env.example             # Environment template
├── Dockerfile
├── requirements.txt
└── README.md
```

## API Endpoints

### Backups
- `GET /api/backups` - List all backups
- `POST /api/backups` - Create a backup
- `GET /api/backups/{name}` - Get backup details

### Restores
- `GET /api/restores` - List all restores
- `POST /api/restores` - Create a restore
- `GET /api/restores/{name}` - Get restore details

### Schedules
- `GET /api/schedules` - List all schedules
- `POST /api/schedules` - Create a schedule
- `DELETE /api/schedules/{name}` - Delete a schedule
- `GET /api/schedules/{name}` - Get schedule details

### Storage
- `GET /api/storage/bsl` - List BackupStorageLocations
- `PATCH /api/storage/bsl` - Update BSL
- `POST /api/storage/validate` - Validate S3 connection

## Environment Variables

All configuration is managed via environment variables (NO HARDCODING!):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `KUBECONFIG_PATH` | No | `None` | Path to kubeconfig. Empty for in-cluster mode |
| `VELERO_NAMESPACE` | Yes | `velero` | Namespace where Velero is installed |
| `CLUSTER_NAME` | Yes | `cluster1` | Cluster identifier |
| `HOST` | No | `0.0.0.0` | API server host |
| `PORT` | No | `8001` | API server port |
| `CORS_ORIGINS` | Yes | - | Comma-separated allowed origins |
| `LOG_LEVEL` | No | `INFO` | Logging level |
| `S3_ACCESS_KEY` | No | `None` | S3 access key (for validation) |
| `S3_SECRET_KEY` | No | `None` | S3 secret key (for validation) |

## Deployment

### Docker Build

```bash
docker build -t velero-dashboard-backend:latest .
```

### Kubernetes Deployment

```bash
# Create RBAC, Deployment, Service
kubectl apply -f k8s/deployment.yaml

# Check status
kubectl get pods -n velero -l app=velero-dashboard-backend

# View logs
kubectl logs -n velero -l app=velero-dashboard-backend -f
```

### Environment-Specific Configuration

For **Cluster 2** (복구 클러스터), change environment variables:

```yaml
env:
  - name: CLUSTER_NAME
    value: "cluster2"
  - name: PORT
    value: "8002"
```

## RBAC Permissions

Backend requires the following Velero permissions:

```yaml
rules:
  - apiGroups: ["velero.io"]
    resources: ["backups", "restores", "schedules", "backupstoragelocations"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  
  - apiGroups: ["velero.io"]
    resources: ["schedules"]
    verbs: ["delete"]  # Only schedules can be deleted
```

## Testing

### Health Check

```bash
curl http://localhost:8001/health
```

### List Backups

```bash
curl http://localhost:8001/api/backups
```

### Create Backup

```bash
curl -X POST http://localhost:8001/api/backups \
  -H "Content-Type: application/json" \
  -d '{"name": "test-backup-1"}'
```

## Development Tips

### Enable Debug Logging

```bash
export LOG_LEVEL=DEBUG
python app/main.py
```

### Test with Local K8s

```bash
# Use kind or minikube
export KUBECONFIG_PATH=~/.kube/config
export VELERO_NAMESPACE=velero
python app/main.py
```

### Auto-reload on Code Changes

Uvicorn with `--reload` flag:

```bash
uvicorn app.main:app --reload
```

## Security Considerations

✅ **Environment Variables**: All secrets via .env (NO HARDCODING)  
✅ **RBAC**: Minimal permissions (ServiceAccount)  
✅ **CORS**: Restricted origins  
✅ **No Credentials in Code**: S3 keys optional, never committed  
❌ **TLS/HTTPS**: Use ingress/reverse proxy in production  

## License

MIT
