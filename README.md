# K8sSee

Kubernetes의 전체 구조부터 Pod 생성·통신·설정·저장소·라이프사이클까지 순서대로 탐색하는 교육용 React 앱입니다. 실제 클러스터에 연결하거나 리소스를 변경하지 않습니다.

## 학습 순서

| 순서 | 페이지 | 주소 |
| --- | --- | --- |
| 1 | Kubernetes 전체 구조 | `#/learn/overview` |
| 2 | Pod가 생성되는 과정 | `#/learn/pod-creation` |
| 3 | StatefulSet 생성 과정 | `#/learn/statefulset-creation` |
| 4 | Job과 CronJob | `#/learn/jobs-cronjobs` |
| 5 | Pod 내부 구조 | `#/learn/pod-internals` |
| 6 | Service와 내부 통신 | `#/learn/service-networking` |
| 7 | Ingress와 외부 요청 | `#/learn/ingress` |
| 8 | cert-manager 기반 Ingress 생성 | `#/learn/cert-manager-ingress` |
| 9 | 주요 리소스 관계 | `#/learn/resource-relations` |
| 10 | ConfigMap과 Secret | `#/learn/configmap-secret` |
| 11 | Volume 종류와 수명 | `#/learn/volume-types` |
| 12 | PVC와 외부 스토리지 | `#/learn/persistent-storage` |
| 13 | Pod 라이프사이클 | `#/learn/pod-lifecycle` |

목차와 이전 학습/다음 학습으로 페이지를 이동합니다. 이전 단계/다음 단계는 현재 페이지의 시뮬레이션을 조작합니다. 페이지 이동 시 자동 재생이 멈추며, 재방문하면 단계와 속도를 일시정지 상태로 복원합니다. 상태는 현재 탭의 앱 실행 동안 유지되며 새로고침 시 초기화됩니다. 페이지 주소는 새로고침·뒤로/앞으로에서도 유지됩니다.

## 주요 기능

- React Flow 캔버스의 줌·팬·노드 드래그·Fit View·미니맵과 구성 요소 설명
- YAML 줄별 분석, 의미 블록 탐색, ConfigMap/Deployment/Service 및 Ingress/프록시 설정 비교·복사
- 단계별 핵심 설명, 담당 구성 요소·행동·이유·결과와 접을 수 있는 심화 설명
- StatefulSet의 OrderedReady 순차 생성, Headless Service DNS, Pod별 PVC 및 Pod 교체 시 저장소 재사용
- Job의 완료·실패·새 Pod 재시도, CronJob 예약 실행·Forbid·일시 중지와 설정 비교
- ConfigMap·Secret의 etcd 저장, 환경변수·파일 주입, 변경 반영 비교와 Secret 보안 조건
- Volume 종류·마운트 경로 비교와 emptyDir·설정 파일·PVC의 컨테이너 재시작/Pod 교체 수명 비교
- Pod 공식 phase·Ready·컨테이너 상태·학습 단계·UID·재시작 횟수 구분
- Readiness/Liveness/Startup 실패, 반복 재시작, 작업 성공·실패, Pod 교체, 정상·강제 종료 비교
- Ingress Host/Path 분기와 Controller 부재·규칙 불일치·Ready 백엔드 부재 비교
- cert-manager의 ClusterIssuer·Certificate·HTTP-01 검증·TLS Secret·HTTPS 연결·자동 갱신과 발급 실패 비교
- PVC 요청부터 CSI 볼륨 생성·바인딩·Attach·Mount·재사용, PVC 삭제 시 Delete/Retain 정책 비교
- 접을 수 있는 명령·로그·etcd 리소스 뷰어: 고정된 시뮬레이션 예시임을 표시

## 로컬 실행

```bash
npm install
npm run dev
```

기본 주소는 `http://localhost:5173/`입니다. Hash 기반 페이지 주소를 사용하므로 정적 호스팅에서 별도 경로 재작성 없이 직접 진입할 수 있습니다.

```bash
npm run build
npm run preview
npm test
```

브라우저 회귀 검증은 로컬 서버와 `agent-browser`가 준비된 환경에서 실행합니다.

```bash
npm run test:browser
npm run test:browser -- --interaction
# 다른 서버 주소를 사용할 때
K8S_CHECK_URL=http://127.0.0.1:5173/ npm run test:browser
```

검증 스크립트는 13개 페이지와 1440/1024/390px 배치, 탐색·재생 중지·페이지별 상태·실패 예시·백과사전을 확인합니다. 결과와 스크린샷은 `/private/tmp/k8s-learning-check/`에 저장됩니다.

## 문서와 코드

- [구현 계획과 완료 상태](plan.md)
- [검증 결과와 범위](docs/verification.md)
- [13개 페이지 학습 가이드](docs/learning-guide.md)
- [기준 구조 설명과 Mermaid 다이어그램](mermaid.md)
- `src/data/learningPages.ts`: 페이지 목차·질문·핵심 설명·공식 출처
- `src/data/learningScenarios.ts`: 기존 시뮬레이션을 페이지에 연결하는 어댑터
- `src/data/statefulsetSteps.ts`: StatefulSet YAML·줄별 분석·순차 생성·저장소 재사용 단계
- `src/data/certManagerSteps.ts`: cert-manager 발급·검증·갱신 시나리오와 YAML
- `src/data/configSecretSteps.ts`: ConfigMap·Secret YAML·저장·주입·변경 반영 단계
- `src/data/volumeExamples.ts`: 볼륨 종류·YAML·마운트·데이터 수명 예시
- `src/data/lifecycleExamples.ts`: Pod 상태와 실패·교체·종료 분기
- `src/hooks/learningState.ts`: 페이지별 상태와 재생·이동 정책
- `src/components/Learning/`: 공통 목차·학습 이동·개념 캔버스

저장소와 Ingress는 AWS EBS 및 NGINX 기반의 구체적인 예시를 포함합니다. CSI 드라이버·네트워크·프록시의 동작은 실제 환경에 따라 달라지므로 공식 문서와 해당 구현의 조건을 함께 확인합니다.
