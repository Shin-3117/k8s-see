import React from 'react';
import { AppMode } from '../types/pipeline';
import { YAML_PRESETS } from '../data/yamlPresets';
import { Layers, Box, FileCode2, BookOpen, GitFork, HardDrive, Network } from 'lucide-react';

interface HeaderProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  selectedPresetId: string;
  onPresetChange: (presetId: string) => void;
  onOpenArchitectureDocs: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onModeChange,
  selectedPresetId,
  onPresetChange,
  onOpenArchitectureDocs
}) => {
  return (
    <header className="bg-[#0F172A] border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5 shadow-lg">
      <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-[#0F172A] rounded-[10px] flex items-center justify-center">
              {/* Kubernetes Helm Wheel SVG */}
              <svg className="w-6 h-6 text-blue-400 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                K8s<span className="text-blue-400">See</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Interactive Visualizer
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">쿠버네티스 내부 동작 & 파드 라이프사이클 시각화</p>
          </div>
        </div>

        {/* 3 Core Modes Switcher */}
        <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-700/80 shadow-inner flex-wrap gap-1">
          <button
            onClick={() => onModeChange('mode1-manifest')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentMode === 'mode1-manifest'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>모드 1: Deployment 적용</span>
          </button>

          <button
            onClick={() => onModeChange('mode2-pod-lifecycle')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentMode === 'mode2-pod-lifecycle'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>모드 2: Pod 런타임 단면도</span>
          </button>

          <button
            onClick={() => onModeChange('mode3-separated-apply')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentMode === 'mode3-separated-apply'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <GitFork className="w-3.5 h-3.5 text-cyan-300" />
            <span>모드 3: ConfigMap / Deploy / Service</span>
          </button>

          <button
            onClick={() => onModeChange('mode4-pvc')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentMode === 'mode4-pvc'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-amber-300" />
            <span>모드 4: PVC & 외부 스토리지(AWS)</span>
          </button>

          <button
            onClick={() => onModeChange('mode5-ingress')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentMode === 'mode5-ingress'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-purple-300" />
            <span>모드 5: Ingress (L7 라우팅)</span>
          </button>
        </div>

        {/* Right Tools: Presets & Encyclopedia */}
        <div className="flex items-center gap-2.5">
          {currentMode === 'mode1-manifest' && (
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
              <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400 text-[11px] hidden sm:inline">템플릿:</span>
              <select
                value={selectedPresetId}
                onChange={(e) => onPresetChange(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer font-medium"
              >
                {YAML_PRESETS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-800 text-slate-200">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentMode === 'mode3-separated-apply' && (
            <div className="flex items-center gap-1.5 bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-800/50 text-xs shadow-inner">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-cyan-300 font-semibold text-[11px]">Spring Boot H2 DB + API Server (분리 배포)</span>
            </div>
          )}

          {currentMode === 'mode5-ingress' && (
            <div className="flex items-center gap-1.5 bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-800/50 text-xs shadow-inner">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              <span className="text-purple-300 font-semibold text-[11px]">L7 Reverse Proxy & Path Routing</span>
            </div>
          )}

          <button
            onClick={onOpenArchitectureDocs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
            title="쿠버네티스 아키텍처 백과사전 열기"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>K8s 백과사전</span>
          </button>
        </div>
      </div>
    </header>
  );
};
