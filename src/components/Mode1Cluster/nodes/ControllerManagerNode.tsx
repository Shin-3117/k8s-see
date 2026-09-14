import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface ControllerManagerNodeData {
  isActive: boolean;
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export const ControllerManagerNode: React.FC<{ data: ControllerManagerNodeData }> = ({ data }) => {
  let borderClass = 'border-slate-700 bg-slate-900/90 text-slate-300';
  if (data.isSelected) {
    borderClass = 'ring-2 ring-amber-400 border-amber-400 bg-slate-900 text-white shadow-xl shadow-amber-400/30';
  } else if (data.isHighlighted) {
    borderClass = 'border-amber-400 bg-slate-900 text-amber-200 ring-2 ring-amber-400/50 animate-pulse';
  } else if (data.isActive) {
    borderClass = 'border-emerald-400 bg-slate-900 text-emerald-200 ring-2 ring-emerald-400/50 animate-pulse shadow-xl shadow-emerald-500/30';
  }

  return (
    <div
      onClick={data.onClick}
      className={`rounded-xl border p-2.5 flex flex-col items-center justify-center cursor-pointer transition-all w-[150px] shadow-xl ${borderClass}`}
    >
      <div className="w-5 h-5 rounded bg-emerald-600/30 text-emerald-300 flex items-center justify-center text-[9px] font-bold font-mono border border-emerald-500/40 mb-1">
        c-m
      </div>
      <span className="text-xs font-bold text-white text-center">Controller Manager</span>
      <span className="text-[9px] text-emerald-400 font-mono">Reconcile Loop</span>
      <span className="text-[8px] text-slate-500 mt-0.5">Deployment/RS/Node</span>

      {/* Handles connecting to API Server (Top) */}
      <Handle type="target" position={Position.Top} id="top-target" className="w-2.5 h-2.5 bg-emerald-500 !top-[-5px]" />
      <Handle type="source" position={Position.Top} id="top-source" className="w-2.5 h-2.5 bg-emerald-500 !top-[-5px]" />
    </div>
  );
};
