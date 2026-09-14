import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database } from 'lucide-react';

interface EtcdNodeData {
  isActive: boolean;
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export const EtcdNode: React.FC<{ data: EtcdNodeData }> = ({ data }) => {
  let borderClass = 'border-slate-700 bg-slate-900/90 text-slate-300';
  if (data.isSelected) {
    borderClass = 'ring-2 ring-amber-400 border-amber-400 bg-slate-900 text-white shadow-xl shadow-amber-400/30';
  } else if (data.isHighlighted) {
    borderClass = 'border-amber-400 bg-slate-900 text-amber-200 ring-2 ring-amber-400/50 animate-pulse';
  } else if (data.isActive) {
    borderClass = 'border-cyan-400 bg-slate-900 text-cyan-200 ring-2 ring-cyan-400/50 animate-pulse shadow-xl shadow-cyan-500/30';
  }

  return (
    <div
      onClick={data.onClick}
      className={`rounded-xl border p-2 flex flex-col items-center justify-center cursor-pointer transition-all w-full h-full relative shadow-xl ${borderClass}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <div className="flex -space-x-1.5">
          <Database className="w-4 h-4 text-cyan-400" />
          <Database className="w-4 h-4 text-cyan-500/70" />
        </div>
        <span className="text-[10px] font-bold font-mono bg-cyan-600/30 text-cyan-300 px-1 py-0.2 rounded border border-cyan-500/30">
          etcd
        </span>
      </div>
      <span className="text-xs font-bold text-white">etcd</span>
      <span className="text-[9px] text-cyan-400 font-mono">(key-value store)</span>
      <span className="text-[8px] text-slate-500 mt-0.5">Raft 3-node Quorum</span>

      {/* Handle connected to API Server (Bottom) */}
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="w-2.5 h-2.5 bg-cyan-500 !bottom-[-5px]" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="w-2.5 h-2.5 bg-cyan-500 !bottom-[-5px]" />
    </div>
  );
};
