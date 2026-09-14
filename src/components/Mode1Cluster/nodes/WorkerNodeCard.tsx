import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { PodInstance, K8sComponentId } from '../../../types/pipeline';
import { Network, Box, FolderGit2 } from 'lucide-react';

interface WorkerNodeCardData {
  nodeId: 'worker-1' | 'worker-2';
  nodeName: string;
  nodeIp: string;
  pods: PodInstance[];
  activeComponents: K8sComponentId[];
  yamlHighlightedComponents: K8sComponentId[];
  selectedComponent: K8sComponentId | null;
  onSelectComponent: (id: K8sComponentId) => void;
}

export const WorkerNodeCard: React.FC<{ data: WorkerNodeCardData }> = ({ data }) => {
  const kubeletId: K8sComponentId = data.nodeId === 'worker-1' ? 'kubelet-1' : 'kubelet-2';
  const runtimeId: K8sComponentId = data.nodeId === 'worker-1' ? 'runtime-1' : 'runtime-2';
  const objectsId: K8sComponentId = data.nodeId === 'worker-1' ? 'objects-1' : 'objects-2';
  const proxyId: K8sComponentId = data.nodeId === 'worker-1' ? 'kube-proxy-1' : 'kube-proxy-2';

  const getSubBorder = (id: K8sComponentId) => {
    if (data.selectedComponent === id) {
      return 'ring-2 ring-amber-400 border-amber-400 shadow-md shadow-amber-400/20';
    }
    if (data.yamlHighlightedComponents.includes(id)) {
      return 'border-amber-400 animate-pulse ring-1 ring-amber-400/40';
    }
    if (data.activeComponents.includes(id)) {
      return 'border-sky-400 animate-pulse ring-1 ring-sky-400/50 shadow-md shadow-sky-500/20';
    }
    return 'border-slate-800 hover:border-slate-600';
  };

  return (
    <div className="bg-slate-950/95 rounded-2xl border-2 border-slate-700/80 p-3 shadow-2xl w-[320px] text-slate-100 relative">
      {/* Target handle from API Server to Kubelet (Left top) */}
      <Handle
        type="target"
        position={Position.Left}
        id="kubelet-target"
        className="w-2.5 h-2.5 bg-blue-500 !left-[-6px] !top-[40px]"
      />

      {/* Target handle from End Users to kube-proxy (Right bottom) */}
      <Handle
        type="target"
        position={Position.Right}
        id="proxy-target"
        className="w-2.5 h-2.5 bg-pink-500 !right-[-6px] !bottom-[22px]"
      />

      {/* Target handle from Ingress Controller (Right middle) */}
      <Handle
        type="target"
        position={Position.Right}
        id="ingress-target"
        className="w-2.5 h-2.5 bg-purple-500 !right-[-6px] !top-[50%]"
      />

      {/* Target & Source handle from AWS Cloud EBS Attach (Top - Worker Node 1 only) */}
      {data.nodeId === 'worker-1' && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="storage-target"
            className="w-2.5 h-2.5 bg-amber-500 !top-[-6px] !left-[20%]"
            title="EBS Block Device Mount Point (/dev/nvme1n1)"
          />
          <Handle
            type="source"
            position={Position.Top}
            id="storage-source"
            className="w-2.5 h-2.5 bg-amber-500 !top-[-6px] !left-[20%]"
          />
        </>
      )}

      {/* CNI Inter-Node Pod Network handles (Top & Bottom) */}
      <Handle
        type="target"
        position={Position.Top}
        id="cni-top-target"
        className="w-2.5 h-2.5 bg-emerald-500 !top-[-6px] !left-[50%]"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="cni-top-source"
        className="w-2.5 h-2.5 bg-emerald-500 !top-[-6px] !left-[50%]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="cni-bottom-source"
        className="w-2.5 h-2.5 bg-emerald-500 !bottom-[-6px] !left-[50%]"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="cni-bottom-target"
        className="w-2.5 h-2.5 bg-emerald-500 !bottom-[-6px] !left-[50%]"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-white">{data.nodeName}</span>
          <span className="text-[9px] text-slate-500 font-mono">{data.nodeIp}</span>
        </div>
        <span className="text-[9px] bg-slate-800 text-blue-300 px-1.5 py-0.2 rounded font-mono">
          node
        </span>
      </div>

      {/* Row 1: Kubelet -> Container Runtime */}
      <div className="grid grid-cols-12 gap-2 mb-2">
        {/* kubelet */}
        <div
          onClick={() => data.onSelectComponent(kubeletId)}
          className={`col-span-4 bg-slate-900 rounded-lg border p-1.5 cursor-pointer transition-all flex flex-col items-center justify-center ${getSubBorder(
            kubeletId
          )}`}
        >
          <div className="w-5 h-5 rounded bg-blue-600/30 text-blue-300 flex items-center justify-center text-[9px] font-bold font-mono mb-0.5">
            k
          </div>
          <span className="text-[10px] font-bold text-slate-200">kubelet</span>
          <span className="text-[8px] text-slate-500 font-mono">Agent</span>
        </div>

        {/* Container Runtime (Pods box) */}
        <div
          onClick={() => data.onSelectComponent(runtimeId)}
          className={`col-span-8 bg-slate-900/90 rounded-lg border p-1.5 cursor-pointer transition-all flex flex-col justify-between ${getSubBorder(
            runtimeId
          )}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-bold text-amber-300">Container Runtime</span>
            <span className="text-[8px] text-slate-500 font-mono">containerd</span>
          </div>

          <div className="flex items-center gap-1 min-h-[38px] bg-slate-950/80 p-1 rounded border border-slate-800/80">
            {data.pods.length === 0 ? (
              <span className="text-[9px] text-slate-600 italic mx-auto">
                (Empty)
              </span>
            ) : (
              data.pods.map((pod) => (
                <div
                  key={pod.id}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border transition-all ${
                    pod.status === 'Ready' || pod.status === 'Running'
                      ? 'bg-blue-600/30 text-blue-200 border-blue-400 shadow-sm shadow-blue-500/20 animate-pulse'
                      : 'bg-amber-600/30 text-amber-200 border-amber-400 animate-pulse'
                  }`}
                >
                  <Box className="w-2.5 h-2.5" />
                  <span className="font-bold">pod</span>
                  <span className="text-[8px] opacity-75">({pod.ready})</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Objects + kube-proxy */}
      <div className="grid grid-cols-12 gap-2">
        <div
          onClick={() => data.onSelectComponent(objectsId)}
          className={`col-span-7 bg-slate-900/60 rounded-lg border p-1.5 cursor-pointer transition-all flex items-center justify-between ${getSubBorder(
            objectsId
          )}`}
        >
          <div className="flex items-center gap-1">
            <FolderGit2 className="w-3 h-3 text-teal-400" />
            <span className="text-[9px] font-bold text-slate-300">Objects*</span>
          </div>
          <div className="flex gap-0.5">
            <span className="text-[7px] px-1 rounded bg-teal-900/60 text-teal-300 font-mono">deploy</span>
            <span className="text-[7px] px-1 rounded bg-teal-900/60 text-teal-300 font-mono">svc</span>
          </div>
        </div>

        <div
          onClick={() => data.onSelectComponent(proxyId)}
          className={`col-span-5 bg-slate-900 rounded-lg border p-1.5 cursor-pointer transition-all flex items-center justify-center gap-1 ${getSubBorder(
            proxyId
          )}`}
        >
          <Network className="w-3 h-3 text-indigo-400" />
          <span className="text-[9px] font-bold text-slate-200">kube-proxy</span>
        </div>
      </div>
    </div>
  );
};
