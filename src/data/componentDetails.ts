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
  csiController: {
    id: 'csiController', name: 'CSI Controller / external-provisioner', category: 'Worker Node',
    k8sRole: '외부 볼륨 생성·삭제·노드 연결 조정',
    summary: 'cloud-controller-manager와 별도 구성입니다. CSI controller의 배치 위치는 클러스터 구성에 따르며 반드시 Control Plane 노드일 필요는 없습니다.',
    deepDive: ['external-provisioner가 PVC와 StorageClass를 관찰하고 CSI 드라이버에 CreateVolume을 요청합니다.', 'WaitForFirstConsumer는 노드 후보·토폴로지를 고려한 볼륨 생성과 바인딩을 지원합니다.', '지원되는 드라이버에서 external-attacher와 CSI controller가 노드 Attach를 조정하고 kubelet·CSI node가 Mount를 수행합니다.'],
    cliCommands: ['kubectl get storageclass', 'kubectl describe pvc mysql-data-pvc', 'kubectl get volumeattachments'],
    configPaths: [], badgeColor: 'bg-amber-500',
  },
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
    k8sRole: 'Kubernetes API 요청의 관문',
    summary: 'Kubernetes API 요청을 검증하고 리소스의 사양과 상태를 etcd에 저장합니다. 앱 트래픽은 노드의 데이터 경로에서 전달되며 API Server를 통과하지 않습니다.',
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
      'Kubernetes 구성 요소는 보통 API Server를 통해 리소스를 조회·변경합니다. 운영 도구나 관리자의 etcd 접근은 별도 권한과 구성이 필요합니다.'
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
    summary: 'Deployment, ReplicaSet, StatefulSet, Node, ServiceAccount, EndpointSlice 등 수많은 핵심 컨트롤러들을 단일 프로세스에서 실행합니다.',
    deepDive: [
      'Reconciliation Loop (조정 루프): 끊임없이 etcd의 "현재 상태(Actual)"와 사용자가 선언한 "원하는 상태(Desired)"를 비교합니다.',
      'ReplicaSet Controller: replicas가 3인데 현재 파드가 2개라면 1개를 새로 생성하고, 4개라면 1개를 제거합니다.',
      'StatefulSet Controller: ReplicaSet 없이 Pod를 직접 관리하며 ordinal 이름과 Pod별 PVC를 유지합니다. 기본 OrderedReady 정책은 앞선 Pod가 Running·Ready가 된 뒤 다음 Pod를 생성합니다.',
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
      'ConfigMap/Secret은 kubelet이 파일로 제공합니다. Secret 볼륨은 tmpfs 등 메모리 기반 저장을 사용하며 ConfigMap과 구현을 동일하게 일반화하지 않습니다.',
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
      'ConfigMap/Secret은 kubelet이 파일로 제공합니다. Secret 볼륨은 tmpfs 등 메모리 기반 저장을 사용하며 ConfigMap과 구현을 동일하게 일반화하지 않습니다.',
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
  },
  'awsCloud': {
    id: 'awsCloud',
    name: 'AWS Cloud (Amazon Web Services)',
    category: 'External',
    k8sRole: '외부 클라우드 인프라 (EBS gp3 볼륨 & EC2 가상 머신)',
    summary: '쿠버네티스 클러스터 외부의 퍼블릭 클라우드 인프라로, EBS CSI Driver와 연계하여 블록 스토리지 볼륨 동적 프로비저닝 및 인스턴스 Attach를 수행합니다.',
    deepDive: [
      'ec2:CreateVolume: StorageClass 매개변수(gp3, IOPS 3000, 125MB/s, KMS 암호화)에 부합하는 가상 디스크(EBS)를 생성합니다.',
      'ec2:AttachVolume: 파드가 스케줄링된 Worker Node(EC2 인스턴스)에 디바이스(/dev/xvdf 또는 /dev/nvme1n1)로 하드웨어 연결합니다.',
      'CSI 사이드카는 CSI 드라이버를 gRPC로 호출하고, EBS 드라이버는 AWS API로 볼륨 생성·연결을 요청합니다.',
      'Pod를 교체해도 PVC/PV가 유지되면 기록된 데이터를 재사용할 수 있습니다. PVC 삭제 후 회수 정책과 앱의 쓰기 완료 여부는 별도로 확인합니다.'
    ],
    cliCommands: [
      'aws ec2 describe-volumes --volume-ids vol-0a91f4b2',
      'aws ec2 describe-volume-status --volume-ids vol-0a91f4b2',
      'kubectl get storageclass,pvc,pv'
    ],
    configPaths: ['/etc/kubernetes/csi/ebs.csi.aws.com'],
    badgeColor: 'bg-amber-600'
  },
  'ingressController': {
    id: 'ingressController',
    name: 'Ingress Controller (ingress-nginx)',
    category: 'Worker Node',
    k8sRole: 'L7 애플리케이션 계층 역방향 프록시 (Reverse Proxy & Load Balancer)',
    summary: '클러스터 외부에서 들어오는 HTTP/HTTPS 트래픽을 단일 엔드포인트(Port 80/443)에서 수신하여, 호스트(도메인) 및 URL 경로 규칙에 따라 적절한 백엔드 파드들로 스마트 라우팅합니다.',
    deepDive: [
      '1. 선언과 구현체의 분리: Ingress 리소스는 규칙 정의(메타데이터)일 뿐이며, Ingress Controller 데몬/디플로이먼트 파드가 실제 NGINX/Envoy 프록시 엔진을 구동합니다.',
      '2. Controller가 Service·EndpointSlice를 감시합니다. ClusterIP 또는 Pod IP 직접 전달은 구현에 따라 다르며, 이 화면은 Pod IP 전달 예시입니다.',
      '3. TLS Termination (SSL 오프로딩): Kubernetes Secret(tls.crt, tls.key)을 로드하여 443 포트에서 암호화 핸드셰이크를 처리하고 백엔드 파드에는 복호화된 평문 HTTP를 전달합니다.',
      '4. 프록시 설정 갱신: reload·동적 갱신 방식과 무중단 동작 조건은 제품·버전·설정에 따라 다릅니다.'
    ],
    cliCommands: [
      'kubectl get ingress -A',
      'kubectl describe ingress ecommerce-ingress',
      'kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx -f',
      'curl -i https://api.example.com/orders'
    ],
    configPaths: ['/etc/nginx/nginx.conf', '/etc/ingress-controller/ssl'],
    badgeColor: 'bg-purple-600'
  }
};
