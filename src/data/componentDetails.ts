import { K8sComponentId } from '../types/pipeline';

export interface ComponentDetailInfo {
  id: K8sComponentId;
  name: string;
  category: 'Client' | 'Control Plane' | 'Worker Node' | 'External';
  k8sRole: string;
  summary: string;
  deepDive: string[];
  cliCommands: string[];
  configPaths: string[];
  badgeColor: string;
}

export const COMPONENT_DETAILS: Record<K8sComponentId, ComponentDetailInfo> = {
  'developer': {
    id: 'developer',
    name: 'Developer (kubectl / CLI)',
    category: 'Client',
    k8sRole: '사용자 및 자동화 배포 파이프라인 (CI/CD)',
    summary: '선언적 YAML 매니페스트를 작성하고 kubectl 또는 REST API를 통해 클러스터 상태 변경을 요청하는 주체입니다.',
    deepDive: [
      '~/.kube/config 파일에서 클러스터 엔드포인트, 클라이언트 인증서(client.crt), 토큰을 로드합니다.',
      '매니페스트를 OpenAPI JSON 스키마로 검증한 뒤 kube-apiserver로 HTTP POST/PATCH 요청을 전송합니다.',
      '선언적(Declarative) 철학: "어떻게(How)" 만들지 지시하지 않고, "어떤 상태(What)"가 되어야 하는지 전달합니다.'
    ],
    cliCommands: [
      'kubectl apply -f manifest.yaml',
      'kubectl get pods -o wide',
      'kubectl describe deployment web-app'
    ],
    configPaths: ['~/.kube/config'],
    badgeColor: 'bg-indigo-500'
  },
  'apiserver': {
    id: 'apiserver',
    name: 'API Server (kube-apiserver)',
    category: 'Control Plane',
    k8sRole: '클러스터의 중앙 제어 관문 & 모든 통신의 허브',
    summary: '쿠버네티스 클러스터의 모든 내/외부 요청이 거쳐 가는 유일한 진입점이며, etcd와 직접 통신할 수 있는 유일한 컴포넌트입니다.',
    deepDive: [
      '1. 인증(Authentication): X.509 인증서, Bearer 토큰, OIDC 등으로 요청자의 신원을 확인합니다.',
      '2. 인가(Authorization): RBAC(Role-Based Access Control) 정책으로 리소스 조작 권한을 검증합니다.',
      '3. 어드미션 컨트롤(Admission Control): Mutating(기본값 주입) 및 Validating(보안/제한 검사) Webhook을 순차 실행합니다.',
      '4. etcd 데이터 조작: 검증이 끝난 오브젝트를 etcd에 직렬화하여 저장하고, Watch API를 통해 변경 사항을 컨트롤러와 kubelet에 브로드캐스트합니다.'
    ],
    cliCommands: [
      'kubectl get --raw /api/v1/namespaces/default/pods',
      'systemctl status kube-apiserver',
      'crictl logs $(crictl ps --name kube-apiserver -q)'
    ],
    configPaths: ['/etc/kubernetes/manifests/kube-apiserver.yaml'],
    badgeColor: 'bg-blue-600'
  },
  'etcd': {
    id: 'etcd',
    name: 'etcd (Key-Value Store)',
    category: 'Control Plane',
    k8sRole: '클러스터의 모든 상태를 영구 보관하는 분산 저장소',
    summary: 'Raft 합의 알고리즘 기반의 고가용성 분산 키-값 저장소로, 클러스터의 단일 진실 공급원(Single Source of Truth)입니다.',
    deepDive: [
      'Raft 합의 알고리즘: 홀수 개(보통 3개 또는 5개) 노드로 클러스터를 구성하며 과반수(Quorum) 합의 시 커밋됩니다.',
      'MVCC (다중 버전 동시성 제어): 모든 변경 사항에 revision 번호를 부여하여 충돌 없이 변경 이력을 추적합니다.',
      'Watch 메커니즘: 키 공간의 변경 사항을 효율적으로 감시하여 API Server가 실시간 이벤트를 전파할 수 있게 합니다.',
      '오직 kube-apiserver만이 etcd와 mTLS 보안 연결로 직접 통신합니다.'
    ],
    cliCommands: [
      'etcdctl endpoint health',
      'etcdctl get /registry/deployments --prefix --keys-only',
      'etcdctl member list -w table'
    ],
    configPaths: ['/etc/kubernetes/manifests/etcd.yaml', '/var/lib/etcd/'],
    badgeColor: 'bg-cyan-600'
  },
  'scheduler': {
    id: 'scheduler',
    name: 'Scheduler (kube-scheduler)',
    category: 'Control Plane',
    k8sRole: '파드를 최적의 워커 노드에 배정하는 배치 결정자',
    summary: '새로 생성되어 nodeName이 비어있는(Pending) 파드를 감지하고, 노드의 자원과 제약 조건을 계산하여 최적의 노드를 결정합니다.',
    deepDive: [
      '1단계 필터링 (Filtering / Predicates): PodFitsResources, MatchNodeSelector, PodToleratesNodeTaints 등으로 부적합 노드를 걸러냅니다.',
      '2단계 점수화 (Scoring / Priorities): LeastRequestedPriority, BalancedResourceAllocation, ImageLocality 등으로 점수를 매겨 최고점 노드를 선택합니다.',
      '3단계 바인딩 (Binding): 선택된 노드 정보를 담아 API Server에 Binding 리소스를 전송하여 etcd에 기록합니다.'
    ],
    cliCommands: [
      'kubectl get events --field-selector reason=Scheduled',
      'systemctl status kube-scheduler'
    ],
    configPaths: ['/etc/kubernetes/manifests/kube-scheduler.yaml'],
    badgeColor: 'bg-purple-600'
  },
  'controllerManager': {
    id: 'controllerManager',
    name: 'Controller Manager (kube-controller-manager)',
    category: 'Control Plane',
    k8sRole: '현재 상태를 원하는 상태(Desired State)로 수렴시키는 제어 루프',
    summary: 'Deployment, ReplicaSet, Node, ServiceAccount, EndpointSlice 등 수많은 핵심 컨트롤러들을 단일 프로세스에서 실행합니다.',
    deepDive: [
      'Reconciliation Loop (조정 루프): 끊임없이 etcd의 "현재 상태(Actual)"와 사용자가 선언한 "원하는 상태(Desired)"를 비교합니다.',
      'ReplicaSet Controller: replicas가 3인데 현재 파드가 2개라면 1개를 새로 생성하고, 4개라면 1개를 제거합니다.',
      'Node Controller: 워커 노드의 하트비트를 감시하여 응답이 없으면(NotReady) 파드를 다른 노드로 대피(Eviction)시킵니다.'
    ],
    cliCommands: [
      'systemctl status kube-controller-manager',
      'kubectl get deployment -o wide'
    ],
    configPaths: ['/etc/kubernetes/manifests/kube-controller-manager.yaml'],
    badgeColor: 'bg-emerald-600'
  },
  'cloudControllerManager': {
    id: 'cloudControllerManager',
    name: 'Cloud Controller Manager (CCM)',
    category: 'Control Plane',
    k8sRole: '클라우드 제공자(AWS, GCP, Azure, OpenStack) 인프라 연동',
    summary: '퍼블릭/프라이빗 클라우드의 로드밸런서(ELB/NLB), 스토리지 볼륨(EBS/PD), 라우트 및 노드 라이프사이클을 연계합니다.',
    deepDive: [
      'Service Type=LoadBalancer 생성 시 클라우드의 실제 L4/L7 로드밸런서를 프로비저닝합니다.',
      '클라우드 상에서 노드가 삭제(Terminate)되면 클러스터에서 해당 노드 오브젝트를 자동 정리합니다.',
      '하이브리드/온프레미스 클러스터에서는 선택 사항(Optional)입니다.'
    ],
    cliCommands: [
      'kubectl get nodes -o custom-columns=NAME:.metadata.name,PROVIDER:.spec.providerID'
    ],
    configPaths: ['/etc/kubernetes/manifests/cloud-controller-manager.yaml'],
    badgeColor: 'bg-sky-600'
  },
  'kubelet-1': {
    id: 'kubelet-1',
    name: 'kubelet (Worker Node 1)',
    category: 'Worker Node',
    k8sRole: '워커 노드의 총지휘관 & 파드 라이프사이클 에이전트',
    summary: 'API Server로부터 할당된 파드 명세(PodSpec)를 전달받아, 컨테이너 런타임(CRI)과 네트워크(CNI)를 제어하여 파드가 건강하게 실행되도록 보장합니다.',
    deepDive: [
      'Pod Worker: 각 파드마다 고유한 고루틴 스레드를 생성하여 파드 생성, 프로브, 종료 과정을 비동기 관리합니다.',
      'CRI (Container Runtime Interface) 호출: gRPC를 통해 containerd/CRI-O에 샌드박스 생성 및 컨테이너 기동을 명령합니다.',
      '상태 보고 (Node Status & Heartbeat): 노드의 CPU/메모리 사용량과 파드 상태를 주기적으로 API Server에 보고합니다.'
    ],
    cliCommands: [
      'systemctl status kubelet',
      'journalctl -u kubelet -f -n 50'
    ],
    configPaths: ['/var/lib/kubelet/config.yaml'],
    badgeColor: 'bg-blue-500'
  },
  'kubelet-2': {
    id: 'kubelet-2',
    name: 'kubelet (Worker Node 2)',
    category: 'Worker Node',
    k8sRole: '워커 노드의 총지휘관 & 파드 라이프사이클 에이전트',
    summary: 'API Server로부터 할당된 파드 명세(PodSpec)를 전달받아, 컨테이너 런타임(CRI)과 네트워크(CNI)를 제어하여 파드가 건강하게 실행되도록 보장합니다.',
    deepDive: [
      'Pod Worker: 각 파드마다 고유한 고루틴 스레드를 생성하여 파드 생성, 프로브, 종료 과정을 비동기 관리합니다.',
      'CRI (Container Runtime Interface) 호출: gRPC를 통해 containerd/CRI-O에 샌드박스 생성 및 컨테이너 기동을 명령합니다.',
      '상태 보고 (Node Status & Heartbeat): 노드의 CPU/메모리 사용량과 파드 상태를 주기적으로 API Server에 보고합니다.'
    ],
    cliCommands: [
      'systemctl status kubelet',
      'journalctl -u kubelet -f -n 50'
    ],
    configPaths: ['/var/lib/kubelet/config.yaml'],
    badgeColor: 'bg-blue-500'
  },
  'runtime-1': {
    id: 'runtime-1',
    name: 'Container Runtime (CRI / containerd)',
    category: 'Worker Node',
    k8sRole: '컨테이너 프로세스 실제 실행 및 리눅스 커널 격리',
    summary: 'containerd 또는 CRI-O 엔진으로, Pause 컨테이너를 통한 네임스페이스 격리, 이미지 다운로드 및 cgroups 자원 제약을 담당합니다.',
    deepDive: [
      'Pause 컨테이너: 동일 파드 내 모든 컨테이너가 IPC 및 네트워크(IP)를 공유할 수 있도록 기반 네임스페이스를 생성합니다.',
      'Linux cgroups: 리눅스 커널의 CPU shares, quota, 메모리 한계(OOM 방지)를 실제 하드웨어 수준에서 격리/제한합니다.',
      'runc: OCI 표준에 맞추어 호스트 OS 커널 위에서 컨테이너 프로세스를 직접 fork/exec 합니다.'
    ],
    cliCommands: [
      'crictl ps',
      'crictl images',
      'crictl pods'
    ],
    configPaths: ['/etc/containerd/config.toml'],
    badgeColor: 'bg-amber-600'
  },
  'runtime-2': {
    id: 'runtime-2',
    name: 'Container Runtime (CRI / containerd)',
    category: 'Worker Node',
    k8sRole: '컨테이너 프로세스 실제 실행 및 리눅스 커널 격리',
    summary: 'containerd 또는 CRI-O 엔진으로, Pause 컨테이너를 통한 네임스페이스 격리, 이미지 다운로드 및 cgroups 자원 제약을 담당합니다.',
    deepDive: [
      'Pause 컨테이너: 동일 파드 내 모든 컨테이너가 IPC 및 네트워크(IP)를 공유할 수 있도록 기반 네임스페이스를 생성합니다.',
      'Linux cgroups: 리눅스 커널의 CPU shares, quota, 메모리 한계(OOM 방지)를 실제 하드웨어 수준에서 격리/제한합니다.',
      'runc: OCI 표준에 맞추어 호스트 OS 커널 위에서 컨테이너 프로세스를 직접 fork/exec 합니다.'
    ],
    cliCommands: [
      'crictl ps',
      'crictl images',
      'crictl pods'
    ],
    configPaths: ['/etc/containerd/config.toml'],
    badgeColor: 'bg-amber-600'
  },
  'objects-1': {
    id: 'objects-1',
    name: 'K8s Objects & Storage',
    category: 'Worker Node',
    k8sRole: '쿠버네티스 리소스 추상화 & 볼륨 마운트',
    summary: '파드에 주입된 ConfigMap, Secret, Persistent Volume 및 ReplicaSet 관리 레이블을 담고 있는 오브젝트 상태입니다.',
    deepDive: [
      'ConfigMap / Secret: kubelet에 의해 메모리 tmpfs 파일 시스템으로 파드 컨테이너에 안전하게 마운트됩니다.',
      'CSI (Container Storage Interface): 외부 스토리지(NFS, AWS EBS 등)를 워커 노드 디렉토리에 attach/mount 합니다.'
    ],
    cliCommands: [
      'kubectl get configmaps,secrets,pvc'
    ],
    configPaths: ['/var/lib/kubelet/pods/<pod-id>/volumes/'],
    badgeColor: 'bg-teal-600'
  },
  'objects-2': {
    id: 'objects-2',
    name: 'K8s Objects & Storage',
    category: 'Worker Node',
    k8sRole: '쿠버네티스 리소스 추상화 & 볼륨 마운트',
    summary: '파드에 주입된 ConfigMap, Secret, Persistent Volume 및 ReplicaSet 관리 레이블을 담고 있는 오브젝트 상태입니다.',
    deepDive: [
      'ConfigMap / Secret: kubelet에 의해 메모리 tmpfs 파일 시스템으로 파드 컨테이너에 안전하게 마운트됩니다.',
      'CSI (Container Storage Interface): 외부 스토리지(NFS, AWS EBS 등)를 워커 노드 디렉토리에 attach/mount 합니다.'
    ],
    cliCommands: [
      'kubectl get configmaps,secrets,pvc'
    ],
    configPaths: ['/var/lib/kubelet/pods/<pod-id>/volumes/'],
    badgeColor: 'bg-teal-600'
  },
  'kube-proxy-1': {
    id: 'kube-proxy-1',
    name: 'kube-proxy (Worker Node 1)',
    category: 'Worker Node',
    k8sRole: '서비스(ClusterIP/NodePort) 가상 네트워크 라우팅 프록시',
    summary: 'Service 오브젝트와 EndpointSlice 변경을 감시하여 노드의 iptables 또는 IPVS 라우팅 테이블을 프로그래밍합니다.',
    deepDive: [
      'iptables 모드: 무작위(random) 또는 균등 확률 체인 규칙을 호스트 커널 넷필터에 작성하여 트래픽을 파드 IP로 DNAT(목적지 주소 변환)합니다.',
      'IPVS 모드: 대규모 클러스터(수천 개 서비스)에서 해시 테이블을 사용하여 O(1)의 고속 라우팅 및 가중치 로드밸런싱을 제공합니다.',
      '직접 패킷을 중계하는 유저스페이스 프록시가 아니라 커널 라우팅 룰을 관리하는 오케스트레이터입니다.'
    ],
    cliCommands: [
      'iptables-save | grep KUBE-SVC',
      'ipvsadm -ln'
    ],
    configPaths: ['/var/lib/kube-proxy/config.conf'],
    badgeColor: 'bg-indigo-600'
  },
  'kube-proxy-2': {
    id: 'kube-proxy-2',
    name: 'kube-proxy (Worker Node 2)',
    category: 'Worker Node',
    k8sRole: '서비스(ClusterIP/NodePort) 가상 네트워크 라우팅 프록시',
    summary: 'Service 오브젝트와 EndpointSlice 변경을 감시하여 노드의 iptables 또는 IPVS 라우팅 테이블을 프로그래밍합니다.',
    deepDive: [
      'iptables 모드: 무작위(random) 또는 균등 확률 체인 규칙을 호스트 커널 넷필터에 작성하여 트래픽을 파드 IP로 DNAT(목적지 주소 변환)합니다.',
      'IPVS 모드: 대규모 클러스터(수천 개 서비스)에서 해시 테이블을 사용하여 O(1)의 고속 라우팅 및 가중치 로드밸런싱을 제공합니다.',
      '직접 패킷을 중계하는 유저스페이스 프록시가 아니라 커널 라우팅 룰을 관리하는 오케스트레이터입니다.'
    ],
    cliCommands: [
      'iptables-save | grep KUBE-SVC',
      'ipvsadm -ln'
    ],
    configPaths: ['/var/lib/kube-proxy/config.conf'],
    badgeColor: 'bg-indigo-600'
  },
  'endusers': {
    id: 'endusers',
    name: 'End Users (외부 트래픽 / 인그레스)',
    category: 'External',
    k8sRole: '클러스터 서비스에 접속하는 실제 사용자 및 클라이언트',
    summary: 'Ingress, NodePort, LoadBalancer IP를 통해 클러스터 서비스로 HTTP/TCP 요청을 전송하는 주체입니다.',
    deepDive: [
      '요청은 노드의 kube-proxy(iptables/IPVS) 또는 Ingress Controller(Nginx, Envoy)를 거칩니다.',
      '파드의 Readiness Probe가 성공하여 EndpointSlice에 등록된 파드들로만 트래픽이 안전하게 분산(Load Balancing)됩니다.'
    ],
    cliCommands: [
      'curl -I http://<service-ip>:80',
      'kubectl get endpointslices'
    ],
    configPaths: [],
    badgeColor: 'bg-pink-600'
  }
};
