import React from 'react';
import { FlowchartNode } from '../../types/pipeline';
import { CheckCircle2, ArrowRight, XCircle, Sparkles } from 'lucide-react';

interface FlowchartSequenceProps {
  nodes: FlowchartNode[];
  activeNodeId: string;
  currentStepIndex: number;
  onSelectStep: (stepIndex: number) => void;
  title?: string;
  subTitle?: string;
  badgeText?: string;
  badgeColorClass?: string;
  isMode1?: boolean;
}

export const FlowchartSequence: React.FC<FlowchartSequenceProps> = ({
  nodes,
  activeNodeId,
  currentStepIndex,
  onSelectStep,
  title = '단일 Pod (pod.yaml) 생성 순서도 (Flowchart)',
  subTitle = '클라이언트 매니페스트 제출부터 컨트롤러 우회, 스케줄링, CRI 기동까지의 파이프라인',
  badgeText = 'Direct Creation Pipeline',
  badgeColorClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  isMode1 = false
}) => {
  return (
    <div className="bg-[#0B1222] rounded-2xl border-2 border-blue-600/50 p-4 shadow-2xl overflow-hidden">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-wide flex items-center gap-2">
              {title}
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeColorClass}`}>
                {badgeText}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              {subTitle}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> 완료
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" /> 진행 중
          </span>
          {!isMode1 && (
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-600" /> 우회(건너뜀)
            </span>
          )}
        </div>
      </div>

      {/* Responsive Flowchart Chain */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2 px-1">
        {nodes.map((node, idx) => {
          const isActive = node.id === activeNodeId;
          const isBypassed = node.type === 'bypassed';
          const stepTarget = isMode1 ? idx : idx > 3 ? idx - 1 : idx;

          let cardStyle = 'bg-slate-900/80 border-slate-800 text-slate-400';
          if (isBypassed) {
            cardStyle = 'bg-rose-950/20 border-rose-900/40 text-rose-400/70 line-through opacity-70';
          } else if (isActive) {
            cardStyle = 'bg-gradient-to-b from-sky-950/90 to-blue-950/90 border-sky-400 text-white shadow-lg shadow-sky-500/25 ring-2 ring-sky-400/50 scale-[1.03] animate-pulse';
          } else if (stepTarget < currentStepIndex) {
            cardStyle = 'bg-slate-900/90 border-emerald-500/40 text-slate-200';
          }

          return (
            <React.Fragment key={node.id}>
              {/* Node Card */}
              <button
                disabled={isBypassed}
                onClick={() => onSelectStep(stepTarget)}
                className={`flex flex-col items-start p-2.5 rounded-xl border transition-all duration-200 min-w-[135px] max-w-[150px] shrink-0 text-left ${cardStyle} ${
                  isBypassed ? 'cursor-not-allowed' : 'cursor-pointer hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded bg-black/40">
                    {node.type}
                  </span>
                  {isActive ? (
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                  ) : stepTarget < currentStepIndex && !isBypassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isBypassed ? (
                    <XCircle className="w-3.5 h-3.5 text-rose-500/60" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-700" />
                  )}
                </div>

                <span className="text-xs font-bold leading-tight line-clamp-1">
                  {node.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 leading-tight">
                  {node.subName}
                </span>
              </button>

              {/* Connecting Arrow */}
              {idx < nodes.length - 1 && (
                <div className="shrink-0 px-0.5 text-slate-600">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
