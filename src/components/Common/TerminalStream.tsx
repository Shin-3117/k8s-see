import React, { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

interface TerminalStreamProps {
  logs: {
    command: string;
    output: string[];
  }[];
  title?: string;
}

export const TerminalStream: React.FC<TerminalStreamProps> = ({
  logs,
  title = '명령과 로그 · 시뮬레이션 예시'
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="bg-[#0A0F1D] rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col font-mono-code text-xs">
      {/* Terminal Title Bar */}
      <div className="bg-slate-900/90 px-3 py-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-[11px] text-slate-300 font-semibold flex items-center gap-1 ml-1">
            <Terminal className="w-3 h-3 text-emerald-400" />
            {title}
          </span>
        </div>

        <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          예시 출력
        </span>
      </div>

      {/* Terminal Body */}
      <div className="p-3 overflow-y-auto max-h-[220px] space-y-3 leading-relaxed text-[11px]">
        {logs.map((log, idx) => (
          <div key={idx} className="space-y-1">
            {/* Command Line with Prompt */}
            <div className="flex items-center justify-between text-slate-300 group">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold overflow-x-auto">
                <span className="text-blue-400 select-none">$</span>
                <span className="text-slate-100 select-all">{log.command}</span>
              </div>
              <button
                onClick={() => handleCopy(log.command, idx)}
                className="opacity-60 group-hover:opacity-100 focus:opacity-100 p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-opacity"
                title="명령어 복사"
              >
                {copiedIndex === idx ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* Output Lines */}
            <div className="pl-3 border-l border-slate-800/80 space-y-0.5 text-slate-400 font-mono">
              {log.output.map((line, lIdx) => (
                <div
                  key={lIdx}
                  className={`whitespace-pre-wrap break-all ${
                    line.includes('Created') || line.includes('Ready') || line.includes('PASSED') || line.includes('Successfully')
                      ? 'text-emerald-300/90'
                      : line.includes('Pending') || line.includes('Warning')
                      ? 'text-amber-300/90'
                      : line.includes('Error') || line.includes('Failed')
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
