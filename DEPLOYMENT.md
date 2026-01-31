# Velero Dashboard - 배포 가이드

## 아키텍처 개요

```
┌─────────────────────────────────────────────────────────┐
│ Cluster 1 (백업, 운영 클러스터)                          │
│                                                         │
│  ├── Velero (ReadWrite mode)                           │
│  │   └── BackupStorageLocation → S3                   │
│  │                                                     │
│  └── velero-dashboard-backend-cluster1                 │
│      ├── ServiceAccount + RBAC                        │
│      ├── In-cluster kubeconfig (자동)                  │
│      ├── Service: cluster1-backend-svc:8001           │
│      └── 환경변수: CLUSTER_NAME=cluster1               │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │
                   API 호출 (원격, ClusterIP Service)
                           │
┌─────────────────────────────────────────────────────────┐
│ Cluster 2 (복구 클러스터) ⭐ Frontend 설치 위치          │
│                                                         │
│  ├── Velero (ReadOnly mode)                            │
│  │   └── BackupStorageLocation → S3 (동일)            │
│  │                                                     │
│  ├── velero-dashboard-backend-cluster2                 │
│  │   ├── ServiceAccount + RBAC                        │
│  │   ├── In-cluster kubeconfig (자동)                  │
│  │   ├── Service: localhost:8002                      │
│  │   └── 환경변수: CLUSTER_NAME=cluster2               │
│  │                                                     │
│  └── velero-dashboard-frontend                         │
│      ├── Nginx container                              │
│      ├── 환경변수:                                     │
│      │   - VITE_API_BASE_URL_CLUSTER1=http://cluster1-backend-svc.velero.svc.cluster.local:8001
│      │   - VITE_API_BASE_URL_CLUSTER2=http://localhost:8002
│      └── Ingress/LoadBalancer로 외부 노출             │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  S3 Storage  │
                    │   (공용)      │
                    └──────────────┘
```

---

## 1단계: Cluster 1 (백업 클러스터) 배포

### 1.1 Velero 설치 (이미 설치되었다고 가정)

```bash
# Velero가 velero namespace에 설치되어 있어야 함
kubectl get pods -n velero
```

### 1.2 Backend 배포

```bash
cd backend

# Docker 이미지 빌드
docker build -t velero-dashboard-backend:1.0.0 .

# Cluster 1에 이미지 푸시 (registry 주소는 환경에 맞게 수정)
docker tag velero-dashboard-backend:1.0.0 your-registry/velero-dashboard-backend:1.0.0
docker push your-registry/velero-dashboard-backend:1.0.0
```

**deployment-cluster1.yaml**:

```yaml
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: velero-dashboard-backend
  namespace: velero

---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: velero-dashboard-backend
  namespace: velero
rules:
  - apiGroups: ["velero.io"]
    resources: ["backups", "restores", "schedules", "backupstoragelocations"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  - apiGroups: ["velero.io"]
    resources: ["schedules"]
    verbs: ["delete"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: velero-dashboard-backend
  namespace: velero
subjects:
  - kind: ServiceAccount
    name: velero-dashboard-backend
    namespace: velero
roleRef:
  kind: Role
  name: velero-dashboard-backend
  apiGroup: rbac.authorization.k8s.io

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: velero-dashboard-backend-cluster1
  namespace: velero
  labels:
    app: velero-dashboard-backend
    cluster: cluster1
spec:
  replicas: 1
  selector:
    matchLabels:
      app: velero-dashboard-backend
      cluster: cluster1
  template:
    metadata:
      labels:
        app: velero-dashboard-backend
        cluster: cluster1
    spec:
      serviceAccountName: velero-dashboard-backend
      containers:
        - name: backend
          image: your-registry/velero-dashboard-backend:1.0.0
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8001
              name: http
          env:
            # In-cluster mode (kubeconfig 불필요)
            - name: KUBECONFIG_PATH
              value: ""
            
            # Velero 설정
            - name: VELERO_NAMESPACE
              value: "velero"
            
            # 클러스터 식별
            - name: CLUSTER_NAME
              value: "cluster1"
            
            # API 서버 설정
            - name: HOST
              value: "0.0.0.0"
            - name: PORT
              value: "8001"
            
            # CORS (Cluster 2의 Frontend URL로 업데이트)
            - name: CORS_ORIGINS
              value: "http://velero-dashboard.cluster2.example.com,http://localhost:5173"
            
            - name: LOG_LEVEL
              value: "INFO"
          
          livenessProbe:
            httpGet:
              path: /health
              port: 8001
            initialDelaySeconds: 10
            periodSeconds: 30
          
          readinessProbe:
            httpGet:
              path: /health
              port: 8001
            initialDelaySeconds: 5
            periodSeconds: 10
          
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi

---
apiVersion: v1
kind: Service
metadata:
  name: velero-dashboard-backend-cluster1
  namespace: velero
  labels:
    app: velero-dashboard-backend
    cluster: cluster1
spec:
  type: ClusterIP
  selector:
    app: velero-dashboard-backend
    cluster: cluster1
  ports:
    - port: 8001
      targetPort: 8001
      protocol: TCP
      name: http
```

**배포**:

```bash
kubectl apply -f deployment-cluster1.yaml -n velero

# 확인
kubectl get pods -n velero -l cluster=cluster1
kubectl logs -n velero -l cluster=cluster1 -f
```

---

## 2단계: Cluster 2 (복구 클러스터) - Backend 배포

**deployment-cluster2.yaml**:

```yaml
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: velero-dashboard-backend
  namespace: velero

---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: velero-dashboard-backend
  namespace: velero
rules:
  - apiGroups: ["velero.io"]
    resources: ["backups", "restores", "schedules", "backupstoragelocations"]
    verbs: ["get", "list", "watch", "create", "update", "patch"]
  - apiGroups: ["velero.io"]
    resources: ["schedules"]
    verbs: ["delete"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: velero-dashboard-backend
  namespace: velero
subjects:
  - kind: ServiceAccount
    name: velero-dashboard-backend
    namespace: velero
roleRef:
  kind: Role
  name: velero-dashboard-backend
  apiGroup: rbac.authorization.k8s.io

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: velero-dashboard-backend-cluster2
  namespace: velero
  labels:
    app: velero-dashboard-backend
    cluster: cluster2
spec:
  replicas: 1
  selector:
    matchLabels:
      app: velero-dashboard-backend
      cluster: cluster2
  template:
    metadata:
      labels:
        app: velero-dashboard-backend
        cluster: cluster2
    spec:
      serviceAccountName: velero-dashboard-backend
      containers:
        - name: backend
          image: your-registry/velero-dashboard-backend:1.0.0
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8002
              name: http
          env:
            # In-cluster mode
            - name: KUBECONFIG_PATH
              value: ""
            
            - name: VELERO_NAMESPACE
              value: "velero"
            
            # 클러스터 식별 (중요!)
            - name: CLUSTER_NAME
              value: "cluster2"
            
            - name: HOST
              value: "0.0.0.0"
            
            # Port 변경!
            - name: PORT
              value: "8002"
            
            - name: CORS_ORIGINS
              value: "http://velero-dashboard.cluster2.example.com,http://localhost:5173"
            
            - name: LOG_LEVEL
              value: "INFO"
          
          livenessProbe:
            httpGet:
              path: /health
              port: 8002
            initialDelaySeconds: 10
            periodSeconds: 30
          
          readinessProbe:
            httpGet:
              path: /health
              port: 8002
            initialDelaySeconds: 5
            periodSeconds: 10
          
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi

---
apiVersion: v1
kind: Service
metadata:
  name: velero-dashboard-backend-cluster2
  namespace: velero
  labels:
    app: velero-dashboard-backend
    cluster: cluster2
spec:
  type: ClusterIP
  selector:
    app: velero-dashboard-backend
    cluster: cluster2
  ports:
    - port: 8002
      targetPort: 8002
      protocol: TCP
      name: http
```

**배포**:

```bash
kubectl apply -f deployment-cluster2.yaml -n velero

# 확인
kubectl get pods -n velero -l cluster=cluster2
```

---

## 3단계: Cluster 2 - Frontend 배포

### 3.1 Frontend 빌드

```bash
cd frontend

# 환경변수 설정 (.env.production)
cat > .env.production << EOF
# Cluster 1 backend (원격 클러스터)
VITE_API_BASE_URL_CLUSTER1=http://velero-dashboard-backend-cluster1.velero.svc.cluster.local:8001

# Cluster 2 backend (로컬 클러스터)
VITE_API_BASE_URL_CLUSTER2=http://velero-dashboard-backend-cluster2.velero.svc.cluster.local:8002
EOF

# 빌드
npm run build

# Docker 이미지 빌드
docker build -t velero-dashboard-frontend:1.0.0 .

# 레지스트리 푸시
docker tag velero-dashboard-frontend:1.0.0 your-registry/velero-dashboard-frontend:1.0.0
docker push your-registry/velero-dashboard-frontend:1.0.0
```

### 3.2 Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx 설정
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://velero-dashboard-backend-cluster2.velero.svc.cluster.local:8002; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3.3 Frontend Deployment

**frontend-deployment.yaml**:

```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: velero-dashboard-frontend
  namespace: velero
  labels:
    app: velero-dashboard-frontend
spec:
  replicas: 1
  selector:
    matchLabels:
      app: velero-dashboard-frontend
  template:
    metadata:
      labels:
        app: velero-dashboard-frontend
    spec:
      containers:
        - name: frontend
          image: your-registry/velero-dashboard-frontend:1.0.0
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 80
              name: http
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 10
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 200m
              memory: 256Mi

---
apiVersion: v1
kind: Service
metadata:
  name: velero-dashboard-frontend
  namespace: velero
  labels:
    app: velero-dashboard-frontend
spec:
  type: LoadBalancer  # 또는 ClusterIP + Ingress
  selector:
    app: velero-dashboard-frontend
  ports:
    - port: 80
      targetPort: 80
      protocol: TCP
      name: http

---
# Optional: Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: velero-dashboard-frontend
  namespace: velero
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: velero-dashboard.cluster2.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: velero-dashboard-frontend
                port:
                  number: 80
```

**배포**:

```bash
kubectl apply -f frontend-deployment.yaml -n velero

# 확인
kubectl get pods -n velero -l app=velero-dashboard-frontend
kubectl get svc -n velero velero-dashboard-frontend
```

---

## 4단계: 네트워크 연결 확인

### Cluster 2에서 Cluster 1 Backend 접근 설정

**방법 1: Kubernetes Service (권장)**

Cluster 1의 backend Service를 ExternalName이나 LoadBalancer로 노출:

```yaml
# Cluster 1에서
apiVersion: v1
kind: Service
metadata:
  name: velero-dashboard-backend-cluster1-external
  namespace: velero
spec:
  type: LoadBalancer  # 또는 NodePort
  selector:
    app: velero-dashboard-backend
    cluster: cluster1
  ports:
    - port: 8001
      targetPort: 8001
```

External IP 확인:
```bash
kubectl get svc -n velero velero-dashboard-backend-cluster1-external
# EXTERNAL-IP 기록 (예: 34.123.45.67)
```

Frontend 환경변수 업데이트:
```bash
VITE_API_BASE_URL_CLUSTER1=http://34.123.45.67:8001
```

**방법 2: Ingress**

```yaml
# Cluster 1
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: velero-backend-cluster1
  namespace: velero
spec:
  rules:
    - host: velero-backend-cluster1.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: velero-dashboard-backend-cluster1
                port:
                  number: 8001
```

Frontend 환경변수:
```bash
VITE_API_BASE_URL_CLUSTER1=http://velero-backend-cluster1.example.com
```

---

## 5단계: 검증

### Backend 1 (Cluster 1) 테스트

```bash
# Cluster 1에서
kubectl port-forward -n velero svc/velero-dashboard-backend-cluster1 8001:8001

curl http://localhost:8001/health
curl http://localhost:8001/api/backups
```

### Backend 2 (Cluster 2) 테스트

```bash
# Cluster 2에서
kubectl port-forward -n velero svc/velero-dashboard-backend-cluster2 8002:8002

curl http://localhost:8002/health
curl http://localhost:8002/api/backups
```

### Frontend 테스트

```bash
# Cluster 2에서
kubectl port-forward -n velero svc/velero-dashboard-frontend 8080:80

# 브라우저에서
http://localhost:8080
```

---

## 요약

**배포 위치**:
- ✅ **Cluster 1** (백업): Backend 1만
- ✅ **Cluster 2** (복구): Backend 2 + Frontend

**kubeconfig**:
- ✅ 각 backend는 **in-cluster config** 사용
- ✅ ServiceAccount + RBAC로 권한 관리
- ❌ kubeconfig 파일 불필요!

**네트워크**:
- Frontend → Backend 1: LoadBalancer/Ingress로 원격 접근
- Frontend → Backend 2: ClusterIP (같은 클러스터)

**환경변수 (Frontend)**:
```bash
VITE_API_BASE_URL_CLUSTER1=http://<cluster1-backend-external-ip>:8001
VITE_API_BASE_URL_CLUSTER2=http://velero-dashboard-backend-cluster2.velero.svc.cluster.local:8002
```
