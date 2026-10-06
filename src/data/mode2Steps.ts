import { PodLifecycleStep } from '../types/podLifecycle';

export const MODE2_STEPS: PodLifecycleStep[] = [
  {
    stepNumber: 1,
    id: 'pending',
    phase: 'Pending',
    learningStage: 'Pending',
    ready: false,
    uid: 'pod-web-001',
    restartCount: 0,
    containerState: 'Waiting',
    displayStatus: 'Pending',
    title: 'Pending: 스케줄링 완료 및 Pod Worker 할당',
    subTitle: 'Kubelet이 노드 자원을 예약하고 비동기 워커 스레드를 시작합니다',
    description: '스케줄러에 의해 이 워커 노드로 배정된 파드 스펙을 Kubelet이 수신했습니다. Kubelet은 메모리와 CPU 여유를 최종 확인하고, 파드 라이프사이클을 전담할 Pod Worker 고루틴을 생성합니다.',
    deepDive: 'Kubelet의 SyncLoop는 API Server의 Watch 채널에서 파드 추가(ADD) 이벤트를 수신하고, 파드의 UID를 키로 하는 전용 Pod Worker 채널에 작업을 전달합니다. 이 시점에는 아직 실제 리눅스 컨테이너가 실행되지 않았습니다.',
    linuxKernelDetails: {
      namespaces: [
        { name: 'Net', status: '대기 중', desc: '호스트 네트워크 공유 상태' },
        { name: 'IPC', status: '대기 중', desc: '공유 메모리 미생성' },
        { name: 'PID', status: '대기 중', desc: '프로세스 트리 미격리' }
      ],
      cgroups: [
        { resource: 'cpu.weight', value: '100', file: '/sys/fs/cgroup/kubepods.slice/pod<uid>/cpu.weight' },
        { resource: 'memory.max', value: '예약 중', file: '/sys/fs/cgroup/kubepods.slice/pod<uid>/memory.max' }
      ]
    },
    probes: {
      startup: 'idle',
      readiness: 'idle',
      liveness: 'idle'
    },
    containers: {
      pause: { status: 'none' },
      init: [
        { name: 'init-db-check', status: 'waiting' }
      ],
      main: { name: 'web-server', status: 'waiting', image: 'nginx:1.25' }
    },
    volumeStatus: { name: 'web-config', type: 'ConfigMap', mounted: false },
    terminalLogs: [
      'I0911 13:20:00.102 kubelet: SyncLoop (ADD, pod) "default/web-server-794d6c-4k8x1"',
      'I0911 13:20:00.105 pod_workers.go:771] Creating Pod Worker for pod 4d9f10a8b9e0',
      'I0911 13:20:00.110 kubelet: Status for pod updated to "Pending"'
    ],
    describeOutput: [
      'Status:       Pending',
      'Node:         worker-node-1/192.168.1.101',
      'Conditions:',
      '  Type           Status',
      '  PodScheduled   True',
      '  Initialized    False',
      '  Ready          False',
      '  ContainersReady False'
    ]
  },
  {
    stepNumber: 2,
    id: 'sandbox',
    phase: 'Pending',
    learningStage: 'SandboxCreating',
    ready: false,
    uid: 'pod-web-001',
    restartCount: 0,
    containerState: 'Waiting',
    displayStatus: 'Pending',
    title: 'Sandbox 격리: Pause 컨테이너 기동 & CNI 네트워크 할당',
    subTitle: '파드 내 모든 컨테이너가 공유할 IP와 통신 네임스페이스를 생성합니다',
    description: 'CRI가 "Pause"라는 극도로 가벼운 인프라 컨테이너를 먼저 실행합니다. 리눅스 네트워크(Net)와 IPC 네임스페이스를 생성하고, CNI(Container Network Interface) 플러그인이 가상 veth 인터페이스를 연결하여 고유 파드 IP(10.244.1.14)를 할당합니다.',
    deepDive: '쿠버네티스의 "동일 파드 내 컨테이너 간 localhost 통신"은 바로 이 Pause 컨테이너의 네트워크 네임스페이스를 공유(Network Namespace Sharing)하기 때문에 가능합니다. ConfigMap/Secret 볼륨은 kubelet이 파일로 제공합니다. 외부 CSI 저장소의 생성·Attach 과정과 구분합니다. pause는 패킷을 중계하지 않습니다.',
    linuxKernelDetails: {
      namespaces: [
        { name: 'Net', status: '격리 완료 (veth0 ➔ br0)', desc: 'Pod IP 10.244.1.14 부여됨' },
        { name: 'IPC', status: '격리 완료', desc: '파드 전용 POSIX 메시지 큐 생성' },
        { name: 'Mount', status: '마운트 중', desc: 'ConfigMap 볼륨 바인드 준비' }
      ],
      cgroups: [
        { resource: 'cpu.max', value: '50000 100000 (0.5 CPU)', file: 'cpu.max' },
        { resource: 'memory.max', value: '536870912 (512MB)', file: 'memory.max' }
      ]
    },
    probes: {
      startup: 'idle',
      readiness: 'idle',
      liveness: 'idle'
    },
    containers: {
      pause: { status: 'running', ip: '10.244.1.14' },
      init: [
        { name: 'init-db-check', status: 'waiting' }
      ],
      main: { name: 'web-server', status: 'waiting', image: 'nginx:1.25' }
    },
    volumeStatus: { name: 'web-config', type: 'ConfigMap', mounted: true },
    terminalLogs: [
      'I0911 13:20:01.002 containerd: RunPodSandbox request received for "web-server-794d6c-4k8x1"',
      'I0911 13:20:01.210 cni-calico: AddCmd: Assigned IP 10.244.1.14/24 to interface veth4a8c9e',
      'I0911 13:20:01.350 containerd: Created sandbox container "registry.k8s.io/pause:3.9" (ID: 3b1c28d7)',
      'I0911 13:20:01.400 volume_manager: Mounted volume "web-config" to /var/lib/kubelet/pods/4d9f10a8b9e0/volumes/'
    ],
    describeOutput: [
      'Status:       Pending',
      'IP:           10.244.1.14',
      'Events:',
      '  Type    Reason     Age   From               Message',
      '  Normal  Scheduled  2s    default-scheduler  Successfully assigned to worker-node-1',
      '  Normal  Sandbox    1s    kubelet            Successfully created pod sandbox with IP 10.244.1.14'
    ]
  },
  {
    stepNumber: 3,
    id: 'init',
    phase: 'Pending',
    learningStage: 'InitRunning',
    ready: false,
    uid: 'pod-web-001',
    restartCount: 0,
    containerState: 'Waiting',
    displayStatus: 'Pending',
    title: 'Init Containers: 사전 준비 작업 순차 실행',
    subTitle: '메인 앱이 뜨기 전 필수 선행 작업(DB 연결 대기, 설정 파일 생성)을 완료합니다',
    description: '파드 스펙에 정의된 initContainers가 명시된 순서대로 하나씩 실행됩니다. 모든 Init 컨테이너가 exit code 0(정상 종료)으로 끝나야만 비로소 메인 애플리케이션 컨테이너를 기동할 수 있습니다.',
    deepDive: '만약 Init 컨테이너가 실패하면 Kubelet은 파드의 restartPolicy(기본 Always)에 따라 Init 컨테이너를 재시작(CrashLoopBackOff)하며 메인 컨테이너는 절대 실행되지 않습니다. 이를 통해 종속성 보장을 안전하게 달성합니다.',
    linuxKernelDetails: {
      namespaces: [
        { name: 'Net', status: '공유 중 (10.244.1.14)', desc: 'Pause 컨테이너 네트워크 사용' },
        { name: 'Mount', status: '마운트 완료', desc: '/shared-data 디렉토리 접근 중' },
        { name: 'PID', status: '격리 (Init PID 1)', desc: 'Init 스크립트 프로세스 실행 중' }
      ],
      cgroups: [
        { resource: 'memory.current', value: '42MB', file: 'memory.current' }
      ]
    },
    probes: {
      startup: 'idle',
      readiness: 'idle',
      liveness: 'idle'
    },
    containers: {
      pause: { status: 'running', ip: '10.244.1.14' },
      init: [
        { name: 'init-db-check', status: 'running' }
      ],
      main: { name: 'web-server', status: 'waiting', image: 'nginx:1.25' }
    },
    volumeStatus: { name: 'web-config', type: 'ConfigMap', mounted: true },
    terminalLogs: [
      'I0911 13:20:02.010 containerd: CreateContainer "init-db-check" from busybox:1.36',
      'I0911 13:20:02.450 init-db-check: Checking database connection at db-service:5432...',
      'I0911 13:20:03.100 init-db-check: Connection established! Writing config cache...',
      'I0911 13:20:03.300 init-db-check: Preparing to exit after successful checks'
    ],
    describeOutput: [
      'Status:       Pending',
      'Init Containers:',
      '  init-db-check:',
      '    Container ID:  containerd://8f2a1b...',
      '    State:         Running',
      'Conditions:',
      '  Type           Status',
      '  Initialized    False'
    ]
  },
  {
    stepNumber: 4,
    id: 'app-start',
    phase: 'Running',
    learningStage: 'ContainerCreating',
    ready: false,
    uid: 'pod-web-001',
    restartCount: 0,
    containerState: 'Running',
    displayStatus: 'Running',
    title: 'ContainerCreating: 메인 컨테이너 이미지 Pull & 기동',
    subTitle: 'CRI가 OCI 컨테이너 프로세스를 fork/exec하고 cgroups 자원을 제약합니다',
    description: 'Init 컨테이너가 성공했으므로 메인 컨테이너(web-server)를 시작합니다. 이미지(nginx:1.25)가 노드에 없으면 원격 레지스트리에서 다운로드하고, 리눅스 cgroups(CPU 0.5코어, Mem 512MB) 제약 아래에서 메인 프로세스(nginx 마스터)를 실행합니다.',
    deepDive: 'containerd의 runc가 커널 시스템 콜 `clone(CLONE_NEWPID | CLONE_NEWNS)`을 호출하여 프로세스를 격리합니다. 표준 입출력(stdout/stderr)은 호스트의 /var/log/pods/ 디렉토리에 JSON 파일로 리다이렉트되어 `kubectl logs`로 읽을 수 있게 됩니다.',
    linuxKernelDetails: {
      namespaces: [
        { name: 'Net', status: '공유 (10.244.1.14)', desc: '포트 80 소켓 개방 중' },
        { name: 'PID', status: '메인 컨테이너 분리', desc: 'nginx: master process (PID 1)' },
        { name: 'Mount', status: '루프백 바인드', desc: 'nginx.conf 마운트 완료' }
      ],
      cgroups: [
        { resource: 'cpu.max', value: '50000 100000 (50% CPU Cap)', file: 'cpu.max' },
        { resource: 'memory.high', value: '471859200 (Throttle Alert)', file: 'memory.high' },
        { resource: 'memory.max', value: '536870912 (OOM Limit)', file: 'memory.max' }
      ]
    },
    probes: {
      startup: 'checking',
      readiness: 'idle',
      liveness: 'idle'
    },
    containers: {
      pause: { status: 'running', ip: '10.244.1.14' },
      init: [
        { name: 'init-db-check', status: 'completed' }
      ],
      main: { name: 'web-server', status: 'running', image: 'nginx:1.25' }
    },
    volumeStatus: { name: 'web-config', type: 'ConfigMap', mounted: true },
    terminalLogs: [
      'I0911 13:20:04.100 kubelet: Pulling image "nginx:1.25"',
      'I0911 13:20:05.200 kubelet: Successfully pulled image "nginx:1.25" in 1.1s (18.2 MB)',
      'I0911 13:20:05.350 containerd: Starting container "web-server" PID 41902',
      'I0911 13:20:05.410 web-server: 2026/09/11 13:20:05 [notice] 1#1: using the "epoll" event method',
      'I0911 13:20:05.412 web-server: 2026/09/11 13:20:05 [notice] 1#1: start worker processes'
    ],
    describeOutput: [
      'Status:       Running',
      'Containers:',
      '  web-server:',
      '    Container ID:   containerd://192a8c...',
      '    Image:          nginx:1.25',
      '    State:          Running (Started 1s ago)',
      '    Ready:          False'
    ]
  },
  {
    stepNumber: 5,
    id: 'ready',
    phase: 'Running',
    learningStage: 'Running',
    ready: true,
    uid: 'pod-web-001',
    restartCount: 0,
    containerState: 'Running',
    displayStatus: 'Running',
    title: 'Running: 3대 프로브(Probe) 헬스체크 & 트래픽 투입',
    subTitle: 'Startup 성공 후 Readiness와 Liveness가 각각 동작합니다',
    description: 'Kubelet이 3대 프로브를 가동합니다. Startup Probe가 성공하면 Readiness와 Liveness가 각각의 설정에 따라 동작합니다. Readiness 결과가 Ready 조건에 반영되면 일반 Service 트래픽 대상이 될 수 있습니다. Running만으로 요청 처리 가능 여부를 판단하지 않습니다.',
    deepDive: 'Readiness Probe가 실패하면 파드가 재시작되지는 않지만 일반 Service의 준비된 트래픽 대상에서 제외됩니다. EndpointSlice와 전달 규칙 반영에는 전파 지연이 있을 수 있습니다. Liveness Probe가 연속 실패하면 Kubelet이 컨테이너를 kill하고 재시작합니다.',
    linuxKernelDetails: {
      namespaces: [
        { name: 'Net', status: 'Active (Traffic Flowing)', desc: '10.244.1.14:80 ➔ 200 OK' },
        { name: 'PID', status: '안정적 실행 중', desc: 'Worker Threads x 4' }
      ],
      cgroups: [
        { resource: 'cpu.stat', value: 'usage_usec: 128490 (정상)', file: 'cpu.stat' },
        { resource: 'memory.current', value: '68MB / 512MB (안전)', file: 'memory.current' }
      ]
    },
    probes: {
      startup: 'success',
      readiness: 'success',
      liveness: 'success'
    },
    containers: {
      pause: { status: 'running', ip: '10.244.1.14' },
      init: [
        { name: 'init-db-check', status: 'completed' }
      ],
      main: { name: 'web-server', status: 'running', image: 'nginx:1.25' }
    },
    volumeStatus: { name: 'web-config', type: 'ConfigMap', mounted: true },
    terminalLogs: [
      'I0911 13:20:06.010 prober.go:128] Startup probe passed for "web-server"',
      'I0911 13:20:07.120 prober.go:145] Readiness probe HTTP GET / : 200 OK (latency: 1.2ms)',
      'I0911 13:20:07.150 kubelet: Pod "web-server-794d6c-4k8x1" condition Ready set to True',
      'I0911 13:20:07.180 endpoint_slice_controller: Added 10.244.1.14:80 to Service "web-service"',
      'I0911 13:20:08.000 web-server: 10.244.0.0 "GET / HTTP/1.1" 200 615 "-" "Mozilla/5.0"'
    ],
    describeOutput: [
      'Status:       Running',
      'Conditions:',
      '  Type              Status',
      '  Initialized       True',
      '  Ready             True',
      '  ContainersReady   True',
      '  PodScheduled      True'
    ]
  },
  {
    stepNumber: 6,
    id: 'terminating',
    phase: 'Running',
    learningStage: 'Terminating',
    ready: false,
    uid: 'pod-web-001',
    restartCount: 0,
    containerState: 'Running',
    displayStatus: 'Terminating',
    title: 'Terminating: Graceful Shutdown (우아한 무중단 종료)',
    subTitle: 'EndpointSlice 갱신과 노드 종료는 병행 · 기본 30초 유예에 preStop 포함',
    description: '사용자가 `kubectl delete pod`를 실행하거나 새 버전 롤아웃 시 종료 절차가 시작됩니다. EndpointSlice의 트래픽 대상 변경과 kubelet의 종료 처리는 병행됩니다. 설정된 preStop이 실행되고 런타임이 보통 SIGTERM을 전달합니다. 기본 30초 유예에는 preStop 실행 시간이 포함되며 전파 지연이 있을 수 있습니다.',
    deepDive: '남은 프로세스만 유예 시간 종료 후 SIGKILL로 강제 종료합니다. 정상 종료하면 SIGKILL은 필요 없습니다. 컨테이너 종료 후 sandbox·네트워크·볼륨을 정리하며 finalizer 등의 조건에 따라 API 객체 삭제가 지연될 수 있습니다.',
    linuxKernelDetails: {
      namespaces: [
        { name: 'Net', status: 'Endpoint 해제됨', desc: '인바운드 신규 연결 차단, 기존 소켓 FIN 대기' },
        { name: 'PID', status: 'SIGTERM 수신', desc: '프로세스 Graceful Shutdown 루틴 진행' }
      ],
      cgroups: [
        { resource: 'cgroup.procs', value: '종료 대기 중', file: 'cgroup.procs' }
      ]
    },
    probes: {
      startup: 'idle',
      readiness: 'failed',
      liveness: 'idle'
    },
    containers: {
      pause: { status: 'running', ip: '10.244.1.14' },
      init: [
        { name: 'init-db-check', status: 'completed' }
      ],
      main: { name: 'web-server', status: 'terminating', image: 'nginx:1.25' }
    },
    volumeStatus: { name: 'web-config', type: 'ConfigMap', mounted: true },
    terminalLogs: [
      'I0911 13:20:30.001 apiserver: DELETE /api/v1/namespaces/default/pods/web-server-794d6c-4k8x1',
      'I0911 13:20:30.020 endpoint_slice_controller: Removed 10.244.1.14:80 from Service "web-service"',
      'I0911 13:20:30.050 kubelet: Executing preStop hook for container "web-server"',
      'I0911 13:20:30.120 containerd: Sending SIGTERM to PID 41902 (Grace period: 30s)',
      'I0911 13:20:31.050 web-server: 2026/09/11 13:20:31 [notice] 1#1: signal 15 (SIGTERM) received, exiting',
      'I0911 13:20:31.400 containerd: Container "web-server" exited with status 0',
      'I0911 13:20:31.600 cni-calico: DelCmd: Released IP 10.244.1.14/24',
      'I0911 13:20:31.800 kubelet: node cleanup completed; API deletion reconciles separately'
    ],
    describeOutput: [
      'Status:       Running (kubectl STATUS: Terminating)',
      'Deletion Timestamp:  2026-09-11T13:20:30Z',
      'Termination Grace Period: 30s',
      'Conditions:',
      '  Ready:   False',
      'Events:',
      '  Normal  Killing  2s  kubelet  Stopping container web-server'
    ]
  }
];
