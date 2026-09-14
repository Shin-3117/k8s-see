import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Network, ShieldCheck, RefreshCw, Layers, ArrowRight } from 'lucide-react';
import { Mode5Step } from '../../../types/pipeline';

interface IngressControllerNodeData {
  isActive: boolean;
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: () => void;
  ingressState?: Mode5Step['ingressControllerState'];
  activeRoute?: Mode5Step['activeRoute'];
}

export const IngressControllerNode: React.FC<{ data: IngressControllerNodeData }> = ({ data }) => {
  const { isActive, isHighlighted, isSelected, onClick, ingressState, activeRoute } = data;

  let borderClass = 'border-purple-600/70 bg-slate-900/95 text-slate-200';
  if (isSelected) {
    borderClass = 'ring-2 ring-amber-400 border-amber-400 bg-slate-900 text-white shadow-xl shadow-amber-400/30';
  } else if (isHighlighted) {
    borderClass = 'border-amber-400 bg-slate-900 text-amber-200 ring-2 ring-amber-400/50 animate-pulse';
  } else if (isActive) {
    borderClass = 'border-purple-400 bg-slate-900 text-purple-100 ring-2 ring-purple-400/60 animate-pulse shadow-xl shadow-purple-500/30';
  }

  const status = ingressState?.status || 'ready';
  const statusColorMap = {
    syncing: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    reloaded: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    routing: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
    ready: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border-2 p-3 flex flex-col justify-between cursor-pointer transition-all w-full h-full relative shadow-2xl backdrop-blur-sm ${borderClass}`}
    >
      {/* Target Handle from API Server (Left top) */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-from-api"
        className="w-2.5 h-2.5 bg-blue-400 !left-[-6px] !top-[18%]"
        title="Watch Events from kube-apiserver"
      />

      {/* Target & Source Handles with End Users (Right) */}
      <Handle
        type="target"
        position={Position.Right}
        id="target-from-user"
        className="w-2.5 h-2.5 bg-pink-500 !right-[-6px] !top-[40%]"
        title="Inbound HTTPS/443 Traffic from End Users"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-to-user"
        className="w-2.5 h-2.5 bg-emerald-400 !right-[-6px] !top-[60%]"
        title="200 OK Response to End Users"
      />

      {/* Source Handles to Worker Nodes (Left) */}
      <Handle
        type="source"
        position={Position.Left}
        id="source-to-node1"
        className="w-2.5 h-2.5 bg-purple-500 !left-[-6px] !top-[50%]"
        title="L7 Proxy to Worker Node 1 (order-service)"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="source-to-node2"
        className="w-2.5 h-2.5 bg-purple-500 !left-[-6px] !top-[80%]"
        title="L7 Proxy to Worker Node 2 (product-service)"
      />

      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between gap-1.5 border-b border-slate-800 pb-1.5 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow">
              <Network className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white tracking-wide">Ingress Controller</span>
              </div>
              <span className="text-[9px] font-mono text-purple-400">ingress-nginx</span>
            </div>
          </div>

          <span
            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border uppercase ${statusColorMap[status]}`}
          >
            {status}
          </span>
        </div>

        {/* SSL & Reload Status */}
        <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono mb-2">
          <div className="bg-slate-950/70 p-1.5 rounded-md border border-slate-800 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate text-slate-300" title="TLS Termination">
              TLS : 443
            </span>
          </div>

          <div className="bg-slate-950/70 p-1.5 rounded-md border border-slate-800 flex items-center gap-1">
            <RefreshCw className={`w-3 h-3 text-cyan-400 shrink-0 ${status === 'reloaded' ? 'animate-spin' : ''}`} />
            <span className="truncate text-slate-300">
              Reloads: {ingressState?.reloadsCount ?? 1}
            </span>
          </div>
        </div>

        {/* Dynamic Upstream Routes */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 uppercase tracking-wider px-0.5">
            <span className="flex items-center gap-0.5">
              <Layers className="w-2.5 h-2.5 text-purple-400" />
              L7 Upstreams
            </span>
            <span className="text-purple-300">Pod IP Direct</span>
          </div>

          <div
            className={`text-[9px] font-mono p-1 rounded border flex items-center justify-between transition-colors ${
              activeRoute?.path === '/orders'
                ? 'bg-purple-950/60 border-purple-400/80 text-purple-200 shadow-sm'
                : 'bg-slate-950/50 border-slate-800/80 text-slate-400'
            }`}
          >
            <span className="font-semibold text-purple-300">/orders</span>
            <span className="flex items-center gap-1 text-[8.5px]">
              <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
              <span>10.244.1.25:8080</span>
            </span>
          </div>

          <div
            className={`text-[9px] font-mono p-1 rounded border flex items-center justify-between transition-colors ${
              activeRoute?.path === '/products'
                ? 'bg-purple-950/60 border-purple-400/80 text-purple-200 shadow-sm'
                : 'bg-slate-950/50 border-slate-800/80 text-slate-400'
            }`}
          >
            <span className="font-semibold text-purple-300">/products</span>
            <span className="flex items-center gap-1 text-[8.5px]">
              <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
              <span>10.244.2.18:8080</span>
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-2 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[8.5px] text-slate-500 font-mono">
        <span>Host: api.example.com</span>
        <span className="text-purple-400 font-semibold">L7 Reverse Proxy</span>
      </div>
    </div>
  );
};
