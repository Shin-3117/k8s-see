# K8s-See (쿠버네티스 동작 인터랙티브 시각화 플랫폼)

> **"매니페스트(YAML)를 제출한 바로 그 순간부터 쿠버네티스 내부에서는 어떤 일이 일어날까?"**  
> 사용자가 업로드한 쿠버네티스 표준 아키텍처 다이어그램(DevOps Mojo)을 웹 화면에 1:1로 구현하고, 매니페스트 라인별 변화와 2대 핵심 모드를 통해 쿠버네티스의 동작 원리를 시각적으로 완벽하게 체험할 수 있는 웹 애플리케이션입니다.

---

## 🌟 핵심 기능

### 1. React Flow (@xyflow/react) 기반 인터랙티브 캔버스 업그레이드
- **무한 캔버스 줌(Zoom) & 팬(Pan)**: 마우스 휠 및 드래그를 통해 자유롭게 확대/축소 및 이동 가능
- **인터랙티브 노드 드래그(Draggable Nodes)**: Master Node 컴포넌트들 및 Worker Nodes를 사용자가 직접 드래그하여 배치 조작 가능
- **실시간 내장 엣지 애니메이션(Animated SmoothStep Edges)**: 활성화된 데이터 패킷 경로를 따라 선이 살아 움직이며, 실시간 패킷 라벨(`POST /apis/...`, `Raft Propose`, `Binding`) 표시
- **미니맵(MiniMap) & 뷰 컨트롤(Controls)**: 우측 하단 미니맵과 FitView(화면 맞춤) 버튼 완비

### 2. 매니페스트 줄별(Line-by-Line) 쿠버네티스 변화 시각화
- 좌측 YAML 에디터에서 특정 라인/블록(예: `spec.replicas`, `spec.selector`, `resources.requests`, `readinessProbe` 등)을 클릭하거나 **[줄별 투어 모드]**로 탐색할 때:
  - 해당 줄이 골드/앰버로 하이라이트됩니다.
  - 우측 아키텍처 다이어그램에서 영향받는 컴포넌트(API Server, etcd, ReplicaSet Controller, Kube-Scheduler, Kubelet cgroups 등)가 **네온 펄스(Pulse Glow)**로 반응합니다.
  - 하단 카드에 **"이 줄이 쿠버네티스 내부(리눅스 cgroups, etcd 키 경로, 2단계 스케줄링, 엔드포인트 바인딩 등)에서 어떤 동작을 일으키는지"** 1:1 상세 해설과 추천 CLI 명령어가 제공됩니다.

### 2. 모드 1: Manifest 적용 시나리오 (Cluster Orchestration View)
- **상단 8단계 생성 순서도 (Flowchart Sequence)** 탑재:
  `1. kubectl apply` ➔ `2. API Server` ➔ `3. etcd` ➔ `4. Controller Manager` ➔ `5. Scheduler` ➔ `6. Kubelet` ➔ `7. CRI` ➔ `8. Service & Proxy`
- **클러스터 오케스트레이션 8단계 여정**: 사용자가 YAML을 확인하고 **[Apply (적용)]** 버튼을 누르는 순간부터 클러스터 전역에서 리소스가 처리되는 과정을 순서도와 React Flow 캔버스로 시뮬레이션
- **모드 1과 모드 3의 차이점**: 모드 1은 `Controller Manager(ReplicaSet Controller)`가 4단계에서 핵심 Reconcile 루프를 수행하지만, 모드 3(단일 Pod)에서는 컨트롤러가 우회(Bypassed)되어 직접 스케줄러로 직행하는 차이를 순서도 상에서 극명하게 비교 가능!
  - **Step 1**: Manifest 수신 & 클라이언트 직렬화 (Developer ➔ API Server)
  - **Step 2**: 인증(AuthN), 인가(AuthZ) 및 어드미션 컨트롤 (API Server 내부)
  - **Step 3**: etcd 영구 저장 & Raft 분산 커밋 (Quorum 커밋 ➔ `201 Created` 응답)
  - **Step 4**: 컨트롤러 감지 & ReplicaSet Reconcile 루프 (미할당 파드 생성, `nodeName: null`)
  - **Step 5**: 스케줄러 2단계 배치 (Filtering ➔ Scoring ➔ Node Binding)
  - **Step 6**: 워커 노드 Kubelet 감지 (Watch 스트림 ➔ Pod Worker 고루틴 기동)
  - **Step 7**: CRI 격리 환경 구축 & 이미지 Pull & 파드 기동 (Pause 컨테이너, CNI IP, containerd)
  - **Step 8**: 프로브 검증 & kube-proxy 서비스 라우팅 반영 (EndpointSlice 갱신 ➔ iptables/IPVS 분산)
- **실제 화살표를 따라 날아가는 빛나는 패킷(Glowing Particle Flow)**과 실시간 `kubectl get events -w` 터미널 로그 스트림 연동

### 3. 모드 2: Pod 상세 라이프사이클 (Pod Runtime Deep-Dive)
- 워커 노드 내부의 파드를 고배율로 줌인한 **단면도 뷰**:
  - **Linux Namespaces**: `CLONE_NEWNET` (Pod IP `10.244.1.14`), `CLONE_NEWIPC`, `CLONE_NEWPID`
  - **Linux cgroups v2**: `cpu.max`, `memory.max` (OOM 한계치)
  - **Pause 컨테이너**: 네트워크 및 IPC 네임스페이스 기반 샌드박스
  - **CSI 볼륨 마운트**: ConfigMap / Secret / PVC
  - **Init Containers**: 순차적 선행 작업 실행 (DB 연결 대기 등)
  - **Main Container**: 애플리케이션 기동 및 cgroups 자원 격리
  - **3대 프로브(Probe)**: `Startup Probe` ➔ `Readiness Probe` (통과 시 Service 투입) ➔ `Liveness Probe`
  - **우아한 종료 (Graceful Shutdown)**: `kubectl delete pod` 시뮬레이션 (Service 제외 ➔ preStop 훅 ➔ SIGTERM 30초 대기 ➔ SIGKILL)

### 4. [신규 추가] 모드 3: 단일 Pod 생성 순서도 (pod.yaml / sk085-pod-test)
- 사용자가 직접 작성한 단일 `kind: Pod` 매니페스트(`sk085-pod-test`)를 기반으로 한 **7단계 생성 순서도 파이프라인**:
  - **Step 1**: `kubectl apply -f pod.yaml` (Core API `/api/v1/namespaces/class-3/pods` 요청)
  - **Step 2**: API Server 인증/인가 & ServiceAccount `default` 토큰 자동 프로젝션 주입
  - **Step 3**: etcd 영구 저장 & **⚠️ Controller Manager 완전 우회(Bypassed!)** - Deployment가 아니므로 ReplicaSet 루프 없이 곧바로 스케줄러로 직행하는 아키텍처 원리 강조!
  - **Step 4**: Scheduler 2단계 스케줄링 (Filtering ➔ Scoring ➔ Worker Node 1 바인딩)
  - **Step 5**: Worker Node 1 Kubelet 감지 (Watch 스트림 ➔ Pod Worker 고루틴 기동)
  - **Step 6**: CRI 격리 ➔ `imagePullPolicy: Always`에 따른 Docker Hub 최신 다이제스트 강제 Pull ➔ 환경변수 `USER_NAME=sk085` 주입
  - **Step 7**: Nginx 컨테이너 프로세스 실행 ➔ Pod Running 확정 (`echo $USER_NAME=sk085`)
- **Flowchart Sequence**: `Client` ➔ `API Server` ➔ `etcd` ➔ `[X Controller 건너뜀]` ➔ `Scheduler` ➔ `Kubelet` ➔ `CRI` ➔ `Running`
- **단독(Naked) 파드 아키텍처 특성 안내**: 컨트롤러 없이 직접 생성된 파드는 노드 장애 시 자가 치유(Self-Healing)가 되지 않는다는 실무 팁 제공

### 5. K8s 컴포넌트 심층 백과사전
- 다이어그램의 어떤 컴포넌트(`API Server`, `etcd`, `Scheduler`, `Controller Manager`, `kubelet`, `Container Runtime`, `kube-proxy`, `Developer`, `End Users`)를 클릭하더라도 역할, 내부 동작 원리, 설정 파일 경로, 실무 CLI 명령어가 담긴 상세 모달이 열립니다.

---

## 🚀 로컬 실행 방법

```bash
# 1. 의존성 설치 (기완료)
npm install

# 2. 로컬 개발 서버 실행
npm run dev

# 3. 브라우저에서 열기
# http://localhost:5173
```

### 프로덕션 빌드 & 프리뷰
```bash
npm run build
npm run preview
```

---

## 📁 디렉토리 구조

```
k8s-see/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── types/
│   │   ├── pipeline.ts          # 모드 1 클러스터 오케스트레이션 타입
│   │   ├── podLifecycle.ts      # 모드 2 파드 런타임 상태 머신 타입
│   │   └── yamlMapping.ts       # YAML 라인별 K8s 컴포넌트 임팩트 매핑 타입
│   ├── data/
│   │   ├── yamlPresets.ts       # Nginx Deployment, ClusterIP Service 등 프리셋
│   │   ├── mode1Steps.ts        # 8단계 클러스터 오케스트레이션 데이터 및 CLI 로그
│   │   ├── mode2Steps.ts        # 6단계 파드 런타임 라이프사이클 데이터
│   │   └── componentDetails.ts  # 아키텍처 컴포넌트별 상세 백과사전
│   └── components/
│       ├── Header.tsx           # 상단 모드 스위처, 프리셋 선택, K8s 백과사전
│       ├── YamlInspector/
│       │   ├── YamlEditor.tsx   # 코드 에디터 & 줄별 탐색기 & Apply 버튼
│       │   └── LineImpactCard.tsx# 선택된 줄의 K8s 내부 원리 1:1 설명 카드
│       ├── Mode1Cluster/
│       │   ├── ClusterCanvas.tsx# DevOps Mojo 다이어그램 1:1 재현 캔버스
│       │   └── PacketOverlay.tsx# 컴포넌트 간 빛나는 패킷 플로우 애니메이션
│       ├── Mode2Pod/
│       │   └── PodDeepDiveCanvas.tsx# 파드 내부 런타임 단면도 & 프로브 모니터
│       └── Common/
│           ├── PlaybackBar.tsx  # 재생/일시정지/스텝 이동/속도 조절 바
│           ├── StepExplainer.tsx# 단계별 한글 상세 설명 카드
│           ├── TerminalStream.tsx# 실시간 kubectl 이벤트/로그 콘솔
│           └── ComponentDetailModal.tsx# 컴포넌트 클릭 시 딥다이브 모달
```
