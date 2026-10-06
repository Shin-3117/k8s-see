import { Handle, NodeProps, Position } from "@xyflow/react";
import {
  Box,
  Database,
  FolderGit2,
  Network,
  Shield,
  Layers,
  KeyRound,
  HardDrive,
} from "lucide-react";

// Match the storage page's component cards while keeping this graph's directional ports.
const appearances = {
  api: {
    title: "API Server",
    badge: "kube-apiserver",
    detail: "AuthN → AuthZ → Admission → etcd",
    symbol: "api",
    color: "blue",
  },
  etcd: {
    title: "etcd",
    badge: "key-value store",
    detail: "클러스터 사양 · 상태 저장",
    icon: Database,
    color: "cyan",
  },
  scheduler: {
    title: "Scheduler",
    badge: "kube-scheduler",
    detail: "Filter → Score",
    symbol: "sched",
    color: "purple",
  },
  controller: {
    title: "Controller Manager",
    badge: "Reconcile Loop",
    detail: "Deployment / RS / Node",
    symbol: "c-m",
    color: "emerald",
  },
  kubelet: {
    title: "kubelet",
    badge: "Agent",
    detail: "노드 실행 관리",
    symbol: "k",
    color: "blue",
  },
  runtime: {
    title: "Container Runtime",
    badge: "containerd",
    detail: "CRI · sandbox / 컨테이너 실행",
    icon: Box,
    color: "amber",
  },
  pod: {
    title: "Pod",
    badge: "pod",
    detail: "앱 컨테이너 · 공유 네트워크",
    icon: Box,
    color: "blue",
  },
  client: {
    title: "클라이언트 Pod",
    badge: "pod",
    detail: "Service 이름으로 요청",
    icon: Box,
    color: "blue",
  },
  a: {
    title: "Ready Pod A",
    badge: "pod",
    detail: "선택된 Ready 백엔드",
    icon: Box,
    color: "blue",
  },
  b: {
    title: "Ready Pod B",
    badge: "pod",
    detail: "다른 요청의 Ready 백엔드",
    icon: Box,
    color: "blue",
  },
  proxy: {
    title: "Service 구현",
    badge: "kube-proxy / 대체 구현",
    detail: "Service · EndpointSlice 감시",
    icon: Network,
    color: "indigo",
  },
  rules: {
    title: "kube-proxy / 대체 구현",
    badge: "전달 규칙",
    detail: "커널 / eBPF 규칙 구성",
    icon: Network,
    color: "indigo",
  },
  cni: {
    title: "CNI",
    badge: "Pod Network",
    detail: "연결 · IP · 라우팅",
    icon: Network,
    color: "emerald",
  },
  dns: {
    title: "CoreDNS",
    badge: "DNS",
    detail: "Service 이름 → IP",
    icon: Network,
    color: "cyan",
  },
  service: {
    title: "Service",
    badge: "svc",
    detail: "ClusterIP · selector",
    icon: FolderGit2,
    color: "teal",
  },
  deployment: {
    title: "Deployment",
    badge: "deploy",
    detail: "배포 · 업데이트 관리",
    icon: FolderGit2,
    color: "teal",
  },
  replicaset: {
    title: "ReplicaSet",
    badge: "rs",
    detail: "복제본 수 유지",
    icon: Layers,
    color: "teal",
  },
  config: {
    title: "ConfigMap / Secret",
    badge: "설정 리소스",
    detail: "환경변수 · 설정 파일",
    icon: FolderGit2,
    color: "teal",
  },
  sa: {
    title: "ServiceAccount",
    badge: "API 신원",
    detail: "Pod의 Kubernetes API 신원",
    icon: KeyRound,
    color: "purple",
  },
  rbac: {
    title: "Role / Binding",
    badge: "RBAC",
    detail: "권한 정의 · 신원 연결",
    icon: Shield,
    color: "purple",
  },
  namespace: {
    title: "Namespace",
    badge: "namespace",
    detail: "리소스의 논리적 범위",
    icon: Layers,
    color: "slate",
  },
  pvc: {
    title: "PVC → PV → 저장소",
    badge: "volume",
    detail: "Pod가 사용하는 영속 볼륨",
    icon: HardDrive,
    color: "amber",
  },
  path: {
    title: "노드 데이터 경로",
    badge: "Kernel / eBPF",
    detail: "실제 앱 패킷 전달",
    icon: Network,
    color: "indigo",
  },
} satisfies Record<
  string,
  {
    title: string;
    badge: string;
    detail: string;
    color: string;
    symbol?: string;
    icon?: typeof Box;
  }
>;

const palettes: Record<
  string,
  { ink: string; badge: string; active: string; handle: string }
> = {
  blue: {
    ink: "text-blue-300",
    badge: "bg-blue-600/30 border-blue-500/40",
    active: "border-sky-400 ring-sky-400/50 shadow-sky-500/30",
    handle: "#60a5fa",
  },
  cyan: {
    ink: "text-cyan-300",
    badge: "bg-cyan-600/30 border-cyan-500/40",
    active: "border-cyan-400 ring-cyan-400/50 shadow-cyan-500/30",
    handle: "#22d3ee",
  },
  purple: {
    ink: "text-purple-300",
    badge: "bg-purple-600/30 border-purple-500/40",
    active: "border-purple-400 ring-purple-400/50 shadow-purple-500/30",
    handle: "#c084fc",
  },
  emerald: {
    ink: "text-emerald-300",
    badge: "bg-emerald-600/30 border-emerald-500/40",
    active: "border-emerald-400 ring-emerald-400/50 shadow-emerald-500/30",
    handle: "#34d399",
  },
  amber: {
    ink: "text-amber-300",
    badge: "bg-amber-600/30 border-amber-500/40",
    active: "border-amber-400 ring-amber-400/50 shadow-amber-500/30",
    handle: "#fbbf24",
  },
  indigo: {
    ink: "text-indigo-300",
    badge: "bg-indigo-600/30 border-indigo-500/40",
    active: "border-indigo-400 ring-indigo-400/50 shadow-indigo-500/30",
    handle: "#818cf8",
  },
  teal: {
    ink: "text-teal-300",
    badge: "bg-teal-600/30 border-teal-500/40",
    active: "border-teal-400 ring-teal-400/50 shadow-teal-500/30",
    handle: "#2dd4bf",
  },
  slate: {
    ink: "text-slate-300",
    badge: "bg-slate-800 border-slate-600",
    active: "border-slate-400 ring-slate-400/50 shadow-slate-500/30",
    handle: "#94a3b8",
  },
};

export function ConceptNode({ id, data }: NodeProps) {
  const appearance = appearances[id as keyof typeof appearances];
  const palette = palettes[appearance.color];
  const Icon = "icon" in appearance ? appearance.icon : null;
  const selected = !!data.selected;
  const active = !!data.active;
  const border = selected
    ? "border-amber-400 ring-2 ring-amber-400 shadow-amber-400/30"
    : active
      ? `${palette.active} ring-2`
      : "border-slate-700";
  return (
    <div
      aria-label={String(data.label)}
      className={`h-[100px] rounded-xl ${id === "api" ? "border-2" : "border"} bg-slate-900/90 shadow-xl flex flex-col items-center justify-center gap-1 px-2 text-center cursor-pointer transition-colors ${border}`}
    >
      <div className="flex items-center justify-center gap-2">
        <div
          className={`h-6 min-w-6 px-1 rounded border flex items-center justify-center ${palette.badge} ${palette.ink}`}
        >
          {Icon ? (
            <Icon size={16} aria-hidden="true" />
          ) : (
            <span className="text-[10px] font-bold font-mono">
              {"symbol" in appearance ? appearance.symbol : ""}
            </span>
          )}
        </div>
        <span className="text-xs font-bold text-white">{appearance.title}</span>
      </div>
      <span
        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${palette.badge} ${palette.ink}`}
      >
        {appearance.badge}
      </span>
      <span className="text-[9px] text-slate-400">{appearance.detail}</span>
      {(
        [
          ["top", Position.Top],
          ["right", Position.Right],
          ["bottom", Position.Bottom],
          ["left", Position.Left],
        ] as const
      ).map(([side, position]) => (
        <span key={side}>
          <Handle
            type="source"
            id={`out-${side}`}
            position={position}
            style={{ background: palette.handle }}
            isConnectable={false}
          />
          <Handle
            type="target"
            id={`in-${side}`}
            position={position}
            style={{ background: palette.handle }}
            isConnectable={false}
          />
        </span>
      ))}
      <Handle
        type="source"
        id="out-right-low"
        position={Position.Right}
        style={{ top: "75%", background: palette.handle }}
        isConnectable={false}
      />
      <Handle
        type="source"
        id="out-right-high"
        position={Position.Right}
        style={{ top: "25%", background: palette.handle }}
        isConnectable={false}
      />
      <Handle
        type="target"
        id="in-top-right"
        position={Position.Top}
        style={{ left: "75%", background: palette.handle }}
        isConnectable={false}
      />
    </div>
  );
}
