import { Mode1Step, FlowchartNode } from '../types/pipeline';

export const MODE1_FLOWCHART_NODES: FlowchartNode[] = [
  { id: 'm1-client', name: '1. kubectl apply', subName: 'deployment.yaml 제출', componentId: 'developer', type: 'client', status: 'completed' },
  { id: 'm1-apiserver', name: '2. API Server', subName: '인증/인가 & 어드미션', componentId: 'apiserver', type: 'control-plane', status: 'pending' },
  { id: 'm1-etcd', name: '3. etcd 영구 저장', subName: 'Raft Quorum 커밋', componentId: 'etcd', type: 'control-plane', status: 'pending' },
  { id: 'm1-controller', name: '4. Controller Manager', subName: 'ReplicaSet Reconcile', componentId: 'controllerManager', type: 'control-plane', status: 'pending' },
  { id: 'm1-scheduler', name: '5. Scheduler', subName: '2-Phase 노드 분산 배치', componentId: 'scheduler', type: 'control-plane', status: 'pending' },
  { id: 'm1-kubelet', name: '6. Kubelet (Worker)', subName: 'Watch 감지 & Pod Worker', componentId: 'kubelet-1', type: 'worker', status: 'pending' },
  { id: 'm1-cri', name: '7. CRI (containerd)', subName: 'Pause / CNI / Pod 기동', componentId: 'runtime-1', type: 'worker', status: 'pending' },
  { id: 'm1-proxy', name: '8. Service & Proxy', subName: 'Readiness ➔ iptables 반영', componentId: 'kube-proxy-1', type: 'worker', status: 'pending' }
];

export const MODE1_STEPS: Mode1Step[] = [
  {
    stepNumber: 1,
    title: 'Manifest 수신 & 클라이언트 직렬화',
    subTitle: 'kubectl apply -f deployment.yaml',
    activeNodeId: 'm1-client',
    activeComponents: ['developer', 'apiserver'],
    packets: [
      {
        from: 'developer',
        to: 'apiserver',
        label: 'POST /apis/apps/v1/deployments',
        method: 'HTTP/2 POST',
        color: '#60A5FA'
      }
    ],
    description: '개발자(또는 CI/CD 도구)가 YAML 매니페스트를 kubectl로 실행합니다. kubectl은 YAML을 OpenAPI JSON 스키마로 직렬화하여 kube-apiserver로 HTTPS POST 요청을 보냅니다.',
    k8sMechanism: '클라이언트 측(kubectl)은 먼저 클러스터 캐시(~/.kube/cache)의 OpenAPI 사양을 통해 필드 오타를 검사하고, 유효한 경우 kubeconfig의 인증 정보(Client Cert / Token)를 HTTP Authorization 헤더에 첨부하여 전송합니다.',
    cliLogs: [
      {
        command: 'kubectl apply -f nginx-deployment.yaml -v=6',
        output: [
          'I0911 13:15:01.12001 loader.go:395] Config loaded from file: /Users/u085/.kube/config',
          'I0911 13:15:01.13402 round_trippers.go:553] POST https://k8s-master:6443/apis/apps/v1/namespaces/default/deployments',
          'I0911 13:15:01.13410 round_trippers.go:560] Request Headers: Accept: application/json, Content-Type: application/json',
          'I0911 13:15:01.14500 round_trippers.go:575] Response Status: 202 Accepted in 11 milliseconds'
        ]
      }
    ],
    podsState: [],
    highlightYamlLines: [1, 2, 3, 4, 5],
    etcdState: {
      revision: 42914,
      raftTerm: 3,
      records: []
    }
  },
  {
    stepNumber: 2,
    title: '인증(AuthN), 인가(AuthZ) 및 어드미션 컨트롤',
    subTitle: 'kube-apiserver 내부 파이프라인 심사',
    activeNodeId: 'm1-apiserver',
    activeComponents: ['apiserver'],
    packets: [],
    description: 'kube-apiserver가 들어온 요청에 대해 3중 보안 검문을 실시합니다. 1) 요청자가 누구인지(인증), 2) 해당 네임스페이스에 배포할 권한이 있는지(RBAC 인가), 3) 정책 위반이 없는지(Admission Webhook)를 통과시킵니다.',
    k8sMechanism: 'Mutating Webhook은 기본 스펙(예: PodSecurityContext, 기본 스토리지 클래스)을 매니페스트에 자동 주입하고, Validating Webhook은 리소스 쿼터 초과 여부와 비보안 루트 권한 사용 여부를 엄격히 심사합니다.',
    cliLogs: [
      {
        command: 'journalctl -u kube-apiserver -n 20 --no-pager',
        output: [
          'apiserver: Authentication: user="developer@company.com" groups=["system:authenticated"]',
          'apiserver: Authorization: RBAC RoleBinding "admin" allows "create" on "deployments" in "default"',
          'apiserver: Admission mutating webhook "default-storage-class" passed',
          'apiserver: Admission validating webhook "pod-security-standards" PASSED'
        ]
      }
    ],
    podsState: [],
    highlightYamlLines: [3, 4, 5],
    etcdState: {
      revision: 42914,
      raftTerm: 3,
      records: []
    }
  },
  {
    stepNumber: 3,
    title: 'etcd 영구 저장 & Raft 분산 커밋',
    subTitle: '클러스터 단일 진실 공급원(SSOT)에 Desired State 기록',
    activeNodeId: 'm1-etcd',
    activeComponents: ['apiserver', 'etcd', 'developer'],
    packets: [
      {
        from: 'apiserver',
        to: 'etcd',
        label: 'Raft Propose (/registry/deployments/default/web-server)',
        method: 'gRPC Propose',
        color: '#22D3EE'
      },
      {
        from: 'apiserver',
        to: 'developer',
        label: 'HTTP 201 Created (deployment.apps/web-server created)',
        method: 'HTTP/2 201',
        color: '#34D399'
      }
    ],
    description: 'API Server가 검증된 Deployment 오브젝트를 분산 저장소 etcd에 기록합니다. etcd 3중화 클러스터의 Raft 리더 노드가 과반수(Quorum) 합의를 거쳐 디스크 WAL(Write-Ahead Log)에 커밋하면, API Server가 개발자에게 성공(201 Created)을 응답합니다.',
    k8sMechanism: 'etcd는 각 쓰기 작업마다 단조 증가하는 revision 번호를 부여(MVCC)합니다. 이 시점에 사용자 터미널에는 "deployment.apps/web-server created" 메시지가 출력되지만, 아직 실제 컨테이너는 실행되지 않은 상태입니다.',
    cliLogs: [
      {
        command: 'etcdctl get /registry/deployments/default/web-server --write-out=json',
        output: [
          '{"header":{"cluster_id":1484163907,"member_id":1027665774,"revision":42915,"raft_term":3},',
          '"kvs":[{"key":"L3JlZ2lzdHJ5L2RlcGxveW1lbnRzL2RlZmF1bHQvd2ViLXNlcnZlcg==","create_revision":42915}]}'
        ]
      }
    ],
    podsState: [],
    highlightYamlLines: [6, 7],
    etcdState: {
      revision: 42915,
      raftTerm: 3,
      records: [
        {
          key: '/registry/deployments/default/web-server',
          type: 'Deployment',
          action: 'created',
          revision: 42915,
          highlightFields: ['metadata.name: "web-server"', 'spec.replicas: 2', 'spec.template.spec.containers'],
          data: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
              name: 'web-server',
              namespace: 'default',
              uid: '7c8e49b1-91ea-42b7-a38f',
              generation: 1,
              creationTimestamp: '2026-09-11T16:40:00Z',
              labels: { app: 'web-server' }
            },
            spec: {
              replicas: 2,
              selector: { matchLabels: { app: 'web-server' } },
              template: {
                metadata: { labels: { app: 'web-server' } },
                spec: {
                  containers: [
                    {
                      name: 'nginx',
                      image: 'nginx:1.25',
                      ports: [{ containerPort: 80 }]
                    }
                  ]
                }
              }
            },
            status: {}
          }
        }
      ]
    }
  },
  {
    stepNumber: 4,
    title: '컨트롤러 감지 & ReplicaSet Reconcile 루프',
    subTitle: 'Desired State(2) vs Current State(0) ➔ 미할당 파드 생성',
    activeNodeId: 'm1-controller',
    activeComponents: ['controllerManager', 'apiserver', 'etcd'],
    packets: [
      {
        from: 'controllerManager',
        to: 'apiserver',
        label: 'Watch Event ➔ POST /api/v1/pods (Pod 1 & Pod 2)',
        method: 'Reconcile Create',
        color: '#10B981'
      },
      {
        from: 'apiserver',
        to: 'etcd',
        label: 'Store Pods (nodeName: null, Status: Pending)',
        method: 'gRPC Put',
        color: '#22D3EE'
      }
    ],
    description: 'kube-controller-manager의 Deployment Controller와 ReplicaSet Controller가 Watch 이벤트를 수신합니다. 원하는 파드 수(2개)와 현재 파드 수(0개)의 차이를 계산하고, 스케줄링 대기 상태인 미할당 Pod 오브젝트 2개를 생성하여 API Server에 등록합니다.',
    k8sMechanism: '생성된 2개의 Pod 오브젝트는 spec.nodeName 필드가 비어있으며(null), status.phase는 "Pending" 상태로 etcd에 저장됩니다. 컨트롤러는 파드를 직접 노드에 배치하지 않고 오직 오브젝트 생성만 담당합니다.',
    cliLogs: [
      {
        command: 'kubectl get rs,pods -l app=web-server',
        output: [
          'NAME                                DESIRED   CURRENT   READY   AGE',
          'replicaset.apps/web-server-794d6c   2         2         0       1s',
          '',
          'NAME                                READY   STATUS    RESTARTS   AGE   NODE',
          'web-server-794d6c-4k8x1            0/1     Pending   0          1s    <none>',
          'web-server-794d6c-9p2mz            0/1     Pending   0          1s    <none>'
        ]
      }
    ],
    podsState: [
      { id: 'pod-1', name: 'web-server-794d6c-4k8x1', nodeId: 'worker-1', status: 'Pending', ready: '0/1', restarts: 0, age: '1s', ip: '미할당' },
      { id: 'pod-2', name: 'web-server-794d6c-9p2mz', nodeId: 'worker-2', status: 'Pending', ready: '0/1', restarts: 0, age: '1s', ip: '미할당' }
    ],
    highlightYamlLines: [6, 7, 8, 9, 10],
    etcdState: {
      revision: 42918,
      raftTerm: 3,
      records: [
        {
          key: '/registry/deployments/default/web-server',
          type: 'Deployment',
          action: 'updated',
          revision: 42916,
          highlightFields: ['status.replicas: 2', 'status.observedGeneration: 1'],
          data: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: { name: 'web-server', namespace: 'default', generation: 1 },
            spec: { replicas: 2 },
            status: { replicas: 2, updatedReplicas: 2, readyReplicas: 0 }
          }
        },
        {
          key: '/registry/replicasets/default/web-server-794d6c',
          type: 'ReplicaSet',
          action: 'created',
          revision: 42916,
          highlightFields: ['metadata.ownerReferences', 'spec.replicas: 2'],
          data: {
            apiVersion: 'apps/v1',
            kind: 'ReplicaSet',
            metadata: {
              name: 'web-server-794d6c',
              namespace: 'default',
              ownerReferences: [
                { apiVersion: 'apps/v1', kind: 'Deployment', name: 'web-server', uid: '7c8e49b1-91ea-42b7-a38f' }
              ]
            },
            spec: { replicas: 2, selector: { matchLabels: { app: 'web-server' } } },
            status: { replicas: 2, fullyLabeledReplicas: 2 }
          }
        },
        {
          key: '/registry/pods/default/web-server-794d6c-4k8x1',
          type: 'Pod',
          action: 'created',
          revision: 42917,
          highlightFields: ['spec.nodeName: null', 'status.phase: "Pending"', 'metadata.ownerReferences'],
          data: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'web-server-794d6c-4k8x1',
              namespace: 'default',
              ownerReferences: [{ apiVersion: 'apps/v1', kind: 'ReplicaSet', name: 'web-server-794d6c' }]
            },
            spec: { nodeName: null, containers: [{ name: 'nginx', image: 'nginx:1.25' }] },
            status: { phase: 'Pending', conditions: [{ type: 'PodScheduled', status: 'False' }] }
          }
        },
        {
          key: '/registry/pods/default/web-server-794d6c-9p2mz',
          type: 'Pod',
          action: 'created',
          revision: 42918,
          highlightFields: ['spec.nodeName: null', 'status.phase: "Pending"', 'metadata.ownerReferences'],
          data: {
            apiVersion: 'v1',
            kind: 'Pod',
            metadata: {
              name: 'web-server-794d6c-9p2mz',
              namespace: 'default',
              ownerReferences: [{ apiVersion: 'apps/v1', kind: 'ReplicaSet', name: 'web-server-794d6c' }]
            },
            spec: { nodeName: null, containers: [{ name: 'nginx', image: 'nginx:1.25' }] },
            status: { phase: 'Pending', conditions: [{ type: 'PodScheduled', status: 'False' }] }
          }
        }
      ]
    }
  },
  {
    stepNumber: 5,
    title: '스케줄러 2단계 배치 (Filtering & Scoring)',
    subTitle: '최적 노드 선별 ➔ Node 1 및 Node 2에 각각 바인딩(Binding)',
    activeNodeId: 'm1-scheduler',
    activeComponents: ['scheduler', 'apiserver', 'etcd'],
    packets: [
      {
        from: 'scheduler',
        to: 'apiserver',
        label: 'Binding: pod-1 ➔ worker-node-1, pod-2 ➔ worker-node-2',
        method: 'POST /binding',
        color: '#A855F7'
      },
      {
        from: 'apiserver',
        to: 'etcd',
        label: 'Update Pods: spec.nodeName Assigned',
        method: 'gRPC Commit',
        color: '#22D3EE'
      }
    ],
    description: 'kube-scheduler가 nodeName이 비어있는 2개 파드를 감지합니다. 1단계 필터링(노드 자원 여유, Taints/Tolerations)을 통과한 노드 중, 2단계 점수화(자원 균등 분배 LeastRequestedPriority)를 통해 Pod 1은 Worker Node 1에, Pod 2는 Worker Node 2에 분산 배치하기로 결정하고 API Server에 Binding을 요청합니다.',
    k8sMechanism: '스케줄러는 노드에 직접 접속하지 않습니다. 단지 API Server의 /binding 서브리소스를 호출하여 etcd 상의 Pod spec.nodeName을 "worker-node-1"과 "worker-node-2"로 갱신할 뿐입니다.',
    cliLogs: [
      {
        command: 'kubectl get events --field-selector reason=Scheduled',
        output: [
          'LAST SEEN   TYPE     REASON      OBJECT                         MESSAGE',
          '1s          Normal   Scheduled   pod/web-server-794d6c-4k8x1   Successfully assigned default/web-server-794d6c-4k8x1 to worker-node-1',
          '1s          Normal   Scheduled   pod/web-server-794d6c-9p2mz   Successfully assigned default/web-server-794d6c-9p2mz to worker-node-2'
        ]
      }
    ],
    podsState: [
      { id: 'pod-1', name: 'web-server-794d6c-4k8x1', nodeId: 'worker-1', status: 'Pending', ready: '0/1', restarts: 0, age: '3s', ip: '미할당' },
      { id: 'pod-2', name: 'web-server-794d6c-9p2mz', nodeId: 'worker-2', status: 'Pending', ready: '0/1', restarts: 0, age: '3s', ip: '미할당' }
    ],
    highlightYamlLines: [21, 22, 23, 24, 25, 26, 27],
    etcdState: {
      revision: 42921,
      raftTerm: 3,
      records: [
        {
          key: '/registry/deployments/default/web-server',
          type: 'Deployment',
          action: 'unchanged',
          revision: 42916,
          data: { metadata: { name: 'web-server' }, spec: { replicas: 2 } }
        },
        {
          key: '/registry/replicasets/default/web-server-794d6c',
          type: 'ReplicaSet',
          action: 'unchanged',
          revision: 42916,
          data: { metadata: { name: 'web-server-794d6c' }, spec: { replicas: 2 } }
        },
        {
          key: '/registry/pods/default/web-server-794d6c-4k8x1',
          type: 'Pod',
          action: 'updated',
          revision: 42920,
          highlightFields: ['spec.nodeName = "worker-node-1"', 'conditions[PodScheduled]=True'],
          data: {
            metadata: { name: 'web-server-794d6c-4k8x1' },
            spec: { nodeName: 'worker-node-1' },
            status: { phase: 'Pending', conditions: [{ type: 'PodScheduled', status: 'True', reason: 'Scheduled' }] }
          }
        },
        {
          key: '/registry/pods/default/web-server-794d6c-9p2mz',
          type: 'Pod',
          action: 'updated',
          revision: 42921,
          highlightFields: ['spec.nodeName = "worker-node-2"', 'conditions[PodScheduled]=True'],
          data: {
            metadata: { name: 'web-server-794d6c-9p2mz' },
            spec: { nodeName: 'worker-node-2' },
            status: { phase: 'Pending', conditions: [{ type: 'PodScheduled', status: 'True', reason: 'Scheduled' }] }
          }
        }
      ]
    }
  },
  {
    stepNumber: 6,
    title: '워커 노드 Kubelet 감지 (Watch 스트림)',
    subTitle: 'kubelet이 본인 노드에 할당된 새 파드 감지 & Pod Worker 기동',
    activeNodeId: 'm1-kubelet',
    activeComponents: ['apiserver', 'kubelet-1', 'kubelet-2'],
    packets: [
      {
        from: 'apiserver',
        to: 'kubelet-1',
        label: 'Watch Event: PodSpec for worker-node-1',
        method: 'gRPC Stream',
        color: '#3B82F6'
      },
      {
        from: 'apiserver',
        to: 'kubelet-2',
        label: 'Watch Event: PodSpec for worker-node-2',
        method: 'gRPC Stream',
        color: '#3B82F6'
      }
    ],
    description: '각 워커 노드의 kubelet은 API Server와 맺고 있는 지속적인 Watch HTTP 스트림을 통해 "자신의 노드 이름(worker-node-1, worker-node-2)"으로 스케줄링된 신규 파드를 감지합니다. Kubelet은 즉시 파드 전담 비동기 고루틴인 Pod Worker를 기동합니다.',
    k8sMechanism: 'Kubelet 내부의 PLEG(Pod Lifecycle Event Generator)와 SyncLoop가 작동하며, 파드 상태를 "ContainerCreating"으로 전이하고 볼륨 마운트와 런타임 호출을 준비합니다.',
    cliLogs: [
      {
        command: 'journalctl -u kubelet -n 10 -f',
        output: [
          'kubelet[2104]: "SyncLoop (ADD, pod)": "default/web-server-794d6c-4k8x1"',
          'kubelet[2104]: "Creating PodSandbox for pod" pod="default/web-server-794d6c-4k8x1"',
          'kubelet[2104]: "Starting Pod Worker goroutine" workerID=49'
        ]
      }
    ],
    podsState: [
      { id: 'pod-1', name: 'web-server-794d6c-4k8x1', nodeId: 'worker-1', status: 'ContainerCreating', ready: '0/1', restarts: 0, age: '5s', ip: '10.244.1.14' },
      { id: 'pod-2', name: 'web-server-794d6c-9p2mz', nodeId: 'worker-2', status: 'ContainerCreating', ready: '0/1', restarts: 0, age: '5s', ip: '10.244.2.21' }
    ],
    highlightYamlLines: [16, 17, 18],
    etcdState: {
      revision: 42925,
      raftTerm: 3,
      records: [
        {
          key: '/registry/deployments/default/web-server',
          type: 'Deployment',
          action: 'unchanged',
          revision: 42916,
          data: { metadata: { name: 'web-server' }, spec: { replicas: 2 } }
        },
        {
          key: '/registry/replicasets/default/web-server-794d6c',
          type: 'ReplicaSet',
          action: 'unchanged',
          revision: 42916,
          data: { metadata: { name: 'web-server-794d6c' }, spec: { replicas: 2 } }
        },
        {
          key: '/registry/pods/default/web-server-794d6c-4k8x1',
          type: 'Pod',
          action: 'updated',
          revision: 42924,
          highlightFields: ['status.phase: "Pending"', 'containerStatuses[0].state.waiting: "ContainerCreating"'],
          data: {
            metadata: { name: 'web-server-794d6c-4k8x1' },
            spec: { nodeName: 'worker-node-1' },
            status: {
              phase: 'Pending',
              hostIP: '192.168.1.101',
              containerStatuses: [{ name: 'nginx', state: { waiting: { reason: 'ContainerCreating' } } }]
            }
          }
        },
        {
          key: '/registry/pods/default/web-server-794d6c-9p2mz',
          type: 'Pod',
          action: 'updated',
          revision: 42925,
          highlightFields: ['status.phase: "Pending"', 'containerStatuses[0].state.waiting: "ContainerCreating"'],
          data: {
            metadata: { name: 'web-server-794d6c-9p2mz' },
            spec: { nodeName: 'worker-node-2' },
            status: {
              phase: 'Pending',
              hostIP: '192.168.1.102',
              containerStatuses: [{ name: 'nginx', state: { waiting: { reason: 'ContainerCreating' } } }]
            }
          }
        }
      ]
    }
  },
  {
    stepNumber: 7,
    title: 'CRI 격리 환경 구축 & 이미지 Pull & 컨테이너 기동',
    subTitle: 'Pause 샌드박스 생성 ➔ CNI 가상 IP ➔ containerd 컨테이너 실행',
    activeNodeId: 'm1-cri',
    activeComponents: ['kubelet-1', 'kubelet-2', 'runtime-1', 'runtime-2', 'objects-1', 'objects-2'],
    packets: [
      {
        from: 'kubelet-1',
        to: 'runtime-1',
        label: 'CRI gRPC: RunPodSandbox & CreateContainer(nginx)',
        method: 'gRPC Call',
        color: '#F59E0B'
      },
      {
        from: 'kubelet-2',
        to: 'runtime-2',
        label: 'CRI gRPC: RunPodSandbox & CreateContainer(nginx)',
        method: 'gRPC Call',
        color: '#F59E0B'
      }
    ],
    description: 'Kubelet이 CRI(containerd)를 호출하여 1) Pause 컨테이너로 독립된 Network/IPC 네임스페이스를 생성하고, 2) CNI 플러그인이 파드 IP(10.244.1.14, 10.244.2.21)를 부여하며, 3) nginx:1.25 이미지를 다운로드하여 컨테이너 프로세스를 실행합니다.',
    k8sMechanism: '리눅스 커널 수준에서 cgroups v2를 설정하여 각 컨테이너가 지정된 CPU(250m)와 메모리(256Mi~512Mi) 내에서만 동작하도록 물리적으로 격리합니다.',
    cliLogs: [
      {
        command: 'crictl ps',
        output: [
          'CONTAINER           IMAGE               CREATED             STATE               NAME                POD ID',
          '8f9e12a4b0c1        nginx:1.25          2 seconds ago       Running             nginx               4d9f10a8b9e0',
          '3b1c28d7e4f9        registry.k8s.io/pause:3.9  4 seconds ago  Running             POD                 4d9f10a8b9e0'
        ]
      }
    ],
    podsState: [
      { id: 'pod-1', name: 'web-server-794d6c-4k8x1', nodeId: 'worker-1', status: 'Running', ready: '0/1', restarts: 0, age: '7s', ip: '10.244.1.14' },
      { id: 'pod-2', name: 'web-server-794d6c-9p2mz', nodeId: 'worker-2', status: 'Running', ready: '0/1', restarts: 0, age: '7s', ip: '10.244.2.21' }
    ],
    highlightYamlLines: [16, 17, 18, 19, 20, 21, 22, 23, 24],
    etcdState: {
      revision: 42930,
      raftTerm: 3,
      records: [
        {
          key: '/registry/deployments/default/web-server',
          type: 'Deployment',
          action: 'unchanged',
          revision: 42916,
          data: { metadata: { name: 'web-server' }, spec: { replicas: 2 } }
        },
        {
          key: '/registry/replicasets/default/web-server-794d6c',
          type: 'ReplicaSet',
          action: 'unchanged',
          revision: 42916,
          data: { metadata: { name: 'web-server-794d6c' }, spec: { replicas: 2 } }
        },
        {
          key: '/registry/pods/default/web-server-794d6c-4k8x1',
          type: 'Pod',
          action: 'updated',
          revision: 42929,
          highlightFields: ['status.phase: "Running"', 'status.podIP: "10.244.1.14"', 'containerStatuses.ready: false'],
          data: {
            metadata: { name: 'web-server-794d6c-4k8x1' },
            spec: { nodeName: 'worker-node-1' },
            status: {
              phase: 'Running',
              podIP: '10.244.1.14',
              hostIP: '192.168.1.101',
              containerStatuses: [
                {
                  name: 'nginx',
                  ready: false,
                  restartCount: 0,
                  state: { running: { startedAt: '2026-09-11T16:40:07Z' } }
                }
              ]
            }
          }
        },
        {
          key: '/registry/pods/default/web-server-794d6c-9p2mz',
          type: 'Pod',
          action: 'updated',
          revision: 42930,
          highlightFields: ['status.phase: "Running"', 'status.podIP: "10.244.2.21"', 'containerStatuses.ready: false'],
          data: {
            metadata: { name: 'web-server-794d6c-9p2mz' },
            spec: { nodeName: 'worker-node-2' },
            status: {
              phase: 'Running',
              podIP: '10.244.2.21',
              hostIP: '192.168.1.102',
              containerStatuses: [
                {
                  name: 'nginx',
                  ready: false,
                  restartCount: 0,
                  state: { running: { startedAt: '2026-09-11T16:40:07Z' } }
                }
              ]
            }
          }
        }
      ]
    }
  },
  {
    stepNumber: 8,
    title: '프로브 검증 & kube-proxy 서비스 라우팅 반영',
    subTitle: 'Readiness 성공 ➔ EndpointSlice 등록 ➔ iptables/IPVS 트래픽 수신',
    activeNodeId: 'm1-proxy',
    activeComponents: ['kubelet-1', 'kubelet-2', 'apiserver', 'kube-proxy-1', 'kube-proxy-2', 'endusers'],
    packets: [
      {
        from: 'kubelet-1',
        to: 'apiserver',
        label: 'PodStatus: Ready=True (1/1)',
        method: 'Patch Status',
        color: '#10B981'
      },
      {
        from: 'apiserver',
        to: 'kube-proxy-1',
        label: 'EndpointSlice Update: [10.244.1.14:80, 10.244.2.21:80]',
        method: 'Watch Event',
        color: '#6366F1'
      },
      {
        from: 'endusers',
        to: 'kube-proxy-1',
        label: 'HTTP GET (외부 사용자 트래픽 인입 ➔ Pod 로드밸런싱)',
        method: 'Traffic Ingress',
        color: '#EC4899'
      },
      {
        from: 'kube-proxy-1',
        to: 'runtime-2',
        label: 'CNI VXLAN: 10.244.2.21:80 (Pod-2 터널링 라우팅)',
        method: 'Overlay Routing',
        color: '#10B981'
      }
    ],
    description: 'Kubelet의 Readiness Probe가 200 OK를 확인하여 파드 상태를 "Ready (1/1)"로 확정 보고합니다. EndpointSlice Controller가 파드 IP들을 서비스 엔드포인트에 추가하고, 각 노드의 kube-proxy가 커널 iptables/IPVS 룰을 갱신하여 외부 사용자 트래픽이 양쪽 파드로 완벽하게 로드밸런싱됩니다!',
    k8sMechanism: 'iptables -t nat -A KUBE-SVC-xxx 규칙에 의해 들어오는 패킷이 50% 확률로 10.244.1.14:80 또는 10.244.2.21:80으로 DNAT되어 최종 파드 컨테이너로 안전하게 전달됩니다.',
    cliLogs: [
      {
        command: 'kubectl get pods,endpointslices -o wide',
        output: [
          'NAME                                READY   STATUS    RESTARTS   AGE   IP            NODE',
          'web-server-794d6c-4k8x1            1/1     Running   0          12s   10.244.1.14   worker-node-1',
          'web-server-794d6c-9p2mz            1/1     Running   0          12s   10.244.2.21   worker-node-2',
          '',
          'NAME                        ADDRESSTYPE   PORTS   ENDPOINTS                    AGE',
          'web-service-7f4x           IPv4          80      10.244.1.14,10.244.2.21      2s'
        ]
      }
    ],
    podsState: [
      { id: 'pod-1', name: 'web-server-794d6c-4k8x1', nodeId: 'worker-1', status: 'Ready', ready: '1/1', restarts: 0, age: '12s', ip: '10.244.1.14' },
      { id: 'pod-2', name: 'web-server-794d6c-9p2mz', nodeId: 'worker-2', status: 'Ready', ready: '1/1', restarts: 0, age: '12s', ip: '10.244.2.21' }
    ],
    highlightYamlLines: [28, 29, 30, 31, 32],
    etcdState: {
      revision: 42935,
      raftTerm: 3,
      records: [
        {
          key: '/registry/deployments/default/web-server',
          type: 'Deployment',
          action: 'updated',
          revision: 42933,
          highlightFields: ['status.availableReplicas: 2', 'status.readyReplicas: 2'],
          data: {
            metadata: { name: 'web-server' },
            spec: { replicas: 2 },
            status: { replicas: 2, updatedReplicas: 2, readyReplicas: 2, availableReplicas: 2 }
          }
        },
        {
          key: '/registry/replicasets/default/web-server-794d6c',
          type: 'ReplicaSet',
          action: 'updated',
          revision: 42933,
          highlightFields: ['status.readyReplicas: 2', 'status.availableReplicas: 2'],
          data: {
            metadata: { name: 'web-server-794d6c' },
            spec: { replicas: 2 },
            status: { replicas: 2, readyReplicas: 2, availableReplicas: 2 }
          }
        },
        {
          key: '/registry/pods/default/web-server-794d6c-4k8x1',
          type: 'Pod',
          action: 'updated',
          revision: 42931,
          highlightFields: ['containerStatuses[0].ready: true (1/1)', 'conditions[Ready]=True'],
          data: {
            metadata: { name: 'web-server-794d6c-4k8x1' },
            spec: { nodeName: 'worker-node-1' },
            status: {
              phase: 'Running',
              podIP: '10.244.1.14',
              conditions: [{ type: 'Ready', status: 'True' }],
              containerStatuses: [{ name: 'nginx', ready: true, restartCount: 0 }]
            }
          }
        },
        {
          key: '/registry/pods/default/web-server-794d6c-9p2mz',
          type: 'Pod',
          action: 'updated',
          revision: 42932,
          highlightFields: ['containerStatuses[0].ready: true (1/1)', 'conditions[Ready]=True'],
          data: {
            metadata: { name: 'web-server-794d6c-9p2mz' },
            spec: { nodeName: 'worker-node-2' },
            status: {
              phase: 'Running',
              podIP: '10.244.2.21',
              conditions: [{ type: 'Ready', status: 'True' }],
              containerStatuses: [{ name: 'nginx', ready: true, restartCount: 0 }]
            }
          }
        },
        {
          key: '/registry/endpointslices/default/web-service-7f4x',
          type: 'EndpointSlice',
          action: 'created',
          revision: 42935,
          highlightFields: ['endpoints[0]: 10.244.1.14 (Ready)', 'endpoints[1]: 10.244.2.21 (Ready)', 'ports[0].port: 80'],
          data: {
            apiVersion: 'discovery.k8s.io/v1',
            kind: 'EndpointSlice',
            metadata: { name: 'web-service-7f4x', namespace: 'default', labels: { 'kubernetes.io/service-name': 'web-service' } },
            addressType: 'IPv4',
            endpoints: [
              { addresses: ['10.244.1.14'], conditions: { ready: true }, nodeName: 'worker-node-1', targetRef: { kind: 'Pod', name: 'web-server-794d6c-4k8x1' } },
              { addresses: ['10.244.2.21'], conditions: { ready: true }, nodeName: 'worker-node-2', targetRef: { kind: 'Pod', name: 'web-server-794d6c-9p2mz' } }
            ],
            ports: [{ name: 'http', port: 80, protocol: 'TCP' }]
          }
        }
      ]
    }
  }
];
