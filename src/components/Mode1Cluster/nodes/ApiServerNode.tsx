import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface ApiServerNodeData {
  isActive: boolean;
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export const ApiServerNode: React.FC<{ data: ApiServerNodeData }> = ({ data }) => {
  let borderClass = 'border-slate-700 bg-slate-900/90 text-slate-300';
  if (data.isSelected) {
    borderClass = 'ring-2 ring-amber-400 border-amber-400 bg-slate-900 text-white shadow-xl shadow-amber-400/30';
  } else if (data.isHighlighted) {
    borderClass = 'border-amber-400 bg-slate-900 text-amber-200 ring-2 ring-amber-400/50 animate-pulse';
  } else if (data.isActive) {
    borderClass = 'border-sky-400 bg-slate-900 text-sky-200 ring-2 ring-sky-400/50 animate-pulse shadow-xl shadow-sky-500/30';
  }

  return (
    <div
      onClick={data.onClick}
      className={`rounded-xl border-2 p-3.5 flex flex-col items-center justify-center cursor-pointer transition-all w-[240px] shadow-2xl ${borderClass}`}
    >
      {/* Target Handle from Developer (Left) */}
      <Handle type="target" position={Position.Left} id="left" className="w-2.5 h-2.5 bg-blue-500 !left-[-6px]" />

      {/* Handles to etcd & Cloud Controller (Top) */}
      <Handle type="source" position={Position.Top} id="top-etcd-source" className="w-2.5 h-2.5 bg-cyan-500 !top-[-6px] !left-[25%]" />
      <Handle type="target" position={Position.Top} id="top-etcd-target" className="w-2.5 h-2.5 bg-cyan-500 !top-[-6px] !left-[25%]" />

      <Handle type="source" position={Position.Top} id="top-ccm-source" className="w-2.5 h-2.5 bg-sky-500 !top-[-6px] !left-[75%]" />
      <Handle type="target" position={Position.Top} id="top-ccm-target" className="w-2.5 h-2.5 bg-sky-500 !top-[-6px] !left-[75%]" />

      {/* Handles to Scheduler & Controller Manager (Bottom) */}
      <Handle type="source" position={Position.Bottom} id="bottom-sched-source" className="w-2.5 h-2.5 bg-purple-500 !bottom-[-6px] !left-[25%]" />
      <Handle type="target" position={Position.Bottom} id="bottom-sched-target" className="w-2.5 h-2.5 bg-purple-500 !bottom-[-6px] !left-[25%]" />

      <Handle type="source" position={Position.Bottom} id="bottom-cm-source" className="w-2.5 h-2.5 bg-emerald-500 !bottom-[-6px] !left-[75%]" />
      <Handle type="target" position={Position.Bottom} id="bottom-cm-target" className="w-2.5 h-2.5 bg-emerald-500 !bottom-[-6px] !left-[75%]" />

      {/* Source Handles to Worker Nodes (Right) */}
      <Handle type="source" position={Position.Right} id="right-node1" className="w-2.5 h-2.5 bg-blue-500 !right-[-6px] !top-[30%]" />
      <Handle type="source" position={Position.Right} id="right-node2" className="w-2.5 h-2.5 bg-blue-500 !right-[-6px] !top-[70%]" />

      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-extrabold font-mono shadow">
          api
        </div>
        <span className="text-sm font-black text-white tracking-wide">API Server</span>
      </div>
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
        kube-apiserver
      </span>
      <span className="text-[9px] text-slate-400 mt-1 text-center">
        AuthN ➔ AuthZ ➔ Admission ➔ etcd
      </span>
    </div>
  );
};
