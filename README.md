# Velero Dashboard

> Kubernetes Velero 백업/복구를 위한 DR 관리 대시보드

## 프로젝트 구조

```
velero-dashboard/
├── frontend/          # React + TypeScript 웹 대시보드
│   ├── src/
│   │   ├── api/      # API 클라이언트
│   │   ├── components/
│   │   ├── pages/
│   │   └── styles/
│   └── README.md
│
└── backend/          # (구현 예정) Python FastAPI 서버
    ├── app/
    │   ├── api/      # REST API endpoints
    │   ├── k8s/      # Kubernetes client
    │   └── models/
    └── README.md
```

## Architecture

### Multi-Cluster DR Setup

```
┌─────────────────┐         ┌─────────────────┐
│  Cluster 1      │         │  Cluster 2      │
│  (운영)         │         │  (복구)         │
│                 │         │                 │
│  Velero (RW)    │         │  Velero (RO)    │
│  Backend API    │         │  Backend API    │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │      ┌───────────────┐    │
         └─────▶│  S3 Storage   │◀───┘
                │  (공용)        │
                └───────────────┘
                        ▲
                        │
                ┌───────┴────────┐
                │   Frontend     │
                │   Dashboard    │
                └────────────────┘
```

## Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

환경변수 설정:
```bash
# frontend/.env
VITE_API_BASE_URL_CLUSTER1=http://localhost:8001
VITE_API_BASE_URL_CLUSTER2=http://localhost:8002
```

### Backend (구현 예정)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## Features

### ✅ Frontend (완료)

- [x] Cluster 1 (운영) 페이지
  - [x] 백업 스케줄 관리
  - [x] 즉시 백업 실행
  - [x] KPI 타일 (마지막 백업, 활성 스케줄)
- [x] Cluster 2 (복구) 페이지
  - [x] 동기화된 백업 목록
  - [x] Failover 실행
  - [x] 복구 진행 상태 모니터링
- [x] Storage 페이지
  - [x] BSL 상태 확인
  - [x] S3 설정 변경
  - [x] 스토리지 검증
- [x] 디자인 시스템 (Health Dashboard 기반)
- [x] Toast 알림 시스템
- [x] 반응형 레이아웃

### ✅ Backend (완료)

- [x] FastAPI 프레임워크
- [x] Kubernetes API 연동 (Python client)
- [x] Velero CR 관리 (Backup, Restore, Schedule, BSL)
- [x] S3 스토리지 검증 (boto3)
- [x] RBAC 설정 (ServiceAccount, Role, RoleBinding)
- [x] 환경변수 관리 (pydantic-settings)
- [x] CORS 설정
- [x] API 문서화 (Swagger UI)
- [x] Docker 이미지
- [x] Kubernetes 배포 매니페스트

## Documentation

- [Implementation Plan](file:///C:/Users/wjdqu/.gemini/antigravity/brain/3a6e5e71-7506-4cea-9ff6-f8aeceebbfb7/implementation_plan.md)
- [Walkthrough](file:///C:/Users/wjdqu/.gemini/antigravity/brain/3a6e5e71-7506-4cea-9ff6-f8aeceebbfb7/walkthrough.md)
- [Frontend README](./frontend/README.md)

## Design Principles

### 환경변수 우선
- ❌ 하드코딩 금지
- ✅ 모든 설정은 환경변수로 관리
- ✅ `.env.example` 제공

### 보안 우선
- ❌ Frontend에 kubeconfig, token 저장 금지
- ✅ Backend만 Kubernetes API 접근
- ✅ ServiceAccount/RBAC 사용

### 운영 우선
- ✅ 명확한 정보 계층
- ✅ 위험한 작업은 확인 모달
- ✅ 실시간 상태 업데이트

## License

MIT
