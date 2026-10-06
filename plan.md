# K8s-See 학습 흐름 개선 계획

작성일: 2026-10-06  
상태: 화면·코드 검토를 반영한 제안, 구현 전  
기준 문서: 같은 저장소의 `mermaid.md`\
검토 화면: http://localhost:5173/

## 1. 목표와 범위

**학습을 8개의 순서별 페이지로 구성하고, 구현도 같은 순서로 진행한다.** 전체 구조에서 시작해 Pod 생성·내부 구조·통신·설정·저장소를 배운 뒤 라이프사이클로 연결한다. 화면 탐색은 번호가 붙은 학습 목차와 이전 학습/다음 학습으로 통일한다.

`mermaid.md`는 설명과 기술적 근거의 기준으로 사용한다. 문서의 통신 절에서 Ingress를, 리소스 관계 절에서 PVC·외부 스토리지를 분리해 독립 학습 페이지로 구성한다.

React Flow 캔버스, YAML 연결, 재생 컨트롤, Pod 단면도, 로그·etcd 뷰어는 계속 사용한다. 각 기능이 어느 개념을 설명하는지 학습 목차에서 연결하고, 핵심 설명을 먼저 읽을 수 있게 배치를 바꾼다.

이 문서의 산출물은 구현 계획이다. 현재 앱 코드 변경, 배포, 커밋은 범위에 포함하지 않는다. 향후 구현도 실제 Kubernetes 클러스터 연결 없이 기존 교육용 시뮬레이션 안에서 진행한다.

## 2. 현재 화면에서 확인한 내용

연결된 Whale 브라우저에서 기존 5개 시뮬레이션 화면을 전환해 화면 구조와 접근성 텍스트를 확인했다. Deployment 첫 화면, Pod 단면도, PVC 화면은 스크린샷으로 배치도 확인했다. Pod 단면도의 1→2 단계 이동과 백과사전 모달 열기를 확인했다. 전체 재생·모든 버튼·모바일 화면의 동작 검증은 아직 수행하지 않았다.

| 관찰 | 학습에 미치는 영향 | 변경 방향 |
| --- | --- | --- |
| 기본 진입 화면이 Deployment 적용이며 상단에 시뮬레이션 선택 탭이 나열됨 | 전체 구조를 배우기 전에 시나리오를 선택해야 함 | 전체 구조를 첫 페이지로 제공하고 순서별 학습 목차로 전환 |
| 긴 가로 순서도가 먼저 보이고 마지막 단계는 가로 스크롤이 필요함 | 과정의 끝과 현재 단계의 설명을 함께 보기 어려움 | 간결한 단계 표시와 현재 단계 중심 패널 제공 |
| 헤더의 템플릿·백과사전 텍스트가 좁은 영역에서 여러 줄로 줄바꿈됨 | 탐색 도구의 가독성이 떨어짐 | 제목·학습 목차·페이지 도구의 영역 분리 |
| 캔버스, YAML, 단계 설명, 터미널, etcd 뷰어가 세로로 길게 배치됨 | 현재 동작과 이유를 함께 읽으려면 스크롤이 필요함 | 캔버스 옆에 핵심 설명, 상세 도구는 펼쳐보기 |
| Pod의 2단계에서 `PHASE: SANDBOXCREATING`, describe 예시에서는 `Pending`이 표시됨 | 학습용 단계와 공식 Pod phase가 혼동됨 | 공식 phase와 학습 단계를 별도 표시 |
| Pod 단면도에 namespaces·cgroups 세부사항이 바로 노출됨 | 공유 IP·pause·앱 컨테이너 관계보다 내부 용어가 먼저 들어옴 | 기본 단면도와 심화 정보를 분리 |
| 백과사전 버튼이 API Server 모달부터 열림 | 전체 구성 요소 목록을 찾기 어려움 | 구성 요소 목록을 진입 화면으로 제공 |
| API Server 모달에 “모든 통신의 허브”, “모든 내/외부 요청” 표현이 있음 | 앱 트래픽도 API Server를 통과한다고 오해할 수 있음 | Kubernetes API 요청의 관문으로 범위를 명시 |
| PVC 화면에서 Cloud Controller→AWS 선에 CSI API가 표시됨 | cloud-controller-manager와 CSI 구성 요소가 섞여 보임 | 저장소 시나리오의 역할·연결을 별도로 교정 |

위 배치 관찰은 현재 브라우저 창 기준이다. 브라우저 배율과 다양한 해상도에서 같은 문제가 발생하는지는 구현 시 별도로 확인한다.

### 코드·문서 검토에서 확인한 추가 사항

- `App.tsx`는 기존 시뮬레이션별 단계·재생 상태를 관리한다. 각 학습 페이지에 필요한 시각화·단계를 어댑터로 연결하고 페이지별 상태를 분리한다. Pod 내부와 라이프사이클이 같은 컴포넌트를 재사용해도 단계·재생 상태가 섞이지 않게 한다.
- 기존 화면 전환 핸들러에는 Ingress 재생 중지가 누락되어 있다. 모든 학습 페이지 이동에서 재생 중지를 공통 처리하고 회귀 확인 항목에 포함한다.
- Service 프리셋에도 Deployment용 8단계가 표시되고 설명 배너로 차이를 보완한다. 리소스 종류에 맞는 시나리오 연결이 필요하다.
- README의 분리 적용 화면 설명은 단일 Pod 생성이지만, 실제 화면·`AppMode`는 ConfigMap/Deployment/Service 분리 적용이다. README를 새로운 8개 학습 페이지와 실제 구성에 맞춘다.

## 3. 학습 페이지 순서와 기존 기능의 연결

아래 순서를 학습 목차와 구현 작업의 기준으로 사용한다. 각 페이지는 독립 진입 주소와 제목을 가지며, 목차에서 바로 접근할 수 있다. 이전 학습/다음 학습은 페이지를 이동하고, 이전 단계/다음 단계는 현재 페이지 안의 시뮬레이션을 조작한다.

| 순서 | 학습 페이지 | 먼저 답할 질문 | 활용할 기존 기능 | 기준 설명 |
| --- | --- | --- | --- | --- |
| 1 | Kubernetes 전체 구조 | 누가 상태를 관리하고 누가 Pod를 실행하나? | 클러스터 캔버스, 구성 요소 모달 | `mermaid.md` 1절 |
| 2 | Pod가 생성되는 과정 | YAML 제출 뒤 누가 무엇을 하나? | Deployment 적용, YAML 분석, 순서도, 로그·etcd | 2절 |
| 3 | Pod 내부 구조 | 같은 Pod의 컨테이너는 무엇을 공유하나? | Pod 단면도, init·main·pause 표시 | 3절 |
| 4 | Service와 내부 통신 | Pod IP·DNS·Service는 어떻게 연결되나? | 분리 적용의 Service 단계, 패킷 애니메이션 | 4절의 내부 통신 설명 |
| 5 | Ingress와 외부 요청 | 외부 HTTP(S) 요청은 어떤 앱으로 전달되나? | Ingress 재생, YAML·프록시 설정 비교, 라우팅 | 4절의 Ingress 상세 설명 |
| 6 | 주요 리소스 관계 | 설정·Namespace·권한은 Pod와 어떻게 연결되나? | ConfigMap/Deployment/Service YAML 비교, etcd 뷰어 | 5절의 리소스 관계 설명 |
| 7 | PVC와 외부 스토리지 | 저장소는 어떻게 생성·마운트되고 유지되나? | PVC/AWS EBS 재생, YAML 분석, 로그·etcd | 5절의 PVC·외부 스토리지 상세 설명 |
| 8 | Pod 라이프사이클 | 준비·실행·실패·재시작·종료는 어떻게 다른가? | Pod 단계 재생, 프로브 모니터, 삭제 시뮬레이션 | 6절 |

`mermaid.md` 7절의 핵심 정리는 관련 페이지의 마무리 설명에 반영한다. 주요 리소스 관계 페이지에서 저장소는 다음 학습으로 짧게 소개하고, 상세한 CSI·바인딩·마운트 설명은 7페이지에 배치한다.

기존 시뮬레이션 선택 탭은 학습 목차로 대체한다. 각 페이지에서 필요한 예시를 선택할 수 있게 하되, 별도 전역 화면 선택 메뉴는 두지 않는다. 기존 캔버스·YAML 비교·재생·로그 등은 해당 페이지 안에서 재사용한다.

## 4. 공통 학습 페이지 구조

### 첫 페이지와 탐색

- 기본 진입점은 1페이지 ‘Kubernetes 전체 구조’다.
- 목차에는 1~8페이지의 번호와 제목을 표시하고 현재 페이지를 강조한다.
- 구성 요소를 클릭하면 역할 요약과 관련 학습 페이지 링크를 제공한다.
- 페이지 하단에 이전 학습/다음 학습을 둔다. 첫 페이지에는 이전 학습, 마지막 페이지에는 다음 학습을 표시하지 않는다.
- 직접 주소 진입, 새로고침, 브라우저 뒤로/앞으로에서도 현재 페이지를 올바르게 표시한다.

### 페이지 내부 배치

모든 페이지는 **학습 질문 → 핵심 설명 → 인터랙티브 시각화 → 단계 재생 → YAML·로그 상세 → 이전 학습/다음 학습** 순서를 따른다. 전체 구조·리소스 관계처럼 탐색 중심인 페이지에는 재생할 과정이 있을 때만 재생 도구를 표시한다.

```text
┌─────────────────────────────────────────────────────────────┐
│ K8s-See       현재 학습 페이지                  백과사전    │
├─────────────┬───────────────────────────────────────────────┤
│ 학습 목차   │ 학습 질문 + 핵심 설명                         │
│ 1 전체 구조 ├──────────────────────────────┬────────────────┤
│ 2 Pod 생성  │                              │ 현재 단계      │
│ 3 Pod 내부  │ 인터랙티브 캔버스 / Pod 단면도│ 누가 / 무엇을  │
│ 4 Service   │                              │ 왜 / 결과      │
│ 5 Ingress   ├──────────────────────────────┴────────────────┤
│ 6 리소스    │ 재생 / 이전 단계·다음 단계 / 단계 선택 / 속도│
│ 7 PVC       ├───────────────────────────────────────────────┤
│ 8 생명주기  │ YAML · 명령/예시 로그 · etcd · 심화 설명      │
│             ├───────────────────────────────────────────────┤
│             │ 이전 학습                       다음 학습     │
└─────────────┴───────────────────────────────────────────────┘
```

넓은 화면에서는 목차·캔버스·현재 설명을 함께 보여준다. 좁은 화면에서는 목차를 접고 본문을 위 순서대로 배치한다. 페이지 이동 시 재생을 멈추고 새 제목으로 스크롤·포커스를 옮긴다. 이미 방문한 페이지의 단계는 복원하되 재생은 일시정지 상태로 유지하고, 리셋은 현재 페이지에만 적용한다.

기존 긴 순서도는 전체 과정 펼쳐보기로 유지한다. 기본 화면에는 현재 단계와 전후 단계를 표시한다. 캔버스 크기가 바뀌거나 처음 진입하면 Fit View를 적용하고, 사용자가 조작한 줌·노드 배치를 매 단계마다 덮어쓰지 않는다.

### 설명 카드 작성 규칙

모든 페이지와 단계에 동일한 순서를 적용한다.

1. **핵심**: 지금 이해할 한 문장.
2. **누가 / 무엇을 / 왜**: 담당 구성 요소, 행동, 목적.
3. **결과**: 변경된 리소스·상태·통신 경로.
4. **직접 확인**: 적합한 kubectl 명령과 예시 출력.
5. **심화**: Raft, MVCC, cgroups, 시스템 호출, 구현별 차이와 공식 출처.

예: “스케줄러는 미배정 Pod에 적합한 노드를 선택하고 API에 배정을 기록한다. 해당 노드의 kubelet이 이를 감지해 실행을 준비한다.” 이후 펼쳐보기에서 Filter/Score/Binding을 설명한다.

터미널과 etcd 뷰어에는 **시뮬레이션 예시**임을 표시한다. 고정 IP·UID·revision·시간·로그는 실제 클러스터의 실시간 결과처럼 보이지 않게 한다.

## 5. 설명과 모델의 정확성 개선

`mermaid.md`의 설명을 8개 학습 페이지에 맞게 연결하고, 기술적 사실은 공식 문서로 대조한다. 구현 환경의 예시를 모든 클러스터의 필수 구조로 설명하지 않는다.

| 우선순위 | 대상 | 수정 기준 |
| --- | --- | --- |
| P0 | Pod 상태 | 공식 `phase`와 학습 단계·컨테이너 상태·kubectl STATUS를 분리. `SandboxCreating`, `Ready`, `Terminating`을 공식 phase로 표시하지 않음 |
| P0 | 프로브 | startup 성공 후 readiness와 liveness가 각각 동작. readiness 실패와 재시작을 구분 |
| P0 | 종료 | EndpointSlice 갱신과 노드 종료가 병행됨을 표현. 기본 유예 30초는 preStop 포함, 남은 프로세스에만 SIGKILL |
| P0 | 관리와 통신 | API Server는 Kubernetes API 관문. 앱 패킷은 노드 데이터 경로로 전달. pause는 공유 환경 유지 |
| P0 | 리소스별 시나리오 | Service 단독 적용에서 ReplicaSet/Pod 생성 단계가 진행되지 않음. Deployment 생성 과정과 별도 연결 |
| P1 | 저장소 역할 | ConfigMap/Secret 볼륨을 CSI 저장소와 구분. AWS EBS 예시에서 CSI controller/node 역할을 cloud-controller-manager와 구분 |
| P1 | 저장소 배정·영속성 | `WaitForFirstConsumer`의 노드 후보 선택·볼륨 준비·최종 배정을 구분. 기존 볼륨 재사용 시 재포맷하지 않으며, Pod 삭제와 PVC 삭제의 회수 정책을 구분 |
| P1 | Ingress 역할·분기 | 규칙/Controller, API 감시/앱 요청을 구분. `/orders`와 `/products`는 별도 요청이며 TLS·설정 갱신·백엔드 전달 방식은 구현 조건을 표시 |
| P1 | 리소스 위치 | Deployment/Service는 API 리소스임을 표시. Worker의 Objects 영역이 실행 프로세스처럼 보이지 않게 변경 |
| P1 | 구현 차이 | Pod PID 공유는 설정에 따른다는 점, CNI가 항상 VXLAN을 쓰지 않는다는 점, kube-proxy 대체 구현 가능성 명시 |
| P1 | 교체와 재시작 | 같은 UID의 컨테이너 재시작과 새 UID의 Pod 교체를 구분. 직접 생성한 Pod와 컨트롤러 관리 Pod 비교 |

상태·프로브·종료 기준은 [Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)과 [Probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/)를 따른다. 볼륨 종류는 [Volumes](https://kubernetes.io/docs/concepts/storage/volumes/)를 참고한다. 구성 요소·통신 역할은 [Kubernetes Components](https://kubernetes.io/docs/concepts/overview/components/)와 [네트워크 개념](https://kubernetes.io/docs/concepts/services-networking/)을 기준으로 검토한다.

저장소 페이지는 [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/), [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/), [AWS EBS CSI Driver](https://github.com/kubernetes-sigs/aws-ebs-csi-driver)를, 외부 요청 페이지는 [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)를 기준으로 검토한다.

## 6. 데이터와 컴포넌트 변경 방향

### 문서 관리

`k8s-see`는 독립 Git 저장소다. 같은 저장소의 `mermaid.md`를 설명 기준으로 사용한다. 공통 준비 작업에서 기준 내용을 `docs/learning-guide.md`로 정리하고, 8개 페이지 ID와 설명 절·공식 출처를 연결한다. 앱 데이터와 문서를 같은 변경에서 검토한다.

초기에는 Markdown 자동 파싱이나 Mermaid 렌더러를 새로 도입하지 않고 기존 React Flow에 학습 내용을 연결한다. 원본 문서와의 자동 동기화는 후속 필요가 있을 때 결정한다.

### 페이지와 시뮬레이션 데이터 분리

- `data/learningPages.ts`: 페이지 ID, 순서, 제목, 학습 질문, 핵심 설명, 주소, 이전/다음 페이지, 가이드 절, 연결 시각화·단계.
- 페이지 ID: `overview`, `pod-creation`, `pod-internals`, `service-networking`, `ingress`, `resource-relations`, `persistent-storage`, `pod-lifecycle`.
- 기존 `mode1Steps`~`mode5Steps`는 내부 재사용 대상으로 유지한다. 기존 파일명·타입명 변경은 페이지별 이관에 필요한 범위에서 수행하고 사용자 화면에는 노출하지 않는다.
- 시뮬레이션 상태는 페이지 ID를 기준으로 보관한다. 같은 시각화를 사용하는 페이지도 단계·재생·속도·리셋 상태를 독립적으로 관리한다.
- 단계 설명에는 `summary`, `actor`, `action`, `reason`, `result`, `sources`를 추가하고 기존 필드를 지원하는 어댑터를 제공한다.
- `PacketPath`에 관리/API·앱 트래픽·설정 관계를 구분하는 필드를 추가해 범례와 애니메이션을 일관되게 적용한다.
- Pod에는 `podPhase`, `learningStage`, `ready`, `containerState`, `displayStatus`, `uid`, `restartCount`를 구분한다. 타입·화면·예시 출력을 함께 이관한다.
- 단계 연결에는 명시적인 ID를 사용한다. 페이지별로 단계를 나눠도 기존 번호 기반 삭제 점프가 잘못된 단계로 향하지 않게 한다.

### 주요 변경 파일

기존 경로의 숫자는 내부 파일 식별자이며, 학습 목차는 8개 페이지 ID로 관리한다.

| 파일/영역 | 계획 |
| --- | --- |
| `src/App.tsx` | 페이지 진입·이동, 페이지별 상태, 공통 재생 중지·복원 정책 |
| `src/components/Header.tsx` | 학습 페이지 제목·페이지 도구 중심으로 개편 |
| 신규 `LearningSidebar`, `LearningPageLayout`, `LearningNavigation`, `PageIntro` | 순서별 목차, 공통 배치, 이전/다음 학습, 학습 질문 |
| 신규 `ArchitectureOverview`, `ResourceRelations` | 1페이지 전체 구조와 6페이지 리소스 관계 |
| `Common/StepExplainer.tsx` | 핵심 요약, 누가/무엇/왜/결과, 심화 펼쳐보기 |
| `Common/FlowchartSequence.tsx`, `PlaybackBar.tsx` | 현재 페이지의 단계 탐색·재생과 전체 과정 접근 |
| `Mode1Cluster/ReactFlowClusterCanvas.tsx`, 노드 컴포넌트 | 페이지별 캔버스 재사용, 관리/트래픽 범례, 네트워크·CSI 역할 |
| `Mode2Pod/PodDeepDiveCanvas.tsx`, `types/podLifecycle.ts` | 3·8페이지에 필요한 내용 분리, phase·Ready·학습 단계 구분 |
| `data/mode1Steps.ts`, `data/mode3Steps.ts`, `YamlInspector/SeparatedYamlViewer.tsx` | 2·4·6페이지에 생성·Service·설정 관련 내용 연결 |
| `data/mode5Steps.ts`, `YamlInspector/IngressYamlViewer.tsx`, `Mode1Cluster/nodes/IngressControllerNode.tsx` | 5페이지의 요청 분기·TLS·YAML/프록시 비교 |
| `data/mode4Steps.ts`, `YamlInspector/PvcYamlViewer.tsx` | 7페이지의 저장소 8단계·바인딩·마운트·영속성 |
| `componentDetails.ts`, `yamlPresets.ts`, YAML 뷰어, `TerminalStream`, `EtcdLiveViewer` | 페이지별 연결, 설명 교정, 예시 데이터 표시 |
| `README.md`, `docs/learning-guide.md` | 8개 학습 페이지·사용법·설명 기준과 일치 |

## 7. 페이지 순서에 따른 구현 작업과 완료 기준

**공통 준비 → 1페이지 → 2페이지 → … → 8페이지 → 전체 흐름 검증** 순서로 진행한다. 각 페이지에서 설명·시각화·상태·상세 도구 연결을 함께 완료하고, 해당 페이지의 완료 기준을 확인한 뒤 다음 작업으로 이동한다. 공통 준비에서 전체 페이지의 상세 내용을 한 번에 구현하지 않는다.

### 공통 준비: 페이지 탐색과 재사용 기반

- [ ] 8개 페이지 ID·순서·제목·기준 설명을 `learningPages.ts`와 학습 가이드에 정리한다.
- [ ] 공통 페이지 레이아웃, 순서별 목차, 이전 학습/다음 학습, 페이지별 진입 주소를 마련한다.
- [ ] 기존 시뮬레이션 선택 탭을 제거하고 페이지 내부에 필요한 예시·도구를 연결할 어댑터를 마련한다.
- [ ] 페이지별 상태 저장, 이동 시 모든 재생 중지, 재방문 시 일시정지 복원, 현재 페이지 리셋 정책을 적용한다.
- [ ] 설명 카드와 예시 표시 규칙을 적용할 공통 컴포넌트를 준비한다.
- [ ] 기존 YAML 선택·재생·캔버스 조작을 보존하고 `npm run build`를 확인한다.

완료 기준: 8개 페이지의 공통 틀을 목차·이전/다음·주소로 탐색할 수 있다. 이전 페이지의 재생이 계속 진행되지 않고, 학습 이동과 시뮬레이션 단계 이동이 구별된다. 페이지 본문은 아래 순서로 채운다.

### 1페이지: Kubernetes 전체 구조

- [ ] 기본 진입 화면에 “Control Plane이 상태를 관리하고 Node가 Pod를 실행한다”는 핵심 설명을 표시한다.
- [ ] Control Plane/Worker 경계와 API Server·etcd·컨트롤러·스케줄러·kubelet·런타임의 역할을 연결한다.
- [ ] 구성 요소 목록·역할 요약·관련 학습 페이지 이동을 제공한다.
- [ ] 관리/API 관계와 앱 트래픽 범례를 선 모양·라벨로 구분한다. AWS·CSI 세부 구성은 저장소 페이지에서 확장한다.

완료 기준: 처음 방문한 사용자가 전체 구조와 두 영역의 역할을 설명하고, 다음 학습으로 Pod 생성 페이지에 이동할 수 있다. API Server를 앱 패킷의 전달 경로로 표시하지 않는다.

### 2페이지: Pod가 생성되는 과정

- [ ] Deployment YAML 제출부터 ReplicaSet·Pod 생성, 스케줄링, kubelet·런타임 실행까지 연결한다.
- [ ] 현재 단계의 담당자·행동·목적·결과를 캔버스 옆 설명에 표시한다.
- [ ] YAML 줄별 분석, 순서도, 로그·etcd 하이라이트를 현재 단계와 동기화한다.
- [ ] 공식 Pod phase와 학습 단계를 분리하고, sandbox 준비는 `Pending`으로 표현한다.
- [ ] Service 단독 YAML을 선택하면 해당 리소스 설명·Service 페이지로 연결한다. Pod 생성 단계를 그대로 재생하지 않는다.

완료 기준: 스케줄러가 API에 노드 배정을 기록하고 kubelet이 감지하는 관계를 따라갈 수 있다. YAML·설명·로그·상태가 같은 단계를 표시한다.

### 3페이지: Pod 내부 구조

- [ ] pause·init·앱 컨테이너와 공유 네트워크 공간을 기본 단면도로 표시한다.
- [ ] 같은 Pod의 IP·포트 공간·localhost 공유와 포트 충돌 예시를 연결한다.
- [ ] pause가 공유 환경을 유지하며 패킷을 중계하지 않는다는 설명을 적용한다.
- [ ] namespaces·cgroups·PID 공유 설정 등 내부 구현은 심화 펼쳐보기로 분리한다.
- [ ] 기본 생성 과정과 Pod 내부 단계를 연결하고, 실패·종료 분기는 8페이지에서 다룬다.

완료 기준: 공유 IP와 localhost 통신을 단면도에서 확인할 수 있다. 기본 설명을 읽기 위해 내부 구현 용어를 먼저 이해할 필요가 없다.

### 4페이지: Service와 내부 통신

- [ ] localhost, Pod IP, Service 이름·ClusterIP 접근을 비교한다.
- [ ] CoreDNS 이름 해석과 실제 앱 패킷 전달을 별도 경로로 표시한다.
- [ ] Service·EndpointSlice와 kube-proxy 또는 대체 구현의 전달 규칙 관계를 연결한다.
- [ ] CNI의 연결·라우팅 구성과 커널/eBPF 등의 데이터 경로를 설명한다. VXLAN 등은 구현 예시로 표시한다.
- [ ] Service YAML·selector·백엔드 상태와 패킷 애니메이션을 연결한다.

완료 기준: Service가 안정적인 주소를 정의하는 API 리소스임을 이해하고, DNS 조회부터 백엔드 Pod까지 요청을 따라갈 수 있다. Service 적용만으로 ReplicaSet/Pod를 생성하지 않는다.

### 5페이지: Ingress와 외부 요청

Service 내부 통신을 배운 다음 외부 진입 주소, Host·Path 라우팅, TLS 종료를 다룬다. 기존 요청 시뮬레이션의 다음 7단계를 이 페이지에 연결한다.

| 페이지 내부 단계 | 보강할 설명과 시각화 |
| --- | --- |
| 1. Ingress 선언 적용 | `ingressClassName`, Host, Path, `pathType`, 백엔드 Service/포트, TLS Secret의 의미 |
| 2. Controller 감지 | 설치된 Controller가 API를 감시하고 Service·EndpointSlice·Secret 정보를 반영 |
| 3. 프록시 설정 갱신 | NGINX 설정은 현재 예시로 유지. reload·동적 갱신 방식은 구현 조건을 표시 |
| 4. 외부 HTTPS 요청 | 외부 DNS·진입 주소를 통해 Controller에 도착하고 TLS를 종료하는 흐름 |
| 5. `/orders` 요청 | `api.example.com/orders`를 `order-service:8080`의 백엔드로 전달 |
| 6. `/products` 요청 | 별도 요청인 `api.example.com/products`를 `product-service:8080`의 백엔드로 전달 |
| 7. 응답 반환 | 선택된 앱 Pod→Controller→외부 사용자 응답 |

- [ ] Ingress는 규칙이고 Controller가 실제 요청을 처리한다는 설명을 먼저 제공한다.
- [ ] Ingress YAML·Service YAML·프록시 설정 비교, 재생·패킷 애니메이션·로그를 연결한다.
- [ ] `/orders`와 `/products`를 서로 다른 요청의 비교로 표현한다.
- [ ] API 감시·설정 흐름과 앱 요청 흐름을 구분한다. ClusterIP 이용/Pod IP 직접 전달은 구현에 따른 예시로 표시한다.
- [ ] Controller 부재·Host/Path 불일치·준비된 백엔드 부재를 구분하는 설명과 예시를 제공한다.

완료 기준: Host·Path에 따른 백엔드 선택, TLS Secret과 종료 위치를 설명할 수 있다. 한 요청이 두 앱을 순차 방문하는 것처럼 표시되지 않으며, 오류 응답은 구현 조건에 맞게 설명한다.

### 6페이지: 주요 리소스 관계

- [ ] Deployment→ReplicaSet→Pod, Service→Pod, ConfigMap/Secret→Pod의 관계도를 제공한다.
- [ ] ConfigMap·Secret의 환경변수/파일 제공을 YAML 비교와 현재 적용 단계에 연결한다.
- [ ] Namespace의 논리적 범위와 ServiceAccount·Role/ClusterRole·Binding의 관계를 설명한다.
- [ ] 리소스 관계와 실행 프로세스를 구분하고 Secret 저장 시 암호화는 클러스터 설정에 따른다는 점을 명시한다.
- [ ] Pod→PVC→PV를 다음 학습의 개요로 소개하고, 상세 저장소 과정은 7페이지로 연결한다.

완료 기준: 설정·접근 신원·권한·실행 리소스의 관계를 구분할 수 있다. ConfigMap/Secret 파일 제공을 외부 CSI 볼륨 생성 과정과 혼동하지 않는다.

### 7페이지: PVC와 외부 스토리지

일반적인 Pod→PVC→PV→외부 스토리지 관계를 먼저 설명하고 현재 AWS EBS 예시로 구체화한다. 기존 저장소 시뮬레이션의 다음 8단계를 이 페이지에 연결한다.

| 페이지 내부 단계 | 보강할 설명과 시각화 |
| --- | --- |
| 1. PVC 요청 접수 | 용량·접근 모드·StorageClass, `WaitForFirstConsumer`의 소비 Pod 대기 |
| 2. Pod 노드 선택 | 노드 후보·AZ·볼륨 토폴로지를 함께 고려하고, 볼륨 바인딩 뒤 최종 Pod 배정 |
| 3. CSI 프로비저너 | external-provisioner와 CSI controller 역할을 cloud-controller-manager와 구분 |
| 4. 외부 볼륨 생성·바인딩 | CSI 드라이버의 AWS API 호출, EBS·PV 생성과 PVC `Bound` 전이 |
| 5. 노드 연결: Attach | VolumeAttachment와 CSI controller의 노드 연결을 마운트와 구분 |
| 6. 파일시스템 준비·Mount | kubelet·CSI node의 준비·마운트. 새 볼륨 초기화와 기존 볼륨 재마운트를 구분 |
| 7. DB 컨테이너 실행 | Pod의 `volumes`와 컨테이너의 `volumeMounts`가 `/var/lib/mysql`에 연결 |
| 8. 영속성 확인 | 같은 PVC를 사용하는 새 Pod의 데이터 조회, Pod 삭제/PVC 삭제와 `Delete`/`Retain` 비교 |

- [ ] YAML 분석·비교, 재생, 로그·etcd를 현재 저장소 단계와 연결한다.
- [ ] CSI controller/node와 외부 저장소의 역할을 구분하고 CSI controller의 배치 위치를 고정된 필수 구조로 표현하지 않는다.
- [ ] PVC/PV 상태와 Pod phase를 각각 표시하고, `Bound`와 마운트 완료를 구분한다.
- [ ] 같은 PVC 재사용 시 기존 볼륨을 재포맷하지 않는 흐름과 회수 정책을 설명한다.
- [ ] 재시작 시 무조건 무손실 보존된다는 표현을 교정하고 영속 저장소와 앱의 쓰기 완료·복구를 구분한다.

완료 기준: 요청부터 생성·바인딩·Attach·Mount·데이터 조회까지 담당 구성 요소를 따라갈 수 있다. Pod 교체와 PVC 삭제에 따른 저장소 결과를 구분할 수 있다.

### 8페이지: Pod 라이프사이클

- [ ] 공식 phase, Ready 조건, 컨테이너 상태, kubectl STATUS, 학습 단계를 구분해 표시한다.
- [ ] startup·readiness·liveness의 시작 조건과 실패 결과를 프로브 모니터에 연결한다.
- [ ] 정상 완료, 컨테이너 반복 실패, readiness 실패, 정상 종료, Pod 교체 분기를 제공한다.
- [ ] 컨테이너 재시작은 같은 UID·증가한 restartCount, Pod 교체는 새 UID로 표시한다. 직접 생성한 Pod와 컨트롤러 관리 Pod를 비교한다.
- [ ] EndpointSlice 갱신과 노드 종료의 병행, preStop을 포함한 유예 시간, 남은 프로세스의 SIGKILL을 설명한다.
- [ ] 앞에서 배운 통신·저장소 페이지로 관련 설명 링크를 제공하고 전체 학습의 핵심을 정리한다.

완료 기준: Running과 Ready, readiness 실패와 재시작, 컨테이너 재시작과 Pod 교체를 구분한다. 삭제 시 트래픽 대상 변경·노드 종료·저장소 유지가 각각 어떻게 처리되는지 설명할 수 있다.

## 8. 페이지별 검증과 전체 흐름 검증

각 페이지 구현 후 `npm run build`로 TypeScript와 Vite 빌드를 확인하고 해당 페이지의 사용자 흐름을 검증한다. 새로운 분기·상태 모델은 사용자 결과를 검증하는 테스트를 추가하며 설명 문구 자체를 그대로 재현하는 테스트는 작성하지 않는다.

| 학습 페이지 | 확인할 결과 |
| --- | --- |
| 1. Kubernetes 전체 구조 | 기본 진입·역할 요약·구성 요소 목록·관련 페이지 이동이 일치 |
| 2. Pod가 생성되는 과정 | YAML 선택·노드 배정·단계 설명·로그·etcd·phase가 동기화 |
| 3. Pod 내부 구조 | 공유 네트워크·localhost·pause 역할이 단면도와 일치 |
| 4. Service와 내부 통신 | DNS/앱 패킷 구분, Service 단독 적용, selector와 준비된 백엔드 연결 |
| 5. Ingress와 외부 요청 | Host/Path별 별도 요청, TLS 위치, Controller·규칙·백엔드 부재를 구분 |
| 6. 주요 리소스 관계 | 설정 YAML·리소스 관계·신원/권한 설명이 연결되고 저장소 상세로 이동 가능 |
| 7. PVC와 외부 스토리지 | 소비 Pod 대기·AZ·Bound·Attach/Mount·재사용·회수 정책을 구분 |
| 8. Pod 라이프사이클 | Ready·프로브 실패·UID/restartCount·완료/종료 분기가 서로 다른 결과를 표현 |

공통 준비와 모든 페이지 완료 후에는 다음 항목을 확인한다.

- [ ] 1→8페이지를 이전 학습/다음 학습으로 순서대로 이동하고 목차에서 직접 이동한다.
- [ ] 페이지별 주소로 직접 진입하고 새로고침·브라우저 뒤로/앞으로에서 제목·목차·내용이 일치한다.
- [ ] Ingress를 포함한 모든 재생 가능 페이지에서 이동 시 재생이 멈추고, 재방문 시 해당 페이지의 단계가 일시정지 상태로 복원된다.
- [ ] Pod 내부와 라이프사이클처럼 같은 시각화를 재사용하는 페이지의 상태·리셋이 독립적이다.
- [ ] 재생/일시정지/이전 단계·다음 단계/직접 단계/리셋/속도가 설명·로그·상태와 동기화된다.
- [ ] YAML 비교·복사·줄별 하이라이트, 백과사전, 줌/팬/노드 드래그/Fit View/미니맵을 사용할 수 있다.
- [ ] 1440px, 1024px, 390px 너비에서 목차·시각화·설명·도구·학습 이동에 접근할 수 있고 문서 전체의 가로 넘침이 없다.
- [ ] 키보드로 목차·펼쳐보기·재생·학습 이동·모달 닫기를 조작하고, 색상 없이도 경로 의미를 식별한다.
- [ ] README와 학습 가이드가 8개 페이지의 실제 구성·사용법과 일치한다.

현재 작업은 계획 문서 수정이므로 앱 빌드나 기능 테스트를 새로 수행하지 않는다. 구현 단계에서 위 검증을 수행한다.

## 9. 첫 작업과 이후 진행 방식

**공통 페이지 틀과 상태 관리부터 준비하고, 1페이지 ‘Kubernetes 전체 구조’를 완성한다.** 이어서 2→8페이지를 순서대로 구현한다. 각 페이지의 체크리스트·완료 기준·검증 결과를 확인한 뒤 다음 페이지 작업을 진행한다.

Ingress와 PVC·외부 스토리지는 각각 5페이지와 7페이지의 독립 작업으로 관리한다. 페이지별 구현이 모두 끝나면 1→8 학습 흐름과 기존 인터랙티브 기능의 전체 회귀 확인을 수행한다.
