import type { EtcdRecord } from "../types/pipeline";
import type { LearningClusterStep } from "./learningScenarios";

export const CERT_MANAGER_SOURCES = [
  "https://cert-manager.io/docs/usage/ingress/",
  "https://cert-manager.io/docs/configuration/acme/http01/",
  "https://cert-manager.io/docs/usage/certificate/",
  "https://letsencrypt.org/docs/challenge-types/",
];

export const CLUSTER_ISSUER_YAML = `# cert-manager와 HTTP-01을 지원하는 Ingress Controller가 먼저 설치되어 있어야 합니다.
# public은 예시 IngressClass 이름입니다. 실제 설치된 클래스 이름으로 바꾸세요.
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    email: admin@example.com # 본인의 이메일로 변경
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-staging-account-key
    solvers:
      - http01:
          ingress:
            ingressClassName: public`;

export const TLS_INGRESS_YAML = `# app.example.com을 본인이 소유한 도메인으로 변경하고 DNS를 연결하세요.
# default Namespace에 app-service:80과 Ready 백엔드가 이미 있다고 가정합니다.
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-https
  namespace: default
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-staging
spec:
  ingressClassName: public
  tls:
    - hosts:
        - app.example.com
      secretName: app-example-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: app-service
                port:
                  number: 80`;

export const CERTIFICATE_YAML = `# ingress-shim이 자동 생성하는 Certificate의 주요 필드입니다.
# 위 Ingress 방식에서는 이 객체를 별도로 apply할 필요가 없습니다.
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: app-example-tls
  namespace: default
spec:
  secretName: app-example-tls
  dnsNames:
    - app.example.com
  issuerRef:
    name: letsencrypt-staging
    kind: ClusterIssuer
    group: cert-manager.io`;

export const CERT_MANAGER_EXAMPLES = {
  normal: { label: "정상 발급 · HTTPS · 자동 갱신" },
  "no-cert-manager": { label: "cert-manager 미설치" },
  "issuer-not-ready": { label: "ClusterIssuer 준비 실패" },
  "http01-failed": { label: "DNS / HTTP-01 검증 실패" },
};

type CertManagerStep = LearningClusterStep & { activeConcepts: string[]; tlsReady: boolean };
type LessonRow = Pick<CertManagerStep,
  "title" | "actor" | "action" | "reason" | "result" | "k8sMechanism" | "cliLogs" | "activeConcepts"
>;
const rows: LessonRow[] = [
  {
    title: "설치·도메인·진입 주소 준비", actor: "관리자 / DNS",
    action: "cert-manager와 Ingress Controller를 설치하고 도메인의 DNS를 외부 진입 주소에 연결합니다.",
    reason: "발급 자동화와 외부 도메인 검증이 가능하도록", result: "사전 조건 확인 · 아직 TLS Secret 없음",
    k8sMechanism: "cert-manager와 Ingress Controller는 별도 구성 요소입니다. HTTP-01은 인터넷에서 도메인의 80번 포트에 접근할 수 있어야 합니다. app.example.com과 public은 예시이므로 소유 도메인과 실제 IngressClass로 바꿉니다.",
    cliLogs: [{ command: "kubectl get pods -n cert-manager\nkubectl get ingressclass\nkubectl get service app-service -n default", output: ["cert-manager / webhook / cainjector: Running (예시)", "IngressClass: public (설치된 Controller가 처리)", "app-service:80과 Ready 백엔드는 사전에 준비한 상태"] }],
    activeConcepts: ["manager", "controller"],
  },
  {
    title: "ClusterIssuer 등록과 ACME 계정 준비", actor: "cert-manager / Let’s Encrypt",
    action: "ClusterIssuer의 ACME 서버·이메일·검증 방법을 읽고 ACME 계정을 준비합니다.",
    reason: "어느 인증기관에 어떤 방식으로 발급을 요청할지 정하기 위해", result: "letsencrypt-staging Ready=True",
    k8sMechanism: "ClusterIssuer는 클러스터 범위, Issuer는 Namespace 범위입니다. Issuer를 쓰면 Ingress와 같은 Namespace에 두고 cert-manager.io/issuer를 사용합니다. privateKeySecretRef는 ACME 계정 키이며, 사이트의 TLS Secret과 다릅니다. ClusterIssuer의 계정 Secret은 기본적으로 cert-manager Namespace에 저장되며 cluster-resource-namespace 설정에 따릅니다.",
    cliLogs: [{ command: "kubectl apply -f cluster-issuer.yaml\nkubectl get clusterissuer letsencrypt-staging", output: ["clusterissuer.cert-manager.io/letsencrypt-staging created", "NAME                  READY", "letsencrypt-staging    True"] }],
    activeConcepts: ["issuer", "manager", "ca"],
  },
  {
    title: "TLS 설정이 있는 Ingress 생성", actor: "사용자 / API Server",
    action: "발급자 annotation, tls.hosts와 tls.secretName을 포함한 Ingress를 등록합니다.",
    reason: "라우팅 규칙과 사용할 인증서의 도메인·저장 위치를 선언하기 위해", result: "Ingress app-https 생성 · 발급은 아직 진행 전",
    k8sMechanism: "rules.host와 tls.hosts를 같은 도메인으로 맞춥니다. secretName을 적는 것만으로 인증서가 만들어지지는 않습니다. ingress-shim이 annotation을 감지해야 합니다. app-service와 Ingress는 같은 Namespace에 있습니다.",
    cliLogs: [{ command: "kubectl apply -f ingress.yaml\nkubectl describe ingress app-https -n default", output: ["ingress.networking.k8s.io/app-https created", "Host: app.example.com / TLS Secret: app-example-tls", "이 시점에는 신뢰할 수 있는 사이트 인증서가 아직 준비되지 않았습니다."] }],
    activeConcepts: ["ingress"],
  },
  {
    title: "ingress-shim이 Certificate 자동 생성", actor: "cert-manager의 ingress-shim",
    action: "Ingress를 보고 같은 Namespace에 Certificate를 생성합니다.",
    reason: "원하는 인증서의 도메인·발급자·Secret을 지속적으로 관리하기 위해", result: "Certificate app-example-tls · Ready=False",
    k8sMechanism: "Certificate에는 dnsNames, issuerRef, secretName이 기록됩니다. Ingress annotation을 사용한 예시에서는 Certificate를 수동으로 중복 생성하지 않습니다.",
    cliLogs: [{ command: "kubectl get certificate app-example-tls -n default", output: ["NAME              READY   SECRET", "app-example-tls   False   app-example-tls"] }],
    activeConcepts: ["ingress", "manager", "certificate"],
  },
  {
    title: "서명 요청과 Order·Challenge 생성", actor: "cert-manager의 인증서 / ACME 컨트롤러",
    action: "개인 키와 CSR을 준비하고 CertificateRequest, ACME Order와 Challenge를 만듭니다.",
    reason: "인증기관에 서명을 요청하고 도메인 소유권 검증을 시작하기 위해", result: "Order pending · Challenge pending",
    k8sMechanism: "CertificateRequest는 인증서 서명 요청, Order는 ACME 발급 주문, Challenge는 도메인 검증 작업입니다. 개인 키는 클러스터에서 관리하고 인증기관에는 CSR을 보냅니다. 승인된 요청을 ACME issuer가 처리합니다.",
    cliLogs: [{ command: "kubectl get certificaterequest,order,challenge -n default", output: ["CertificateRequest app-example-tls-1: Ready=False", "Order app-example-tls-order: pending", "Challenge app-example-tls-http01: pending", "리소스 이름은 설명용 예시이며 실제 생성 이름은 달라집니다."] }],
    activeConcepts: ["certificate", "request", "ca"],
  },
  {
    title: "HTTP-01로 도메인 소유권 검증", actor: "cert-manager solver / Let’s Encrypt",
    action: "임시 solver Pod·Service·Ingress를 준비하고 도메인의 검증 URL에 응답합니다.",
    reason: "요청자가 도메인을 제어한다는 사실을 인증기관이 확인하도록", result: "HTTP-01 Challenge valid",
    k8sMechanism: "cert-manager의 자체 점검 후 Let’s Encrypt가 http://app.example.com/.well-known/acme-challenge/<token>을 검증합니다. 요청은 Ingress Controller를 통해 solver에 전달되며 앱의 / 경로와 별개입니다. DNS, 방화벽의 80번 포트, solver IngressClass와 네트워크 접근성을 확인합니다. 와일드카드 인증서는 DNS-01을 사용합니다.",
    cliLogs: [{ command: "kubectl describe challenge app-example-tls-http01 -n default", output: ["Type: HTTP-01 / State: valid", "임시 solver 경로에서 올바른 검증 응답 확인"] }],
    activeConcepts: ["ca", "controller", "solver"],
  },
  {
    title: "인증서 발급과 TLS Secret 저장", actor: "Let’s Encrypt / cert-manager / API Server",
    action: "인증기관이 서명한 인증서와 개인 키를 app-example-tls Secret에 저장합니다.",
    reason: "Ingress Controller가 인증서와 키를 읽을 수 있도록", result: "Certificate Ready=True · kubernetes.io/tls Secret 생성",
    k8sMechanism: "Secret의 tls.crt는 인증서 체인, tls.key는 개인 키입니다. Ingress·Certificate·TLS Secret은 같은 Namespace에 있습니다. Secret은 API Server를 통해 저장하며 실제 개인 키를 로그나 예제에 출력하지 않습니다. 완료된 HTTP-01 solver 리소스는 정리됩니다.",
    cliLogs: [{ command: "kubectl get certificate app-example-tls -n default\nkubectl get secret app-example-tls -n default", output: ["app-example-tls   Ready=True", "app-example-tls   kubernetes.io/tls   DATA=2", "staging 인증서는 브라우저의 공개 신뢰 대상이 아닙니다."] }],
    activeConcepts: ["ca", "manager", "secret"],
  },
  {
    title: "Controller가 인증서를 읽고 HTTPS 처리", actor: "브라우저 / Ingress Controller / 앱",
    action: "Ingress Controller가 TLS Secret을 반영하고 443번 포트에서 TLS를 종료해 앱으로 전달합니다.",
    reason: "브라우저와 외부 진입점 사이의 통신을 암호화하기 위해", result: "HTTPS → Ingress Controller → app-service → Ready Pod",
    k8sMechanism: "이 예시는 Controller에서 TLS를 종료하고 백엔드에는 HTTP로 전달합니다. 앱까지 암호화하려면 별도 백엔드 TLS 설정이 필요합니다. 공개 브라우저 신뢰를 확인하려면 production 발급자로 전환해 재발급해야 합니다. HTTP → HTTPS 리다이렉트는 Controller별 별도 설정입니다.",
    cliLogs: [{ command: "curl -I https://app.example.com", output: ["staging 예시: 공개 신뢰 저장소에서는 인증서 검증 실패가 예상됩니다.", "production 인증서 발급·반영 후: 인증서 검증 성공 및 앱 응답 확인", "HTTPS 상태 코드는 앱과 Controller 설정에 따라 달라집니다."] }],
    activeConcepts: ["browser", "controller", "secret", "app"],
  },
  {
    title: "만료 전 자동 갱신과 Secret 반영", actor: "cert-manager / Ingress Controller",
    action: "갱신 시점에 새 인증서를 발급받아 같은 TLS Secret을 갱신합니다.",
    reason: "인증서가 만료되기 전에 HTTPS 서비스를 유지하기 위해", result: "새 인증서 → 같은 Secret → Controller 반영",
    k8sMechanism: "status.renewalTime에 맞춰 재발급하며 필요하면 도메인을 다시 검증합니다. 갱신에도 DNS와 solver 경로, 발급자가 정상이어야 합니다. Controller가 Secret 변경을 반영하는 방식과 지연은 구현에 따릅니다. 갱신 실패 시 기존 인증서는 만료 전까지 사용할 수 있지만 자동 갱신 성공을 보장하지는 않습니다.",
    cliLogs: [{ command: "kubectl describe certificate app-example-tls -n default", output: ["Ready: True / Revision: 2 (갱신 완료 예시)", "Not After / Renewal Time: 실제 Certificate의 status에서 확인", "Secret 이름 app-example-tls 유지 · 새 인증서로 갱신"] }],
    activeConcepts: ["certificate", "manager", "ca", "secret", "controller"],
  },
];

function resource(kind: EtcdRecord["type"], name: string, data: EtcdRecord["data"], index: number): EtcdRecord {
  return {
    key: `${kind === "ClusterIssuer" ? "클러스터 범위" : "default"}/${kind}/${name}`,
    type: kind, action: "unchanged", revision: 5100 + index,
    data: { apiVersion: kind === "Ingress" ? "networking.k8s.io/v1" : kind === "Secret" ? "v1" : kind === "Order" || kind === "Challenge" ? "acme.cert-manager.io/v1" : "cert-manager.io/v1", kind, metadata: { name, ...(kind === "ClusterIssuer" ? {} : { namespace: "default" }) }, ...data },
  };
}

function recordsAt(index: number): EtcdRecord[] {
  const records: EtcdRecord[] = [];
  if (index >= 1) records.push(resource("ClusterIssuer", "letsencrypt-staging", {
    spec: { acme: { server: "https://acme-staging-v02.api.letsencrypt.org/directory", email: "admin@example.com", privateKeySecretRef: { name: "letsencrypt-staging-account-key" }, solvers: [{ http01: { ingress: { ingressClassName: "public" } } }] } },
    status: { conditions: [{ type: "Ready", status: "True" }] },
  }, index));
  if (index >= 2) records.push(resource("Ingress", "app-https", {
    metadata: { name: "app-https", namespace: "default", annotations: { "cert-manager.io/cluster-issuer": "letsencrypt-staging" } },
    spec: { ingressClassName: "public", tls: [{ hosts: ["app.example.com"], secretName: "app-example-tls" }], rules: [{ host: "app.example.com", http: { paths: [{ path: "/", pathType: "Prefix", backend: { service: { name: "app-service", port: { number: 80 } } } }] } }] },
  }, index));
  if (index >= 3) records.push(resource("Certificate", "app-example-tls", {
    spec: { secretName: "app-example-tls", dnsNames: ["app.example.com"], issuerRef: { name: "letsencrypt-staging", kind: "ClusterIssuer", group: "cert-manager.io" } },
    status: { conditions: [{ type: "Ready", status: index >= 6 ? "True" : "False" }], revision: index >= 8 ? 2 : index >= 6 ? 1 : 0 },
  }, index));
  if (index >= 4) {
    records.push(resource("CertificateRequest", index >= 8 ? "app-example-tls-2" : "app-example-tls-1", {
      spec: { request: "<CSR 생략>", issuerRef: { name: "letsencrypt-staging", kind: "ClusterIssuer", group: "cert-manager.io" } },
      status: { conditions: [{ type: "Approved", status: "True" }, { type: "Ready", status: index >= 6 ? "True" : "False" }] },
    }, index));
    records.push(resource("Order", "app-example-tls-order", { status: { state: index >= 6 ? "valid" : "pending" } }, index));
    if (index < 6) records.push(resource("Challenge", "app-example-tls-http01", { spec: { type: "HTTP-01", dnsName: "app.example.com" }, status: { state: index >= 5 ? "valid" : "pending" } }, index));
  }
  if (index >= 6) records.push(resource("Secret", "app-example-tls", {
    type: "kubernetes.io/tls", data: { "tls.crt": "<인증서 체인 생략>", "tls.key": "<개인 키 생략>" },
  }, index));
  return records;
}

export const CERT_MANAGER_STEPS: CertManagerStep[] = rows.map((row, index) => ({
  ...row, id: `cert-manager-${index}`, stepNumber: index + 1,
  subTitle: "HTTPS 인증서 발급 · HTTP-01 예시", summary: row.action,
  description: `${row.action} ${row.result}`, activeComponents: [], packets: [], podsState: [],
  tlsReady: index >= 6, sources: CERT_MANAGER_SOURCES,
  etcdState: { revision: 5100 + index, raftTerm: 3, records: recordsAt(index) },
}));

const failures = {
  "no-cert-manager": { index: 0, title: "cert-manager 미설치로 발급 시작 불가", actor: "관리자", message: "cert-manager CRD와 컨트롤러가 없으면 ClusterIssuer를 등록할 수 없고 ingress-shim의 Certificate 자동 생성도 동작하지 않습니다.", command: "kubectl apply -f cluster-issuer.yaml", output: "no matches for kind ClusterIssuer in version cert-manager.io/v1", active: ["manager"] },
  "issuer-not-ready": { index: 1, title: "ClusterIssuer Ready=False", actor: "cert-manager / ACME 서버", message: "ACME 계정 준비에 실패했습니다. ClusterIssuer Events와 서버 URL·이메일·외부 통신을 확인하고 Ready=True가 된 뒤 발급을 진행합니다.", command: "kubectl describe clusterissuer letsencrypt-staging", output: "Ready=False · ACME 계정 등록 실패 예시", active: ["issuer", "ca"] },
  "http01-failed": { index: 5, title: "HTTP-01 검증 대기 · 인증서 미발급", actor: "cert-manager solver / DNS / 네트워크", message: "도메인의 DNS나 80번 포트, solver의 IngressClass가 맞지 않으면 검증이 진행되지 않습니다. Challenge Events와 공개 검증 경로를 확인합니다.", command: "kubectl describe challenge app-example-tls-http01 -n default", output: "State=pending · Waiting for HTTP-01 challenge propagation · self-check 실패 예시", active: ["ca", "controller", "solver"] },
};

export function certManagerSteps(example: string): CertManagerStep[] {
  const failure = failures[example as keyof typeof failures];
  if (!failure) return CERT_MANAGER_STEPS;
  const records = recordsAt(failure.index);
  for (const record of records) {
    if (record.type === "ClusterIssuer" && example === "issuer-not-ready") record.data.status.conditions[0].status = "False";
    if (record.type === "Challenge") record.data.status.state = "pending";
  }
  const step: CertManagerStep = {
    ...CERT_MANAGER_STEPS[failure.index], title: failure.title, actor: failure.actor,
    action: failure.message, summary: failure.message, description: failure.message,
    reason: "실패한 사전 조건을 해결해야 인증서를 발급받을 수 있기 때문",
    result: "TLS Secret 없음 · HTTPS 인증서 준비 실패", k8sMechanism: failure.message,
    activeConcepts: failure.active, tlsReady: false,
    cliLogs: [{ command: failure.command, output: [failure.output, "TLS Secret app-example-tls: 아직 없음"] }],
    etcdState: { revision: 5200 + failure.index, raftTerm: 3, records },
  };
  return [...CERT_MANAGER_STEPS.slice(0, failure.index), step];
}
