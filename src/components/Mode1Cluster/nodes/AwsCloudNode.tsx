import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { HardDrive, ShieldCheck, Zap } from 'lucide-react';

interface AwsCloudNodeData {
  isActive: boolean;
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: () => void;
  volumeState?: {
    volumeId: string;
    size: string;
    type: string;
    status: 'creating' | 'available' | 'attached';
    attachedNode?: string;
    devicePath?: string;
  };
}

export const AwsCloudNode: React.FC<{ data: AwsCloudNodeData }> = ({ data }) => {
  let borderClass = 'border-amber-500/40 bg-slate-900/95 text-slate-300 shadow-xl shadow-amber-950/20';
  if (data.isSelected) {
    borderClass = 'ring-2 ring-amber-400 border-amber-400 bg-slate-900 text-white shadow-2xl shadow-amber-500/40';
  } else if (data.isHighlighted) {
    borderClass = 'border-amber-400 bg-slate-900 text-amber-200 ring-2 ring-amber-400/50 animate-pulse';
  } else if (data.isActive) {
    borderClass = 'border-amber-400 bg-slate-900 text-amber-200 ring-2 ring-amber-400/60 animate-pulse shadow-2xl shadow-amber-500/40';
  }

  const vol = data.volumeState;

  return (
    <div
      onClick={data.onClick}
      className={`rounded-2xl border-2 p-3 flex flex-col cursor-pointer transition-all w-[250px] min-h-[185px] ${borderClass} relative`}
    >
      {/* Handle from Cloud Controller Manager (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="api-target"
        className="w-2.5 h-2.5 bg-amber-500 !left-[-6px] !top-[65%]"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="api-source"
        className="w-2.5 h-2.5 bg-amber-500 !left-[-6px] !top-[65%]"
      />

      {/* Handle to Worker Node 1 (Bottom-Right) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="attach-source"
        className="w-2.5 h-2.5 bg-amber-500 !bottom-[-6px] !left-[80%]"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="attach-target"
        className="w-2.5 h-2.5 bg-amber-500 !bottom-[-6px] !left-[80%]"
      />

      {/* Header: AWS Logo & Region */}
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shrink-0">
            <span className="text-[11px] font-black tracking-tighter">AWS</span>
          </div>
          <div>
            <div className="text-[19px] font-black text-amber-300 leading-none tracking-tight">
              AWS Cloud
            </div>
            <div className="text-[9px] font-mono text-slate-400 mt-0.5">
              Region: us-east-1
            </div>
          </div>
        </div>
        <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30 shrink-0">
          AWS API
        </span>
      </div>

      {/* Elastic Block Store (EBS) Volume Status Card */}
      {vol ? <div className="bg-slate-950/80 rounded-xl p-2 border border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-200">
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            <span>Amazon EBS (gp3)</span>
          </div>
          <span
            className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded ${
              vol.status === 'attached'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : vol.status === 'available'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
            }`}
          >
            {vol.status === 'attached'
              ? 'ATTACHED'
              : vol.status === 'available'
              ? 'AVAILABLE'
              : 'CREATING'}
          </span>
        </div>

        {/* Volume Details */}
        <div className="space-y-0.5 text-[9px] font-mono">
          <div className="flex items-center justify-between text-slate-400">
            <span>Vol-ID:</span>
            <span className="text-amber-200 font-semibold">{vol.volumeId}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Capacity:</span>
            <span className="text-slate-200">{vol.size}</span>
          </div>
          {vol.devicePath && (
            <div className="flex items-center justify-between text-slate-400">
              <span>Host Device:</span>
              <span className="text-emerald-300 font-bold">{vol.devicePath}</span>
            </div>
          )}
        </div>

        {/* Specs Badges */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[8px] text-slate-400">
          <span className="flex items-center gap-0.5 text-amber-400/90">
            <Zap className="w-2.5 h-2.5" />
            3,000 IOPS
          </span>
          <span className="flex items-center gap-0.5 text-slate-400">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
            KMS Encrypted
          </span>
        </div>
      </div> : <p className="text-xs text-slate-400 p-3">현재 외부 볼륨 없음 · PVC/회수 상태 확인</p>}
    </div>
  );
};
