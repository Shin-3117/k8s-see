import { useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  Node,
  Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { LearningPageId, pageHref, sourceUrl } from "../../data/learningPages";
interface Concept {
  id: string;
  label: string;
  text: string;
  related: LearningPageId;
  component?: string;
}
const overview: Concept[] = [
  {
    id: "api",
    label: "kube-apiserver",
    text: "Kubernetes API의 인증·인가·Admission과 리소스 조회·변경을 처리합니다. 앱 패킷의 프록시가 아닙니다.",
    related: "pod-creation",
  },
  {
    id: "etcd",
    label: "etcd · 상태 저장",
    text: "클러스터 리소스의 사양과 상태를 저장합니다. 앱 데이터 볼륨과는 별개입니다.",
    related: "resource-relations",
  },
  {
    id: "scheduler",
    label: "Scheduler · 노드 선택",
    text: "미배정 Pod에 적합한 노드를 선택하고 API에 배정을 기록합니다.",
    related: "pod-creation",
  },
  {
    id: "controller",
    label: "Controller · 상태 조정",
    text: "Deployment·ReplicaSet 등이 필요한 수의 Pod 객체를 생성합니다.",
    related: "pod-creation",
  },
  {
    id: "kubelet",
    label: "kubelet · 노드 실행 관리",
    text: "자기 노드에 배정된 Pod를 감지해 런타임을 호출하고 상태와 프로브 결과를 보고합니다.",
    related: "pod-lifecycle",
  },
  {
    id: "runtime",
    label: "Runtime · 컨테이너 실행",
    text: "CRI 요청에 따라 이미지·sandbox·컨테이너를 준비합니다.",
    related: "pod-internals",
  },
  {
    id: "pod",
    label: "Pod · 앱 컨테이너",
    text: "같은 Pod의 컨테이너는 공유 네트워크 공간을 사용합니다.",
    related: "pod-internals",
  },
  {
    id: "cni",
    label: "CNI · Pod 네트워크",
    text: "Pod의 연결·IP·라우팅을 구성합니다. 오버레이·직접 라우팅 등 구현이 다양합니다.",
    related: "service-networking",
  },
  {
    id: "dns",
    label: "CoreDNS · 이름 해석",
    text: "Service 이름 등을 IP로 해석하는 DNS입니다. 보통 Pod로 실행됩니다.",
    related: "service-networking",
  },
  {
    id: "proxy",
    label: "Service 구현 · 전달 규칙",
    text: "kube-proxy 또는 대체 구현이 Service와 EndpointSlice를 기반으로 데이터 경로를 구성합니다.",
    related: "service-networking",
  },
];
const resources: Concept[] = [
  {
    id: "deployment",
    label: "Deployment",
    text: "배포·업데이트를 관리하고 ReplicaSet으로 복제본을 유지합니다.",
    related: "pod-creation",
  },
  {
    id: "replicaset",
    label: "ReplicaSet",
    text: "원하는 수의 Pod를 유지합니다.",
    related: "pod-creation",
  },
  {
    id: "pod",
    label: "Pod",
    text: "Node에 배정되는 컨테이너 실행 단위입니다.",
    related: "pod-internals",
  },
  {
    id: "config",
    label: "ConfigMap / Secret",
    text: "같은 Namespace의 설정·민감한 데이터를 환경변수나 파일로 제공합니다. Secret 저장 시 암호화는 클러스터 설정에 따릅니다.",
    related: "resource-relations",
  },
  {
    id: "service",
    label: "Service",
    text: "보통 label selector로 Pod를 선택합니다. Service 자체는 Pod를 생성하지 않습니다.",
    related: "service-networking",
  },
  {
    id: "sa",
    label: "ServiceAccount",
    text: "Pod가 API에 접근할 때 사용하는 신원입니다. 지정만으로 권한을 부여하지 않습니다.",
    related: "resource-relations",
  },
  {
    id: "rbac",
    label: "Role / Binding",
    text: "Role/ClusterRole이 권한을 정의하고 RoleBinding/ClusterRoleBinding이 신원과 연결합니다.",
    related: "resource-relations",
  },
  {
    id: "namespace",
    label: "Namespace",
    text: "이름과 정책의 논리적 범위를 구분합니다. 물리적인 노드가 아닙니다.",
    related: "resource-relations",
  },
  {
    id: "pvc",
    label: "PVC → PV → 저장소",
    text: "Pod가 PVC를 참조하고 PV가 실제 저장소를 연결합니다. 다음 페이지에서 생성·마운트를 살펴봅니다.",
    related: "persistent-storage",
  },
];
const networking: Concept[] = [
  {
    id: "client",
    label: "클라이언트 Pod",
    text: "같은 Pod는 localhost, 다른 Pod는 Pod IP, 안정적인 접근은 Service 이름을 사용합니다.",
    related: "pod-internals",
  },
  {
    id: "dns",
    label: "CoreDNS · DNS 조회",
    text: "일반 ClusterIP Service 이름에 대해 ClusterIP를 반환합니다. 실제 앱 요청과 별도 통신입니다.",
    related: "service-networking",
  },
  {
    id: "service",
    label: "Service · ClusterIP",
    text: "고정된 가상 주소와 포트를 정의하는 API 리소스입니다. 독립 프록시 컨테이너가 아닙니다.",
    related: "service-networking",
  },
  {
    id: "rules",
    label: "kube-proxy / 대체 구현",
    text: "Service·EndpointSlice 정보를 읽어 커널/eBPF 등의 전달 규칙을 구성합니다.",
    related: "service-networking",
  },
  {
    id: "path",
    label: "노드 데이터 경로",
    text: "실제 패킷은 커널 네트워크/eBPF 등의 경로에서 백엔드로 전달됩니다. API Server와 pause를 통과하지 않습니다.",
    related: "service-networking",
  },
  {
    id: "cni",
    label: "CNI · 연결 / 라우팅",
    text: "Pod 연결과 노드 간 라우팅을 구성합니다. 네트워크 제품에 따라 Service 처리도 통합합니다.",
    related: "service-networking",
  },
  {
    id: "a",
    label: "Ready Pod A",
    text: "Service의 준비된 백엔드입니다. 선택된 한 Pod가 요청을 처리합니다.",
    related: "pod-lifecycle",
  },
  {
    id: "b",
    label: "Ready Pod B",
    text: "복제본이 교체되어도 Service 주소는 유지됩니다.",
    related: "pod-lifecycle",
  },
];
const definitions = { overview, resources, networking };
const connections: Record<
  keyof typeof definitions,
  [string, string, string, boolean?][]
> = {
  overview: [
    ["api", "etcd", "리소스 저장"],
    ["scheduler", "api", "배정 기록"],
    ["controller", "api", "상태 조정"],
    ["api", "kubelet", "사양 / 상태"],
    ["kubelet", "runtime", "CRI"],
    ["runtime", "pod", "실행"],
    ["runtime", "cni", "연결 요청"],
    ["api", "proxy", "Service 감시", true],
  ],
  resources: [
    ["deployment", "replicaset", "관리"],
    ["replicaset", "pod", "복제본 유지"],
    ["config", "pod", "환경변수 / 파일", true],
    ["service", "pod", "selector", true],
    ["sa", "pod", "API 신원", true],
    ["rbac", "sa", "권한 연결", true],
    ["namespace", "config", "논리적 범위", true],
    ["pod", "pvc", "볼륨 사용", true],
  ],
  networking: [
    ["client", "dns", "DNS 조회 패킷"],
    ["dns", "client", "DNS: ClusterIP 응답"],
    ["client", "service", "앱 요청: ClusterIP"],
    ["service", "path", "가상 주소의 실제 전달"],
    ["rules", "path", "전달 규칙 구성", true],
    ["cni", "path", "라우팅 구성", true],
    ["path", "a", "선택된 백엔드"],
    ["path", "b", "다른 요청의 백엔드"],
  ],
};
function Boundary({ data }: { data: { label: string } }) {
  return (
    <div className="text-sm font-bold text-slate-300 px-3 py-2">
      {data.label}
    </div>
  );
}
const NODE_TYPES = { boundary: Boundary };
function template(variant: keyof typeof definitions): Node[] {
  const nodes: Node[] = definitions[variant].map((c, i) => ({
    id: c.id,
    position: { x: (i % 3) * 260, y: Math.floor(i / 3) * 145 },
    data: { label: c.label },
    style: {
      background: "#0f172a",
      color: "#e2e8f0",
      border: "1px solid #475569",
      borderRadius: 12,
      width: 220,
      padding: 18,
    },
  }));
  if (variant === "overview") {
    const group = (id: string, label: string, x: number): Node => ({
      id,
      type: "boundary",
      position: { x, y: 0 },
      data: { label },
      style: {
        width: 490,
        height: 475,
        background: "#1e293b44",
        border: "1px dashed #64748b",
        color: "#cbd5e1",
        padding: 10,
      },
    });
    return [
      group("control-plane", "Control Plane · 상태 관리", 0),
      group("worker", "Worker Node · 실행 / 네트워크", 530),
      ...nodes.map((n, i) => ({
        ...n,
        parentId: i < 4 ? "control-plane" : "worker",
        extent: "parent" as const,
        position: {
          x: ((i < 4 ? i : i - 4) % 2) * 235 + 15,
          y: Math.floor((i < 4 ? i : i - 4) / 2) * 105 + 45,
        },
        style: { ...n.style, width: 215, padding: 12 },
      })),
    ];
  }
  return nodes;
}
const EMPTY_ACTIVE: string[] = [];
export function ConceptCanvas({
  variant,
  active = EMPTY_ACTIVE,
}: {
  variant: keyof typeof definitions;
  active?: string[];
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(template(variant));
  const [selected, setSelected] = useState(definitions[variant][0]);
  useEffect(() => {
    setNodes((current) =>
      current.map((n) => ({
        ...n,
        style: {
          ...n.style,
          borderColor: active.includes(n.id) ? "#60a5fa" : "#475569",
          boxShadow: active.includes(n.id) ? "0 0 15px #2563eb55" : undefined,
        },
      })),
    );
  }, [active, setNodes]);
  const edges: Edge[] = connections[variant].map(
    ([source, target, label, dashed], i) => ({
      id: `relation-${i}`,
      source,
      target,
      label,
      animated:
        active.includes(source) &&
        !dashed &&
        (variant !== "networking" ||
          (active.includes(target) && target !== "b")),
      markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
      style: { stroke: "#94a3b8", strokeDasharray: dashed ? "5 4" : undefined },
      labelStyle: { fill: "#cbd5e1", fontSize: 11 },
      labelBgStyle: { fill: "#0f172a" },
    }),
  );
  return (
    <section className="space-y-3 min-w-0">
      <div className="h-[430px] sm:h-[510px] rounded-xl border border-slate-700 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          onNodesChange={onNodesChange}
          onNodeClick={(_, node) => {
            const found = definitions[variant].find((c) => c.id === node.id);
            if (found) setSelected(found);
          }}
          fitView
          minZoom={0.2}
          maxZoom={2}
        >
          <Background color="#334155" />
          <Controls />
          <MiniMap
            pannable
            zoomable
            nodeColor="#334155"
            maskColor="#0f172aaa"
          />
        </ReactFlow>
      </div>
      <div className="learning-panel">
        <p className="text-xs text-slate-500 mb-3">
          실선: 관리 / 요청 흐름 · 점선: 설정 / 관계
        </p>
        <div
          className="flex flex-wrap gap-2 mb-4"
          role="group"
          aria-label="구성 요소 선택"
        >
          {definitions[variant].map((c) => (
            <button
              key={c.id}
              className="learning-button"
              aria-pressed={selected.id === c.id}
              onClick={() => setSelected(c)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <h3 className="font-bold text-blue-200">{selected.label}</h3>
        <p className="text-sm leading-7 text-slate-300 mt-2">{selected.text}</p>
        <a
          className="inline-block text-sm text-blue-400 mt-3"
          href={pageHref(selected.related)}
        >
          관련 학습 보기 →
        </a>
        <a
          className="ml-4 text-xs text-slate-400 underline"
          href={sourceUrl(
            variant === "resources"
              ? "overview/working-with-objects"
              : variant === "networking"
                ? "services-networking"
                : "overview/components",
          )}
          target="_blank"
          rel="noreferrer"
        >
          공식 설명
        </a>
      </div>
    </section>
  );
}
