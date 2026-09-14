import { YamlPreset } from '../../types/yamlMapping';
import { Play, Sparkles, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

interface YamlEditorProps {
  preset: YamlPreset;
  activeLines: number[];
  selectedLine: number | null;
  onSelectLine: (lineNumber: number) => void;
  onApplyManifest: () => void;
  isSimulating: boolean;
}

export const YamlEditor: React.FC<YamlEditorProps> = ({
  preset,
  activeLines,
  selectedLine,
  onSelectLine,
  onApplyManifest,
  isSimulating
}) => {
  const lines = preset.content.split('\n');

  // Find which impact applies to the currently selected line
  const currentImpactIndex = preset.impacts.findIndex(
    (imp) => selectedLine !== null && selectedLine >= imp.startLine && selectedLine <= imp.endLine
  );

  const handlePrevImpact = () => {
    if (currentImpactIndex > 0) {
      onSelectLine(preset.impacts[currentImpactIndex - 1].startLine);
    } else {
      onSelectLine(preset.impacts[preset.impacts.length - 1].startLine);
    }
  };

  const handleNextImpact = () => {
    if (currentImpactIndex < preset.impacts.length - 1) {
      onSelectLine(preset.impacts[currentImpactIndex + 1].startLine);
    } else {
      onSelectLine(preset.impacts[0].startLine);
    }
  };

  return (
    <div className="bg-[#0F172A] rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-full">
      {/* Header Bar */}
      <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono font-medium text-slate-300 ml-1">
            manifest.yaml
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">
            {lines.length} lines
          </span>
        </div>

        {/* Apply Button */}
        <button
          onClick={onApplyManifest}
          disabled={isSimulating}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
            isSimulating
              ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 active:scale-95'
          }`}
        >
          {isSimulating ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 animate-spin" />
              <span>클러스터 반영 중...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Apply (적용하기)</span>
            </>
          )}
        </button>
      </div>

      {/* Sub-toolbar: Line-by-Line Stepper */}
      <div className="bg-slate-950/60 px-3 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-300 font-medium">줄별 클러스터 변화 분석:</span>
          <span className="text-amber-400/90 font-mono text-[10px]">
            {selectedLine ? `${selectedLine}행 선택됨` : '줄을 클릭해보세요'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevImpact}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
            title="이전 의미 블록으로 이동"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-slate-500">
            {currentImpactIndex >= 0 ? `${currentImpactIndex + 1}/${preset.impacts.length}` : '-'}
          </span>
          <button
            onClick={handleNextImpact}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
            title="다음 의미 블록으로 이동"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="p-2 overflow-y-auto flex-1 font-mono-code text-xs leading-relaxed max-h-[460px]">
        {lines.map((line, idx) => {
          const lineNumber = idx + 1;
          // Check if this line is in the selected line or active impact range
          const impact = preset.impacts.find(
            (imp) => lineNumber >= imp.startLine && lineNumber <= imp.endLine
          );
          const isSelected = selectedLine !== null && impact && selectedLine >= impact.startLine && selectedLine <= impact.endLine;
          const isPipelineActive = activeLines.includes(lineNumber);

          return (
            <div
              key={idx}
              onClick={() => onSelectLine(lineNumber)}
              className={`group flex items-center rounded px-2 py-0.5 cursor-pointer transition-all duration-150 ${
                isSelected
                  ? 'bg-amber-500/20 text-amber-200 border-l-2 border-amber-400 font-semibold'
                  : isPipelineActive
                  ? 'bg-blue-500/20 text-blue-200 border-l-2 border-blue-400'
                  : 'hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              {/* Line Number */}
              <span
                className={`w-7 text-right select-none pr-3 text-[11px] font-mono ${
                  isSelected
                    ? 'text-amber-400 font-bold'
                    : isPipelineActive
                    ? 'text-blue-400 font-bold'
                    : 'text-slate-600 group-hover:text-slate-400'
                }`}
              >
                {lineNumber}
              </span>

              {/* Code Line Content with Basic Syntax Coloring */}
              <span className="flex-1 whitespace-pre">
                {formatYamlLine(line)}
              </span>

              {/* Impact Indicator Tag on hover/selected */}
              {impact && impact.startLine === lineNumber && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-sans uppercase tracking-tight ml-2 transition-opacity ${
                    isSelected
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30 opacity-100'
                      : 'bg-slate-800 text-slate-400 opacity-60 group-hover:opacity-100'
                  }`}
                >
                  {impact.keyword}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Simple syntax colorizer for YAML
function formatYamlLine(line: string) {
  if (line.trim().startsWith('#')) {
    return <span className="text-slate-500 italic">{line}</span>;
  }
  const parts = line.split(':');
  if (parts.length > 1) {
    const key = parts[0];
    const rest = parts.slice(1).join(':');
    return (
      <>
        <span className="text-sky-300 font-medium">{key}</span>
        <span className="text-slate-400">:</span>
        <span className="text-emerald-300">{rest}</span>
      </>
    );
  }
  return <span>{line}</span>;
}
