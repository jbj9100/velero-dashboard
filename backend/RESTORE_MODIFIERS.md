# Velero Dashboard - Restore with Modifications API

## 개요

Velero Restore 시 리소스를 수정할 수 있는 기능이 추가되었습니다.  
백업을 복구하면서 네임스페이스 변경, replica 조정, 환경변수 수정 등을 할 수 있습니다.

## API Endpoint

### POST `/api/restores/with-modifications`

복구 시 리소스 수정 규칙을 적용하여 Restore를 생성합니다.

## 요청 예제

### 1. Deployment Replica를 1로 줄이기 (프로덕션 → 개발)

```json
{
  "name": "restore-prod-to-dev",
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
```

### 2. 네임스페이스 변경 (production → staging)

```json
{
  "name": "restore-prod-to-staging",
  "backupName": "prod-backup-20240131",
  "includedNamespaces": ["production"],
  "resourceModifierRules": [
    {
      "conditions": {
        "groupResource": "pods",
        "namespaces": ["production"]
      },
      "patches": [
        {
          "operation": "replace",
          "path": "/metadata/namespace",
          "value": "staging"
        }
      ]
    }
  ]
}
```

### 3. 환경변수 변경

```json
{
  "name": "restore-with-new-env",
  "backupName": "app-backup-20240131",
  "resourceModifierRules": [
    {
      "conditions": {
        "groupResource": "deployments.apps",
        "resourceNameRegex": "^myapp-.*"
      },
      "patches": [
        {
          "operation": "replace",
          "path": "/spec/template/spec/containers/0/env/0/value",
          "value": "development"
        }
      ]
    }
  ]
}
```

### 4. 이미지 태그 변경

```json
{
  "name": "restore-with-different-tag",
  "backupName": "app-backup-20240131",
  "resourceModifierRules": [
    {
      "conditions": {
        "groupResource": "deployments.apps"
      },
      "patches": [
        {
          "operation": "replace",
          "path": "/spec/template/spec/containers/0/image",
          "value": "myregistry.io/myapp:v2.0.0"
        }
      ]
    }
  ]
}
```

### 5. Label 추가

```json
{
  "name": "restore-with-labels",
  "backupName": "app-backup-20240131",
  "resourceModifierRules": [
    {
      "conditions": {
        "groupResource": "deployments.apps"
      },
      "patches": [
        {
          "operation": "add",
          "path": "/metadata/labels/environment",
          "value": "staging"
        }
      ]
    }
  ]
}
```

## 응답 형식

```json
{
  "name": "restore-prod-to-dev",
  "phase": "New",
  "backupName": "prod-backup-20240131",
  "startTimestamp": "2024-01-31T10:30:00Z",
  "completionTimestamp": null,
  "warnings": 0,
  "errors": 0
}
```

## Resource Modifier Fields

### Conditions (리소스 선택 조건)

| 필드 | 타입 | 설명 | 예제 |
|------|------|------|------|
| `groupResource` | string | 리소스 타입 | `"deployments.apps"`, `"pods"`, `"services"` |
| `resourceNameRegex` | string | 리소스 이름 정규식 | `"^nginx-.*"` |
| `namespaces` | string[] | 대상 네임스페이스 | `["production", "staging"]` |
| `labelSelector` | object | 라벨 셀렉터 | `{"app": "nginx", "tier": "frontend"}` |

### Patches (JSON Patch 연산)

| 필드 | 타입 | 설명 |
|------|------|------|
| `operation` | string | 연산 타입: `"add"`, `"remove"`, `"replace"`, `"copy"`, `"move"` |
| `path` | string | JSON 경로 (예: `/spec/replicas`) |
| `value` | any | 새로운 값 (add/replace 시 필요) |
| `from` | string | 원본 경로 (copy/move 시 필요) |

## 동작 원리

1. **ConfigMap 생성**: API가 resource modifier 규칙을 YAML로 변환하여 ConfigMap 생성
2. **Restore CR 생성**: ConfigMap을 참조하는 Restore Custom Resource 생성
3. **Velero 처리**: Velero가 복구하면서 자동으로 규칙 적용

생성되는 ConfigMap 예시:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: restore-resource-modifiers-restore-prod-to-dev
  namespace: velero
  labels:
    velero.io/restore-name: restore-prod-to-dev
    app.kubernetes.io/managed-by: velero-dashboard
data:
  resource-modifiers.yaml: |
    version: v1
    resourceModifierRules:
    - conditions:
        groupResource: deployments.apps
        namespaces:
        - production
      patches:
      - operation: replace
        path: /spec/replicas
        value: 1
```

## 테스트 방법

### curl 사용

```bash
curl -X POST http://localhost:8000/api/restores/with-modifications \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-restore-with-mods",
    "backupName": "test-backup",
    "resourceModifierRules": [
      {
        "conditions": {
          "groupResource": "deployments.apps"
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
  }'
```

### Python 사용

```python
import requests

url = "http://localhost:8000/api/restores/with-modifications"
payload = {
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

response = requests.post(url, json=payload)
print(response.json())
```

## 검증

### ConfigMap 확인

```bash
kubectl get configmap -n velero | grep restore-resource-modifiers

kubectl get configmap restore-resource-modifiers-<restore-name> -n velero -o yaml
```

### Restore 상태 확인

```bash
kubectl get restore <restore-name> -n velero

kubectl describe restore <restore-name> -n velero
```

### 실제 적용 확인

```bash
# Replica가 1로 설정되었는지 확인
kubectl get deploy -n <namespace>

# 네임스페이스가 변경되었는지 확인
kubectl get pods -n staging
```

## 사용 사례

### 1. 프로덕션 백업을 개발 환경으로 복구
- Replica를 1로 줄임
- 리소스 제한 조정
- 환경변수를 dev로 변경

### 2. 클러스터 마이그레이션
- 네임스페이스 이름 변경
- 스토리지 클래스 변경
- 이미지 레지스트리 변경

### 3. 버전 롤백
- 이미지 태그를 이전 버전으로 변경
- ConfigMap/Secret 값 복원

## 주의사항

- Resource Modifier 기능은 **Velero 1.11+** 버전에서 사용 가능합니다
- JSON Path는 정확해야 합니다 (오타 시 적용 안 됨)
- ConfigMap은 자동으로 삭제되지 않으므로 정리 필요 시 수동 삭제해야 합니다

## 참고 문서

- [Velero Resource Modifiers 공식 문서](https://velero.io/docs/main/restore-resource-modifiers/)
- [JSON Patch RFC 6902](https://tools.ietf.org/html/rfc6902)
