# Kubernetes 멀티 노드 · 멀티 네임스페이스 통신 구조

이 문서는 클러스터 내 서로 다른 **논리적 공간(Namespace A, B)**과 **물리적 실행 환경(Worker Node 1, 2, 10)**에 배치된 Pod들이 어떻게 통신하는지 정리한 문서다.

> **핵심 전제**
>
> - **Namespace(네임스페이스)**는 리소스 이름 범위, Service DNS 도메인, 권한(RBAC), 네트워크 정책(NetworkPolicy)을 구분하는 **논리적 경계**다. 물리적인 라우터나 별도의 노드가 아니다.
> - **Worker Node(워커 노드)**는 실제 컨테이너 프로세스와 커널 네트워크(CNI, kube-proxy/eBPF 데이터 경로)가 동작하는 **물리/가상 머신**이다.
> - 아래 시나리오에서 `FE가 BE를 호출한다`는 흐름은 클러스터 내부 네트워크 경유 과정을 명확히 보여주기 위해 **FE Pod(`pod1`) 내부의 서버 코드(SSR/Next.js 등) 또는 리버스 프록시(NGINX 등)가 클러스터 내부에서 BE를 호출하는 기준**으로 설명한다. *(참고: 만약 브라우저에 내려간 정적 SPA JS가 직접 호출한다면, 클러스터 내부 동서 통신이 아니라 외부 사용자 브라우저 → Ingress → BE 순서로 진입한다.)*

---

## 0. 전체 배치 구조 (논리적 Namespace vs 물리적 Worker Node)

| 구분                | Pod 이름  | 역할 (코드)        | 논리적 소속 (Namespace)          | 물리적 실행 위치 (Node)  | 연결된 Service (예시)  |
| ------------------- | --------- | ------------------ | -------------------------------- | ------------------------ | ---------------------- |
| **Frontend**  | `pod1`  | **FE 코드**  | **Namespace A** (`ns-a`) | **Worker Node 1**  | `fe-svc` (`ns-a`)  |
| **Backend 1** | `pod3`  | **BE1 코드** | **Namespace A** (`ns-a`) | **Worker Node 2**  | `be1-svc` (`ns-a`) |
| **Backend 2** | `pod10` | **BE2 코드** | **Namespace B** (`ns-b`) | **Worker Node 10** | `be2-svc` (`ns-b`) |

```mermaid
flowchart TB
    subgraph LOGICAL["논리적 구분: Namespace 및 Service (API 리소스)"]
        direction LR
        subgraph NSA["Namespace A (ns-a)"]
            FESVC["Service: fe-svc<br/>(ns-a)"]
            BE1SVC["Service: be1-svc<br/>(ns-a)"]
        end
        subgraph NSB["Namespace B (ns-b)"]
            BE2SVC["Service: be2-svc<br/>(ns-b)"]
        end
    end

    subgraph PHYSICAL["물리적 배치: Worker Nodes (실제 프로세스 및 네트워크)"]
        direction LR
        subgraph WN1["Worker Node 1"]
            POD1["pod1: FE 코드<br/>소속: Namespace A<br/>IP: 10.244.1.11"]
        end
        subgraph WN2["Worker Node 2"]
            POD3["pod3: BE1 코드<br/>소속: Namespace A<br/>IP: 10.244.2.33"]
        end
        subgraph WN10["Worker Node 10"]
            POD10["pod10: BE2 코드<br/>소속: Namespace B<br/>IP: 10.244.10.100"]
        end
    end

    FESVC -.->|"selector 선택"| POD1
    BE1SVC -.->|"selector 선택"| POD3
    BE2SVC -.->|"selector 선택"| POD10
```

- 점선(`-.->`)은 실제 네트워크 홉이 아니라 **Service가 어떤 Pod를 백엔드(EndpointSlice)로 가리키는지**를 뜻하는 논리적 연결이다.

---

## 1. 사용자가 FE로 접속하고, FE가 BE1 코드를 호출하는 경우

- **특징**: 외부 진입(North-South) 후 **같은 네임스페이스(`Namespace A`) 내부, 서로 다른 워커 노드(`Worker Node 1` → `Worker Node 2`) 간 통신**이다.
- **DNS 특징**: `pod1`과 `be1-svc`가 모두 **Namespace A**에 속하므로, `pod1`은 짧은 서비스 이름(`http://be1-svc`)만으로 호출할 수 있다.

### 1-1. 데이터 경로 구조도 (Flowchart)

```mermaid
flowchart LR
    USER["외부 사용자"] -->|"1. HTTP/HTTPS 접속"| ENTRY["외부 진입점<br/>LB / Ingress Controller"]
    ENTRY -->|"2. fe-svc 백엔드 전달"| POD1

    DNS["CoreDNS<br/>클러스터 DNS"]

    subgraph WN1["Worker Node 1"]
        subgraph NSA_N1["논리 소속: Namespace A"]
            POD1["pod1: FE 코드<br/>(10.244.1.11)"]
        end
        KP1["kube-proxy / eBPF<br/>Service 규칙 관리"]
        DP1["Node 1 커널 데이터 경로<br/>DNAT: ClusterIP → 10.244.2.33"]
        CNI1["CNI 플러그인<br/>노드 간 라우팅/오버레이"]

        POD1 -->|"3. DNS 질의: be1-svc"| DNS
        DNS -.->|"4. be1-svc ClusterIP 응답"| POD1
        POD1 -->|"5. ClusterIP로 요청"| DP1
        KP1 -.->|"be1-svc(ns-a) 규칙 설정"| DP1
        DP1 --> CNI1
    end

    subgraph WN2["Worker Node 2"]
        CNI2["CNI 플러그인"]
        subgraph NSA_N2["논리 소속: Namespace A"]
            POD3["pod3: BE1 코드<br/>(10.244.2.33)"]
        end
        CNI2 -->|"7. 패킷 전달"| POD3
    end

    CNI1 -->|"6. 노드 네트워크 이동<br/>(Node 1 → Node 2)"| CNI2
```

### 1-2. 단계별 호출 흐름 (Sequence Diagram)

```mermaid
sequenceDiagram
    actor User as 외부 사용자
    participant Entry as 외부 LB / Ingress
    participant Pod1 as pod1 (FE 코드)<br/>[Namespace A / Node 1]
    participant DNS as CoreDNS
    participant Node1Net as Node 1 커널 데이터 경로<br/>(kube-proxy + CNI)
    participant Node2Net as Node 2 커널 데이터 경로<br/>(CNI)
    participant Pod3 as pod3 (BE1 코드)<br/>[Namespace A / Node 2]

    User->>Entry: 1. FE 서비스 접속 요청
    Entry->>Pod1: 2. Worker Node 1의 pod1로 트래픽 전달
    Pod1->>DNS: 3. DNS 조회: "be1-svc" (같은 Namespace A이므로 짧은 이름 사용 가능)
    Note over Pod1,DNS: /etc/resolv.conf의 search ns-a.svc.cluster.local 자동 적용
    DNS-->>Pod1: 4. be1-svc의 ClusterIP 반환 (예: 10.96.10.1)
    Pod1->>Node1Net: 5. ClusterIP(10.96.10.1)로 HTTP 요청 전송
    Note over Node1Net: kube-proxy 규칙(iptables/IPVS/eBPF)에 의해<br/>목적지 IP를 pod3 IP(10.244.2.33)로 DNAT 변환
    Node1Net->>Node2Net: 6. CNI를 통해 Worker Node 1 → Worker Node 2로 패킷 전송
    Node2Net->>Pod3: 7. pod3(BE1) 컨테이너로 패킷 전달
    Pod3-->>Pod1: 8. BE1 처리 결과 응답 (Node 2 → Node 1 역순)
    Pod1-->>Entry: 9. FE 최종 응답 반환
    Entry-->>User: 10. 사용자에게 응답 전달
```

### 1-3. 핵심 포인트

1. **같은 Namespace 내 DNS 축약**: `pod1`의 `/etc/resolv.conf`에는 `search namespace-a.svc.cluster.local svc.cluster.local cluster.local`이 기본 설정되어 있다. 따라서 코드에서 `http://be1-svc`만 호출해도 자동으로 `be1-svc.namespace-a.svc.cluster.local`로 해석된다.
2. **Service는 프록시 서버를 거치지 않음**: `be1-svc`라는 별도 컨테이너를 경유하는 것이 아니라, 출발지 노드인 **Worker Node 1의 커널 데이터 경로**에서 곧바로 `pod3`의 Pod IP로 목적지가 변환(DNAT)되어 **Worker Node 2**로 직행한다.

---

## 2. 사용자가 FE로 접속하고, FE가 BE2 코드를 호출하는 경우

- **특징**: 외부 진입 후 **서로 다른 네임스페이스(`Namespace A` → `Namespace B`)이자 서로 다른 워커 노드(`Worker Node 1` → `Worker Node 10`) 간 통신**이다.
- **DNS 특징**: 대상이 다른 네임스페이스(`Namespace B`)에 있으므로 **반드시 네임스페이스를 명시한 주소(`be2-svc.namespace-b` 또는 `be2-svc.namespace-b.svc.cluster.local`)**로 호출해야 한다.
- **네트워크 특징**: 네임스페이스가 달라도 별도의 "네임스페이스 게이트웨이"를 거치지 않는다. 커널과 CNI 수준에서는 **Worker Node 1에서 Worker Node 10으로 직접 전달**된다.

### 2-1. 데이터 경로 구조도 (Flowchart)

```mermaid
flowchart LR
    USER["외부 사용자"] -->|"1. HTTP/HTTPS 접속"| ENTRY["외부 진입점<br/>LB / Ingress Controller"]
    ENTRY -->|"2. fe-svc 백엔드 전달"| POD1

    DNS["CoreDNS<br/>클러스터 DNS"]

    subgraph WN1["Worker Node 1"]
        subgraph NSA_N1["논리 소속: Namespace A"]
            POD1["pod1: FE 코드<br/>(10.244.1.11)"]
        end
        KP1["kube-proxy / eBPF<br/>모든 Namespace의 Service 규칙 보유"]
        DP1["Node 1 커널 데이터 경로<br/>DNAT: ClusterIP → 10.244.10.100"]
        CNI1["CNI 플러그인"]

        POD1 -->|"3. DNS 질의:<br/>be2-svc.namespace-b.svc.cluster.local"| DNS
        DNS -.->|"4. be2-svc ClusterIP 응답"| POD1
        POD1 -->|"5. ClusterIP로 요청"| DP1
        KP1 -.->|"be2-svc(ns-b) 규칙 설정"| DP1
        DP1 --> CNI1
    end

    subgraph WN10["Worker Node 10"]
        CNI10["CNI 플러그인"]
        subgraph NSB_N10["논리 소속: Namespace B"]
            POD10["pod10: BE2 코드<br/>(10.244.10.100)"]
        end
        CNI10 -->|"7. 패킷 전달"| POD10
    end

    CNI1 -->|"6. 노드 네트워크 이동<br/>(Node 1 → Node 10, Namespace 경계 무관)"| CNI10
```

### 2-2. 단계별 호출 흐름 (Sequence Diagram)

```mermaid
sequenceDiagram
    actor User as 외부 사용자
    participant Entry as 외부 LB / Ingress
    participant Pod1 as pod1 (FE 코드)<br/>[Namespace A / Node 1]
    participant DNS as CoreDNS
    participant Node1Net as Node 1 커널 데이터 경로<br/>(kube-proxy + CNI)
    participant Node10Net as Node 10 커널 데이터 경로<br/>(CNI)
    participant Pod10 as pod10 (BE2 코드)<br/>[Namespace B / Node 10]

    User->>Entry: 1. FE 서비스 접속 요청
    Entry->>Pod1: 2. Worker Node 1의 pod1로 트래픽 전달
    Pod1->>DNS: 3. DNS 조회: "be2-svc.namespace-b.svc.cluster.local" (또는 "be2-svc.namespace-b")
    Note over Pod1,DNS: 다른 Namespace이므로 "be2-svc"만 쓰면<br/>Namespace A에서 찾다가 NXDOMAIN 실패함!
    DNS-->>Pod1: 4. Namespace B의 be2-svc ClusterIP 반환 (예: 10.96.20.2)
    Pod1->>Node1Net: 5. ClusterIP(10.96.20.2)로 HTTP 요청 전송
    Note over Node1Net: Worker Node 1의 kube-proxy는 클러스터 전체 Service를 감시하므로<br/>Namespace B의 be2-svc도 Node 1 커널에서 즉시 pod10 IP(10.244.10.100)로 DNAT
    Node1Net->>Node10Net: 6. CNI를 통해 Worker Node 1 → Worker Node 10으로 패킷 전송
    Note over Node1Net,Node10Net: NetworkPolicy가 없다면 Namespace A → B 트래픽은 기본 허용(Flat Network)
    Node10Net->>Pod10: 7. pod10(BE2) 컨테이너로 패킷 전달
    Pod10-->>Pod1: 8. BE2 처리 결과 응답 (Node 10 → Node 1 역순)
    Pod1-->>Entry: 9. FE 최종 응답 반환
    Entry-->>User: 10. 사용자에게 응답 전달
```

### 2-3. 핵심 포인트

1. **다른 Namespace 호출 시 DNS 주소 규칙**:
   - ❌ `http://be2-svc`: `be2-svc.namespace-a.svc.cluster.local`을 찾게 되어 실패한다.
   - ⭕ `http://be2-svc.namespace-b`: `/etc/resolv.conf`의 두 번째 검색 도메인인 `svc.cluster.local`과 결합되어 성공한다.
   - ⭕ `http://be2-svc.namespace-b.svc.cluster.local`: 전체 정규화 도메인(FQDN)으로 가장 명확하며 불필요한 DNS 검색 시도를 줄일 수 있다.
2. **kube-proxy의 범위는 클러스터 전체**: `Worker Node 1`에는 `Namespace B`의 Pod가 하나도 없더라도, `Worker Node 1`의 `kube-proxy`(또는 eBPF)는 `Namespace B`의 Service와 EndpointSlice 정보를 이미 알고 있어 `Worker Node 1` 커널에서 바로 `pod10`으로 DNAT한다.

---

## 3. BE1 코드가 BE2를 호출하는 경우

- **특징**: 외부 사용자 진입이 아닌 **클러스터 내부 백엔드 간(East-West) 통신**이다.
- **배치 관계**: `Namespace A`의 `Worker Node 2`에 있는 `pod3`(BE1)가 `Namespace B`의 `Worker Node 10`에 있는 `pod10`(BE2)을 호출한다.
- **데이터 경로**: `Worker Node 1`을 전혀 거치지 않고, 출발지인 **`Worker Node 2`의 커널 데이터 경로에서 DNAT된 후 `Worker Node 10`으로 직접 이동**한다.

### 3-1. 데이터 경로 구조도 (Flowchart)

```mermaid
flowchart LR
    DNS["CoreDNS<br/>클러스터 DNS"]

    subgraph WN2["Worker Node 2"]
        subgraph NSA_N2["논리 소속: Namespace A"]
            POD3["pod3: BE1 코드<br/>(10.244.2.33)"]
        end
        KP2["kube-proxy / eBPF<br/>Service 규칙 관리"]
        DP2["Node 2 커널 데이터 경로<br/>DNAT: ClusterIP → 10.244.10.100"]
        CNI2["CNI 플러그인"]

        POD3 -->|"1. DNS 질의:<br/>be2-svc.namespace-b.svc.cluster.local"| DNS
        DNS -.->|"2. be2-svc ClusterIP 응답"| POD3
        POD3 -->|"3. ClusterIP로 요청"| DP2
        KP2 -.->|"be2-svc(ns-b) 규칙 설정"| DP2
        DP2 --> CNI2
    end

    subgraph WN10["Worker Node 10"]
        CNI10["CNI 플러그인"]
        subgraph NSB_N10["논리 소속: Namespace B"]
            POD10["pod10: BE2 코드<br/>(10.244.10.100)"]
        end
        CNI10 -->|"5. 패킷 전달"| POD10
    end

    CNI2 -->|"4. 노드 네트워크 이동<br/>(Node 2 → Node 10)"| CNI10
```

### 3-2. 단계별 호출 흐름 (Sequence Diagram)

```mermaid
sequenceDiagram
    participant Pod3 as pod3 (BE1 코드)<br/>[Namespace A / Node 2]
    participant DNS as CoreDNS
    participant Node2Net as Node 2 커널 데이터 경로<br/>(kube-proxy + CNI)
    participant Node10Net as Node 10 커널 데이터 경로<br/>(CNI)
    participant Pod10 as pod10 (BE2 코드)<br/>[Namespace B / Node 10]

    Pod3->>DNS: 1. DNS 조회: "be2-svc.namespace-b.svc.cluster.local"
    DNS-->>Pod3: 2. Namespace B의 be2-svc ClusterIP 반환 (예: 10.96.20.2)
    Pod3->>Node2Net: 3. ClusterIP(10.96.20.2)로 요청 패킷 전송 (출발지: 10.244.2.33)
    Note over Node2Net: Worker Node 2의 커널에서 목적지를<br/>ClusterIP(10.96.20.2) → pod10 IP(10.244.10.100)로 DNAT 변환
    Node2Net->>Node10Net: 4. CNI를 통해 Worker Node 2 → Worker Node 10으로 패킷 전달
    Node10Net->>Pod10: 5. pod10(BE2) 컨테이너로 패킷 전달
    Pod10-->>Node10Net: 6. 응답 패킷 생성 (목적지: pod3 IP 10.244.2.33)
    Node10Net-->>Node2Net: 7. Worker Node 10 → Worker Node 2로 응답 패킷 전달
    Note over Node2Net: conntrack 상태 테이블을 참조해<br/>출발지 IP를 pod10 IP → ClusterIP로 역변환(Reverse NAT)
    Node2Net-->>Pod3: 8. pod3(BE1)가 응답 수신
```

### 3-3. 핵심 포인트

1. **내부 서비스 간 직접 통신(East-West Traffic)**: 클러스터 내부의 `pod3`가 `pod10`을 부를 때는 외부 Ingress나 LoadBalancer로 나갔다 들어오지 않고, `ClusterIP` Service를 통해 **Worker Node 2 → Worker Node 10**으로 곧바로 통신한다.
2. **conntrack과 역변환(Reverse NAT)**: `pod3`는 `ClusterIP(10.96.20.2)`로 패킷을 보냈지만 실제 응답은 `pod10(10.244.10.100)`이 보낸다. 이때 출발지 노드(`Worker Node 2`)의 커널 `conntrack`이 연결 기록을 기억하고 있다가 응답 패킷의 출발지를 다시 `ClusterIP`로 되돌려주므로, `pod3`의 소켓은 정상적으로 응답을 받는다.
3. **NetworkPolicy로 접근 제어 시**: 만약 `Namespace B`의 `pod10`(BE2)이 오직 `Namespace A`의 `pod3`(BE1)로부터의 호출만 허용하고 `pod1`(FE)의 직접 호출(시나리오 2)은 차단하고 싶다면, `Namespace B`에 `NetworkPolicy`를 생성하여 `namespaceSelector`(Namespace A)와 `podSelector`(`app: be1`)를 함께 지정하면 된다.

---

## 4. 세 가지 경우 한눈에 비교 요약

| 비교 항목                        | 1. 사용자 → FE(`pod1`) → BE1(`pod3`)     | 2. 사용자 → FE(`pod1`) → BE2(`pod10`)    | 3. BE1(`pod3`) → BE2(`pod10`)           |
| -------------------------------- | ---------------------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| **트래픽 성격**            | 외부 진입(North-South) 후 내부 호출(East-West) | 외부 진입(North-South) 후 내부 호출(East-West) | 순수 내부 백엔드 간 호출(East-West)          |
| **출발지 → 목적지 Pod**   | `pod1` → `pod3`                           | `pod1` → `pod10`                          | `pod3` → `pod10`                        |
| **Namespace 변화**         | **같은 Namespace** (`A` → `A`)      | **다른 Namespace** (`A` → `B`)      | **다른 Namespace** (`A` → `B`)    |
| **Worker Node 경로**       | **Node 1 → Node 2**                     | **Node 1 → Node 10**                    | **Node 2 → Node 10**                  |
| **권장 호출 도메인 (DNS)** | `be1-svc` (짧은 이름 가능)                   | `be2-svc.namespace-b.svc.cluster.local`      | `be2-svc.namespace-b.svc.cluster.local`    |
| **DNAT 수행 위치**         | Worker Node 1 커널                             | Worker Node 1 커널                             | Worker Node 2 커널                           |
| **NetworkPolicy 격리 시**  | 같은 Namespace 내`podSelector`로 제어        | `namespaceSelector` + `podSelector` 필요   | `namespaceSelector` + `podSelector` 필요 |
