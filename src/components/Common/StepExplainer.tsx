import { Cpu } from 'lucide-react';

interface StepExplainerProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  subTitle: string;
  description: string;
  k8sMechanism: string;
}

export const StepExplainer: React.FC<StepExplainerProps> = ({
  stepNumber,
  totalSteps,
  title,
  subTitle,
  description,
  k8sMechanism
}) => {
  return (
    <div className="bg-[#0F172A] rounded-xl border border-slate-800 p-4 shadow-xl flex flex-col justify-between">
      <div>
        {/* Step Badge & Title */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Step {stepNumber} of {totalSteps}
          </span>
          <h3 className="text-sm font-bold text-white tracking-tight">
            {title}
          </h3>
        </div>

        {/* Subtitle command badge */}
        <div className="text-xs font-mono text-cyan-400 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800 mb-3 w-fit">
          {subTitle}
        </div>

        {/* Main Human Explanation */}
        <p className="text-xs text-slate-200 leading-relaxed mb-3">
          {description}
        </p>

        {/* Behind the Scenes K8s Mechanism */}
        <div className="bg-slate-950/90 rounded-lg p-3 border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-blue-400 font-bold mb-1">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>쿠버네티스 내부 동작 원리 (Behind the Scenes):</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {k8sMechanism}
          </p>
        </div>
      </div>
    </div>
  );
};
