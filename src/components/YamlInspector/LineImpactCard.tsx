import React from 'react';
import { YamlLineImpact } from '../../types/yamlMapping';
import { COMPONENT_DETAILS } from '../../data/componentDetails';
import { Cpu, Terminal, ArrowRight, Layers } from 'lucide-react';

interface LineImpactCardProps {
  impact: YamlLineImpact | null;
  onComponentClick: (componentId: any) => void;
}

export const LineImpactCard: React.FC<LineImpactCardProps> = ({
  impact,
  onComponentClick
}) => {
  if (!impact) {
    return (
      <div className="bg-[#0F172A] rounded-xl border border-slate-800/90 p-4 text-slate-400 text-xs flex flex-col items-center justify-center text-center h-[180px]">
        <Layers className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
        <p className="font-medium text-slate-300">매니페스트(YAML) 줄을 클릭해 보세요</p>
        <p className="text-[11px] text-slate-500 mt-1 max-w-[280px]">
          선택한 줄이 쿠버네티스 클러스터 내부(API Server, etcd, Scheduler, cgroups 등)에서 어떤 변화를 일으키는지 1:1로 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0F172A] rounded-xl border border-amber-500/40 p-3.5 shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Background Accent Glow */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Lines {impact.startLine}-{impact.endLine}
            </span>
            <span className="text-xs font-bold text-white tracking-tight">
              {impact.title}
            </span>
          </div>

          <span className="text-[10px] font-mono text-amber-400/80 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {impact.keyword}
          </span>
        </div>

        {/* Affected Components Tag Bar */}
        <div className="flex items-center flex-wrap gap-1.5 mb-2.5">
          <span className="text-[10px] text-slate-400 font-medium">영향 컴포넌트:</span>
          {impact.affectedComponents.map((compId) => {
            const comp = COMPONENT_DETAILS[compId];
            return (
              <button
                key={compId}
                onClick={() => onComponentClick(compId)}
                className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 transition-all cursor-pointer"
                title="컴포넌트 상세 백과사전 보기"
              >
                <span>{comp ? comp.name.split(' ')[0] : compId}</span>
                <ArrowRight className="w-2.5 h-2.5 opacity-60" />
              </button>
            );
          })}
        </div>

        {/* Summary */}
        <p className="text-xs text-slate-200 leading-relaxed mb-2 font-normal">
          {impact.summary}
        </p>

        {/* Internal / Kernel Mechanism */}
        <div className="bg-slate-950/80 rounded-lg p-2 border border-slate-800/80 text-[11px] mb-2">
          <div className="flex items-center gap-1.5 text-amber-400/90 font-medium mb-1">
            <Cpu className="w-3 h-3" />
            <span>쿠버네티스 내부 / 리눅스 커널 동작:</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {impact.kernelOrInternal}
          </p>
        </div>
      </div>

      {/* CLI Command Hint */}
      {impact.cliCommand && (
        <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-md border border-slate-800 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-300 overflow-x-auto">
            <Terminal className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="text-slate-200 select-all">{impact.cliCommand}</span>
          </div>
        </div>
      )}
    </div>
  );
};
