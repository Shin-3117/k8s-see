import React from 'react';
import { ComponentDetailInfo, COMPONENT_DETAILS } from '../../data/componentDetails';
import { K8sComponentId } from '../../types/pipeline';
import { X, BookOpen, Terminal, CheckCircle2, FolderOpen } from 'lucide-react';

interface ComponentDetailModalProps {
  componentId: K8sComponentId | null;
  onClose: () => void;
}

export const ComponentDetailModal: React.FC<ComponentDetailModalProps> = ({
  componentId,
  onClose
}) => {
  if (!componentId) return null;

  const info: ComponentDetailInfo = COMPONENT_DETAILS[componentId];
  if (!info) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0F172A] w-full max-w-2xl rounded-2xl border-2 border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-8 rounded-full ${info.badgeColor}`} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">{info.name}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {info.category}
                </span>
              </div>
              <p className="text-xs text-blue-400 font-medium mt-0.5">{info.k8sRole}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs leading-relaxed">
          {/* Summary Box */}
          <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl p-3.5 text-slate-200 font-medium">
            {info.summary}
          </div>

          {/* Deep Dive Bullet Points */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>핵심 아키텍처 및 내부 원리</span>
            </h4>
            <div className="space-y-1.5 pl-1">
              {info.deepDive.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Config & Manifest Paths */}
          {info.configPaths.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>주요 설정 파일 및 매니페스트 경로</span>
              </h4>
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                {info.configPaths.map((p, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-900 text-amber-300/90 px-2 py-1 rounded border border-slate-800"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Useful CLI Commands */}
          {info.cliCommands.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>관련 유용한 CLI 명령어</span>
              </h4>
              <div className="space-y-1 font-mono text-[11px]">
                {info.cliCommands.map((cmd, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 p-2 rounded border border-slate-800 text-slate-300 flex items-center gap-2 select-all"
                  >
                    <span className="text-blue-400 select-none">$</span>
                    <span>{cmd}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-900 px-5 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
