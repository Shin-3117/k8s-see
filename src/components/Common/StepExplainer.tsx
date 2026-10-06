import { StepExplanation } from "../../data/learningScenarios";
interface StepExplainerProps extends Partial<StepExplanation> {
  stepNumber: number;
  totalSteps: number;
  title: string;
  subTitle: string;
  description: string;
  k8sMechanism: string;
}
export function StepExplainer({
  stepNumber,
  totalSteps,
  title,
  subTitle,
  description,
  k8sMechanism,
  summary,
  actor,
  action,
  reason,
  result,
  sources,
}: StepExplainerProps) {
  return (
    <section className="learning-panel h-full" aria-label="현재 단계 설명">
      <p className="text-xs text-blue-400 font-mono mb-3">
        현재 단계 {stepNumber} / {totalSteps}
      </p>
      <h2 className="text-lg font-bold leading-7 mb-2">{title}</h2>
      <p className="text-sm text-blue-200 leading-7 mb-4">
        {summary ?? description}
      </p>
      <dl className="space-y-3 text-sm">
        {[
          ["누가", actor],
          ["무엇을", action],
          ["왜", reason],
          ["결과", result],
        ].map(([label, value]) =>
          value ? (
            <div key={label}>
              <dt className="text-xs text-slate-500 mb-1">{label}</dt>
              <dd className="text-slate-200 leading-6">{value}</dd>
            </div>
          ) : null,
        )}
      </dl>
      <details className="mt-5 border-t border-slate-700 pt-3">
        <summary className="text-sm cursor-pointer text-slate-400">
          심화 설명과 구현 조건
        </summary>
        <p className="text-sm leading-7 text-slate-300 mt-3">{description}</p>
        <p className="text-sm leading-7 text-slate-400 mt-3">{k8sMechanism}</p>
        <p className="text-xs font-mono text-cyan-400 mt-3 break-words">
          {subTitle}
        </p>
      </details>
      {sources?.map((url) => (
        <a
          key={url}
          className="inline-block text-xs text-blue-400 mt-4 underline"
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          공식 근거 ↗
        </a>
      ))}
    </section>
  );
}
