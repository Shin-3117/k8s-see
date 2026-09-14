import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Users } from 'lucide-react';

interface EndUsersNodeData {
  isActive: boolean;
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export const EndUsersNode: React.FC<{ data: EndUsersNodeData }> = ({ data }) => {
  let borderClass = 'border-slate-700 bg-slate-900/90 text-slate-300';
  if (data.isSelected) {
    borderClass = 'ring-2 ring-amber-400 border-amber-400 bg-slate-900 text-white shadow-xl shadow-amber-400/30';
  } else if (data.isHighlighted) {
    borderClass = 'border-amber-400 bg-slate-900 text-amber-200 ring-2 ring-amber-400/50 animate-pulse';
  } else if (data.isActive) {
    borderClass = 'border-pink-400 bg-slate-900 text-pink-200 ring-2 ring-pink-400/50 animate-pulse shadow-xl shadow-pink-500/30';
  }

  return (
    <div
      onClick={data.onClick}
      className={`rounded-xl border p-3 flex flex-col items-center justify-center cursor-pointer transition-all w-full h-full relative shadow-xl ${borderClass}`}
    >
      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-pink-400 mb-1.5 shadow-inner border border-slate-700">
        <Users className="w-6 h-6" />
      </div>
      <span className="text-xs font-bold text-white text-center">End Users</span>
      <span className="text-[9px] text-pink-400 font-mono mt-0.5 font-semibold text-center">Inbound Traffic</span>
      <span className="text-[8px] text-slate-500 text-center mt-0.5">Ingress / Svc</span>

      {/* Outgoing Handle on Left to Worker Nodes' kube-proxy */}
      <Handle
        type="source"
        position={Position.Left}
        id="left-node1"
        className="w-2.5 h-2.5 bg-pink-500 !left-[-5px] !top-[30%]"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-node2"
        className="w-2.5 h-2.5 bg-pink-500 !left-[-5px] !top-[70%]"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-ingress"
        className="w-2.5 h-2.5 bg-purple-500 !left-[-5px] !top-[40%]"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-ingress-target"
        className="w-2.5 h-2.5 bg-emerald-400 !left-[-5px] !top-[60%]"
      />
    </div>
  );
};
