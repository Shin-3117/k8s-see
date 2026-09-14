import { YamlPreset } from '../types/yamlMapping';

export const NGINX_DEPLOYMENT_YAML = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-server
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web-server
  template:
    metadata:
      labels:
        app: web-server
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: 250m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        readinessProbe:
          httpGet:
            path: /
            port: 80`;

export const SERVICE_INGRESS_YAML = `apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  type: ClusterIP
  selector:
    app: web-server
  ports:
  - port: 80
    targetPort: 80`;

export const YAML_PRESETS: YamlPreset[] = [
  {
    id: 'nginx-deployment',
    name: 'Nginx 웹 서버 Deployment',
    description: '레플리카 2개, 리소스 제약(CPU/Mem), 헬스체크 프로브가 포함된 표준 배포 매니페스트',
    content: NGINX_DEPLOYMENT_YAML,
    impacts: [
      {
        startLine: 1,
        endLine: 2,
        keyword: 'apiVersion & kind',
        title: 'API 버전 및 리소스 종류 선언',
        affectedComponents: ['apiserver'],
        summary: 'API Server가 OpenAPI 스키마 레지스트리(apps/v1)에서 Deployment 리소스를 인식하고 스키마 유효성을 검증합니다.',
        deepDive: '쿠버네티스 kube-apiserver는 요청을 받으면 internal Scheme 구조체에 등록된 리소스인지 대조합니다. apps 그룹의 v1 버전에 정의된 필수 필드 누락 여부와 스키마 유효성을 즉시 검사합니다.',
        kernelOrInternal: 'API Server: Scheme.Convert() 및 OpenAPI v3 JSON Schema 검증기 실행',
        cliCommand: 'kubectl explain deployment.apiVersion'
      },
      {
        startLine: 3,
        endLine: 5,
        keyword: 'metadata (name & namespace)',
        title: '오브젝트 고유 식별자 및 etcd 저장 경로',
        affectedComponents: ['apiserver', 'etcd'],
        summary: 'etcd에 저장될 키 경로(/registry/deployments/default/web-server)를 결정하고 RBAC 권한을 검사합니다.',
        deepDive: '모든 쿠버네티스 리소스는 네임스페이스와 이름을 결합하여 etcd에 유일무이한 키 경로로 저장됩니다. API Server의 RBAC 인가 모듈이 현재 사용자가 default 네임스페이스에 create deployments 권한이 있는지 검사합니다.',
        kernelOrInternal: 'etcd 키: /registry/deployments/default/web-server 및 ResourceVersion 부여',
        cliCommand: 'kubectl auth can-i create deployment -n default'
      },
      {
        startLine: 6,
        endLine: 7,
        keyword: 'spec.replicas: 2',
        title: '원하는 파드 개수 선언 (Desired State)',
        affectedComponents: ['controllerManager'],
        summary: 'kube-controller-manager의 ReplicaSet Controller가 작동하여 파드를 정확히 2개로 유지하는 Reconcile 루프를 가동합니다.',
        deepDive: '컨트롤러 매니저는 etcd의 실시간 변경을 Watch하고 있다가 "Desired Replicas = 2"를 감지합니다. 현재 동작 중인 파드 개수(0개)와 비교하여 차이(+2개)를 인지하고, 즉시 미할당 Pod 오브젝트 2개를 생성하여 API Server에 요청합니다.',
        kernelOrInternal: 'Controller Manager: syncDeployment() ➔ newRS() ➔ manageReplicas(desired=2, current=0)',
        cliCommand: 'kubectl scale deployment web-server --replicas=3'
      },
      {
        startLine: 8,
        endLine: 10,
        keyword: 'spec.selector.matchLabels',
        title: '관리 대상 파드 식별 라벨 셀렉터',
        affectedComponents: ['controllerManager', 'kube-proxy-1', 'kube-proxy-2'],
        summary: '컨트롤러와 서비스가 어떤 파드를 추적하고 관리할지 결정하는 핵심 레이블 매칭 필터입니다.',
        deepDive: 'ReplicaSet은 이 selector와 일치하는 labels를 가진 파드만을 자신의 소유로 관리합니다. 이후 Service 역시 이 selector를 통해 엔드포인트 파드를 찾아 kube-proxy 라우팅 테이블에 등록합니다.',
        kernelOrInternal: 'labels.Selector: labels.NewRequirement("app", selection.Equals, []string{"web-server"})',
        cliCommand: 'kubectl get pods -l app=web-server'
      },
      {
        startLine: 11,
        endLine: 14,
        keyword: 'template.metadata.labels',
        title: '생성될 파드에 부착되는 주민등록 라벨',
        affectedComponents: ['objects-1', 'objects-2'],
        summary: '앞으로 태어날 파드 인스턴스들의 메타데이터에 app: web-server 라벨이 부여됩니다.',
        deepDive: '파드 템플릿의 라벨은 파드가 생성될 때 파드 메타데이터에 그대로 복사됩니다. 이 라벨이 위의 selector와 반드시 일치해야 Deployment가 유효성 검사를 통과할 수 있습니다.',
        kernelOrInternal: 'Pod.ObjectMeta.Labels: map[string]string{"app": "web-server"}',
        cliCommand: 'kubectl get pods --show-labels'
      },
      {
        startLine: 16,
        endLine: 18,
        keyword: 'containers.image: nginx:1.25',
        title: '컨테이너 이미지 명세 및 런타임 Pull',
        affectedComponents: ['runtime-1', 'runtime-2'],
        summary: '워커 노드의 CRI(containerd)가 컨테이너 레지스트리에서 다운로드할 이미지와 태그를 지정합니다.',
        deepDive: 'Kubelet이 PodSpec을 받으면 CRI(containerd)에 ImageService.PullImage gRPC를 호출합니다. 로컬 캐시가 없으면 Docker Hub 레지스트리에서 레이어(tarball)를 다운로드하여 압축을 풀고 OCI 루트 파일시스템을 구성합니다.',
        kernelOrInternal: 'CRI gRPC: PullImageRequest{image.Image="nginx:1.25"} ➔ OverlayFS 스토리지 레이어 구성',
        cliCommand: 'crictl pull nginx:1.25'
      },
      {
        startLine: 19,
        endLine: 20,
        keyword: 'ports.containerPort: 80',
        title: '컨테이너 네트워크 포트 개방',
        affectedComponents: ['runtime-1', 'runtime-2', 'kube-proxy-1', 'kube-proxy-2'],
        summary: '파드 내부 가상 IP(10.244.x.x)에서 애플리케이션이 수신 대기할 TCP 포트 번호입니다.',
        deepDive: '파드 생성 시 CNI(Calico/Flannel)가 생성한 veth 페어를 통해 파드 전용 네트워크 네임스페이스에서 포트 80 리스닝 소켓을 개방하고, Service가 이를 타겟 포트로 매핑할 수 있게 합니다.',
        kernelOrInternal: 'Linux Net Namespace: iptables / IPVS 목적지 포트 80 라우팅',
        cliCommand: 'kubectl get ep web-server'
      },
      {
        startLine: 21,
        endLine: 27,
        keyword: 'resources (requests & limits)',
        title: '스케줄링 필터링 및 리눅스 cgroups 자원 제약',
        affectedComponents: ['scheduler', 'kubelet-1', 'kubelet-2', 'runtime-1', 'runtime-2'],
        summary: '스케줄러는 노드의 잔여 CPU/메모리를 검사하고, Kubelet은 리눅스 cgroups로 자원 상한을 격리합니다.',
        deepDive: '1. requests(CPU 250m, Mem 256Mi): kube-scheduler의 Phase 1 필터링에서 노드의 Allocatable 잔여량이 250m 이상인지 검사합니다. 2. limits(CPU 500m, Mem 512Mi): Kubelet이 리눅스 cgroups v2의 cpu.max 및 memory.max 파일에 값을 기록하여 메모리 512Mi 초과 시 커널 OOM-Killer가 프로세스를 즉시 종료시킵니다.',
        kernelOrInternal: '리눅스 cgroups: /sys/fs/cgroup/memory.max=536870912, cpu.max="50000 100000"',
        cliCommand: 'cat /sys/fs/cgroup/kubepods/pod<uuid>/memory.max'
      },
      {
        startLine: 28,
        endLine: 32,
        keyword: 'readinessProbe',
        title: '트래픽 수신 준비 검증 프로브',
        affectedComponents: ['kubelet-1', 'kubelet-2', 'kube-proxy-1', 'kube-proxy-2'],
        summary: 'Kubelet이 HTTP GET / 헬스체크를 수행하여 성공하기 전까지는 Service의 트래픽을 파드로 보내지 않습니다.',
        deepDive: 'Kubelet의 ProbeManager가 10초 주기로 컨테이너의 포트 80에 HTTP 요청을 보냅니다. 200 OK 응답이 오면 PodCondition "Ready: True"로 전환되고, EndpointSlice Controller가 파드 IP를 서비스 엔드포인트에 등록하여 kube-proxy가 실제 트래픽을 흘려보냅니다.',
        kernelOrInternal: 'Kubelet Prober: http.Get("http://10.244.1.5:80/") ➔ EndpointSlice 등록 트리거',
        cliCommand: 'kubectl describe pod web-server -n default | grep -A 5 Readiness'
      }
    ]
  },
  {
    id: 'service-ingress',
    name: 'ClusterIP Service 매니페스트',
    description: '파드들의 고유 IP를 단일 가상 IP로 묶고 트래픽을 로드밸런싱하는 서비스',
    content: SERVICE_INGRESS_YAML,
    impacts: [
      {
        startLine: 1,
        endLine: 2,
        keyword: 'kind: Service',
        title: '서비스 오브젝트 선언',
        affectedComponents: ['apiserver', 'etcd'],
        summary: 'API Server에 가상 IP(ClusterIP)를 생성하고 etcd에 Service 메타데이터를 저장합니다.',
        deepDive: 'Service는 동적으로 생성되고 사라지는 파드들의 IP 대신 고정된 내부 가상 IP(VIP)를 제공하는 쿠버네티스의 핵심 네트워크 추상화입니다.',
        kernelOrInternal: 'Service CIDR (10.96.0.0/12) 대역에서 미사용 VIP 자동 할당',
        cliCommand: 'kubectl get svc'
      },
      {
        startLine: 5,
        endLine: 7,
        keyword: 'spec.type & selector',
        title: 'ClusterIP 및 백엔드 파드 타겟팅',
        affectedComponents: ['kube-proxy-1', 'kube-proxy-2'],
        summary: 'app: web-server 라벨을 가진 모든 파드의 IP를 탐색하여 kube-proxy가 iptables에 로드밸런싱 규칙을 심습니다.',
        deepDive: 'EndpointSlice Controller가 app=web-server 라벨을 가진 살아있는 파드들의 IP(예: 10.244.1.14, 10.244.2.21)를 수집합니다. 모든 워커 노드의 kube-proxy가 이를 읽어 50%씩 확률로 분산하는 iptables statistic 모드 규칙을 작성합니다.',
        kernelOrInternal: 'iptables -A KUBE-SVC -m statistic --mode random --probability 0.50000000000 -j KUBE-SEP-1',
        cliCommand: 'kubectl get endpoints web-service'
      }
    ]
  }
];
