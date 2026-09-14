import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cloud, ArrowRight } from 'lucide-react';

interface CloudControllerNodeData {
  isActive: boolean;
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export const CloudControllerNode: React.FC<{ data: CloudControllerNodeData }> = ({ data }) => {
  let borderClass = 'border-slate-700 bg-slate-900/70 text-slate-400';
  if (data.isSelected) {
    borderClass = 'ring-2 ring-amber-400 border-amber-400 bg-slate-900 text-white shadow-xl shadow-amber-400/30';
  } else if (data.isHighlighted) {
    borderClass = 'border-amber-400 bg-slate-900 text-amber-200 ring-2 ring-amber-400/50 animate-pulse';
  } else if (data.isActive) {
    borderClass = 'border-sky-400 bg-slate-900 text-sky-200 ring-2 ring-sky-400/50 animate-pulse';
  }

  return (
    <div
      onClick={data.onClick}
      className={`rounded-xl border p-2.5 flex flex-col items-center justify-center cursor-pointer transition-all w-[150px] shadow-xl ${borderClass}`}
    >
      <div className="flex items-center gap-1.5 mb-1 text-sky-400">
        <Cloud className="w-4 h-4" />
        <span className="text-[9px] font-mono bg-sky-500/20 px-1 py-0.2 rounded text-sky-300">c-c-m</span>
      </div>
      <span className="text-[11px] font-bold text-slate-200 text-center">Cloud Controller*</span>
      <span className="text-[8px] text-slate-500 mt-1 flex items-center gap-1">
        <span>Cloud Provider API</span>
        <ArrowRight className="w-2.5 h-2.5 opacity-60" />
      </span>

      <Handle type="target" position={Position.Bottom} id="bottom-target" className="w-2.5 h-2.5 bg-sky-500 !bottom-[-5px]" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="w-2.5 h-2.5 bg-sky-500 !bottom-[-5px]" />
    </div>
  );
};
