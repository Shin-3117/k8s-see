# K8sSee 학습 가이드

13개 학습 페이지의 설명 기준입니다. 화면은 같은 순서로 탐색하며, 페이지 내부의 재생은 교육용 시뮬레이션입니다. IP·시간·UID·revision·로그는 실제 클러스터의 조회 결과가 아닙니다.

## 1. Kubernetes 전체 구조

페이지 ID: `overview`
```mermaid
flowchart TB
    USER["사용자 / CI"] --> CLI["kubectl"]
    CLI --> API

    subgraph CLUSTER["Kubernetes Cluster"]
        subgraph CP["Control Plane: 클러스터 상태 관리"]
            API["kube-apiserver<br/>API 요청 처리"]
            ETCD[("etcd<br/>클러스터 상태 저장")]
            SCHED["kube-scheduler<br/>Pod 실행 노드 선택"]
            CTRL["kube-controller-manager<br/>원하는 상태로 조정"]
            CLOUD["cloud-controller-manager<br/>클라우드 연동: 선택 구성"]
            API <--> ETCD
            SCHED <-->|"상태 조회 / 노드 배정 기록"| API
            CTRL <-->|"상태 조회 / 리소스 변경"| API
            CLOUD <--> API
        end

        subgraph N1["Worker Node 1"]
            K1["kubelet<br/>Pod 실행 관리"]
            R1["Container Runtime<br/>containerd / CRI-O"]
            C1["CNI 플러그인<br/>Pod 네트워크 구성"]
            P1["kube-proxy 또는 대체 구현<br/>Service 전달 규칙 관리"]
            POD1["Pod A<br/>pause + 앱 컨테이너"]
            POD2["Pod B<br/>pause + 앱 컨테이너"]
            K1 -->|"CRI"| R1
            R1 --> POD1
            R1 --> POD2
            R1 -->|"네트워크 설정 요청"| C1
        end

        subgraph N2["Worker Node 2"]
            K2["kubelet"]
            R2["Container Runtime"]
            C2["CNI 플러그인"]
            P2["kube-proxy 또는 대체 구현"]
            POD3["Pod C<br/>pause + 앱 컨테이너"]
            K2 -->|"CRI"| R2
            R2 --> POD3
            R2 --> C2
        end

        K1 <-->|"Pod 사양 조회 / 상태 보고"| API
        K2 <-->|"Pod 사양 조회 / 상태 보고"| API
        API -.->|"Service / EndpointSlice 감시"| P1
        API -.->|"Service / EndpointSlice 감시"| P2
    end
```

화살표는 관리 관계와 API 통신을 나타낸다. 앱의 패킷이 API 서버나 kubelet을 거쳐 전달된다는 의미는 아니다. Control Plane도 서버인 노드 위에서 실행되며, 위 그림은 역할을 기준으로 구분했다.

| 구성 요소 | 주요 역할 |
| --- | --- |
| kube-apiserver | Kubernetes API 제공, 인증·인가·Admission 처리, 리소스 조회·변경 |
| etcd | 리소스 사양과 상태 등 클러스터 데이터 저장 |
| kube-scheduler | 아직 배정되지 않은 Pod에 적합한 노드 선택 |
| kube-controller-manager | 복제본 수 등 원하는 상태와 실제 상태를 맞추는 컨트롤러 실행 |
| kubelet | 자기 노드의 Pod 실행·상태·프로브 관리 |
| Container Runtime | 이미지 준비와 컨테이너 생성·실행·종료 |
| CNI 플러그인 | Pod 네트워크 연결 구성. IP 할당과 라우팅 등의 구현은 플러그인에 따라 다름 |
| kube-proxy / 대체 구현 | Service 주소로 온 트래픽을 백엔드 Pod로 전달하도록 규칙 구성 |
| CoreDNS | Service 이름 등을 IP로 해석하는 클러스터 DNS, 보통 Pod로 실행 |

스케줄러가 kubelet을 직접 호출해 Pod를 실행시키는 것은 아니다. 스케줄러가 API에 노드 배정을 기록하면 해당 노드의 kubelet이 이를 감지한다. [공식 구성 요소 설명](https://kubernetes.io/docs/concepts/overview/components/)

## 2. Pod가 생성되는 과정

페이지 ID: `pod-creation`
```mermaid
sequenceDiagram
    actor U as 사용자
    participant A as API Server
    participant E as etcd
    participant C as 컨트롤러
    participant S as Scheduler
    participant K as 배정된 노드의 kubelet
    participant R as Container Runtime
    participant N as CNI 플러그인

    U->>A: kubectl apply -f deployment.yaml
    A->>E: Deployment 저장
    C->>A: Deployment 감지, ReplicaSet 생성
    C->>A: ReplicaSet 감지, 필요한 Pod 생성
    A->>E: ReplicaSet / Pod 저장
    S->>A: 미배정 Pod 조회, 노드 배정 기록
    K->>A: 자기 노드에 배정된 Pod 감지
    K->>R: CRI: Pod sandbox 생성 요청
    R->>R: pause 컨테이너 실행, 공유 환경 준비
    R->>N: Pod 네트워크 연결 요청
    N-->>R: 네트워크 준비 완료
    K->>R: init 컨테이너 실행 요청: 있는 경우
    K->>R: 앱 컨테이너 실행 요청
    K->>A: Pod 상태 / readiness 등 보고
```

이 그림은 정상적인 시작 흐름을 단순화했다. 컨트롤러는 API Server를 통해 리소스를 변경하며 etcd를 직접 수정하지 않는다. Pod의 네트워크 준비 후 일반 init 컨테이너가 완료되면 앱 컨테이너가 시작된다. readiness가 성공하면 Service의 일반적인 트래픽 대상이 될 수 있다. [Pod 생명주기](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)

## StatefulSet 생성 과정

페이지 ID: `statefulset-creation` (Deployment 생성 다음 학습)

StatefulSet 컨트롤러는 ReplicaSet 없이 Pod를 직접 관리한다. Headless Service(`clusterIP: None`)를 별도로 생성하고 StatefulSet의 `serviceName`으로 연결한다. `OrderedReady` 정책에서는 `web-0`이 Running·Ready가 된 뒤 `web-1`을 생성한다.

```mermaid
flowchart LR
    API["API Server"] --> STS["StatefulSet web"]
    STS --> P0["web-0 · ordinal 0"]
    STS --> P1["web-1 · ordinal 1"]
    P0 --> C0["data-web-0 PVC"] --> V0["PV 0"]
    P1 --> C1["data-web-1 PVC"] --> V1["PV 1"]
    SVC["Headless Service web-headless"] -. "selector / DNS 이름" .-> P0
    SVC -. "selector / DNS 이름" .-> P1
```

동적 프로비저닝 가능한 기본 StorageClass와 CSI 구성이 준비된 예시다. `volumeClaimTemplates`로 Pod마다 독립 PVC를 만들고 해당 Pod의 볼륨으로 사용한다. 바인딩과 노드 배정 순서는 StorageClass의 `volumeBindingMode`에 따라 달라진다.

`web-0`을 정상 종료·삭제한 뒤 컨트롤러가 같은 이름의 새 Pod를 생성한다. 이름과 DNS 이름은 유지되고 UID와 IP는 바뀔 수 있다. 기존 `data-web-0` PVC와 연결된 PV를 재사용한다. DNS 주소 반영에는 Pod의 준비 상태와 DNS 캐시가 영향을 준다.

Pod별 저장소는 애플리케이션 데이터 복제·동기화·백업을 대신하지 않는다. 기본 PVC 보존 정책은 Retain이며 StatefulSet 삭제·축소 시 별도 정책을 설정할 수 있다. PVC 삭제 이후 PV 회수 정책은 별도 개념이다.

공식 근거: [StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)

## Job과 CronJob

페이지 ID: `jobs-cronjobs` (StatefulSet 다음 학습)

Job은 끝나는 작업을 관리하고, CronJob은 일정마다 Job을 생성한다. Job 컨트롤러가 Pod를 직접 만들며 ReplicaSet을 거치지 않는다. 스케줄러는 Pod의 노드를 선택하고 kubelet과 런타임이 실행한다. 이 과정의 리소스 읽기·쓰기는 API Server를 거친다.

```mermaid
flowchart TD
    CJ["CronJob · schedule / timeZone / jobTemplate"] -->|"CronJob 컨트롤러 · 예약 시각"| J["Job · completions / backoffLimit"]
    J -->|"Job 컨트롤러"| P["Pod · 배치 프로세스"]
    P -->|"종료 코드 0"| S["Pod Succeeded → Job Complete"]
    P -->|"오류 · Never 정책"| F["Pod Failed → 새 Pod 재시도 또는 Job Failed"]
```

정상 완료, Never 정책에서 새 UID의 Pod로 재시도, backoffLimit=0 실패, 5분마다 새 Job 생성, Forbid 중복 실행 방지, suspend 예약 중지를 비교한다. 정상 CronJob 예시는 Asia/Seoul 09:00과 09:05의 예약을 보여준다. Forbid 분기는 작업이 5분 넘게 실행되도록 Job 실행 제한을 600초로 늘린다. 다른 예시의 실행 제한은 120초다.

Pod의 Succeeded는 phase이고 Job의 Complete는 condition이다. Never와 OnFailure는 Pod 재시작 정책이며 완료된 Job을 자동 재시작하는 설정이 아니다. CronJob의 startingDeadlineSeconds는 늦어진 예약의 시작 유예 시간, Job의 activeDeadlineSeconds는 실행 시간 제한이다. TTL과 historyLimit은 서로 다른 정리 기준이며 먼저 적용된 정책에 의해 기록이 삭제될 수 있다.

일정은 정확히 한 번 실행을 보장하지 않는다. 재시도·중복 실행에 대비한 멱등성이 필요하다. suspend는 진행 중인 Job을 중단하지 않는다. Forbid는 동일 CronJob의 Job 사이에만 적용되며 건너뛴 일정은 이후 deadline 범위에서 실행될 수 있다.

공식 근거: [Job](https://kubernetes.io/docs/concepts/workloads/controllers/job/), [CronJob](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/)

## 3. Pod 내부 구조

페이지 ID: `pod-internals`
```mermaid
flowchart TB
    subgraph POD["Pod: 하나의 네트워크 공간 / Pod IP"]
        PAUSE["pause 컨테이너<br/>공유 네임스페이스 유지"]
        NET["공유 네트워크 네임스페이스<br/>IP / 포트 공간 / localhost"]
        APP1["앱 컨테이너 A<br/>예: 8080 포트"]
        APP2["앱 컨테이너 B<br/>예: 9090 포트"]
        PAUSE -.->|"유지"| NET
        APP1 --- NET
        APP2 --- NET
        APP1 <-->|"localhost로 통신"| APP2
    end
```

- pause는 앱보다 먼저 실행되어 Pod의 공유 환경을 유지한다.
- 앱 컨테이너들은 네트워크 네임스페이스를 공유하므로 같은 IP와 포트 공간을 사용한다. 같은 주소·포트에 동시에 바인딩하면 충돌할 수 있다.
- pause는 패킷을 중계하는 프록시가 아니다. 일반적인 Linux 환경에서 실제 패킷 처리는 커널이 수행한다.
- 앱 컨테이너 하나가 재시작되어도 sandbox가 유지되면 공유 네트워크 환경도 유지된다.

pause는 보통 Pod YAML의 `spec.containers`에 직접 작성하지 않고 런타임이 관리한다. [containerd의 sandbox 설명](https://github.com/containerd/containerd/blob/main/docs/sandbox-api.md)

## 4. Service와 내부 통신

페이지 ID: `service-networking`
```mermaid
flowchart LR
    CLIENT["클라이언트 Pod"] -->|"DNS 조회"| DNS["CoreDNS"]
    DNS -.->|"Service의 ClusterIP 응답"| CLIENT
    CLIENT -->|"ClusterIP로 요청"| DP["노드의 데이터 경로<br/>커널 네트워크 / eBPF 등"]
    RULE["kube-proxy 또는 대체 구현"] -.->|"Service 전달 규칙 설정"| DP
    CNI["CNI 플러그인"] -.->|"Pod 연결 / 라우팅 구성"| DP
    DP -->|"백엔드 선택 / 패킷 전달"| A["Pod A: 앱"]
    DP -->|"백엔드 선택 / 패킷 전달"| B["Pod B: 앱"]
```

실선은 요청 흐름, 점선은 이름 해석 결과나 설정 관계다. 그림은 일반적인 ClusterIP Service를 기준으로 한다.

**Service는 보통 별도의 프록시 컨테이너가 아니다.** 안정적인 주소와 백엔드 선택 기준을 정의하는 API 리소스다. kube-proxy 또는 대체 구현이 이 정의를 실제 전달 규칙으로 만든다. CNI는 Pod 사이의 연결을 구성하며, 일부 네트워크 제품은 Service 처리까지 통합한다.

같은 Pod 안에서는 `localhost`, 다른 Pod로 직접 접근할 때는 `Pod IP`, 여러 Pod를 안정적인 이름으로 접근할 때는 `Service`를 사용한다. 서로 다른 노드 사이의 트래픽은 노드 네트워크를 통과하며, 직접 라우팅·오버레이 등의 방식은 네트워크 구현에 따라 다르다. [공식 네트워크 설명](https://kubernetes.io/docs/concepts/services-networking/)

## 5. Ingress와 외부 요청

페이지 ID: `ingress`
### 외부 HTTP 요청 예시

```mermaid
flowchart LR
    USER["외부 사용자"] --> LB["외부 Load Balancer"]
    LB --> GW["Ingress Controller<br/>또는 Gateway 구현"]
    CONF["Ingress / Gateway API 리소스"] -.->|"라우팅 설정"| GW
    GW --> BACKEND["Service가 나타내는 백엔드 Pod 집합"]
    BACKEND --> APP["앱 Pod"]
```

일반적인 HTTP 진입 구성의 개념도다. 실제 구현은 Service의 ClusterIP를 이용하거나 백엔드 Pod IP로 직접 전달할 수 있다. Ingress/Gateway 리소스에는 규칙을 작성하며, 설치된 컨트롤러·게이트웨이 구현이 실제 요청을 처리한다. 외부 접근에는 NodePort나 LoadBalancer Service도 사용할 수 있다. [Service와 외부 접근](https://kubernetes.io/docs/concepts/services-networking/)

### Host·Path와 TLS

**Ingress는 Host·Path별 전달 규칙이며, Ingress Controller가 그 규칙을 실제 프록시나 로드 밸런서 설정에 반영한다.** Ingress 리소스만 생성해도 Controller가 자동 설치되는 것은 아니다. 아래는 요청 예시의 `api.example.com`과 두 Service를 사용하는 예시다.

```mermaid
flowchart TB
    API["API Server<br/>Ingress / Service / EndpointSlice / Secret"]
    API -.->|"Controller가 감시하고 설정 반영"| IC["Ingress Controller / 프록시<br/>예시: TLS 종료 + Host·Path 판단"]
    CLIENT["외부 사용자<br/>api.example.com"] -->|"DNS로 찾은 외부 진입 주소 / HTTPS"| LB["외부 Load Balancer<br/>예시 진입 구성"]
    LB --> IC
    IC -->|"별도 요청: /orders"| ORDER["order-service 백엔드<br/>order-api Pod: 8080"]
    IC -->|"별도 요청: /products"| PRODUCT["product-service 백엔드<br/>product-api Pod: 8080"]
```

점선은 API 감시·설정 관계이고 실선은 앱 요청이다. 외부 DNS는 클러스터 내부 Service 이름을 해석하는 CoreDNS와 구분한다. 위 예시는 외부 Load Balancer를 사용하지만 Controller 노출 방식은 배포 환경에 따라 다르다.

| 페이지 내부 7단계 | 누가 무엇을 하는가 |
| --- | --- |
| 1. Ingress 적용 | 사용자가 YAML을 제출하고 API Server가 규칙을 저장 |
| 2. Controller 감지 | Controller가 담당 Ingress와 Service·EndpointSlice·TLS Secret을 확인 |
| 3. 설정 갱신 | 프록시의 라우팅·인증서 설정 반영. 기존 NGINX 설정 화면은 구현 예시 |
| 4. HTTPS 요청 진입 | 사용자가 외부 진입 주소에 접속하고, 이 예시에서는 Controller가 TLS 종료 |
| 5. `/orders` 라우팅 | Host와 Path가 맞으면 `order-service:8080`의 준비된 백엔드로 전달 |
| 6. `/products` 라우팅 | 다른 요청을 `product-service:8080`의 준비된 백엔드로 전달 |
| 7. 응답 반환 | 선택된 앱의 응답을 프록시가 외부 사용자에게 반환 |

5·6단계는 **서로 다른 요청을 비교하는 분기**다. 한 요청이 orders Pod를 거친 다음 products Pod로 이동하는 순서가 아니다. Service 포트는 `targetPort`를 통해 앱 포트와 연결된다. Controller가 ClusterIP를 이용할지 EndpointSlice의 Pod IP로 직접 전달할지는 구현에 따라 다르다.

YAML에서는 다음 연결을 읽는다.

| 필드 | 의미 |
| --- | --- |
| `spec.ingressClassName` | 처리할 IngressClass 지정. 해당 클래스에 대응하는 Controller 필요 |
| `rules[].host` | HTTP Host 조건. 예시: `api.example.com` |
| `http.paths[].path`, `pathType` | URL 경로 조건. `Prefix`는 경로 요소 기준 접두 일치, `Exact`는 정확한 일치 |
| `backend.service.name`, `port` | 같은 Namespace의 대상 Service와 Service 포트 |
| `tls[].hosts`, `secretName` | TLS 대상 호스트와 인증서·키가 담긴 같은 Namespace의 Secret |

Controller 부재는 규칙이 처리되지 않는 문제, Host·Path 불일치는 대상 규칙을 찾지 못하는 문제, 준비된 백엔드 부재는 앱에 전달할 대상이 없는 문제다. 구체적인 HTTP 응답과 기본 백엔드 동작은 Controller 설정에 따른다. NGINX의 reload 방식이나 TLS 종료 후 백엔드 프로토콜도 모든 구현에 공통인 것으로 설명하지 않는다. [공식 Ingress 설명](https://kubernetes.io/docs/concepts/services-networking/ingress/)

```bash
# 예시 리소스는 default Namespace 기준
kubectl get ingressclass
kubectl describe ingress ecommerce-ingress -n default
kubectl get service order-service product-service -n default
kubectl get endpointslices -n default -l kubernetes.io/service-name=order-service
kubectl get endpointslices -n default -l kubernetes.io/service-name=product-service
kubectl describe secret example-tls-cert -n default

# 외부 DNS와 신뢰할 수 있는 TLS 인증서가 준비된 실제 환경에서 두 요청 비교
curl -i https://api.example.com/orders
curl -i https://api.example.com/products
```

## cert-manager 기반 Ingress 생성

페이지 ID: `cert-manager-ingress` (Ingress와 외부 요청 다음 학습)

cert-manager와 HTTP-01을 지원하는 Ingress Controller를 설치하고 도메인 DNS와 외부 80·443 포트, 앱 Service의 Ready 백엔드를 준비한다. `public`은 설치된 IngressClass로, `app.example.com`은 소유한 도메인으로 바꾼다.

9단계: 사전 준비 → ClusterIssuer와 ACME 계정 → TLS Ingress 등록 → ingress-shim의 Certificate 생성 → CertificateRequest·Order·Challenge → HTTP-01 검증 → TLS Secret 저장 → HTTPS 연결 → 만료 전 갱신.

Ingress의 `cert-manager.io/cluster-issuer` annotation이 발급자를 선택하고 `tls.hosts`가 인증서의 도메인, `tls.secretName`이 저장할 Secret 이름을 지정한다. Certificate와 TLS Secret은 Ingress와 같은 Namespace에 생성된다. ClusterIssuer의 ACME 계정 키 Secret은 사이트 TLS Secret과 별개다. Issuer를 사용한다면 같은 Namespace에 두고 `cert-manager.io/issuer` annotation으로 참조한다.

HTTP-01은 공개 HTTP 검증 URL을 임시 solver로 연결한다. cert-manager의 자체 점검과 인증기관의 검증이 성공하면 인증서 체인과 개인 키를 `kubernetes.io/tls` Secret의 `tls.crt`·`tls.key`로 저장한다. Ingress Controller는 Secret을 읽어 443번 포트의 TLS를 종료한다. 이 예시에서 Controller에서 앱으로 가는 연결은 HTTP이며, 백엔드 TLS와 HTTPS 리다이렉트는 별도 설정이다. 와일드카드는 DNS-01이 필요하다.

cert-manager 미설치, ClusterIssuer 준비 실패, DNS·80번 포트·solver 클래스 문제를 각각 선택할 수 있다. 실패 분기에서는 TLS Secret이 만들어지지 않는다. 인증서 갱신도 도메인 검증과 발급자 상태가 정상이어야 한다.

예시 YAML은 Let’s Encrypt staging을 사용해 발급 흐름을 확인하며 브라우저 신뢰 경고가 예상된다. 운영에서는 별도 production ClusterIssuer를 등록하고 Ingress annotation을 변경해 재발급한다. Ready 상태 외에 실제 인증서의 발급자와 Controller 반영도 확인한다. 앱의 재생·로그·API 객체는 교육용 고정 예시이며 실제 클러스터를 변경하지 않는다.

공식 근거: [Ingress 자동 인증서](https://cert-manager.io/docs/usage/ingress/), [HTTP-01](https://cert-manager.io/docs/configuration/acme/http01/), [Certificate와 갱신](https://cert-manager.io/docs/usage/certificate/), [Let’s Encrypt 검증 방식](https://letsencrypt.org/docs/challenge-types/)

## 6. 주요 리소스 관계

페이지 ID: `resource-relations`
```mermaid
flowchart TB
    DEP["Deployment<br/>배포 / 롤링 업데이트"] --> RS["ReplicaSet<br/>Pod 복제본 수 유지"]
    RS --> POD["Pod<br/>컨테이너 실행 단위"]
    STS["StatefulSet<br/>안정적인 식별자 / 저장소"] --> POD
    DS["DaemonSet<br/>대상 노드마다 Pod 배치"] --> POD
    CJ["CronJob<br/>예약 실행"] --> JOB["Job<br/>완료되는 작업"]
    JOB --> POD
    SVC["Service"] -.->|"보통 label selector로 선택"| POD
    CM["ConfigMap / Secret"] -.->|"환경변수 / 파일 제공"| POD
    SA["ServiceAccount"] -.->|"Pod의 API 접근 신원"| POD
    POD -->|"볼륨 사용"| PVC["PVC<br/>저장소 요청"]
    PVC -->|"바인딩"| PV["PV<br/>저장소 리소스"]
    PV --> STORAGE["실제 스토리지<br/>CSI 드라이버 등으로 연결"]
```

위 그림은 여러 워크로드 종류를 비교한 것이다. 한 Pod가 Deployment, StatefulSet, DaemonSet 모두에 의해 동시에 관리된다는 뜻은 아니다.

| 분류 | 기억할 관계 |
| --- | --- |
| 실행 | Node 위에 Pod가 실행되고 Pod 안에 컨테이너가 존재 |
| 배포 관리 | Deployment → ReplicaSet → Pod |
| 통신 | Service가 Pod 집합에 안정적인 접근 주소 제공 |
| 설정 | ConfigMap은 설정 데이터, Secret은 민감한 데이터 제공 |
| 저장소 | Pod가 PVC를 참조하고 PVC가 PV에 연결 |
| 접근 제어 | ServiceAccount가 신원, Role/ClusterRole이 권한, Binding이 둘을 연결 |
| 논리적 구분 | Namespace가 이름과 정책 적용 범위를 구분하며 물리적인 노드는 아님 |

ServiceAccount만 지정한다고 권한이 생기지는 않는다. RBAC Binding 등을 통해 권한을 부여한다. Secret은 이름만으로 저장 시 암호화가 보장되는 것은 아니며 클러스터 설정에 따라 달라진다.

## 7. PVC와 외부 스토리지

페이지 ID: `persistent-storage`
**PVC는 Pod가 필요한 저장소를 요청하는 리소스이고, PV는 실제 저장소와 연결되는 클러스터 리소스다.** StorageClass는 동적 생성에 사용할 프로비저너와 정책을 정의한다. 기존 PV를 연결하는 정적 방식도 가능하다. 저장소 예시는 AWS EBS CSI 드라이버를 통한 동적 생성 예시다.

| 구성 요소 | 역할 |
| --- | --- |
| PVC: `mysql-data-pvc` | Namespace 안에서 20Gi 등 용량·접근 모드·StorageClass 요청 |
| StorageClass: `ebs-gp3-sc` | `ebs.csi.aws.com`과 볼륨 종류·바인딩·회수 정책 정의 |
| PV | PVC와 바인딩되고 CSI 볼륨 식별자 등 실제 저장소 연결 정보 보유 |
| CSI controller와 사이드카 | 볼륨 생성·삭제 및 지원되는 노드 Attach/Detach 조정 |
| CSI node와 kubelet | 해당 노드에서 볼륨 준비·마운트 및 해제 |
| 외부 스토리지: AWS EBS | 앱이 쓰는 실제 데이터 저장. API 리소스인 PV와 구분 |

CSI controller는 cloud-controller-manager와 별도 구성이다. Controller가 반드시 Control Plane 노드에 배치되어야 하는 것은 아니다. EBS의 생성·연결에는 AWS API 접근 권한과 드라이버가 필요하다. [AWS EBS CSI Driver](https://github.com/kubernetes-sigs/aws-ebs-csi-driver)

```mermaid
sequenceDiagram
    actor U as 사용자
    participant A as API Server
    participant S as Scheduler
    participant C as CSI controller / 사이드카
    participant E as AWS EBS API
    participant K as kubelet / CSI node
    participant P as 앱 컨테이너

    U->>A: StorageClass와 PVC 적용
    Note over A,S: WaitForFirstConsumer: 소비 Pod를 기다림
    U->>A: PVC를 참조하는 Deployment 적용
    Note over A,S: 컨트롤러가 ReplicaSet / Pod 생성
    S->>A: 노드 후보 선택, PVC에 선택 노드 정보 기록
    C->>A: PVC / StorageClass / 노드 토폴로지 확인
    C->>E: CSI 드라이버가 적합한 AZ에 볼륨 생성 요청
    E-->>C: 볼륨 식별자 반환
    C->>A: PV 등록
    Note over A,S: PV/PVC 바인딩 완료 후 최종 Pod 노드 배정
    C->>E: 대상 노드에 볼륨 Attach 요청
    E-->>C: 연결 완료
    K->>K: 볼륨 준비, 필요 시 초기화, 마운트
    K->>P: 런타임을 통해 volumeMounts 경로 제공
    P->>P: /var/lib/mysql에 데이터 읽기 / 쓰기
```

이 그림은 정상 흐름을 단순화한 **저장소 준비 과정**이다. 실제 앱의 디스크 I/O가 API Server를 통과하는 경로를 뜻하지 않는다. `WaitForFirstConsumer`는 소비 Pod의 스케줄링 제약을 고려해 볼륨 생성·바인딩을 늦춘다. 노드 후보 선택과 최종 Pod 배정은 구분하며, CSI 드라이버와 스케줄러가 볼륨 토폴로지를 함께 고려한다. [StorageClass와 볼륨 바인딩](https://kubernetes.io/docs/concepts/storage/storage-classes/)

| 페이지 내부 8단계 | 이해할 핵심 |
| --- | --- |
| 1. PVC 접수 | `Pending`은 소비 Pod 대기일 수 있음. 실패 여부는 Events로 확인 |
| 2. Pod 노드 선택 | 노드 자원·AZ·저장소 제약을 고려하고 볼륨 준비 뒤 최종 배정 |
| 3. CSI 프로비저너 | external-provisioner가 요청을 조정하고 CSI 드라이버가 저장소 API 호출 |
| 4. EBS 생성·PV 바인딩 | 실제 볼륨과 PV가 생성되고 PVC가 `Bound`로 전이 |
| 5. Attach | 볼륨을 대상 노드에 연결. VolumeAttachment로 연결 상태 확인 |
| 6. Mount | 노드에 파일시스템을 준비·마운트. 기존 데이터 볼륨은 다시 포맷하지 않음 |
| 7. DB 실행 | Pod의 `volumes[].persistentVolumeClaim.claimName`과 컨테이너의 `volumeMounts`를 연결 |
| 8. 영속성 확인 | 같은 PVC를 참조하는 새 Pod에서 이전 데이터를 읽는 예시 |

`Bound`는 저장소 연결 관계가 성립한 상태이며, 컨테이너 마운트·앱 준비까지 완료했다는 뜻은 아니다. `ReadWriteOnce`는 단일 노드에서 읽기·쓰기할 수 있다는 의미이며 단일 Pod로 제한한다는 뜻은 아니다. 실제 동시 사용 조건은 드라이버와 저장소 기능도 확인해야 한다.

Pod를 삭제해도 PVC/PV가 유지되면 새 Pod가 같은 볼륨을 재사용할 수 있다. PVC 삭제 후에는 PV의 회수 정책에 따라 `Delete`는 외부 볼륨 삭제로 이어질 수 있고, `Retain`은 저장소를 남겨 관리자가 회수하도록 한다. 영속 저장소는 앱이 아직 기록하지 않은 데이터나 모든 장애의 무손실 복구를 보장하지 않는다. [PV·PVC와 접근 모드·회수 정책](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)

```bash
# 예시 PVC와 앱은 default Namespace 기준
kubectl get storageclass ebs-gp3-sc -o yaml
kubectl get pvc mysql-data-pvc -n default
kubectl describe pvc mysql-data-pvc -n default
kubectl get pv
kubectl get volumeattachments

# POD_NAME을 실제 DB Pod 이름으로 변경
kubectl describe pod POD_NAME -n default
kubectl exec POD_NAME -n default -- df -h /var/lib/mysql
```

PVC Events에서는 소비 Pod 대기·프로비저닝을, Pod Events에서는 스케줄링·Attach·Mount 오류를 확인한다. 영속성 실습은 같은 PVC를 유지한 채 앱에서 데이터를 기록하고, 교체된 Pod에서 다시 조회하는 순서로 진행한다. ConfigMap/Secret 파일 제공은 여기서 설명한 EBS의 CSI 생성·Attach 과정과 구분한다.

## 8. Pod 라이프사이클

페이지 ID: `pod-lifecycle`
### Pod의 단계: phase

```mermaid
stateDiagram-v2
    [*] --> Pending: Pod 객체 생성
    Pending --> Running: 노드 배정 및 컨테이너 시작
    Pending --> Failed: 시작 단계에서 복구 불가능한 실패
    Running --> Running: 정책에 따라 컨테이너 재시작
    Running --> Succeeded: 모든 컨테이너 정상 종료, 재시작 없음
    Running --> Failed: 모든 컨테이너 종료, 하나 이상 실패, 재시작 없음
    state "Unknown: 상태 확인 불가" as Unknown
    note right of Unknown
        노드 통신 문제 등으로 상태를 얻지 못한 경우
        필수로 거치는 단계는 아님
    end note
```

대표 흐름을 단순화한 그림이다. `phase`는 상세한 실행 상태 전체를 표현하지 않는다.

| phase | 의미 |
| --- | --- |
| Pending | 스케줄링 대기, 이미지 다운로드, init 실행 등 시작 준비 중 |
| Running | 컨테이너 생성 완료. 하나 이상 실행 중이거나 시작·재시작 중 |
| Succeeded | 모든 컨테이너가 성공적으로 종료되고 재시작하지 않음 |
| Failed | 모두 종료되었고 하나 이상 실패했으며 재시작하지 않음 |
| Unknown | Pod 상태를 확인할 수 없음 |

**Running이 곧 요청 처리 가능이라는 뜻은 아니다.** `Ready` 조건도 확인해야 한다. `kubectl get pods`의 `STATUS`에 나타나는 `CrashLoopBackOff`, `ImagePullBackOff`, `Terminating`은 별도의 Pod phase가 아니다.

### 준비 상태와 건강 검사

```mermaid
flowchart LR
    START["컨테이너 시작"] --> STARTUP["startupProbe<br/>설정한 경우 시작 완료 확인"]
    STARTUP -->|"성공 후"| CHECK["readiness / liveness 검사"]
    CHECK --> READY["readiness 성공<br/>요청 처리 가능"]
    CHECK --> NOTREADY["readiness 실패<br/>일반 Service 트래픽 대상에서 제외"]
    CHECK --> RESTART["liveness 연속 실패<br/>컨테이너 종료 후 정책에 따라 재시작"]
    STARTUP -->|"실패 임계치 도달"| RESTART
```

startupProbe가 없으면 readiness/liveness는 각자의 설정에 따라 시작한다. readiness 실패만으로 컨테이너가 재시작되지는 않는다. Pod의 `Ready`는 컨테이너 준비 상태와 readiness gate 등도 반영한다. [공식 프로브 설명](https://kubernetes.io/docs/concepts/workloads/pods/probes/)

### 컨테이너 재시작과 Pod 교체

```mermaid
flowchart TB
    EXIT["컨테이너 종료"] --> POLICY{"restartPolicy"}
    POLICY -->|"Always: 종료 결과와 무관"| RETRY["같은 Pod 안에서 컨테이너 재시작"]
    POLICY -->|"OnFailure: 실패한 경우"| RETRY
    POLICY -->|"Never / OnFailure의 정상 종료"| STOP["해당 컨테이너 재시작 안 함"]
    RETRY --> LOOP["반복 실패 시 재시작 지연<br/>CrashLoopBackOff"]
    LOST["Pod 삭제 / 노드 장애 등"] --> CTRL["Deployment 등의 컨트롤러<br/>필요한 복제본 수 확인"]
    CTRL --> NEW["새 UID의 Pod 생성<br/>다시 스케줄링"]
```

표는 기본 Pod 수준 `restartPolicy` 기준이다. 컨테이너별 정책 등의 확장 설정은 생략했다. **컨테이너 재시작은 같은 Pod, Pod 교체는 새 Pod**다. 기존 Pod가 다른 노드로 이동하지 않는다. 컨트롤러 없이 직접 생성한 Pod에는 자동 교체가 보장되지 않는다.

### 삭제와 정상 종료

```mermaid
flowchart TB
    DELETE["Pod 삭제 요청"] --> MARK["삭제 시각 / 유예 시간 기록<br/>kubectl 표시: Terminating"]
    MARK --> ENDPOINT["EndpointSlice 갱신<br/>일반 신규 트래픽 대상에서 제외"]
    MARK --> HOOK["kubelet: preStop 실행<br/>설정되어 있고 실행 조건을 만족하는 경우"]
    HOOK --> TERM["런타임: 종료 신호 전달<br/>보통 SIGTERM"]
    TERM --> WAIT{"유예 시간 내 종료?"}
    WAIT -->|"예"| CLEAN["sandbox / 네트워크 등 정리"]
    WAIT -->|"아니오"| KILL["남은 프로세스에 SIGKILL"]
    KILL --> CLEAN
    CLEAN --> REMOVE["Pod API 객체 제거<br/>finalizer 등이 있으면 대기 가능"]
```

일반적인 삭제 흐름이다. 트래픽 대상 갱신과 노드의 종료 처리는 병행되므로 순간적인 전파 지연이 있을 수 있다. `terminationGracePeriodSeconds` 기본값은 **30초**이며 preStop 실행 시간도 포함한다. 이미지 설정에 따라 종료 신호가 달라질 수 있다. 앱 종료 후 pause와 Pod 네트워크도 정리된다.

종료된 Pod가 항상 즉시 삭제되지는 않는다. 작업 완료 Pod는 `Succeeded`/`Failed`로 남을 수 있다. [공식 Pod 라이프사이클과 종료 설명](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)

### 상태 확인 명령

```bash
# READY, STATUS, RESTARTS 확인
kubectl get pods -o wide

# phase와 Ready 조건 확인: POD_NAME을 실제 이름으로 변경
kubectl get pod POD_NAME -o jsonpath='{.status.phase}{"\n"}{.status.conditions[?(@.type=="Ready")].status}{"\n"}'

# 컨테이너 상태, 종료 이유, Events 확인
kubectl describe pod POD_NAME

# 직전에 종료된 컨테이너 로그 확인: 컨테이너가 여러 개면 -c 이름 추가
kubectl logs POD_NAME --previous
```

## 참고 문서

- [Kubernetes 구성 요소](https://kubernetes.io/docs/concepts/overview/components/)
- [Kubernetes 개념: 워크로드·설정·저장소·보안](https://kubernetes.io/docs/concepts/)
- [Pod 생명주기](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
- [네트워크와 Service](https://kubernetes.io/docs/concepts/services-networking/)
- [Ingress 규칙과 Controller](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [PV·PVC와 영속 저장소](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [StorageClass와 볼륨 바인딩](https://kubernetes.io/docs/concepts/storage/storage-classes/)
- [AWS EBS CSI Driver](https://github.com/kubernetes-sigs/aws-ebs-csi-driver)
- [containerd Pod sandbox](https://github.com/containerd/containerd/blob/main/docs/sandbox-api.md)

## ConfigMap과 Secret

페이지 ID: `configmap-secret` (주요 리소스 관계 다음 학습)

ConfigMap은 일반 설정을, Secret은 비밀번호·API 키·인증서 같은 민감한 정보를 관리한다. 둘 다 API Server를 통해 etcd에 별도 리소스로 저장된다. 설정만 생성해서 Pod가 생기지는 않는다.

Pod는 같은 Namespace의 ConfigMap·Secret 이름과 키를 환경변수 또는 볼륨으로 참조한다. kubelet이 API Server에서 필요한 데이터를 받아 컨테이너 환경변수와 파일을 준비한다. Pod가 etcd에 직접 접근하지 않는다. 환경변수·볼륨 주입과 앱의 Kubernetes API 직접 조회 권한은 별개다.

실행 중인 컨테이너 환경변수는 자동 갱신되지 않는다. 일반 볼륨 파일은 지연 후 갱신되며 앱이 다시 읽어야 한다. subPath 마운트는 자동 갱신되지 않는다. 시뮬레이션 마지막 단계는 APP_MODE 환경변수가 production을 유지하면서 설정 파일이 mode=debug로 갱신된 이후를 비교한다.

Secret의 Base64는 암호화가 아니다. 기본 Kubernetes 설정은 Secret의 etcd 저장 암호화를 보장하지 않으므로 저장 암호화와 RBAC 권한 제한이 필요하다. Pod 생성 권한을 통한 간접 접근도 고려해야 한다. 공개용 가상 비밀번호 demo-only만 예시에 사용한다.

공식 근거: [ConfigMaps](https://kubernetes.io/docs/concepts/configuration/configmap/), [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)

## Volume 종류와 수명

페이지 ID: `volume-types` (ConfigMap·Secret 다음, PVC·외부 스토리지 이전)

볼륨은 임시 파일, API 설정 파일, 노드 디스크, 외부 저장소 등 여러 소스를 컨테이너에 연결한다. `volumes`는 Pod 수준에서 소스를 정의하고 `volumeMounts`는 컨테이너마다 이름과 경로를 연결한다. 같은 볼륨을 서로 다른 경로에 마운트해도 같은 파일을 공유한다.

종류 비교에는 emptyDir, hostPath, configMap, secret, downwardAPI, projected, persistentVolumeClaim, nfs, local, image가 포함된다. local은 PV에서 정의하고 Pod에서는 PVC로 사용한다. CSI는 드라이버 규격으로 영구·임시 볼륨 모두 가능하다.

세 가지 예시를 5단계로 비교한다: 소스와 경로 연결 → 파일 사용 → 컨테이너 재시작 → Pod 삭제 → 새 Pod 생성. emptyDir의 파일은 같은 Pod의 컨테이너 재시작에는 유지되고 Pod 삭제 후 새 Pod에는 없다. ConfigMap·Secret 원본은 별도 API 리소스로 남고 새 Pod에 다시 투영된다. PVC 예시는 외부 CSI 저장소와 Bound PVC를 가정하며 정상 종료·볼륨 해제 후 새 노드의 Pod에서 같은 데이터를 읽는다.

다른 노드의 사용 가능 여부는 실제 저장소·접근 모드·배치 조건에 따른다. hostPath·local 데이터는 원래 노드에 종속된다. 사용자 파일은 etcd가 아니라 해당 저장소에 존재하며 ConfigMap·Secret 원본 값은 etcd에 저장된다.

공식 근거: [Volumes](https://kubernetes.io/docs/concepts/storage/volumes/), [Ephemeral Volumes](https://kubernetes.io/docs/concepts/storage/ephemeral-volumes/)
