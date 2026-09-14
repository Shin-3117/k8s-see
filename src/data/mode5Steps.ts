import { FlowchartNode, Mode5Step, EtcdRecord } from '../types/pipeline';

// ============================================================================
// MODE 5 FLOWCHART NODES (7-Step Ingress L7 Traffic Routing Pipeline)
// ============================================================================
export const MODE5_FLOWCHART_NODES: FlowchartNode[] = [
  {
    id: 'm5-1-ingress-apply',
    name: '1. [Ingress] 선언 적용',
    subName: 'kubectl apply ➔ etcd 등록',
    componentId: 'apiserver',
    type: 'client',
    status: 'pending'
  },
  {
    id: 'm5-2-controller-watch',
    name: '2. [Watch] 인그레스 감지',
    subName: 'Controller ➔ 엔드포인트 수집',
    componentId: 'ingressController',
    type: 'worker',
    status: 'pending'
  },
  {
    id: 'm5-3-nginx-reload',
    name: '3. [Reload] NGINX 동적 갱신',
    subName: 'nginx.conf 생성 & 무중단 reload',
    componentId: 'ingressController',
    type: 'worker',
    status: 'pending'
  },
  {
    id: 'm5-4-https-req',
    name: '4. [Client] HTTPS 요청 진입',
    subName: 'Host: api.example.com & TLS 종료',
    componentId: 'ingressController',
    type: 'client',
    status: 'pending'
  },
  {
    id: 'm5-5-route-order',
    name: '5. [L7 Route] /orders 분기',
    subName: 'Worker-1 (order-api Pod) 중계',
    componentId: 'ingressController',
    type: 'worker',
    status: 'pending'
  },
  {
    id: 'm5-6-route-product',
    name: '6. [L7 Route] /products 분기',
    subName: 'Worker-2 (product-api Pod) 중계',
    componentId: 'ingressController',
    type: 'worker',
    status: 'pending'
  },
  {
    id: 'm5-7-response',
    name: '7. [Response] 200 OK 응답 반환',
    subName: 'JSON 응답 ➔ End User 전달',
    componentId: 'endusers',
    type: 'client',
    status: 'pending'
  }
];

// ============================================================================
// YAML MANIFESTS & CONFIG TEMPLATES
// ============================================================================
export const INGRESS_YAML = `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ecommerce-ingress
  namespace: default
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "15"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - api.example.com
      secretName: example-tls-cert
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /orders
            pathType: Prefix
            backend:
              service:
                name: order-service
                port:
                  number: 8080
          - path: /products
            pathType: Prefix
            backend:
              service:
                name: product-service
                port:
                  number: 8080`;

export const ORDER_SERVICE_YAML = `apiVersion: v1
kind: Service
metadata:
  name: order-service
  namespace: default
  labels:
    app: order-api
spec:
  type: ClusterIP
  selector:
    app: order-api
  ports:
    - name: http
      port: 8080
      targetPort: 8080
      protocol: TCP`;

export const PRODUCT_SERVICE_YAML = `apiVersion: v1
kind: Service
metadata:
  name: product-service
  namespace: default
  labels:
    app: product-api
spec:
  type: ClusterIP
  selector:
    app: product-api
  ports:
    - name: http
      port: 8080
      targetPort: 8080
      protocol: TCP`;

export const NGINX_CONF_RAW = `# /etc/nginx/nginx.conf (자동 렌더링된 Ingress Controller 라우팅 테이블)
events { worker_connections 10240; }

http {
  # 업스트림 백엔드 파드 실시간 매핑
  upstream default-order-service-8080 {
    least_conn;
    server 10.244.1.25:8080 max_fails=3 fail_timeout=10s; # Worker-1 (order-api Pod)
    keepalive 32;
  }

  upstream default-product-service-8080 {
    least_conn;
    server 10.244.2.18:8080 max_fails=3 fail_timeout=10s; # Worker-2 (product-api Pod)
    keepalive 32;
  }

  server {
    listen 80;
    listen 443 ssl http2;
    server_name api.example.com;

    # TLS Termination (Secret: example-tls-cert)
    ssl_certificate /etc/ingress-controller/ssl/tls.crt;
    ssl_certificate_key /etc/ingress-controller/ssl/tls.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    location /orders {
      proxy_pass http://default-order-service-8080;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto https;
    }

    location /products {
      proxy_pass http://default-product-service-8080;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto https;
    }
  }
}`;

// ============================================================================
// BASE ETCD RECORDS
// ============================================================================
const BASE_INGRESS_CLASS: EtcdRecord = {
  key: '/registry/ingressclasses/nginx',
  type: 'IngressClass',
  action: 'unchanged',
  revision: 201,
  data: {
    apiVersion: 'networking.k8s.io/v1',
    kind: 'IngressClass',
    metadata: { name: 'nginx' },
    spec: { controller: 'k8s.io/ingress-nginx' }
  }
};

const BASE_ORDER_SVC: EtcdRecord = {
  key: '/registry/services/specs/default/order-service',
  type: 'Service',
  action: 'unchanged',
  revision: 202,
  data: {
    metadata: { name: 'order-service', namespace: 'default' },
    spec: {
      type: 'ClusterIP',
      clusterIP: '10.96.104.42',
      ports: [{ port: 8080, targetPort: 8080 }]
    }
  }
};

const BASE_PRODUCT_SVC: EtcdRecord = {
  key: '/registry/services/specs/default/product-service',
  type: 'Service',
  action: 'unchanged',
  revision: 203,
  data: {
    metadata: { name: 'product-service', namespace: 'default' },
    spec: {
      type: 'ClusterIP',
      clusterIP: '10.96.220.89',
      ports: [{ port: 8080, targetPort: 8080 }]
    }
  }
};

const BASE_ORDER_EPS: EtcdRecord = {
  key: '/registry/endpointslices/default/order-service-slice',
  type: 'EndpointSlice',
  action: 'unchanged',
  revision: 204,
  data: {
    metadata: { name: 'order-service-slice', namespace: 'default' },
    endpoints: [{ addresses: ['10.244.1.25'], nodeName: 'worker-1', conditions: { ready: true } }],
    ports: [{ name: 'http', port: 8080 }]
  }
};

const BASE_PRODUCT_EPS: EtcdRecord = {
  key: '/registry/endpointslices/default/product-service-slice',
  type: 'EndpointSlice',
  action: 'unchanged',
  revision: 205,
  data: {
    metadata: { name: 'product-service-slice', namespace: 'default' },
    endpoints: [{ addresses: ['10.244.2.18'], nodeName: 'worker-2', conditions: { ready: true } }],
    ports: [{ name: 'http', port: 8080 }]
  }
};

const BASE_INGRESS_RECORD: EtcdRecord = {
  key: '/registry/ingresses/default/ecommerce-ingress',
  type: 'Ingress',
  action: 'created',
  revision: 210,
  data: {
    metadata: { name: 'ecommerce-ingress', namespace: 'default' },
    spec: {
      ingressClassName: 'nginx',
      tls: [{ hosts: ['api.example.com'], secretName: 'example-tls-cert' }],
      rules: [
        {
          host: 'api.example.com',
          http: {
            paths: [
              { path: '/orders', backend: { service: { name: 'order-service', port: { number: 8080 } } } },
              { path: '/products', backend: { service: { name: 'product-service', port: { number: 8080 } } } }
            ]
          }
        }
      ]
    },
    status: {
      loadBalancer: {
        ingress: [{ ip: '192.168.1.200', hostname: 'api.example.com' }]
      }
    }
  }
};

// ============================================================================
// MODE 5 STEPS (7 Comprehensive Steps)
// ============================================================================
export const MODE5_STEPS: Mode5Step[] = [
  // --------------------------------------------------------------------------
  // STEP 1: Ingress Manifest Apply
  // --------------------------------------------------------------------------
  {
    stepNumber: 1,
    title: 'Ingress 선언적 리소스 생성 및 etcd 등록',
    subTitle: '호스트(api.example.com), TLS 인증서, URL 경로 규칙(/orders, /products) 선언',
    phase: 'ingress-create',
    targetYaml: 'ingress',
    activeNodeId: 'm5-1-ingress-apply',
    activeComponents: ['developer', 'apiserver', 'etcd'],
    packets: [
      {
        from: 'developer',
        to: 'apiserver',
        label: 'HTTP POST /apis/networking.k8s.io/v1/namespaces/default/ingresses (ecommerce-ingress)',
        method: 'REST Post',
        color: '#60A5FA'
      },
      {
        from: 'apiserver',
        to: 'etcd',
        label: 'Put /registry/ingresses/default/ecommerce-ingress (rev: 210)',
        method: 'gRPC Put',
        color: '#06B6D4'
      }
    ],
    description:
      '개발자가 호스트명 `api.example.com`과 2개의 경로(`/orders`, `/products`)를 정의한 Ingress 매니페스트를 `kube-apiserver`에 제출합니다. API 서버는 스키마 유효성을 검증하고 OpenAPI 스펙에 맞춰 etcd에 상태를 영구 저장합니다.',
    k8sMechanism:
      'Ingress는 자체로 트래픽을 처리하는 프록시가 아니며 단지 "L7 라우팅 규칙을 정의한 메타데이터 선언"입니다. 실제 트래픽 처리는 클러스터 내에서 실행 중인 Ingress Controller(예: ingress-nginx, Traefik, Envoy)가 감시하여 수행합니다.',
    cliLogs: [
      {
        command: 'kubectl apply -f ingress.yaml',
        output: ['ingress.networking.k8s.io/ecommerce-ingress created']
      },
      {
        command: 'kubectl get ingress -n default',
        output: [
          'NAME                CLASS   HOSTS             ADDRESS          PORTS     AGE',
          'ecommerce-ingress   nginx   api.example.com   192.168.1.200    80, 443   2s'
        ]
      }
    ],
    podsState: [
      {
        id: 'pod-order',
        name: 'order-api-7b8f9c-k8q9w',
        nodeId: 'worker-1',
        status: 'Running',
        ready: '1/1',
        restarts: 0,
        age: '12m',
        ip: '10.244.1.25'
      },
      {
        id: 'pod-product',
        name: 'product-api-5c9d6a-p4m2x',
        nodeId: 'worker-2',
        status: 'Running',
        ready: '1/1',
        restarts: 0,
        age: '15m',
        ip: '10.244.2.18'
      }
    ],
    highlightYamlLines: [1, 2, 3, 11, 12, 13, 18, 19, 26, 27],
    etcdState: {
      revision: 210,
      raftTerm: 4,
      records: [
        BASE_INGRESS_CLASS,
        BASE_ORDER_SVC,
        BASE_PRODUCT_SVC,
        BASE_ORDER_EPS,
        BASE_PRODUCT_EPS,
        {
          ...BASE_INGRESS_RECORD,
          action: 'created',
          highlightFields: ['metadata.name', 'spec.rules', 'spec.tls']
        }
      ]
    },
    ingressControllerState: {
      status: 'ready',
      reloadsCount: 0,
      sslCert: 'example-tls-cert (Loaded)',
      activeConnections: 12,
      upstreams: [
        {
          name: 'default-order-service-8080',
          service: 'order-service',
          backends: [{ ip: '10.244.1.25', port: 8080, status: 'up' }]
        },
        {
          name: 'default-product-service-8080',
          service: 'product-service',
          backends: [{ ip: '10.244.2.18', port: 8080, status: 'up' }]
        }
      ]
    }
  },

  // --------------------------------------------------------------------------
  // STEP 2: Ingress Controller Watch Event
  // --------------------------------------------------------------------------
  {
    stepNumber: 2,
    title: 'Ingress Controller의 API Watch 감지 & 백엔드 엔드포인트 수집',
    subTitle: 'kube-apiserver의 변경 이벤트를 수신하여 서비스와 연결된 실제 파드 IP를 조회',
    phase: 'controller-watch',
    targetYaml: 'ingress',
    activeNodeId: 'm5-2-controller-watch',
    activeComponents: ['apiserver', 'ingressController'],
    packets: [
      {
        from: 'apiserver',
        to: 'ingressController',
        label: 'Watch Event: Ingress ADDED (ecommerce-ingress, ingressClass: nginx)',
        method: 'Watch Stream',
        color: '#A855F7'
      },
      {
        from: 'ingressController',
        to: 'apiserver',
        label: 'Get EndpointSlices for order-service & product-service',
        method: 'REST Get',
        color: '#38BDF8'
      }
    ],
    description:
      'Worker Node에서 데몬/디플로이먼트로 구동되는 `Ingress Controller` 프로세스가 Long-Polling HTTP Watch 스트림을 통해 새로운 Ingress가 추가되었음을 감지합니다. 이어서 `order-service`와 `product-service`의 최신 파드 IP 목록(`10.244.1.25:8080`, `10.244.2.18:8080`)을 조회합니다.',
    k8sMechanism:
      'Ingress Controller는 iptables나 kube-proxy의 ClusterIP VIP를 거치지 않고, Endpoint/EndpointSlice API를 통해 **파드의 실제 IP로 직접(Direct Pod Communication)** 트래픽을 프록시합니다. 이를 통해 추가적인 네트워크 홉과 오버헤드를 완전히 제거합니다.',
    cliLogs: [
      {
        command: 'kubectl logs -n ingress-nginx deploy/ingress-nginx-controller -f --tail=3',
        output: [
          'I0914 06:21:03.112 event.go:285] Event(v1.ObjectReference{Kind:"Ingress", Name:"ecommerce-ingress"}): type: "Normal" reason: "Sync" Scheduled for sync',
          'I0914 06:21:03.114 controller.go:168] Backend successfully discovered: order-service -> [10.244.1.25:8080]',
          'I0914 06:21:03.115 controller.go:168] Backend successfully discovered: product-service -> [10.244.2.18:8080]'
        ]
      }
    ],
    podsState: [
      {
        id: 'pod-order',
        name: 'order-api-7b8f9c-k8q9w',
        nodeId: 'worker-1',
        status: 'Running',
        ready: '1/1',
        restarts: 0,
        age: '12m',
        ip: '10.244.1.25'
      },
      {
        id: 'pod-product',
        name: 'product-api-5c9d6a-p4m2x',
        nodeId: 'worker-2',
        status: 'Running',
        ready: '1/1',
        restarts: 0,
        age: '15m',
        ip: '10.244.2.18'
      }
    ],
    highlightYamlLines: [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32],
    etcdState: {
      revision: 210,
      raftTerm: 4,
      records: [
        BASE_INGRESS_CLASS,
        BASE_ORDER_SVC,
        BASE_PRODUCT_SVC,
        BASE_ORDER_EPS,
        BASE_PRODUCT_EPS,
        { ...BASE_INGRESS_RECORD, action: 'unchanged' }
      ]
    },
    ingressControllerState: {
      status: 'syncing',
      reloadsCount: 0,
      sslCert: 'example-tls-cert (Loaded)',
      activeConnections: 14,
      upstreams: [
        {
          name: 'default-order-service-8080',
          service: 'order-service',
          backends: [{ ip: '10.244.1.25', port: 8080, status: 'up' }]
        },
        {
          name: 'default-product-service-8080',
          service: 'product-service',
          backends: [{ ip: '10.244.2.18', port: 8080, status: 'up' }]
        }
      ]
    }
  },

  // --------------------------------------------------------------------------
  // STEP 3: Dynamic NGINX Config Reload
  // --------------------------------------------------------------------------
  {
    stepNumber: 3,
    title: 'NGINX 리버스 프록시 설정 템플릿 생성 & 무중단 동적 리로드',
    subTitle: 'Go 템플릿 엔진으로 /etc/nginx/nginx.conf 렌더링 및 SIGHUP 신호 전송',
    phase: 'dynamic-reload',
    targetYaml: 'nginx-conf',
    activeNodeId: 'm5-3-nginx-reload',
    activeComponents: ['ingressController'],
    packets: [
      {
        from: 'ingressController',
        to: 'ingressController',
        label: 'Render Go-Template ➔ /etc/nginx/nginx.conf & Exec: nginx -s reload (SIGHUP)',
        method: 'IPC Signal',
        color: '#10B981'
      }
    ],
    description:
      'Ingress Controller 내부의 Go 컨트롤러 프로세스가 수집된 인그레스 룰과 엔드포인트를 기반으로 `/etc/nginx/nginx.conf`를 생성합니다. 문법 검사(`nginx -t`)가 성공하면 `nginx -s reload`를 호출하여 실행 중인 마스터 프로세스에 `SIGHUP`을 보내 무중단(Zero Downtime)으로 워커 프로세스를 리로드합니다.',
    k8sMechanism:
      '신규 버전의 Ingress-NGINX는 동적 Lua 모듈을 활용하여 엔드포인트(파드 IP) 변경 시에는 NGINX 프로세스 자체를 리로드하지 않고 공유 메모리 딕셔너리(`lua_shared_dict`)를 직접 갱신하여 커넥션 드랍을 최소화합니다.',
    cliLogs: [
      {
        command: 'nginx -t -c /etc/nginx/nginx.conf',
        output: [
          'nginx: the configuration file /etc/nginx/nginx.conf syntax is ok',
          'nginx: configuration file /etc/nginx/nginx.conf test is successful'
        ]
      },
      {
        command: 'nginx -s reload',
        output: [
          '2026/09/14 06:21:05 [notice] 18#18: signal 1 (SIGHUP) received from 32, reconfiguring',
          '2026/09/14 06:21:05 [notice] 18#18: start worker processes',
          '2026/09/14 06:21:05 [notice] 18#18: gracefully shutting down old worker processes'
        ]
      }
    ],
    podsState: [
      {
        id: 'pod-order',
        name: 'order-api-7b8f9c-k8q9w',
        nodeId: 'worker-1',
        status: 'Running',
        ready: '1/1',
        restarts: 0,
        age: '12m',
        ip: '10.244.1.25'
      },
      {
        id: 'pod-product',
        name: 'product-api-5c9d6a-p4m2x',
        nodeId: 'worker-2',
        status: 'Running',
        ready: '1/1',
        restarts: 0,
        age: '15m',
        ip: '10.244.2.18'
      }
    ],
    highlightYamlLines: [6, 7, 8, 9, 10, 11, 12, 13, 23, 24, 25, 30, 31, 32],
    etcdState: {
      revision: 210,
      raftTerm: 4,
      records: [
        BASE_INGRESS_CLASS,
        BASE_ORDER_SVC,
        BASE_PRODUCT_SVC,
        BASE_ORDER_EPS,
        BASE_PRODUCT_EPS,
        { ...BASE_INGRESS_RECORD, action: 'unchanged' }
      ]
    },
    ingressControllerState: {
      status: 'reloaded',
      reloadsCount: 1,
      sslCert: 'example-tls-cert (Active)',
      activeConnections: 18,
      upstreams: [
        {
          name: 'default-order-service-8080',
          service: 'order-service',
          backends: [{ ip: '10.244.1.25', port: 8080, status: 'up' }]
        },
        {
          name: 'default-product-service-8080',
          service: 'product-service',
          backends: [{ ip: '10.244.2.18', port: 8080, status: 'up' }]
        }
      ]
    }
  },

  // --------------------------------------------------------------------------
  // STEP 4: HTTPS Request Arrival & TLS Termination
  // --------------------------------------------------------------------------
  {
    stepNumber: 4,
    title: '외부 사용자 HTTPS 요청 진입 & Ingress TLS Termination',
    subTitle: '클라이언트가 포트 443으로 접속, SNI 확인 및 인증서 암호화 세션 수립',
    phase: 'https-ingress',
    targetYaml: 'ingress',
    activeNodeId: 'm5-4-https-req',
    activeComponents: ['endusers', 'ingressController'],
    packets: [
      {
        from: 'endusers',
        to: 'ingressController',
        label: 'TLS Handshake ➔ HTTPS GET https://api.example.com/orders (SNI: api.example.com)',
        method: 'HTTPS Port 443',
        color: '#EC4899'
      }
    ],
    description:
      '외부 사용자(End User)가 브라우저나 앱에서 `https://api.example.com/orders`로 접속합니다. Ingress Controller는 TLS Handshake를 수행하고 `example-tls-cert` 비밀키(Secret)로 복호화(TLS Termination)하여 평문 HTTP 요청으로 내부 처리 준비를 마칩니다.',
    k8sMechanism:
      'TLS Termination(SSL 오프로딩)을 Ingress 레벨에서 일괄 처리함으로써 개별 백엔드 파드들이 암복호화 연산 부담을 덜고 공통 인증서 갱신/만료를 단 한 곳에서 관리할 수 있습니다.',
    cliLogs: [
      {
        command: 'curl -k -v https://api.example.com/orders',
        output: [
          '* Connected to api.example.com (192.168.1.200) port 443',
          '* ALPN: server accepted http/1.1',
          '* Server certificate: CN=api.example.com, O=K8sCluster CertAuthority',
          '* TLSv1.3 (IN), TLS handshake, [Finished]',
          '> GET /orders HTTP/1.1',
          '> Host: api.example.com',
          '> User-Agent: curl/8.4.0',
          '> Accept: */*'
        ]
      }
    ],
    podsState: [
      {
        id: 'pod-order',
        name: 'order-api-7b8f9c-k8q9w',
        nodeId: 'worker-1',
        status: 'Running',
        ready: '1/1',
        restarts: 0,
        age: '12m',
        ip: '10.244.1.25'
      },
      {
        id: 'pod-product',
        name: 'product-api-5c9d6a-p4m2x',
        nodeId: 'worker-2',
        status: 'Running',
        ready: '1/1',
        restarts: 0,
        age: '15m',
        ip: '10.244.2.18'
      }
    ],
    highlightYamlLines: [11, 12, 13, 14, 15, 16],
    etcdState: {
      revision: 210,
      raftTerm: 4,
      records: [
        BASE_INGRESS_CLASS,
        BASE_ORDER_SVC,
        BASE_PRODUCT_SVC,
        BASE_ORDER_EPS,
        BASE_PRODUCT_EPS,
        BASE_INGRESS_RECORD
      ]
    },
    activeRoute: {
      host: 'api.example.com',
      path: '/orders',
      targetService: 'order-service',
      targetPodIp: '10.244.1.25:8080',
      targetNode: 'worker-1',
      statusCode: 200
    },
    ingressControllerState: {
      status: 'routing',
      reloadsCount: 1,
      sslCert: 'example-tls-cert (TLSv1.3 Established)',
      activeConnections: 25,
      upstreams: [
        {
          name: 'default-order-service-8080',
          service: 'order-service',
          backends: [{ ip: '10.244.1.25', port: 8080, status: 'up' }]
        },
        {
          name: 'default-product-service-8080',
          service: 'product-service',
          backends: [{ ip: '10.244.2.18', port: 8080, status: 'up' }]
        }
      ]
    }
  },

  // --------------------------------------------------------------------------
  // STEP 5: L7 Routing to /orders (Worker Node 1)
  // --------------------------------------------------------------------------
  {
    stepNumber: 5,
    title: 'L7 URL 경로 라우팅: /orders ➔ Worker Node 1 (order-api Pod)',
    subTitle: 'location /orders 규칙 매칭 후 proxy_pass ➔ Pod IP: 10.244.1.25:8080 직접 포워딩',
    phase: 'path-routing-order',
    targetYaml: 'service-order',
    activeNodeId: 'm5-5-route-order',
    activeComponents: ['ingressController', 'runtime-1', 'kube-proxy-1'],
    packets: [
      {
        from: 'ingressController',
        to: 'runtime-1',
        label: 'HTTP Proxy: GET /orders ➔ Pod IP: 10.244.1.25:8080 (X-Forwarded-For 주입)',
        method: 'L7 Reverse Proxy',
        color: '#34D399'
      }
    ],
    description:
      'NGINX 라우팅 엔진이 요청 URL 경로 `/orders`를 검사하여 `location /orders` 블록에 매칭합니다. 미리 등록된 업스트림 `default-order-service-8080` 목록에서 Worker Node 1의 파드 IP `10.244.1.25:8080`으로 HTTP 역방향 프록시(Reverse Proxy) 요청을 중계합니다.',
    k8sMechanism:
      'Ingress Controller는 `X-Forwarded-For`, `X-Forwarded-Proto(https)`, `X-Real-IP` 헤더를 자동으로 삽입하여 백엔드 파드가 원래 접속한 클라이언트의 실제 IP와 프로토콜 정보를 식별할 수 있도록 지원합니다.',
    cliLogs: [
      {
        command: 'kubectl logs -n default pod/order-api-7b8f9c-k8q9w -c order-container --tail=2',
        output: [
          '2026-09-14T06:21:08.412Z [INFO] [OrderController] Received GET /orders from IngressProxy (X-Real-IP: 203.0.113.195)',
          '2026-09-14T06:21:08.420Z [INFO] [OrderService] Querying 3 active orders, generating JSON response (Status: 200 OK)'
        ]
      }
    ],
    podsState: [
      {
        id: 'pod-order',
        name: 'order-api-7b8f9c-k8q9w',
        nodeId: 'worker-1',
        status: 'Running',
        ready: '1/1',
        restarts: 0,
        age: '12m',
        ip: '10.244.1.25'
      },
      {
        id: 'pod-product',
        name: 'product-api-5c9d6a-p4m2x',
        nodeId: 'worker-2',
        status: 'Running',
        ready: '1/1',
        restarts: 0,
        age: '15m',
        ip: '10.244.2.18'
      }
    ],
    highlightYamlLines: [18, 19, 20, 21, 22, 23, 24, 25],
    etcdState: {
      revision: 210,
      raftTerm: 4,
      records: [
        BASE_INGRESS_CLASS,
        BASE_ORDER_SVC,
        BASE_PRODUCT_SVC,
        BASE_ORDER_EPS,
        BASE_PRODUCT_EPS,
        BASE_INGRESS_RECORD
      ]
    },
    activeRoute: {
      host: 'api.example.com',
      path: '/orders',
      targetService: 'order-service',
      targetPodIp: '10.244.1.25:8080',
      targetNode: 'worker-1',
      statusCode: 200
    },
    ingressControllerState: {
      status: 'routing',
      reloadsCount: 1,
      sslCert: 'example-tls-cert (Active)',
      activeConnections: 31,
      upstreams: [
        {
          name: 'default-order-service-8080',
          service: 'order-service',
          backends: [{ ip: '10.244.1.25', port: 8080, status: 'up' }]
        },
        {
          name: 'default-product-service-8080',
          service: 'product-service',
          backends: [{ ip: '10.244.2.18', port: 8080, status: 'up' }]
        }
      ]
    }
  },

  // --------------------------------------------------------------------------
  // STEP 6: L7 Routing to /products (Worker Node 2)
  // --------------------------------------------------------------------------
  {
    stepNumber: 6,
    title: 'L7 URL 경로 라우팅: /products ➔ Worker Node 2 (product-api Pod)',
    subTitle: '동일 호스트(api.example.com)에서 URL 패스에 따라 전혀 다른 노드 및 서비스로 분기',
    phase: 'path-routing-product',
    targetYaml: 'service-product',
    activeNodeId: 'm5-6-route-product',
    activeComponents: ['ingressController', 'runtime-2', 'kube-proxy-2'],
    packets: [
      {
        from: 'ingressController',
        to: 'runtime-2',
        label: 'HTTP Proxy: GET /products ➔ Pod IP: 10.244.2.18:8080 (L7 Path-Based Routing)',
        method: 'L7 Reverse Proxy',
        color: '#F59E0B'
      }
    ],
    description:
      '만약 클라이언트가 `https://api.example.com/products`로 요청을 보낸 경우, NGINX는 `location /products` 블록과 매칭하여 Worker Node 2에서 기동 중인 `product-api` 파드 IP(`10.244.2.18:8080`)로 트래픽을 지능적으로 라우팅합니다.',
    k8sMechanism:
      '단일 외부 공인 IP/로드밸런서만으로도 URL Prefix(/orders vs /products), 서브도메인, HTTP 헤더 등을 기준으로 무한히 다양한 마이크로서비스로 트래픽을 세분화 분기할 수 있는 것이 인그레스의 핵심 강점입니다.',
    cliLogs: [
      {
        command: 'curl -k https://api.example.com/products',
        output: [
          'HTTP/1.1 200 OK',
          'Content-Type: application/json',
          '{"service": "product-api", "node": "worker-2", "pod_ip": "10.244.2.18", "products": [{"id": 101, "name": "Kubernetes Plush Toy"}]}'
        ]
      }
    ],
    podsState: [
      {
        id: 'pod-order',
        name: 'order-api-7b8f9c-k8q9w',
        nodeId: 'worker-1',
        status: 'Running',
        ready: '1/1',
        restarts: 0,
        age: '12m',
        ip: '10.244.1.25'
      },
      {
        id: 'pod-product',
        name: 'product-api-5c9d6a-p4m2x',
        nodeId: 'worker-2',
        status: 'Running',
        ready: '1/1',
        restarts: 0,
        age: '15m',
        ip: '10.244.2.18'
      }
    ],
    highlightYamlLines: [26, 27, 28, 29, 30, 31, 32],
    etcdState: {
      revision: 210,
      raftTerm: 4,
      records: [
        BASE_INGRESS_CLASS,
        BASE_ORDER_SVC,
        BASE_PRODUCT_SVC,
        BASE_ORDER_EPS,
        BASE_PRODUCT_EPS,
        BASE_INGRESS_RECORD
      ]
    },
    activeRoute: {
      host: 'api.example.com',
      path: '/products',
      targetService: 'product-service',
      targetPodIp: '10.244.2.18:8080',
      targetNode: 'worker-2',
      statusCode: 200
    },
    ingressControllerState: {
      status: 'routing',
      reloadsCount: 1,
      sslCert: 'example-tls-cert (Active)',
      activeConnections: 35,
      upstreams: [
        {
          name: 'default-order-service-8080',
          service: 'order-service',
          backends: [{ ip: '10.244.1.25', port: 8080, status: 'up' }]
        },
        {
          name: 'default-product-service-8080',
          service: 'product-service',
          backends: [{ ip: '10.244.2.18', port: 8080, status: 'up' }]
        }
      ]
    }
  },

  // --------------------------------------------------------------------------
  // STEP 7: Client 200 OK Response & Final Stats
  // --------------------------------------------------------------------------
  {
    stepNumber: 7,
    title: '백엔드 처리 완료 및 클라이언트에 200 OK 최종 응답 전달',
    subTitle: '파드 응답 ➔ Ingress Controller TLS 암호화 ➔ End User 클라이언트에 응답 패킷 반환',
    phase: 'client-response',
    targetYaml: 'all',
    activeNodeId: 'm5-7-response',
    activeComponents: ['ingressController', 'endusers'],
    packets: [
      {
        from: 'ingressController',
        to: 'endusers',
        label: 'HTTP/1.1 200 OK (Content-Type: application/json, TLS Encrypted)',
        method: '200 OK',
        color: '#10B981'
      }
    ],
    description:
      '백엔드 파드가 생성한 HTTP 응답 본문이 Ingress Controller로 돌아옵니다. Ingress Controller는 필요한 보안 헤더(`Strict-Transport-Security`, `X-Content-Type-Options`)를 부착하고 세션을 TLS로 재암호화하여 대기 중이던 외부 사용자에게 `200 OK` 응답을 최종 전송합니다.',
    k8sMechanism:
      '전체 L7 트래픽 플로우가 성공적으로 완결되었습니다. Ingress Controller의 메트릭 모니터링(`nginx_ingress_controller_requests`, Prometheus) 카운터가 증가하고 접속 로그(Access Log)가 실시간 기록됩니다.',
    cliLogs: [
      {
        command: 'curl -k -i https://api.example.com/orders',
        output: [
          'HTTP/1.1 200 OK',
          'Server: nginx/1.25.4',
          'Date: Mon, 14 Sep 2026 06:21:09 GMT',
          'Content-Type: application/json; charset=utf-8',
          'Content-Length: 172',
          'Connection: keep-alive',
          'Strict-Transport-Security: max-age=15724800; includeSubDomains',
          '',
          '{"status":"success","service":"order-service","pod":"order-api-7b8f9c-k8q9w","items":[{"orderId":"ORD-9821","amount":150.00,"item":"K8s Cluster Node"}]}'
        ]
      }
    ],
    podsState: [
      {
        id: 'pod-order',
        name: 'order-api-7b8f9c-k8q9w',
        nodeId: 'worker-1',
        status: 'Running',
        ready: '1/1',
        restarts: 0,
        age: '12m',
        ip: '10.244.1.25'
      },
      {
        id: 'pod-product',
        name: 'product-api-5c9d6a-p4m2x',
        nodeId: 'worker-2',
        status: 'Running',
        ready: '1/1',
        restarts: 0,
        age: '15m',
        ip: '10.244.2.18'
      }
    ],
    highlightYamlLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    etcdState: {
      revision: 210,
      raftTerm: 4,
      records: [
        BASE_INGRESS_CLASS,
        BASE_ORDER_SVC,
        BASE_PRODUCT_SVC,
        BASE_ORDER_EPS,
        BASE_PRODUCT_EPS,
        BASE_INGRESS_RECORD
      ]
    },
    activeRoute: {
      host: 'api.example.com',
      path: '/orders',
      targetService: 'order-service',
      targetPodIp: '10.244.1.25:8080',
      targetNode: 'worker-1',
      statusCode: 200
    },
    ingressControllerState: {
      status: 'ready',
      reloadsCount: 1,
      sslCert: 'example-tls-cert (Active)',
      activeConnections: 12,
      upstreams: [
        {
          name: 'default-order-service-8080',
          service: 'order-service',
          backends: [{ ip: '10.244.1.25', port: 8080, status: 'up' }]
        },
        {
          name: 'default-product-service-8080',
          service: 'product-service',
          backends: [{ ip: '10.244.2.18', port: 8080, status: 'up' }]
        }
      ]
    }
  }
];
