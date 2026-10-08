import { useEffect, useRef, useState } from "react";
import { Background, Controls, Handle, MarkerType, MiniMap, Position, ReactFlow, useNodesState } from "@xyflow/react";
import type { Edge, Node, NodeProps, ReactFlowInstance } from "@xyflow/react";
import { CERT_MANAGER_EXAMPLES, CERT_MANAGER_SOURCES, CERTIFICATE_YAML, CLUSTER_ISSUER_YAML, TLS_INGRESS_YAML } from "../../data/certManagerSteps";
import { LearningSnippet } from "./LearningSnippet";

const concepts = [
  { id: "issuer", label: "ClusterIssuer", text: "인증기관·ACME 계정·검증 방법을 정의합니다. 클러스터 범위이며, Ingress가 annotation으로 선택합니다.", x: 290, y: 0 },
  { id: "ingress", label: "Ingress · Host / TLS", text: "사이트 도메인과 TLS Secret 이름, 앱 라우팅을 선언합니다. Certificate를 자동 생성할 발급자를 annotation에 지정합니다.", x: 0, y: 180 },
  { id: "manager", label: "cert-manager", text: "별도 설치하는 컨트롤러입니다. ingress-shim으로 Certificate를 만들고 발급·Secret 저장·갱신을 조정합니다. 앱의 HTTPS 요청을 중계하지 않습니다.", x: 290, y: 180 },
  { id: "certificate", label: "Certificate", text: "원하는 인증서의 dnsNames·issuerRef·secretName과 Ready, 만료·갱신 상태를 관리하는 API 리소스입니다.", x: 580, y: 180 },
  { id: "request", label: "CertificateRequest / Order", text: "CSR 서명 요청과 ACME 발급 주문입니다. Challenge로 도메인 소유권을 검증한 후 인증기관이 서명합니다.", x: 580, y: 390 },
  { id: "ca", label: "Let’s Encrypt · 인증기관", text: "ACME 프로토콜로 도메인 검증 후 인증서에 서명합니다. staging은 테스트용이며 공개 브라우저가 신뢰하지 않습니다.", x: 290, y: 390 },
  { id: "solver", label: "HTTP-01 solver", text: "임시 Pod·Service·Ingress로 검증 토큰에 응답합니다. 인증기관은 80번 포트의 검증 URL에 접근하며 Ingress Controller가 solver로 전달합니다.", x: 0, y: 390 },
  { id: "secret", label: "TLS Secret · tls.crt / tls.key", text: "발급된 인증서 체인과 개인 키를 저장합니다. Ingress와 같은 Namespace에 두며 ACME 계정 키 Secret과 구별합니다.", x: 290, y: 600 },
  { id: "controller", label: "Ingress Controller", text: "Ingress 규칙과 TLS Secret을 읽고 프록시에 반영합니다. 이 예시에서는 TLS를 종료한 뒤 Service의 Ready 백엔드에 HTTP로 전달합니다.", x: 0, y: 600 },
  { id: "browser", label: "브라우저 · HTTPS :443", text: "인증서의 도메인·유효기간·신뢰 체인을 검증하고 TLS 연결을 맺습니다. staging 인증서는 경고가 예상됩니다.", x: 0, y: 810 },
  { id: "app", label: "app-service → Ready Pod", text: "Ingress의 backend가 가리키는 앱입니다. 인증서 발급과 별개로 Service의 포트와 Ready 백엔드가 준비되어 있어야 합니다.", x: 290, y: 810 },
];
const initialNodes: Node[] = concepts.map(({ id, label, x, y }) => ({
  id, type: "certificateResource", position: { x, y }, data: { label },
  style: { width: 220, minHeight: 65, padding: 16, borderRadius: 12, background: "#0f172a", color: "#e2e8f0", border: "1px solid #475569", fontSize: 13 },
}));
const relations: [string, string, string, boolean?][] = [
  ["issuer", "manager", "발급 설정", true],
  ["ingress", "manager", "annotation 감지"],
  ["manager", "certificate", "자동 생성"],
  ["certificate", "request", "CSR / 주문"],
  ["request", "ca", "ACME 요청"],
  ["ca", "solver", "HTTP-01 :80 검증"],
  ["manager", "secret", "발급 후 API로 저장"],
  ["secret", "controller", "인증서 반영", true],
  ["browser", "controller", "HTTPS :443"],
  ["controller", "app", "TLS 종료 후 HTTP"],
];
const ports = [
  ["bottom", "top"], ["right", "left"], ["right", "left"],
  ["bottom", "top"], ["left", "right"], ["left", "right"],
  ["right", "right"], ["left", "right"], ["top", "bottom"], ["bottom", "top"],
];
function CertificateResourceNode({ data }: NodeProps) {
  return (
    <div className="text-center" aria-label={String(data.label)}>
      {String(data.label)}
      {([["top", Position.Top], ["right", Position.Right], ["bottom", Position.Bottom], ["left", Position.Left]] as const).map(([side, position]) => (
        <span key={side}>
          <Handle type="source" id={`out-${side}`} position={position} isConnectable={false} />
          <Handle type="target" id={`in-${side}`} position={position} isConnectable={false} />
        </span>
      ))}
    </div>
  );
}
const NODE_TYPES = { certificateResource: CertificateResourceNode };

export function CertManagerLesson({ example, tlsReady, onExampleChange }: {
  example: string;
  tlsReady: boolean;
  onExampleChange: (example: string) => void;
}) {
  return (
    <section className="learning-panel space-y-4">
      <label className="flex flex-wrap items-center gap-3 text-sm">
        인증서 발급 조건
        <select aria-label="인증서 발급 조건" className="learning-button max-w-full" value={example} onChange={(event) => onExampleChange(event.target.value)}>
          {Object.entries(CERT_MANAGER_EXAMPLES).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
        </select>
      </label>
      <div className="grid sm:grid-cols-3 gap-3 text-sm leading-7">
        <div className="rounded-lg bg-slate-900 p-3"><h2 className="font-bold text-blue-200">1. 사전 준비</h2><p>cert-manager와 HTTP-01을 지원하는 Ingress Controller를 별도로 설치합니다. 도메인 DNS, 외부 80·443 포트, 앱 Service와 Ready 백엔드를 준비합니다.</p></div>
        <div className="rounded-lg bg-slate-900 p-3"><h2 className="font-bold text-blue-200">2. 자동 발급</h2><p>ClusterIssuer와 TLS Ingress를 등록하면 Certificate·서명 요청·도메인 검증이 이어집니다. cert-manager가 발급받고 인증기관이 서명합니다.</p></div>
        <div className="rounded-lg bg-slate-900 p-3"><h2 className="font-bold text-blue-200">3. HTTPS와 갱신</h2><p>Controller가 TLS Secret을 읽어 HTTPS를 처리합니다. cert-manager는 만료 전에 재발급하고 같은 Secret을 갱신합니다.</p></div>
      </div>
      <p data-testid="certificate-tls-state" className={`rounded-lg border p-3 text-sm ${tlsReady ? "border-emerald-700 text-emerald-200" : "border-slate-700 text-slate-300"}`}>
        {tlsReady ? "현재 단계: TLS Secret 준비 완료 · staging 인증서라 브라우저 신뢰 경고는 예상됩니다." : "현재 단계: TLS Secret 준비 전 · Ingress 생성만으로 HTTPS 인증서가 준비되지는 않습니다."}
      </p>
      <p className="text-xs text-amber-200 leading-6">예시는 Let’s Encrypt staging을 사용합니다. 발급 흐름 확인 후 운영 발급자로 전환하세요. public은 실제 IngressClass 이름으로, app.example.com은 소유 도메인으로 바꿉니다. HTTP-01은 단일 도메인 예시이며 와일드카드 인증서는 DNS-01이 필요합니다.</p>
    </section>
  );
}

export function CertManagerCanvas({ active }: { active: string[] }) {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [selected, setSelected] = useState(concepts[2]);
  const flowRef = useRef<ReactFlowInstance | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => flowRef.current?.fitView({ padding: 0.16 }));
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  const visibleNodes: Node[] = nodes.map((node) => ({
    ...node,
    style: { ...node.style, border: `2px solid ${selected.id === node.id ? "#fbbf24" : active.includes(node.id) ? "#38bdf8" : "#475569"}`, background: active.includes(node.id) ? "#0c2943" : "#0f172a" },
  }));
  const edges: Edge[] = relations.map(([source, target, label, dashed], index) => ({
    id: `cert-relation-${index}`, source, target, label, type: "smoothstep",
    sourceHandle: `out-${ports[index][0]}`, targetHandle: `in-${ports[index][1]}`,
    animated: !dashed && active.includes(source) && active.includes(target),
    markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
    style: { stroke: "#94a3b8", strokeDasharray: dashed ? "5 4" : undefined },
    labelStyle: { fill: "#cbd5e1", fontSize: 11 }, labelBgStyle: { fill: "#0f172a" },
  }));
  return (
    <section className="space-y-3 min-w-0">
      <div ref={containerRef} className="h-[480px] sm:h-[640px] rounded-xl border border-slate-700 overflow-hidden" aria-label="인증서 발급과 HTTPS 연결 구성도">
        <ReactFlow nodes={visibleNodes} edges={edges} nodeTypes={NODE_TYPES} onNodesChange={onNodesChange} onInit={(instance) => { flowRef.current = instance; }} onNodeClick={(_, node) => { const concept = concepts.find((item) => item.id === node.id); if (concept) setSelected(concept); }} nodesConnectable={false} fitView fitViewOptions={{ padding: 0.16 }} minZoom={0.2} maxZoom={2}>
          <Background color="#334155" />
          <Controls />
          <MiniMap position="bottom-left" className="hidden sm:block" style={{ width: 110, height: 66, left: 45 }} nodeColor="#334155" maskColor="#0f172aaa" pannable zoomable />
        </ReactFlow>
      </div>
      <div className="learning-panel space-y-3">
        <p className="text-xs text-slate-400">파란 테두리: 현재 단계 · 노란 테두리: 선택한 구성 요소 · 점선: 설정 참조. 관리 리소스 읽기·쓰기는 API Server를 거칩니다.</p>
        <div role="group" aria-label="인증서 구성 요소 선택" className="flex flex-wrap gap-2">
          {concepts.map((concept) => <button key={concept.id} className="learning-button" aria-pressed={selected.id === concept.id} onClick={() => setSelected(concept)}>{concept.label}</button>)}
        </div>
        <h3 className="font-bold text-blue-200">{selected.label}</h3>
        <p className="text-sm leading-7 text-slate-300">{selected.text}</p>
        <p className="text-xs text-slate-400">발급 경로: Ingress → cert-manager → Certificate → ACME 요청·도메인 검증 → TLS Secret. 사용자 요청: 브라우저 → Ingress Controller → 앱.</p>
      </div>
    </section>
  );
}

export function CertManagerYaml() {
  return (
    <div className="space-y-3">
      <LearningSnippet title="1. cluster-issuer.yaml · staging 발급자" code={CLUSTER_ISSUER_YAML} />
      <LearningSnippet title="2. ingress.yaml · HTTPS와 인증서 자동 요청" code={TLS_INGRESS_YAML} />
      <LearningSnippet title="3. 자동 생성되는 Certificate · 주요 필드" code={CERTIFICATE_YAML} />
      <LearningSnippet title="등록 순서와 상태 확인 · 실제 환경에서 직접 실행하는 명령" code={`kubectl apply -f cluster-issuer.yaml
kubectl wait --for=condition=Ready clusterissuer/letsencrypt-staging --timeout=120s
kubectl apply -f ingress.yaml
kubectl get certificate,certificaterequest,order,challenge -n default
kubectl describe certificate app-example-tls -n default
kubectl get secret app-example-tls -n default
# Certificate가 생성된 뒤 준비 상태 확인
kubectl wait --for=condition=Ready certificate/app-example-tls -n default --timeout=300s`} />
      <details className="learning-details">
        <summary>staging 확인 후 운영 인증서로 전환</summary>
        <p className="text-sm leading-7 mb-3">새 ClusterIssuer의 이름을 letsencrypt-prod로, ACME 서버를 https://acme-v02.api.letsencrypt.org/directory로, 계정 Secret 이름을 letsencrypt-prod-account-key로 바꿔 등록합니다. Ready=True를 확인한 뒤 Ingress의 발급자 annotation을 변경하면 재발급됩니다. 실제 인증서의 발급자와 Controller 반영까지 확인하세요.</p>
        <LearningSnippet title="운영 발급자 준비 후 Ingress 전환" code={`# 위 설명대로 작성한 운영 발급자 파일
kubectl apply -f cluster-issuer-prod.yaml
kubectl wait --for=condition=Ready clusterissuer/letsencrypt-prod --timeout=120s
kubectl annotate ingress app-https -n default cert-manager.io/cluster-issuer=letsencrypt-prod --overwrite
kubectl describe certificate app-example-tls -n default
# 재발급 완료 및 Controller 반영 후 브라우저 또는 curl로 신뢰 체인 확인
curl -I https://app.example.com`} />
      </details>
      <div className="flex flex-wrap gap-3 text-xs text-blue-400 underline">
        {CERT_MANAGER_SOURCES.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer">{["Ingress 자동 인증서", "HTTP-01 설정", "Certificate와 갱신", "Let’s Encrypt 검증 방식"][index]} ↗</a>)}
      </div>
    </div>
  );
}
