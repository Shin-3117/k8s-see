import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';

interface PlaybackBarProps {
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  onPlayPause: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onReset: () => void;
  onStepSelect: (index: number) => void;
  onSpeedChange: (speed: number) => void;
  stepTitles: string[];
}

export const PlaybackBar: React.FC<PlaybackBarProps> = ({
  currentStepIndex,
  totalSteps,
  isPlaying,
  speed,
  onPlayPause,
  onPrevStep,
  onNextStep,
  onReset,
  onStepSelect,
  onSpeedChange,
  stepTitles
}) => {
  return (
    <div className="bg-[#0F172A] rounded-xl border border-slate-800 p-3 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
      {/* Control Buttons */}
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={onReset}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="현재 페이지 리셋" aria-label="현재 페이지 리셋"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onPrevStep}
          disabled={currentStepIndex === 0}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
          title="이전 단계" aria-label="이전 단계"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={onPlayPause}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-md active:scale-95 ${
            isPlaying
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>일시정지</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>자동 재생</span>
            </>
          )}
        </button>

        <button
          onClick={onNextStep}
          disabled={currentStepIndex === totalSteps - 1}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
          title="다음 단계" aria-label="다음 단계"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Speed toggle */}
        <div className="ml-2 flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px] font-mono">
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              aria-label={`재생 속도 ${s}배`}
              aria-pressed={speed === s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-1 rounded transition-colors ${
                speed === s
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Timeline Stepper */}
      <div className="flex min-w-0 items-center gap-1 overflow-x-auto max-w-full py-1">
        {stepTitles.map((title, idx) => {
          const isActive = idx === currentStepIndex;
          const isPassed = idx < currentStepIndex;

          return (
            <button
              key={idx}
              aria-label={`단계 ${idx + 1}: ${title}`}
              aria-current={isActive ? 'step' : undefined}
              title={title}
              onClick={() => onStepSelect(idx)}
              className={`group flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap border ${
                isActive
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500 font-bold shadow-md shadow-blue-500/10'
                  : isPassed
                  ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-slate-900/40 text-slate-500 border-slate-800 hover:bg-slate-800/40'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono ${
                  isActive
                    ? 'bg-blue-500 text-white font-bold'
                    : isPassed
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {idx + 1}
              </span>
              <span className="hidden xl:inline">{title.split(':')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
