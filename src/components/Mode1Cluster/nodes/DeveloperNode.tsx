import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { User } from 'lucide-react';

interface DeveloperNodeData {
  isActive: boolean;
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export const DeveloperNode: React.FC<{ data: DeveloperNodeData }> = ({ data }) => {
  let borderClass = 'border-slate-700 bg-slate-900/90 text-slate-300';
  if (data.isSelected) {
    borderClass = 'ring-2 ring-amber-400 border-amber-400 bg-slate-900 text-white shadow-lg shadow-amber-400/25';
  } else if (data.isHighlighted) {
    borderClass = 'border-amber-400 bg-slate-900 text-amber-200 ring-2 ring-amber-400/50 animate-pulse';
  } else if (data.isActive) {
    borderClass = 'border-sky-400 bg-slate-900 text-sky-200 ring-2 ring-sky-400/50 animate-pulse shadow-lg shadow-sky-500/20';
  }

  return (
    <div
      onClick={data.onClick}
      className={`rounded-xl border p-3 flex flex-col items-center justify-center cursor-pointer transition-all w-full h-full relative shadow-xl ${borderClass}`}
    >
      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 mb-1.5 shadow-inner border border-slate-700">
        <User className="w-6 h-6" />
      </div>
      <span className="text-xs font-bold text-white text-center">Developer</span>
      <span className="text-[10px] text-blue-400 font-mono mt-0.5 font-semibold">kubectl</span>
      <span className="text-[8px] text-slate-500 text-center mt-0.5">CLI / API / UI</span>

      {/* Outgoing Handle on Right */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-2.5 h-2.5 bg-blue-500 border border-slate-900 !right-[-5px]"
      />
    </div>
  );
};
