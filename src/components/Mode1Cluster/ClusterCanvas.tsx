import React from 'react';
import { K8sComponentId, PacketPath, PodInstance } from '../../types/pipeline';
import { PacketOverlay } from './PacketOverlay';
import {
  User,
  Users,
  Database,
  Server,
  Cloud,
  Network,
  Box,
  ArrowRight,
  FolderGit2
} from 'lucide-react';

interface ClusterCanvasProps {
  activeComponents: K8sComponentId[];
  packets: PacketPath[];
  podsState: PodInstance[];
  selectedComponent: K8sComponentId | null;
  onSelectComponent: (componentId: K8sComponentId) => void;
  yamlHighlightedComponents?: K8sComponentId[];
}

export const ClusterCanvas: React.FC<ClusterCanvasProps> = ({
  activeComponents,
  packets,
  podsState,
  selectedComponent,
  onSelectComponent,
  yamlHighlightedComponents = []
}) => {
  const getCompBorder = (id: K8sComponentId) => {
    if (selectedComponent === id) {
      return 'ring-2 ring-amber-400 border-amber-400 shadow-lg shadow-amber-400/20';
    }
    if (yamlHighlightedComponents.includes(id)) {
      return 'k8s-glow-warning border-amber-400 animate-pulse';
    }
    if (activeComponents.includes(id)) {
      return 'k8s-glow-active border-sky-400 animate-pulse-glow';
    }
    return 'border-slate-700/80 hover:border-slate-500';
  };

  // Filter pods by worker node
  const podsNode1 = podsState.filter((p) => p.nodeId === 'worker-1');
  const podsNode2 = podsState.filter((p) => p.nodeId === 'worker-2');

  return (
    <div className="relative bg-[#070D18] rounded-2xl border-2 border-blue-600/70 p-4 shadow-2xl overflow-hidden min-w-[980px]">
      {/* Kubernetes Cluster Header Tag */}
      <div className="flex items-center justify-between mb-3 border-b border-blue-900/60 pb-2">
        <div className="flex items-center gap-2">
          {/* Helm Icon */}
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white shadow">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <h2 className="text-base font-extrabold text-blue-300 tracking-wide">
            Kubernetes Cluster
          </h2>
          <span className="text-[10px] bg-blue-950 text-blue-400 px-2 py-0.5 rounded border border-blue-800/80">
            DevOps Mojo Architecture
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-[11px]">Control Plane</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px]">Worker Nodes</span>
          </div>
        </div>
      </div>

      {/* Main Architecture Flow: Left(Developer) -> Center(Control Plane & Worker Nodes) -> Right(End Users) */}
      <div className="grid grid-cols-12 gap-3 relative min-h-[580px]">
        {/* SVG Static Connecting Arrows Layer */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 1200 640"
          preserveAspectRatio="none"
        >
          <defs>
            <marker id="std-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#475569" />
            </marker>
            <marker id="dashed-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#64748B" />
            </marker>
          </defs>

          {/* Developer -> API Server */}
          <line x1="120" y1="320" x2="200" y2="320" stroke="#64748B" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#dashed-arrow)" />

          {/* API Server <-> etcd */}
          <line x1="310" y1="260" x2="310" y2="190" stroke="#475569" strokeWidth="2" markerEnd="url(#std-arrow)" />
          <line x1="300" y1="190" x2="300" y2="260" stroke="#475569" strokeWidth="2" markerEnd="url(#std-arrow)" />

          {/* API Server <-> Scheduler */}
          <line x1="280" y1="380" x2="280" y2="435" stroke="#475569" strokeWidth="2" markerEnd="url(#std-arrow)" />
          <line x1="270" y1="435" x2="270" y2="380" stroke="#475569" strokeWidth="2" markerEnd="url(#std-arrow)" />

          {/* API Server <-> Controller Manager */}
          <line x1="350" y1="380" x2="350" y2="435" stroke="#475569" strokeWidth="2" markerEnd="url(#std-arrow)" />
          <line x1="360" y1="435" x2="360" y2="380" stroke="#475569" strokeWidth="2" markerEnd="url(#std-arrow)" />

          {/* API Server -> Worker Node 1 & 2 Kubelet */}
          <path d="M 450 310 H 530 V 145 H 590" fill="none" stroke="#475569" strokeWidth="2" markerEnd="url(#std-arrow)" />
          <path d="M 450 330 H 530 V 405 H 590" fill="none" stroke="#475569" strokeWidth="2" markerEnd="url(#std-arrow)" />

          {/* Kubelet -> Container Runtime (Node 1 & 2) */}
          <line x1="720" y1="145" x2="760" y2="145" stroke="#475569" strokeWidth="2" markerEnd="url(#std-arrow)" />
          <line x1="720" y1="405" x2="760" y2="405" stroke="#475569" strokeWidth="2" markerEnd="url(#std-arrow)" />

          {/* End Users -> kube-proxy (Node 1 & 2) */}
          <path d="M 1030 350 H 990 V 235 H 950" fill="none" stroke="#64748B" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#dashed-arrow)" />
          <path d="M 1030 370 H 990 V 495 H 950" fill="none" stroke="#64748B" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#dashed-arrow)" />
        </svg>

        {/* Dynamic Glowing Packet Layer */}
        <PacketOverlay packets={packets} />

        {/* 1. LEFT COLUMN: DEVELOPER (1.5 cols) */}
        <div className="col-span-1 flex flex-col items-center justify-center z-20">
          <div
            onClick={() => onSelectComponent('developer')}
            className={`w-full bg-slate-900/90 rounded-xl border p-3 flex flex-col items-center justify-center cursor-pointer transition-all ${getCompBorder(
              'developer'
            )}`}
          >
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 mb-2 shadow-inner border border-slate-700">
              <User className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold text-white text-center">Developer</span>
            <span className="text-[10px] text-blue-400 font-mono mt-1 font-semibold">kubectl</span>
            <span className="text-[9px] text-slate-500 text-center mt-0.5">CLI / API / Dashboard</span>
          </div>
        </div>

        {/* 2. MIDDLE-LEFT COLUMN: CONTROL PLANE (MASTER NODE) (5 cols) */}
        <div className="col-span-5 bg-slate-900/40 rounded-2xl border-2 border-slate-700/60 p-3.5 flex flex-col justify-between z-20 backdrop-blur-sm relative">
          {/* Control Plane Header Badge */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-blue-600/80 flex items-center justify-center text-white text-[10px] font-bold">
                M
              </div>
              <span className="text-xs font-bold text-slate-200">
                Control Plane (Master Node)
              </span>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              control-plane
            </span>
          </div>

          {/* Top Row: etcd + Cloud Controller Manager */}
          <div className="grid grid-cols-2 gap-3 mb-2">
            {/* etcd */}
            <div
              onClick={() => onSelectComponent('etcd')}
              className={`bg-slate-950/80 rounded-xl border p-3 cursor-pointer transition-all flex flex-col items-center justify-center ${getCompBorder(
                'etcd'
              )}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {/* Cylinders */}
                <div className="flex -space-x-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  <Database className="w-5 h-5 text-cyan-500/70" />
                </div>
                <div className="w-6 h-6 rounded-md bg-cyan-600/30 flex items-center justify-center text-cyan-300 border border-cyan-500/40">
                  <span className="text-[9px] font-bold font-mono">etcd</span>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-100">etcd</span>
              <span className="text-[10px] text-cyan-400 font-mono">(key-value store)</span>
              <span className="text-[9px] text-slate-500 mt-0.5">Raft 3-node Quorum</span>
            </div>

            {/* Cloud Controller Manager (Optional) */}
            <div
              onClick={() => onSelectComponent('cloudControllerManager')}
              className={`bg-slate-950/60 rounded-xl border p-2.5 cursor-pointer transition-all flex flex-col items-center justify-center text-center ${getCompBorder(
                'cloudControllerManager'
              )}`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-sky-400">
                <Cloud className="w-4 h-4" />
                <span className="text-[9px] font-mono bg-sky-500/20 px-1 py-0.2 rounded text-sky-300">c-c-m</span>
              </div>
              <span className="text-[11px] font-bold text-slate-200">Cloud Controller Manager*</span>
              <span className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
                <span>Cloud Provider API</span>
                <ArrowRight className="w-2.5 h-2.5 opacity-60" />
              </span>
            </div>
          </div>

          {/* Middle Row: API Server (Central Hub) */}
          <div
            onClick={() => onSelectComponent('apiserver')}
            className={`w-full bg-gradient-to-r from-blue-950/90 via-slate-900 to-blue-950/90 rounded-xl border-2 p-4 cursor-pointer transition-all my-2 flex flex-col items-center justify-center shadow-lg ${getCompBorder(
              'apiserver'
            )}`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
                <span className="text-[10px] font-extrabold font-mono">api</span>
              </div>
              <span className="text-sm font-black text-white tracking-wide">API Server</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                kube-apiserver
              </span>
            </div>
            <p className="text-[11px] text-slate-300 text-center max-w-[340px]">
              AuthN (인증) ➔ AuthZ (인가) ➔ Admission Control ➔ etcd
            </p>
          </div>

          {/* Bottom Row: Scheduler + Controller Manager */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            {/* Scheduler */}
            <div
              onClick={() => onSelectComponent('scheduler')}
              className={`bg-slate-950/80 rounded-xl border p-3 cursor-pointer transition-all flex flex-col items-center justify-center ${getCompBorder(
                'scheduler'
              )}`}
            >
              <div className="w-6 h-6 rounded-md bg-purple-600/30 flex items-center justify-center text-purple-300 border border-purple-500/40 mb-1.5">
                <span className="text-[9px] font-bold font-mono">sched</span>
              </div>
              <span className="text-xs font-bold text-slate-100">Scheduler</span>
              <span className="text-[10px] text-purple-400 font-mono">kube-scheduler</span>
              <span className="text-[9px] text-slate-500 mt-0.5">Filtering ➔ Scoring</span>
            </div>

            {/* Controller Manager */}
            <div
              onClick={() => onSelectComponent('controllerManager')}
              className={`bg-slate-950/80 rounded-xl border p-3 cursor-pointer transition-all flex flex-col items-center justify-center ${getCompBorder(
                'controllerManager'
              )}`}
            >
              <div className="w-6 h-6 rounded-md bg-emerald-600/30 flex items-center justify-center text-emerald-300 border border-emerald-500/40 mb-1.5">
                <span className="text-[9px] font-bold font-mono">c-m</span>
              </div>
              <span className="text-xs font-bold text-slate-100 text-center">Controller Manager</span>
              <span className="text-[10px] text-emerald-400 font-mono">Reconcile Loop</span>
              <span className="text-[9px] text-slate-500 mt-0.5">Deployment/RS/Node</span>
            </div>
          </div>
        </div>

        {/* 3. MIDDLE-RIGHT COLUMN: DATA PLANE (WORKER NODES) (5 cols) */}
        <div className="col-span-5 bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-700/60 p-3 flex flex-col justify-between gap-3 z-20 backdrop-blur-sm">
          {/* Data Plane Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <Server className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">
                Data Plane (Worker Nodes)
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">2 Nodes Active</span>
          </div>

          {/* WORKER NODE 1 */}
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-2.5 shadow-inner">
            {/* Node 1 Title Bar */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-200">Worker Node 1</span>
                <span className="text-[9px] text-slate-500 font-mono">192.168.1.101</span>
              </div>
              <span className="text-[9px] bg-slate-800 text-blue-300 px-1.5 py-0.2 rounded font-mono">
                node
              </span>
            </div>

            {/* Node 1 Top Row: kubelet -> Container Runtime */}
            <div className="grid grid-cols-12 gap-2 mb-2">
              {/* kubelet */}
              <div
                onClick={() => onSelectComponent('kubelet-1')}
                className={`col-span-4 bg-slate-900 rounded-lg border p-2 cursor-pointer transition-all flex flex-col items-center justify-center ${getCompBorder(
                  'kubelet-1'
                )}`}
              >
                <div className="w-5 h-5 rounded bg-blue-600/30 text-blue-300 flex items-center justify-center text-[9px] font-bold font-mono mb-1">
                  k
                </div>
                <span className="text-[11px] font-bold text-slate-200">kubelet</span>
                <span className="text-[9px] text-slate-500 font-mono">Node Agent</span>
              </div>

              {/* Container Runtime (Pods Container) */}
              <div
                onClick={() => onSelectComponent('runtime-1')}
                className={`col-span-8 bg-slate-900/90 rounded-lg border p-2 cursor-pointer transition-all flex flex-col justify-between ${getCompBorder(
                  'runtime-1'
                )}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-amber-300">Container Runtime</span>
                  <span className="text-[9px] text-slate-500 font-mono">containerd</span>
                </div>

                {/* Pod Cubes inside Runtime */}
                <div className="flex items-center gap-1.5 min-h-[42px] bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
                  {podsNode1.length === 0 ? (
                    <span className="text-[10px] text-slate-600 italic mx-auto">
                      대기 중인 파드 없음 (Empty)
                    </span>
                  ) : (
                    podsNode1.map((pod) => (
                      <div
                        key={pod.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border transition-all ${
                          pod.status === 'Ready' || pod.status === 'Running'
                            ? 'bg-blue-600/30 text-blue-200 border-blue-400 shadow-sm shadow-blue-500/20 animate-pulse'
                            : 'bg-amber-600/30 text-amber-200 border-amber-400 animate-pulse'
                        }`}
                      >
                        <Box className="w-3 h-3" />
                        <span className="font-bold">pod</span>
                        <span className="text-[9px] opacity-75">({pod.ready})</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Node 1 Bottom Row: K8s Objects + kube-proxy */}
            <div className="grid grid-cols-12 gap-2">
              {/* Objects */}
              <div
                onClick={() => onSelectComponent('objects-1')}
                className={`col-span-7 bg-slate-900/60 rounded-lg border p-1.5 cursor-pointer transition-all flex items-center justify-between ${getCompBorder(
                  'objects-1'
                )}`}
              >
                <div className="flex items-center gap-1">
                  <FolderGit2 className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-[10px] font-bold text-slate-300">K8s Objects*</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-[8px] px-1 rounded bg-teal-900/60 text-teal-300 border border-teal-700/50 font-mono">deploy</span>
                  <span className="text-[8px] px-1 rounded bg-teal-900/60 text-teal-300 border border-teal-700/50 font-mono">rs</span>
                  <span className="text-[8px] px-1 rounded bg-teal-900/60 text-teal-300 border border-teal-700/50 font-mono">svc</span>
                </div>
              </div>

              {/* kube-proxy */}
              <div
                onClick={() => onSelectComponent('kube-proxy-1')}
                className={`col-span-5 bg-slate-900 rounded-lg border p-1.5 cursor-pointer transition-all flex items-center justify-center gap-1.5 ${getCompBorder(
                  'kube-proxy-1'
                )}`}
              >
                <Network className="w-3.5 h-3.5 text-indigo-400" />
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-200 block leading-tight">kube-proxy</span>
                  <span className="text-[8px] text-slate-500 font-mono block">iptables/IPVS</span>
                </div>
              </div>
            </div>
          </div>

          {/* WORKER NODE 2 */}
          <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-2.5 shadow-inner">
            {/* Node 2 Title Bar */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-200">Worker Node 2</span>
                <span className="text-[9px] text-slate-500 font-mono">192.168.1.102</span>
              </div>
              <span className="text-[9px] bg-slate-800 text-blue-300 px-1.5 py-0.2 rounded font-mono">
                node
              </span>
            </div>

            {/* Node 2 Top Row: kubelet -> Container Runtime */}
            <div className="grid grid-cols-12 gap-2 mb-2">
              {/* kubelet */}
              <div
                onClick={() => onSelectComponent('kubelet-2')}
                className={`col-span-4 bg-slate-900 rounded-lg border p-2 cursor-pointer transition-all flex flex-col items-center justify-center ${getCompBorder(
                  'kubelet-2'
                )}`}
              >
                <div className="w-5 h-5 rounded bg-blue-600/30 text-blue-300 flex items-center justify-center text-[9px] font-bold font-mono mb-1">
                  k
                </div>
                <span className="text-[11px] font-bold text-slate-200">kubelet</span>
                <span className="text-[9px] text-slate-500 font-mono">Node Agent</span>
              </div>

              {/* Container Runtime (Pods Container) */}
              <div
                onClick={() => onSelectComponent('runtime-2')}
                className={`col-span-8 bg-slate-900/90 rounded-lg border p-2 cursor-pointer transition-all flex flex-col justify-between ${getCompBorder(
                  'runtime-2'
                )}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-amber-300">Container Runtime</span>
                  <span className="text-[9px] text-slate-500 font-mono">containerd</span>
                </div>

                {/* Pod Cubes inside Runtime */}
                <div className="flex items-center gap-1.5 min-h-[42px] bg-slate-950/70 p-1.5 rounded border border-slate-800/80">
                  {podsNode2.length === 0 ? (
                    <span className="text-[10px] text-slate-600 italic mx-auto">
                      대기 중인 파드 없음 (Empty)
                    </span>
                  ) : (
                    podsNode2.map((pod) => (
                      <div
                        key={pod.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border transition-all ${
                          pod.status === 'Ready' || pod.status === 'Running'
                            ? 'bg-blue-600/30 text-blue-200 border-blue-400 shadow-sm shadow-blue-500/20 animate-pulse'
                            : 'bg-amber-600/30 text-amber-200 border-amber-400 animate-pulse'
                        }`}
                      >
                        <Box className="w-3 h-3" />
                        <span className="font-bold">pod</span>
                        <span className="text-[9px] opacity-75">({pod.ready})</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Node 2 Bottom Row: K8s Objects + kube-proxy */}
            <div className="grid grid-cols-12 gap-2">
              {/* Objects */}
              <div
                onClick={() => onSelectComponent('objects-2')}
                className={`col-span-7 bg-slate-900/60 rounded-lg border p-1.5 cursor-pointer transition-all flex items-center justify-between ${getCompBorder(
                  'objects-2'
                )}`}
              >
                <div className="flex items-center gap-1">
                  <FolderGit2 className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-[10px] font-bold text-slate-300">K8s Objects*</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-[8px] px-1 rounded bg-teal-900/60 text-teal-300 border border-teal-700/50 font-mono">deploy</span>
                  <span className="text-[8px] px-1 rounded bg-teal-900/60 text-teal-300 border border-teal-700/50 font-mono">rs</span>
                  <span className="text-[8px] px-1 rounded bg-teal-900/60 text-teal-300 border border-teal-700/50 font-mono">svc</span>
                </div>
              </div>

              {/* kube-proxy */}
              <div
                onClick={() => onSelectComponent('kube-proxy-2')}
                className={`col-span-5 bg-slate-900 rounded-lg border p-1.5 cursor-pointer transition-all flex items-center justify-center gap-1.5 ${getCompBorder(
                  'kube-proxy-2'
                )}`}
              >
                <Network className="w-3.5 h-3.5 text-indigo-400" />
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-200 block leading-tight">kube-proxy</span>
                  <span className="text-[8px] text-slate-500 font-mono block">iptables/IPVS</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. RIGHT COLUMN: END USERS (1 col) */}
        <div className="col-span-1 flex flex-col items-center justify-center z-20">
          <div
            onClick={() => onSelectComponent('endusers')}
            className={`w-full bg-slate-900/90 rounded-xl border p-3 flex flex-col items-center justify-center cursor-pointer transition-all ${getCompBorder(
              'endusers'
            )}`}
          >
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-pink-400 mb-2 shadow-inner border border-slate-700">
              <Users className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold text-white text-center">End Users</span>
            <span className="text-[9px] text-pink-400 font-mono mt-1 font-semibold text-center">Inbound Traffic</span>
            <span className="text-[9px] text-slate-500 text-center mt-0.5">Ingress / Svc</span>
          </div>
        </div>
      </div>
    </div>
  );
};
