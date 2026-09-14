import { Mode1Step, FlowchartNode, EtcdRecord } from '../types/pipeline';

// 1. ConfigMap YAML provided by user
export const MODE3_CONFIGMAP_YAML = `apiVersion: v1
kind: ConfigMap
metadata:
  name: sk085-myfirst-configmap
  namespace: class-3
data:
  application-prod.yaml: |
    server:
      port: 8080

    developer:
      owner:
        name: sk085
        role: kubernetes
        level: high
      team:
        position: "5th floor"
        detail: class-3

    # H2 설정
    spring:
      datasource:
        url: jdbc:h2:mem:testdb
        driver-class-name: org.h2.Driver
        username: sa
        password:
      h2:
        console:
          enabled: true
          path: /h2-console
      jpa:
        hibernate:
          ddl-auto: create-drop
        show-sql: true
        defer-datasource-initialization: true
      sql:
        init:
          mode: always`;

// 2. Deployment YAML (mounting the ConfigMap at /config)
export const MODE3_DEPLOYMENT_YAML = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{USER_NAME}}-myfirst-api-server
  namespace: {{NAMESPACE}}
  labels:
    app: {{USER_NAME}}-myfirst-api-server
spec:
  replicas: 1
  selector:
    matchLabels:
      app: {{USER_NAME}}-myfirst-api-server
  template:
    metadata:
      annotations:
        prometheus.io/scrape: 'true'
        prometheus.io/port: '8080'
        prometheus.io/path: '/actuator/prometheus'
        update: {{HASHCODE}}
      labels:
        app: {{USER_NAME}}-myfirst-api-server
    spec:
      volumes:
      - name: config-volume
        configMap:
          name: sk085-myfirst-configmap
      containers:
      - name: webserver
        image: {{DOCKER_REGISTRY}}/{{PROJECT_NAME}}/{{USER_NAME}}-{{IMAGE_NAME}}:1.0
        imagePullPolicy: Always
        volumeMounts:
        - name: config-volume
          mountPath: /config
        env:
        - name: USER_NAME
          value: {{USER_NAME}}
        - name: NAMESPACE
          value: {{NAMESPACE}}
        - name: SPRING_PROFILES_ACTIVE  
          value: "prod"
        - name: SPRING_CONFIG_ADDITIONAL_LOCATION
          value: "file:/config/"`;

// 3. Service YAML
export const MODE3_SERVICE_YAML = `apiVersion: v1
kind: Service
metadata:
  name: {{USER_NAME}}-myfirst-api-server
  namespace: {{NAMESPACE}}
  labels:
    app: {{USER_NAME}}-myfirst-api-server
spec:
  type: ClusterIP
  selector:
    app: {{USER_NAME}}-myfirst-api-server
  ports:
    - name: http
      protocol: TCP
      port: 8080
      targetPort: 8080
    - name: mgmt
      protocol: TCP
      port: 8081
      targetPort: 8081`;

// Default template variable values matching user's sk085 and class-3 namespace
export const DEFAULT_TEMPLATE_VARS = {
  USER_NAME: 'sk085',
  NAMESPACE: 'class-3',
  HASHCODE: 'v24a91f',
  DOCKER_REGISTRY: 'harbor.corp.internal',
  PROJECT_NAME: 'dev-team',
  IMAGE_NAME: 'myfirst-api-server'
};

export const substituteVariables = (yaml: string, vars: typeof DEFAULT_TEMPLATE_VARS = DEFAULT_TEMPLATE_VARS) => {
  return yaml
    .replace(/\{\{USER_NAME\}\}/g, vars.USER_NAME)
    .replace(/\{\{NAMESPACE\}\}/g, vars.NAMESPACE)
    .replace(/\{\{HASHCODE\}\}/g, vars.HASHCODE)
    .replace(/\{\{DOCKER_REGISTRY\}\}/g, vars.DOCKER_REGISTRY)
    .replace(/\{\{PROJECT_NAME\}\}/g, vars.PROJECT_NAME)
    .replace(/\{\{IMAGE_NAME\}\}/g, vars.IMAGE_NAME);
};

// 12 Flowchart Nodes cleanly distinguishing the 3 distinct phases
export const MODE3_FLOWCHART_NODES: FlowchartNode[] = [
  // Phase 1: ConfigMap Apply (1~2)
  { id: 'm3-1-cm-apply', name: '1. [Config] apply', subName: 'configmap.yaml 제출', componentId: 'developer', type: 'client', status: 'completed' },
  { id: 'm3-2-cm-etcd', name: '2. [Config] etcd', subName: 'H2 DB 설정 저장', componentId: 'etcd', type: 'control-plane', status: 'pending' },
  // Phase 2: Deployment Apply & Volume Mount (3~7)
  { id: 'm3-3-deploy-apply', name: '3. [Deploy] apply', subName: 'deployment.yaml 제출', componentId: 'developer', type: 'client', status: 'pending' },
  { id: 'm3-4-deploy-etcd', name: '4. [Deploy] etcd', subName: 'Desired State 커밋', componentId: 'etcd', type: 'control-plane', status: 'pending' },
  { id: 'm3-5-rs', name: '5. [Deploy] Controller', subName: 'ReplicaSet & Pod 생성', componentId: 'controllerManager', type: 'control-plane', status: 'pending' },
  { id: 'm3-6-sched', name: '6. [Deploy] Scheduler', subName: 'Worker-1 노드 바인딩', componentId: 'scheduler', type: 'control-plane', status: 'pending' },
  { id: 'm3-7-kubelet', name: '7. [Deploy] Volume & Pod', subName: 'tmpfs 마운트 & H2 기동', componentId: 'kubelet-1', type: 'worker', status: 'pending' },
  // Phase 3: Service Apply & Multi-Port Routing (8~12)
  { id: 'm3-8-svc-apply', name: '8. [Service] apply', subName: 'service.yaml 접수', componentId: 'developer', type: 'client', status: 'pending' },
  { id: 'm3-9-clusterip', name: '9. [Service] ClusterIP', subName: '가상 IP 10.96.182.44', componentId: 'apiserver', type: 'control-plane', status: 'pending' },
  { id: 'm3-10-endpoints', name: '10. [Link] 라벨 매칭', subName: 'EndpointSlice 듀얼 포트', componentId: 'controllerManager', type: 'control-plane', status: 'pending' },
  { id: 'm3-11-proxy', name: '11. [Network] kube-proxy', subName: 'iptables NAT 체인 주입', componentId: 'kube-proxy-1', type: 'worker', status: 'pending' },
  { id: 'm3-12-traffic', name: '12. [Traffic] 듀얼 트래픽', subName: '8080 H2/API & 8081 Actuator', componentId: 'endusers', type: 'client', status: 'pending' }
];

export interface Mode3Step extends Mode1Step {
  phase: 'configmap' | 'deployment' | 'service';
  targetYaml: 'configmap' | 'deployment' | 'service' | 'all';
  linkageHighlight?: {
    type: 'config' | 'service';
    title: string;
    source: string;
    target: string;
    isMatched: boolean;
  };
}

// =========================================================================
// CUMULATIVE ETCD BASE RECORDS (Preserves all history across steps)
// =========================================================================
const BASE_CM_RECORD: EtcdRecord = {
  key: '/registry/configmaps/class-3/sk085-myfirst-configmap',
  type: 'ConfigMap',
  action: 'unchanged',
  revision: 61201,
  data: {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name: 'sk085-myfirst-configmap',
      namespace: 'class-3',
      uid: 'c71f92a1-3b4e-4f11-9a28-98e721bc5510'
    },
    data: {
      'application-prod.yaml': 'server:\n  port: 8080\n\ndeveloper:\n  owner:\n    name: sk085\n    role: kubernetes\n    level: high\n  team:\n    position: "5th floor"\n    detail: class-3\n\nspring:\n  datasource:\n    url: jdbc:h2:mem:testdb\n    driver-class-name: org.h2.Driver\n    username: sa\n  h2:\n    console:\n      enabled: true\n      path: /h2-console\n    jpa:\n      hibernate:\n        ddl-auto: create-drop\n      show-sql: true'
    }
  }
};

const BASE_DEPLOY_RECORD: EtcdRecord = {
  key: '/registry/deployments/class-3/sk085-myfirst-api-server',
  type: 'Deployment',
  action: 'unchanged',
  revision: 61203,
  data: {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: 'sk085-myfirst-api-server',
      namespace: 'class-3',
      labels: { app: 'sk085-myfirst-api-server' },
      uid: 'd91a82f3-4c91-4e78-9b12-a1f49cb82110',
      generation: 1
    },
    spec: {
      replicas: 1,
      selector: { matchLabels: { app: 'sk085-myfirst-api-server' } },
      template: {
        metadata: {
          labels: { app: 'sk085-myfirst-api-server' },
          annotations: {
            'prometheus.io/scrape': 'true',
            'prometheus.io/port': '8080',
            'prometheus.io/path': '/actuator/prometheus',
            'update': 'v24a91f'
          }
        },
        spec: {
          volumes: [{ name: 'config-volume', configMap: { name: 'sk085-myfirst-configmap' } }],
          containers: [{
            name: 'webserver',
            image: 'harbor.corp.internal/dev-team/sk085-myfirst-api-server:1.0',
            volumeMounts: [{ name: 'config-volume', mountPath: '/config' }],
            env: [
              { name: 'USER_NAME', value: 'sk085' },
              { name: 'NAMESPACE', value: 'class-3' },
              { name: 'SPRING_PROFILES_ACTIVE', value: 'prod' },
              { name: 'SPRING_CONFIG_ADDITIONAL_LOCATION', value: 'file:/config/' }
            ]
          }]
        }
      }
    },
    status: { replicas: 1, readyReplicas: 1, updatedReplicas: 1, availableReplicas: 1 }
  }
};

const BASE_RS_RECORD: EtcdRecord = {
  key: '/registry/replicasets/class-3/sk085-myfirst-api-server-5f89c7d4',
  type: 'ReplicaSet',
  action: 'unchanged',
  revision: 61204,
  data: {
    apiVersion: 'apps/v1',
    kind: 'ReplicaSet',
    metadata: {
      name: 'sk085-myfirst-api-server-5f89c7d4',
      namespace: 'class-3',
      ownerReferences: [{ kind: 'Deployment', name: 'sk085-myfirst-api-server', uid: 'd91a82f3-4c91-4e78-9b12-a1f49cb82110' }]
    },
    spec: { replicas: 1 },
    status: { replicas: 1, readyReplicas: 1 }
  }
};

const BASE_POD_RECORD: EtcdRecord = {
  key: '/registry/pods/class-3/sk085-myfirst-api-server-5f89c7d4-9x7wp',
  type: 'Pod',
  action: 'unchanged',
  revision: 61208,
  data: {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name: 'sk085-myfirst-api-server-5f89c7d4-9x7wp',
      namespace: 'class-3',
      labels: { app: 'sk085-myfirst-api-server', 'pod-template-hash': '5f89c7d4' }
    },
    spec: {
      nodeName: 'worker-1',
      volumes: [{ name: 'config-volume', configMap: { name: 'sk085-myfirst-configmap' } }],
      containers: [{ name: 'webserver', image: 'harbor.corp.internal/dev-team/sk085-myfirst-api-server:1.0' }]
    },
    status: {
      phase: 'Running',
      podIP: '10.244.1.25',
      hostIP: '192.168.1.101',
      conditions: [{ type: 'Ready', status: 'True' }],
      containerStatuses: [{ name: 'webserver', ready: true, restartCount: 0 }]
    }
  }
};

const BASE_SVC_RECORD: EtcdRecord = {
  key: '/registry/services/specs/class-3/sk085-myfirst-api-server',
  type: 'Service',
  action: 'unchanged',
  revision: 61210,
  data: {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: 'sk085-myfirst-api-server',
      namespace: 'class-3',
      labels: { app: 'sk085-myfirst-api-server' }
    },
    spec: {
      type: 'ClusterIP',
      clusterIP: '10.96.182.44',
      selector: { app: 'sk085-myfirst-api-server' },
      ports: [
        { name: 'http', port: 8080, targetPort: 8080, protocol: 'TCP' },
        { name: 'mgmt', port: 8081, targetPort: 8081, protocol: 'TCP' }
      ]
    }
  }
};

const BASE_ENDPOINTSLICE_RECORD: EtcdRecord = {
  key: '/registry/endpointslices/class-3/sk085-myfirst-api-server-7bx4',
  type: 'EndpointSlice',
  action: 'unchanged',
  revision: 61212,
  data: {
    apiVersion: 'discovery.k8s.io/v1',
    kind: 'EndpointSlice',
    metadata: {
      name: 'sk085-myfirst-api-server-7bx4',
      namespace: 'class-3',
      labels: { 'kubernetes.io/service-name': 'sk085-myfirst-api-server' },
      ownerReferences: [{ kind: 'Service', name: 'sk085-myfirst-api-server' }]
    },
    addressType: 'IPv4',
    endpoints: [{
      addresses: ['10.244.1.25'],
      conditions: { ready: true, serving: true, terminating: false },
      nodeName: 'worker-1',
      targetRef: { kind: 'Pod', name: 'sk085-myfirst-api-server-5f89c7d4-9x7wp' }
    }],
    ports: [
      { name: 'http', port: 8080, protocol: 'TCP' },
      { name: 'mgmt', port: 8081, protocol: 'TCP' }
    ]
  }
};

// =========================================================================
// 12 FULLY CUMULATIVE STEPS
// =========================================================================
export const MODE3_STEPS: Mode3Step[] = [
  // -------------------------------------------------------------------------
  // STEP 1: ConfigMap Apply
  // -------------------------------------------------------------------------
  {
    stepNumber: 1,
    phase: 'configmap',
    targetYaml: 'configmap',
    title: '[Config] configmap.yaml 단독 접수 및 스키마 검증',
    subTitle: 'kubectl apply -f configmap.yaml (Spring Boot 프로파일 application-prod.yaml 선제 배포)',
    activeNodeId: 'm3-1-cm-apply',
    activeComponents: ['developer', 'apiserver'],
    packets: [
      {
        from: 'developer',
        to: 'apiserver',
        label: 'POST /api/v1/namespaces/class-3/configmaps',
        method: 'HTTP/2 POST',
        color: '#38BDF8'
      }
    ],
    description: '개발자가 Spring Boot 설정 파일(`application-prod.yaml`, H2 데이터베이스 및 개발자 정보)이 담긴 `configmap.yaml`을 단독으로 실행합니다. API Server는 OpenAPI 스키마 유효성을 검사합니다.',
    k8sMechanism: '쿠버네티스에서 애플리케이션 이미지와 환경 설정을 분리(12-Factor App)하기 위해 ConfigMap을 워크로드(Deployment)보다 먼저 배포하는 것은 클라우드 네이티브의 핵심 권장 패턴입니다.',
    cliLogs: [
      {
        command: 'kubectl apply -f configmap.yaml -n class-3 -v=6',
        output: [
          'I0914 11:20:01.01012 loader.go:395] Config loaded from file: /Users/sk085/.kube/config',
          'I0914 11:20:01.02510 round_trippers.go:553] POST https://k8s-master:6443/api/v1/namespaces/class-3/configmaps',
          'I0914 11:20:01.03401 round_trippers.go:575] Response Status: 201 Created in 8 milliseconds',
          'configmap/sk085-myfirst-configmap created'
        ]
      }
    ],
    podsState: [],
    highlightYamlLines: [1, 2, 3, 4, 5],
    etcdState: {
      revision: 61200,
      raftTerm: 5,
      records: []
    }
  },

  // -------------------------------------------------------------------------
  // STEP 2: ConfigMap etcd Commit
  // -------------------------------------------------------------------------
  {
    stepNumber: 2,
    phase: 'configmap',
    targetYaml: 'configmap',
    title: '[Config] etcd 영구 저장 & Raft 합의 (/registry/configmaps/...)',
    subTitle: 'H2 DB 설정과 application-prod.yaml 데이터가 etcd에 안전하게 보관됨',
    activeNodeId: 'm3-2-cm-etcd',
    activeComponents: ['apiserver', 'etcd', 'developer'],
    packets: [
      {
        from: 'apiserver',
        to: 'etcd',
        label: 'Raft Propose (/registry/configmaps/class-3/sk085-myfirst-configmap)',
        method: 'gRPC Propose',
        color: '#22D3EE'
      },
      {
        from: 'apiserver',
        to: 'developer',
        label: 'HTTP 201 Created (configmap/sk085-myfirst-configmap created)',
        method: 'HTTP/2 201',
        color: '#34D399'
      }
    ],
    description: 'API Server가 검증된 ConfigMap 데이터를 etcd에 영구 기록합니다. 이제 클러스터 내 어떤 Pod든 `sk085-myfirst-configmap`을 참조하여 설정 파일을 파일 또는 환경변수로 마운트할 수 있습니다.',
    k8sMechanism: 'etcd에 저장된 ConfigMap은 1MB 크기 제한이 있으며, API Server를 통해서만 암호화 및 무결성 검증을 거쳐 접근할 수 있습니다.',
    cliLogs: [
      {
        command: 'kubectl get configmap sk085-myfirst-configmap -n class-3 -o yaml',
        output: [
          'apiVersion: v1',
          'kind: ConfigMap',
          'metadata:',
          '  name: sk085-myfirst-configmap',
          '  namespace: class-3',
          'data:',
          '  application-prod.yaml: |',
          '    server.port: 8080',
          '    spring.datasource.url: jdbc:h2:mem:testdb'
        ]
      }
    ],
    podsState: [],
    highlightYamlLines: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    etcdState: {
      revision: 61201,
      raftTerm: 5,
      records: [
        {
          ...BASE_CM_RECORD,
          action: 'created',
          revision: 61201,
          highlightFields: ['metadata.name', 'data["application-prod.yaml"]', 'spring.datasource.url: jdbc:h2:mem:testdb']
        }
      ]
    }
  },

  // -------------------------------------------------------------------------
  // STEP 3: Deployment Apply
  // -------------------------------------------------------------------------
  {
    stepNumber: 3,
    phase: 'deployment',
    targetYaml: 'deployment',
    title: '[Deploy] deployment.yaml 단독 접수 (ConfigMap 볼륨 참조 선언)',
    subTitle: 'volumes.configMap: sk085-myfirst-configmap 및 volumeMounts: /config 선언',
    activeNodeId: 'm3-3-deploy-apply',
    activeComponents: ['developer', 'apiserver'],
    packets: [
      {
        from: 'developer',
        to: 'apiserver',
        label: 'POST /apis/apps/v1/namespaces/class-3/deployments',
        method: 'HTTP/2 POST',
        color: '#60A5FA'
      }
    ],
    description: '이제 개발자가 `deployment.yaml`을 실행합니다. 이 매니페스트는 `volumes` 섹션에서 앞서 배포한 `sk085-myfirst-configmap`을 참조하여 컨테이너 내부 `/config` 경로에 마운트하도록 선언하고 있습니다.',
    k8sMechanism: 'API Server는 매니페스트의 참조 무결성을 확인합니다. 만약 참조하는 ConfigMap이 etcd에 없다면 이 시점에서는 배포가 수락되지만, 차후 Kubelet 기동 시 `CreateContainerConfigError`가 발생하게 됩니다. (선제 배포의 중요성!)',
    cliLogs: [
      {
        command: 'kubectl apply -f deployment.yaml -n class-3',
        output: [
          'deployment.apps/sk085-myfirst-api-server created'
        ]
      }
    ],
    podsState: [],
    highlightYamlLines: [18, 19, 20, 21, 26, 27, 28],
    linkageHighlight: {
      type: 'config',
      title: 'ConfigMap 볼륨 바인딩',
      source: 'ConfigMap: sk085-myfirst-configmap',
      target: 'Deployment.spec.template.spec.volumes[0]',
      isMatched: true
    },
    etcdState: {
      revision: 61201,
      raftTerm: 5,
      records: [
        BASE_CM_RECORD
      ]
    }
  },

  // -------------------------------------------------------------------------
  // STEP 4: Deployment etcd Commit
  // -------------------------------------------------------------------------
  {
    stepNumber: 4,
    phase: 'deployment',
    targetYaml: 'deployment',
    title: '[Deploy] etcd 영구 저장 & Raft 합의 (/registry/deployments/...)',
    subTitle: 'Deployment Desired State(replicas: 1)가 etcd에 기록됨',
    activeNodeId: 'm3-4-deploy-etcd',
    activeComponents: ['apiserver', 'etcd', 'developer'],
    packets: [
      {
        from: 'apiserver',
        to: 'etcd',
        label: 'Raft Propose (/registry/deployments/class-3/sk085-myfirst-api-server)',
        method: 'gRPC Propose',
        color: '#22D3EE'
      },
      {
        from: 'apiserver',
        to: 'developer',
        label: 'HTTP 201 Created (deployment created)',
        method: 'HTTP/2 201',
        color: '#34D399'
      }
    ],
    description: 'API Server가 Deployment 정의를 etcd에 저장합니다. 이제 Controller Manager가 이 이벤트를 감지할 준비를 마칩니다.',
    k8sMechanism: 'etcd에는 ConfigMap과 Deployment가 각각 독립된 디렉토리(`/registry/configmaps/...`, `/registry/deployments/...`)에 안전하게 공존합니다.',
    cliLogs: [
      {
        command: 'kubectl get deployment -n class-3',
        output: [
          'NAME                       READY   UP-TO-DATE   AVAILABLE   AGE',
          'sk085-myfirst-api-server   0/1     0            0           1s'
        ]
      }
    ],
    podsState: [],
    highlightYamlLines: [1, 2, 3, 4, 5, 6, 7],
    etcdState: {
      revision: 61203,
      raftTerm: 5,
      records: [
        BASE_CM_RECORD,
        {
          ...BASE_DEPLOY_RECORD,
          action: 'created',
          revision: 61203,
          highlightFields: ['metadata.name', 'spec.replicas: 1', 'spec.template.spec.volumes[0].configMap.name']
        }
      ]
    }
  },

  // -------------------------------------------------------------------------
  // STEP 5: Controller Manager -> ReplicaSet & Pod
  // -------------------------------------------------------------------------
  {
    stepNumber: 5,
    phase: 'deployment',
    targetYaml: 'deployment',
    title: '[Deploy] Controller Manager ➔ ReplicaSet & 미할당 Pod 생성',
    subTitle: 'Deployment Controller ➔ ReplicaSet 생성 ➔ ReplicaSet Controller ➔ Pod 생성',
    activeNodeId: 'm3-5-rs',
    activeComponents: ['controllerManager', 'apiserver', 'etcd'],
    packets: [
      {
        from: 'controllerManager',
        to: 'apiserver',
        label: 'POST /apis/apps/v1/namespaces/class-3/replicasets',
        method: 'HTTP/2 POST',
        color: '#A855F7'
      },
      {
        from: 'apiserver',
        to: 'etcd',
        label: 'Create /registry/replicasets/... & /registry/pods/...',
        method: 'gRPC Propose',
        color: '#22D3EE'
      }
    ],
    description: 'Deployment Controller가 해시(5f89c7d4)가 붙은 ReplicaSet을 만들고, ReplicaSet Controller가 `sk085-myfirst-configmap` 볼륨 스펙을 상속받은 미할당 Pod를 etcd에 생성합니다.',
    k8sMechanism: 'Pod 스펙 내부에는 ConfigMap의 이름과 마운트 경로(/config)가 명시되어 있으며, 스케줄러가 노드를 지정할 때까지 대기(Pending) 상태로 유지됩니다.',
    cliLogs: [
      {
        command: 'kubectl get rs,pod -n class-3',
        output: [
          'NAME                                                DESIRED   CURRENT   READY   AGE',
          'replicaset.apps/sk085-myfirst-api-server-5f89c7d4   1         1         0       1s',
          '',
          'NAME                                           READY   STATUS    RESTARTS   AGE',
          'pod/sk085-myfirst-api-server-5f89c7d4-9x7wp   0/1     Pending   0          0s'
        ]
      }
    ],
    podsState: [
      {
        id: 'pod-m3-1',
        name: 'sk085-myfirst-api-server-5f89c7d4-9x7wp',
        nodeId: 'worker-1',
        status: 'Pending',
        ready: '0/1',
        restarts: 0,
        age: '1s',
        ip: '할당 대기'
      }
    ],
    highlightYamlLines: [8, 9, 10, 11, 12, 13],
    etcdState: {
      revision: 61205,
      raftTerm: 5,
      records: [
        BASE_CM_RECORD,
        {
          ...BASE_DEPLOY_RECORD,
          action: 'updated',
          revision: 61204,
          highlightFields: ['status.replicas: 1']
        },
        {
          ...BASE_RS_RECORD,
          action: 'created',
          revision: 61204,
          highlightFields: ['metadata.name', 'spec.replicas: 1', 'metadata.ownerReferences']
        },
        {
          ...BASE_POD_RECORD,
          action: 'created',
          revision: 61205,
          highlightFields: ['metadata.name', 'status.phase: "Pending"', 'spec.nodeName: null'],
          data: {
            ...BASE_POD_RECORD.data,
            spec: { ...BASE_POD_RECORD.data.spec, nodeName: null },
            status: { phase: 'Pending' }
          }
        }
      ]
    }
  },

  // -------------------------------------------------------------------------
  // STEP 6: Kube-Scheduler Node Binding
  // -------------------------------------------------------------------------
  {
    stepNumber: 6,
    phase: 'deployment',
    targetYaml: 'deployment',
    title: '[Deploy] Kube-Scheduler ➔ Worker-1 노드 바인딩',
    subTitle: '노드 가용 자원 필터링 및 점수화 후 worker-1에 Pod 배치 확정',
    activeNodeId: 'm3-6-sched',
    activeComponents: ['scheduler', 'apiserver', 'etcd'],
    packets: [
      {
        from: 'scheduler',
        to: 'apiserver',
        label: 'POST /api/v1/namespaces/class-3/pods/.../binding (worker-1)',
        method: 'HTTP/2 POST',
        color: '#F59E0B'
      },
      {
        from: 'apiserver',
        to: 'etcd',
        label: 'Update Pod spec.nodeName = "worker-1"',
        method: 'gRPC Propose',
        color: '#22D3EE'
      }
    ],
    description: 'Kube-Scheduler가 아직 실행 노드가 결정되지 않은 Pod를 발견하고, `worker-1` 노드를 선택하여 etcd의 `spec.nodeName` 필드를 갱신합니다.',
    k8sMechanism: '스케줄러는 ConfigMap의 내용을 직접 읽지 않으며, 오직 노드의 CPU/메모리 자원과 어피니티(Affinity) 규칙을 평가하여 파드를 배치합니다.',
    cliLogs: [
      {
        command: 'kubectl describe pod sk085-myfirst-api-server-5f89c7d4-9x7wp -n class-3 | grep -A 2 Events',
        output: [
          'Events:',
          '  Type    Reason     Age   From               Message',
          '  ----    ------     ----  ----               -------',
          '  Normal  Scheduled  1s    default-scheduler  Successfully assigned class-3/sk085-myfirst-api-server-5f89c7d4-9x7wp to worker-1'
        ]
      }
    ],
    podsState: [
      {
        id: 'pod-m3-1',
        name: 'sk085-myfirst-api-server-5f89c7d4-9x7wp',
        nodeId: 'worker-1',
        status: 'Pending',
        ready: '0/1',
        restarts: 0,
        age: '2s',
        ip: '배치 완료 (worker-1)'
      }
    ],
    highlightYamlLines: [14, 15, 16],
    etcdState: {
      revision: 61206,
      raftTerm: 5,
      records: [
        BASE_CM_RECORD,
        BASE_DEPLOY_RECORD,
        BASE_RS_RECORD,
        {
          ...BASE_POD_RECORD,
          action: 'updated',
          revision: 61206,
          highlightFields: ['spec.nodeName: "worker-1"', 'conditions[PodScheduled]=True'],
          data: {
            ...BASE_POD_RECORD.data,
            spec: { ...BASE_POD_RECORD.data.spec, nodeName: 'worker-1' },
            status: { phase: 'Pending', conditions: [{ type: 'PodScheduled', status: 'True' }] }
          }
        }
      ]
    }
  },

  // -------------------------------------------------------------------------
  // STEP 7: Kubelet Volume & Spring Boot H2 Start
  // -------------------------------------------------------------------------
  {
    stepNumber: 7,
    phase: 'deployment',
    targetYaml: 'deployment',
    title: '[Deploy] Kubelet VolumeManager ➔ ConfigMap 마운트 & H2 DB 기동',
    subTitle: 'tmpfs에 application-prod.yaml 투영 ➔ Spring Boot H2 인메모리 DB 초기화 완료',
    activeNodeId: 'm3-7-kubelet',
    activeComponents: ['kubelet-1', 'runtime-1', 'apiserver', 'etcd'],
    packets: [
      {
        from: 'kubelet-1',
        to: 'apiserver',
        label: 'GET /api/v1/namespaces/class-3/configmaps/sk085-myfirst-configmap',
        method: 'HTTP/2 GET',
        color: '#38BDF8'
      },
      {
        from: 'kubelet-1',
        to: 'runtime-1',
        label: 'CRI RunPodSandbox & Mount tmpfs(/config/application-prod.yaml)',
        method: 'gRPC CRI',
        color: '#EC4899'
      },
      {
        from: 'kubelet-1',
        to: 'apiserver',
        label: 'PATCH Pod status (phase: Running, podIP: 10.244.1.25, ready: 1/1)',
        method: 'HTTP/2 PATCH',
        color: '#10B981'
      }
    ],
    description: '🔥 [결정적 단계]: Worker-1의 Kubelet VolumeManager가 API Server로부터 `sk085-myfirst-configmap`을 조회하여 노드 tmpfs 가상 볼륨에 파일(`application-prod.yaml`)로 생성합니다. containerd가 컨테이너를 구동하자 Spring Boot가 설정 파일의 H2 데이터베이스(`jdbc:h2:mem:testdb`)를 성공적으로 초기화합니다!',
    k8sMechanism: 'Kubelet은 ConfigMap 내용을 파일로 투영할 때 atomic symlink 구조(..data ➔ ..data_tmp)를 사용하여 무중단 파일 갱신을 지원합니다. 이 시점까지는 Service가 없으므로 Pod IP(10.244.1.25)로만 접근 가능합니다.',
    cliLogs: [
      {
        command: 'kubectl logs pod/sk085-myfirst-api-server-5f89c7d4-9x7wp -n class-3',
        output: [
          '2026-09-14 11:20:05.120  INFO 1 --- [main] c.e.demo.MyFirstApiServerApplication    : Starting MyFirstApiServerApplication using Java 17',
          '2026-09-14 11:20:05.142  INFO 1 --- [main] c.e.demo.MyFirstApiServerApplication    : The following profiles are active: prod',
          '2026-09-14 11:20:05.890  INFO 1 --- [main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)',
          '2026-09-14 11:20:06.104  INFO 1 --- [main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...',
          '2026-09-14 11:20:06.312  INFO 1 --- [main] com.zaxxer.hikari.pool.PoolBase          : HikariPool-1 - Driver does not support get/set network timeout for JDBC4_1',
          '2026-09-14 11:20:06.320  INFO 1 --- [main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Start completed.',
          '2026-09-14 11:20:06.325  INFO 1 --- [main] o.s.b.a.h2.H2ConsoleAutoConfiguration   : H2 console available at \'/h2-console\'. Database available at \'jdbc:h2:mem:testdb\'',
          '2026-09-14 11:20:07.101  INFO 1 --- [main] c.e.demo.MyFirstApiServerApplication    : Started MyFirstApiServerApplication in 2.14 seconds (process running for 2.81)'
        ]
      },
      {
        command: 'kubectl exec pod/sk085-myfirst-api-server-5f89c7d4-9x7wp -n class-3 -- ls -la /config',
        output: [
          'total 4',
          'drwxrwxrwx 3 root root 4096 Sep 14 11:20 .',
          'drwxr-xr-x 1 root root 4096 Sep 14 11:20 ..',
          'lrwxrwxrwx 1 root root   28 Sep 14 11:20 application-prod.yaml -> ..data/application-prod.yaml'
        ]
      }
    ],
    podsState: [
      {
        id: 'pod-m3-1',
        name: 'sk085-myfirst-api-server-5f89c7d4-9x7wp',
        nodeId: 'worker-1',
        status: 'Running',
        ready: '1/1',
        restarts: 0,
        age: '8s',
        ip: '10.244.1.25'
      }
    ],
    highlightYamlLines: [18, 19, 20, 21, 26, 27, 28, 33, 34],
    etcdState: {
      revision: 61208,
      raftTerm: 5,
      records: [
        BASE_CM_RECORD,
        BASE_DEPLOY_RECORD,
        BASE_RS_RECORD,
        {
          ...BASE_POD_RECORD,
          action: 'updated',
          revision: 61208,
          highlightFields: ['status.phase: "Running"', 'status.podIP: "10.244.1.25"', 'conditions[Ready]=True']
        }
      ]
    }
  },

  // -------------------------------------------------------------------------
  // STEP 8: Service Apply
  // -------------------------------------------------------------------------
  {
    stepNumber: 8,
    phase: 'service',
    targetYaml: 'service',
    title: '[Service] service.yaml 별도 배포 접수',
    subTitle: 'kubectl apply -f service.yaml (H2 콘솔/HTTP 8080 및 Actuator 8081 듀얼 포트)',
    activeNodeId: 'm3-8-svc-apply',
    activeComponents: ['developer', 'apiserver'],
    packets: [
      {
        from: 'developer',
        to: 'apiserver',
        label: 'POST /api/v1/namespaces/class-3/services',
        method: 'HTTP/2 POST',
        color: '#60A5FA'
      }
    ],
    description: '이제 세 번째 매니페스트인 `service.yaml`을 배포합니다. `selector.app: sk085-myfirst-api-server`와 두 개의 포트(8080 http, 8081 mgmt)가 선언되어 있습니다.',
    k8sMechanism: 'Service는 ConfigMap이나 파드와 물리적으로 연결되어 있지 않으며, 오직 라벨 셀렉터 쿼리를 통해 일치하는 파드들을 동적으로 묶어주는 논리적 로드밸런서입니다.',
    cliLogs: [
      {
        command: 'kubectl apply -f service.yaml -n class-3',
        output: [
          'service/sk085-myfirst-api-server created'
        ]
      }
    ],
    podsState: [
      {
        id: 'pod-m3-1',
        name: 'sk085-myfirst-api-server-5f89c7d4-9x7wp',
        nodeId: 'worker-1',
        status: 'Running',
        ready: '1/1',
        restarts: 0,
        age: '16s',
        ip: '10.244.1.25'
      }
    ],
    highlightYamlLines: [1, 2, 3, 4, 5, 6, 7],
    etcdState: {
      revision: 61209,
      raftTerm: 5,
      records: [
        BASE_CM_RECORD,
        BASE_DEPLOY_RECORD,
        BASE_RS_RECORD,
        BASE_POD_RECORD
      ]
    }
  },

  // -------------------------------------------------------------------------
  // STEP 9: ClusterIP Assignment
  // -------------------------------------------------------------------------
  {
    stepNumber: 9,
    phase: 'service',
    targetYaml: 'service',
    title: '[Service] ClusterIP 가상 IP 할당 & etcd 저장',
    subTitle: 'Service CIDR 풀에서 고정 VIP 10.96.182.44 발급 및 DNS 레코드 등록',
    activeNodeId: 'm3-9-clusterip',
    activeComponents: ['apiserver', 'etcd', 'developer'],
    packets: [
      {
        from: 'apiserver',
        to: 'etcd',
        label: 'Raft Propose (/registry/services/specs/class-3/sk085-myfirst-api-server)',
        method: 'gRPC Propose',
        color: '#22D3EE'
      },
      {
        from: 'apiserver',
        to: 'developer',
        label: 'HTTP 201 Created (service created)',
        method: 'HTTP/2 201',
        color: '#34D399'
      }
    ],
    description: 'API Server가 고정 가상 IP `10.96.182.44`를 할당하고 etcd에 Service 스펙을 저장합니다. CoreDNS에는 `sk085-myfirst-api-server.class-3.svc.cluster.local` A 레코드가 등록됩니다.',
    k8sMechanism: '이 가상 IP(VIP)는 영구 불변이며, 앞으로 Pod가 재시작되거나 롤링 업데이트되어 Pod IP가 바뀌어도 클라이언트는 항상 동일한 ClusterIP로 요청을 보낼 수 있습니다.',
    cliLogs: [
      {
        command: 'kubectl get svc sk085-myfirst-api-server -n class-3',
        output: [
          'NAME                       TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)             AGE',
          'sk085-myfirst-api-server   ClusterIP   10.96.182.44    <none>        8080/TCP,8081/TCP   1s'
        ]
      }
    ],
    podsState: [
      {
        id: 'pod-m3-1',
        name: 'sk085-myfirst-api-server-5f89c7d4-9x7wp',
        nodeId: 'worker-1',
        status: 'Running',
        ready: '1/1',
        restarts: 0,
        age: '18s',
        ip: '10.244.1.25'
      }
    ],
    highlightYamlLines: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    etcdState: {
      revision: 61210,
      raftTerm: 5,
      records: [
        BASE_CM_RECORD,
        BASE_DEPLOY_RECORD,
        BASE_RS_RECORD,
        BASE_POD_RECORD,
        {
          ...BASE_SVC_RECORD,
          action: 'created',
          revision: 61210,
          highlightFields: ['spec.clusterIP: "10.96.182.44"', 'spec.selector.app: "sk085-myfirst-api-server"', 'spec.ports']
        }
      ]
    }
  },

  // -------------------------------------------------------------------------
  // STEP 10: EndpointSlice Label Matching
  // -------------------------------------------------------------------------
  {
    stepNumber: 10,
    phase: 'service',
    targetYaml: 'all',
    title: '[Link] EndpointSlice Controller 가동 (라벨 매칭 & 듀얼 포트 연결)',
    subTitle: 'Service selector(app)와 Pod labels(app) 매칭 ➔ EndpointSlice 생성',
    activeNodeId: 'm3-10-endpoints',
    activeComponents: ['controllerManager', 'apiserver', 'etcd'],
    linkageHighlight: {
      type: 'service',
      title: 'Service 라벨 셀렉터 바인딩',
      source: 'Pod.labels.app: sk085-myfirst-api-server',
      target: 'Service.spec.selector.app: sk085-myfirst-api-server',
      isMatched: true
    },
    packets: [
      {
        from: 'controllerManager',
        to: 'apiserver',
        label: 'POST /apis/discovery.k8s.io/v1/namespaces/class-3/endpointslices',
        method: 'HTTP/2 POST',
        color: '#A855F7'
      },
      {
        from: 'apiserver',
        to: 'etcd',
        label: 'Create /registry/endpointslices/class-3/sk085-myfirst-api-server-7bx4',
        method: 'gRPC Propose',
        color: '#22D3EE'
      }
    ],
    description: '🔥 [라벨 결합의 순간]: EndpointSlice Controller가 동작하여 Service의 `selector.app`과 이미 앞서 구동된 Pod의 `metadata.labels.app`이 정확히 일치함을 확인하고, 파드 IP(`10.244.1.25`)에 `8080`과 `8081` 듀얼 포트를 바인딩한 EndpointSlice를 etcd에 생성합니다.',
    k8sMechanism: '이로써 [ConfigMap ➔ Deployment ➔ Service] 3단 분리 오브젝트가 완벽히 하나로 연결되었습니다: ConfigMap은 볼륨으로 Pod에 주입되었고, Pod는 라벨 셀렉터를 통해 Service에 등록되었습니다.',
    cliLogs: [
      {
        command: 'kubectl get endpointslices -n class-3 -l kubernetes.io/service-name=sk085-myfirst-api-server',
        output: [
          'NAME                                   ADDRESSTYPE   PORTS       ENDPOINTS     AGE',
          'sk085-myfirst-api-server-7bx4          IPv4          8080,8081   10.244.1.25   0s'
        ]
      }
    ],
    podsState: [
      {
        id: 'pod-m3-1',
        name: 'sk085-myfirst-api-server-5f89c7d4-9x7wp',
        nodeId: 'worker-1',
        status: 'Ready',
        ready: '1/1',
        restarts: 0,
        age: '22s',
        ip: '10.244.1.25 (8080/8081 바인딩)'
      }
    ],
    highlightYamlLines: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    etcdState: {
      revision: 61212,
      raftTerm: 5,
      records: [
        BASE_CM_RECORD,
        BASE_DEPLOY_RECORD,
        BASE_RS_RECORD,
        BASE_POD_RECORD,
        BASE_SVC_RECORD,
        {
          ...BASE_ENDPOINTSLICE_RECORD,
          action: 'created',
          revision: 61212,
          highlightFields: ['endpoints[0].addresses: ["10.244.1.25"]', 'ports[0]: {name: "http", port: 8080}', 'ports[1]: {name: "mgmt", port: 8081}']
        }
      ]
    }
  },

  // -------------------------------------------------------------------------
  // STEP 11: Kube-Proxy iptables Sync
  // -------------------------------------------------------------------------
  {
    stepNumber: 11,
    phase: 'service',
    targetYaml: 'all',
    title: '[Network] Kube-Proxy iptables/IPVS 동기화',
    subTitle: '모든 노드에 ClusterIP(10.96.182.44) ➔ Pod IP(10.244.1.25) DNAT 체인 구축',
    activeNodeId: 'm3-11-proxy',
    activeComponents: ['kube-proxy-1', 'kube-proxy-2', 'apiserver'],
    packets: [
      {
        from: 'apiserver',
        to: 'kube-proxy-1',
        label: 'Watch Event: Service & EndpointSlice Created',
        method: 'gRPC Watch',
        color: '#6366F1'
      },
      {
        from: 'apiserver',
        to: 'kube-proxy-2',
        label: 'Watch Event: Service & EndpointSlice Created',
        method: 'gRPC Watch',
        color: '#6366F1'
      }
    ],
    description: '워커 노드의 `kube-proxy`가 커널의 iptables NAT 테이블에 `KUBE-SVC-HTTP-PORT` 및 `KUBE-SVC-MGMT-PORT` 규칙을 주입하여, 가상 IP `10.96.182.44`로 인입되는 패킷을 실제 Spring Boot 파드(`10.244.1.25`)로 즉시 변환(DNAT)합니다.',
    k8sMechanism: '커널 레벨에서 패킷 헤더의 목적지 IP가 즉각 변환되므로 파드는 자신이 ClusterIP를 통해 호출되었는지 인식할 필요 없이 투명하게 트래픽을 처리합니다.',
    cliLogs: [
      {
        command: 'iptables-save -t nat | grep sk085-myfirst-api-server',
        output: [
          '-A KUBE-SERVICES -d 10.96.182.44/32 -p tcp --dport 8080 -j KUBE-SVC-HTTP',
          '-A KUBE-SERVICES -d 10.96.182.44/32 -p tcp --dport 8081 -j KUBE-SVC-MGMT',
          '-A KUBE-SVC-HTTP -j KUBE-SEP-HTTP-1',
          '-A KUBE-SEP-HTTP-1 -p tcp -j DNAT --to-destination 10.244.1.25:8080',
          '-A KUBE-SVC-MGMT -j KUBE-SEP-MGMT-1',
          '-A KUBE-SEP-MGMT-1 -p tcp -j DNAT --to-destination 10.244.1.25:8081'
        ]
      }
    ],
    podsState: [
      {
        id: 'pod-m3-1',
        name: 'sk085-myfirst-api-server-5f89c7d4-9x7wp',
        nodeId: 'worker-1',
        status: 'Ready',
        ready: '1/1',
        restarts: 0,
        age: '26s',
        ip: '10.244.1.25'
      }
    ],
    highlightYamlLines: [10, 11, 12, 13, 14, 15, 16, 17, 18],
    etcdState: {
      revision: 61212,
      raftTerm: 5,
      records: [
        BASE_CM_RECORD,
        BASE_DEPLOY_RECORD,
        BASE_RS_RECORD,
        BASE_POD_RECORD,
        BASE_SVC_RECORD,
        BASE_ENDPOINTSLICE_RECORD
      ]
    }
  },

  // -------------------------------------------------------------------------
  // STEP 12: Dual-Port Traffic Active (All 6 Keys Fully Intact!)
  // -------------------------------------------------------------------------
  {
    stepNumber: 12,
    phase: 'service',
    targetYaml: 'all',
    title: '[Traffic] End Users & Prometheus 듀얼 포트 트래픽 인입',
    subTitle: '포트 8080(H2 콘솔/API) 및 포트 8081(/actuator/prometheus) 서비스 가동 완료',
    activeNodeId: 'm3-12-traffic',
    activeComponents: ['endusers', 'kube-proxy-1', 'objects-1'],
    packets: [
      {
        from: 'endusers',
        to: 'kube-proxy-1',
        label: 'HTTP GET http://10.96.182.44:8080/h2-console',
        method: 'HTTP/1.1 GET',
        color: '#10B981'
      },
      {
        from: 'endusers',
        to: 'kube-proxy-1',
        label: 'Prometheus GET http://10.96.182.44:8081/actuator/prometheus',
        method: 'Prometheus Scrape',
        color: '#F59E0B'
      },
      {
        from: 'kube-proxy-1',
        to: 'objects-1',
        label: 'DNAT Forward to 10.244.1.25:8080 & 8081',
        method: 'Kernel DNAT',
        color: '#34D399'
      }
    ],
    description: '🎉 [전체 연동 완료]: 개발자나 사용자는 `10.96.182.44:8080/h2-console`로 접속하여 ConfigMap으로 주입된 H2 인메모리 데이터베이스를 직접 제어하고 비즈니스 API를 호출할 수 있습니다. 동시에 Prometheus는 `10.96.182.44:8081/actuator/prometheus`에서 JVM 및 스프링 메트릭을 정상 수집합니다!',
    k8sMechanism: '이것이 바로 클라우드 네이티브 쿠버네티스의 3대 분리 아키텍처 [ConfigMap(설정) + Deployment(워크로드) + Service(네트워크)]의 완성된 모습입니다.',
    cliLogs: [
      {
        command: 'curl -i http://10.96.182.44:8080/h2-console',
        output: [
          'HTTP/1.1 200 OK',
          'Content-Type: text/html;charset=UTF-8',
          'Server: Spring-Boot/Tomcat',
          '',
          '<!DOCTYPE html><html><head><title>H2 Console - class-3 / sk085-myfirst-api-server</title></head>',
          '<body><h2>H2 Database Console (jdbc:h2:mem:testdb)</h2></body></html>'
        ]
      },
      {
        command: 'curl -i http://10.96.182.44:8081/actuator/prometheus | head -n 6',
        output: [
          '# HELP jvm_memory_used_bytes The amount of used memory',
          '# TYPE jvm_memory_used_bytes gauge',
          'jvm_memory_used_bytes{area="heap",id="G1 Eden Space",} 3.4258176E7',
          'jvm_memory_used_bytes{area="heap",id="G1 Old Gen",} 1.9482112E7',
          '# HELP jdbc_connections_active Active JDBC connections in HikariCP',
          '# TYPE jdbc_connections_active gauge',
          'jdbc_connections_active{pool="HikariPool-1",} 1.0'
        ]
      }
    ],
    podsState: [
      {
        id: 'pod-m3-1',
        name: 'sk085-myfirst-api-server-5f89c7d4-9x7wp',
        nodeId: 'worker-1',
        status: 'Ready',
        ready: '1/1',
        restarts: 0,
        age: '32s',
        ip: '10.244.1.25'
      }
    ],
    highlightYamlLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    etcdState: {
      revision: 61212,
      raftTerm: 5,
      records: [
        BASE_CM_RECORD,
        BASE_DEPLOY_RECORD,
        BASE_RS_RECORD,
        BASE_POD_RECORD,
        BASE_SVC_RECORD,
        BASE_ENDPOINTSLICE_RECORD
      ]
    }
  }
];
