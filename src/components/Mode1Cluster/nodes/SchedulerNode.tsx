import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface SchedulerNodeData {
  isActive: boolean;
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export const SchedulerNode: React.FC<{ data: SchedulerNodeData }> = ({ data }) => {
  let borderClass = 'border-slate-700 bg-slate-900/90 text-slate-300';
  if (data.isSelected) {
    borderClass = 'ring-2 ring-amber-400 border-amber-400 bg-slate-900 text-white shadow-xl shadow-amber-400/30';
  } else if (data.isHighlighted) {
    borderClass = 'border-amber-400 bg-slate-900 text-amber-200 ring-2 ring-amber-400/50 animate-pulse';
  } else if (data.isActive) {
    borderClass = 'border-purple-400 bg-slate-900 text-purple-200 ring-2 ring-purple-400/50 animate-pulse shadow-xl shadow-purple-500/30';
  }

  return (
    <div
      onClick={data.onClick}
      className={`rounded-xl border p-2 flex flex-col items-center justify-center cursor-pointer transition-all w-full h-full relative shadow-xl ${borderClass}`}
    >
      <div className="w-5 h-5 rounded bg-purple-600/30 text-purple-300 flex items-center justify-center text-[9px] font-bold font-mono border border-purple-500/40 mb-1">
        sched
      </div>
      <span className="text-xs font-bold text-white">Scheduler</span>
      <span className="text-[9px] text-purple-400 font-mono">kube-scheduler</span>
      <span className="text-[8px] text-slate-500 mt-0.5">Filter ➔ Score</span>

      {/* Handles connecting to API Server (Top) */}
      <Handle type="target" position={Position.Top} id="top-target" className="w-2.5 h-2.5 bg-purple-500 !top-[-5px]" />
      <Handle type="source" position={Position.Top} id="top-source" className="w-2.5 h-2.5 bg-purple-500 !top-[-5px]" />
    </div>
  );
};
