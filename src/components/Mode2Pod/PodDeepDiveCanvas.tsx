import React from 'react';
import { PodLifecycleStep, ProbeStatus } from '../../types/podLifecycle';
import {
  Box,
  Cpu,
  HardDrive,
  Network,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Radio,
  Layers,
  Flame,
  RotateCcw
} from 'lucide-react';

interface PodDeepDiveCanvasProps {
  currentStep: PodLifecycleStep;
  onSimulateDelete: () => void;
  onResetLifecycle: () => void;
}

export const PodDeepDiveCanvas: React.FC<PodDeepDiveCanvasProps> = ({
  currentStep,
  onSimulateDelete,
  onResetLifecycle
}) => {
  const getProbeBadge = (status: ProbeStatus, name: string) => {
    switch (status) {
      case 'checking':
        return (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse font-mono font-medium">
            <Radio className="w-2.5 h-2.5 animate-spin" />
            {name}: Checking...
          </span>
        );
      case 'success':
        return (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-medium">
            <CheckCircle2 className="w-2.5 h-2.5" />
            {name}: Passed (200 OK)
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono font-medium">
            <ShieldAlert className="w-2.5 h-2.5" />
            {name}: Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700/60 font-mono">
            <Clock className="w-2.5 h-2.5" />
            {name}: Waiting
          </span>
        );
    }
  };

  return (
    <div className="bg-[#070D18] rounded-2xl border-2 border-indigo-600/70 p-4 shadow-2xl overflow-hidden">
      {/* Top Pod Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-indigo-900/60 pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-wide">
                Pod Runtime Deep-Dive 단면도
              </h2>
              <span
                className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                  currentStep.phase === 'Running'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse'
                    : currentStep.phase === 'Terminating'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                Phase: {currentStep.phase}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              파드 내부 Pause 컨테이너 격리 ➔ 리눅스 네임스페이스 & cgroups ➔ 3대 프로브
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {currentStep.phase !== 'Terminating' ? (
            <button
              onClick={onSimulateDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-700/60 text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>파드 삭제 (Terminating) 시뮬레이션</span>
            </button>
          ) : (
            <button
              onClick={onResetLifecycle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/60 text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>처음부터 다시 생성</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Pod Anatomy */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Side: Linux Kernel Isolation & cgroups (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
          {/* Linux Namespaces */}
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3 shadow-inner">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Linux Namespaces (격리 영역)</span>
            </div>
            <div className="space-y-1.5">
              {currentStep.linuxKernelDetails.namespaces.map((ns, idx) => (
                <div key={idx} className="bg-slate-950/80 p-2 rounded border border-slate-800/80 text-[11px]">
                  <div className="flex items-center justify-between font-mono mb-0.5">
                    <span className="font-bold text-indigo-300">CLONE_NEW{ns.name.toUpperCase()}</span>
                    <span className="text-[10px] text-slate-400">{ns.status}</span>
                  </div>
                  <p className="text-slate-400 text-[10px]">{ns.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Linux cgroups v2 */}
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3 shadow-inner">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Linux cgroups v2 (하드웨어 자원 한계)</span>
            </div>
            <div className="space-y-1.5">
              {currentStep.linuxKernelDetails.cgroups.map((cg, idx) => (
                <div key={idx} className="bg-slate-950/80 p-2 rounded border border-slate-800/80 text-[11px] font-mono flex items-center justify-between">
                  <span className="text-amber-300 font-semibold">{cg.resource}</span>
                  <span className="text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[10px]">
                    {cg.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Pod Interior Containers, Network & Probes (8 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-3">
          {/* 1. Infrastructure Layer: Pause Container + CNI IP */}
          <div className={`rounded-xl border p-3 transition-all ${
            currentStep.containers.pause.status === 'running'
              ? 'bg-blue-950/40 border-blue-500/50 shadow-lg shadow-blue-500/10'
              : 'bg-slate-900/40 border-slate-800 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-600/30 text-blue-300 flex items-center justify-center text-[10px] font-mono font-bold">
                  P
                </div>
                <span className="text-xs font-bold text-slate-100">Pause Container (기반 샌드박스)</span>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-950/80 px-2 py-0.2 rounded border border-blue-800">
                  registry.k8s.io/pause:3.9
                </span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                currentStep.containers.pause.status === 'running'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-500'
              }`}>
                {currentStep.containers.pause.status === 'running' ? 'Active' : 'Uninitialized'}
              </span>
            </div>

            <div className="flex items-center flex-wrap gap-4 text-xs font-mono bg-slate-950/70 p-2 rounded border border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-400">Pod IP:</span>
                <span className="text-white font-bold">{currentStep.containers.pause.ip || '미할당 (Pending)'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-slate-400">Volume:</span>
                <span className="text-teal-300 font-bold">
                  {currentStep.volumeStatus.mounted ? `${currentStep.volumeStatus.name} (Mounted)` : '대기 중'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Container Execution Lanes: Init Containers ➔ Main Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Init Container Box */}
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200">1. Init Containers</span>
                <span className="text-[10px] text-slate-500 font-mono">순차 선행 작업</span>
              </div>

              {currentStep.containers.init.map((ic, idx) => (
                <div key={idx} className="bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-semibold text-purple-300 block">
                      {ic.name}
                    </span>
                    <span className="text-[10px] text-slate-500">DB 연결 및 사전 캐시 생성</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    ic.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : ic.status === 'running'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {ic.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Main Application Container Box */}
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200">2. Main Application Container</span>
                <span className="text-[10px] text-slate-500 font-mono">실제 워크로드</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-semibold text-sky-300 block">
                    {currentStep.containers.main.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Image: {currentStep.containers.main.image}
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  currentStep.containers.main.status === 'running'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse font-bold'
                    : currentStep.containers.main.status === 'terminating'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse font-bold'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {currentStep.containers.main.status}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Probes Radar Network */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-3 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Kubelet 3대 프로브(Probe) 헬스체크 모니터</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">10s Interval</span>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              {getProbeBadge(currentStep.probes.startup, 'Startup Probe')}
              {getProbeBadge(currentStep.probes.readiness, 'Readiness Probe')}
              {getProbeBadge(currentStep.probes.liveness, 'Liveness Probe')}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              • <strong className="text-slate-300">Readiness Probe</strong> 통과 시 파드가 즉시 Service Endpoints에 등록되어 트래픽 수신을 개시합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
