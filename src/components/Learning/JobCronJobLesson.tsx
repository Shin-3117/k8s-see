import { useState } from "react";
import { BATCH_EXAMPLES, BATCH_SOURCES, CRONJOB_YAML, JOB_YAML } from "../../data/jobCronJobSteps";
import type { BatchStep } from "../../data/jobCronJobSteps";
import { LearningSnippet } from "./LearningSnippet";

const concepts = [
  { id: "cronjob", label: "CronJob", detail: "일정과 jobTemplate을 관리합니다. CronJob 컨트롤러가 예약 시각에 Job을 만들며, Pod 생성은 Job 컨트롤러가 맡습니다." },
  { id: "job", label: "Job", detail: "Job 컨트롤러는 Pod를 직접 생성하고 성공 횟수를 집계합니다. completions를 채우면 Complete, 재시도 한도나 실행 제한을 넘으면 Failed 조건을 기록합니다." },
  { id: "pod", label: "Pod", detail: "실제 배치 프로세스를 실행합니다. 종료 코드 0이면 Succeeded, 이 예시의 Never 정책에서 오류로 끝나면 Failed입니다. Pod phase와 Job 조건은 서로 다른 상태입니다." },
  { id: "api", label: "API Server · etcd", detail: "컨트롤러·스케줄러·kubelet은 API Server를 통해 리소스를 읽고 변경합니다. 리소스 사양과 상태는 etcd에 저장됩니다." },
  { id: "execution", label: "Scheduler · kubelet · 런타임", detail: "스케줄러는 미배정 Pod의 노드를 선택해 API에 기록합니다. 노드의 kubelet이 이를 감지하고 런타임을 통해 프로세스를 실행합니다. 예약 시각 판단은 CronJob 컨트롤러의 역할입니다." },
];
export function JobCronJobLesson({ example, onExampleChange }: { example: string; onExampleChange: (value: string) => void }) {
  return (
    <section className="learning-panel space-y-4">
      <label className="flex flex-wrap items-center gap-3 text-sm">
        배치 실행 예시
        <select aria-label="배치 실행 예시" className="learning-button max-w-full" value={example} onChange={(event) => onExampleChange(event.target.value)}>
          {Object.entries(BATCH_EXAMPLES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm leading-7">
          <caption className="text-left text-slate-400 mb-2">Deployment · Job · CronJob 비교</caption>
          <thead><tr>{["리소스", "목적", "관리 관계"].map((label) => <th key={label} className="p-2">{label}</th>)}</tr></thead>
          <tbody>
            {[
              ["Deployment", "웹 서버처럼 계속 실행할 앱", "Deployment → ReplicaSet → Pod"],
              ["Job", "데이터 처리·마이그레이션 등 끝나는 작업", "Job → Pod"],
              ["CronJob", "정기 보고서·주기적 정리 작업", "CronJob → Job → Pod"],
            ].map((row) => <tr key={row[0]} className="border-t border-slate-800">{row.map((cell, index) => <td key={index} className="p-2 align-top">{cell}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-slate-300 leading-7">예약 실행은 정확히 한 번을 보장하지 않습니다. Job 재시도나 예약 중복에 대비해 같은 입력으로 여러 번 실행해도 결과가 중복되지 않는 멱등성을 갖추세요.</p>
    </section>
  );
}

export function JobCronJobCanvas({ step, example }: { step: BatchStep; example: string }) {
  const [selected, setSelected] = useState("job");
  const cron = ["cron", "forbid", "suspended"].includes(example);
  const records = step.etcdState?.records ?? [];
  const detail = concepts.find((concept) => concept.id === selected)!;
  return (
    <section className="learning-panel space-y-4 min-w-0" aria-label="Job과 CronJob 실행 구성도">
      <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-400"><span>위에서 아래로 생성 · 버튼을 눌러 역할 확인</span><span data-testid="batch-clock">{step.clock}</span></div>
      <div className="space-y-2">
        {concepts.slice(cron ? 0 : 1, 3).map((concept, index) => {
          const kind = concept.label;
          const items = records.filter((record) => record.type === kind);
          return (
            <div key={concept.id}>
              {index > 0 ? <p className="text-center text-xs text-slate-500 pb-2">↓ {concept.id === "job" ? "CronJob 컨트롤러가 Job 생성" : "Job 컨트롤러가 Pod 생성"}</p> : null}
              <button className={`w-full rounded-xl border p-4 text-left ${step.activeConcepts.includes(concept.id) ? "bg-sky-950 border-sky-400" : "bg-slate-900 border-slate-700"} ${selected === concept.id ? "ring-2 ring-amber-400" : ""}`} aria-pressed={selected === concept.id} onClick={() => setSelected(concept.id)}>
                <span className="font-bold text-blue-200">{kind}</span>
                <span className="text-xs text-slate-400 ml-3">{items.length}개</span>
                <span className="block text-xs leading-6 mt-2 break-words">
                  {items.length ? items.map((item) => <span key={item.key} className="block">{item.data.metadata.name} · {kind === "CronJob" ? item.data.spec.suspend ? "예약 중지" : "5분마다 · Asia/Seoul" : kind === "Job" ? item.data.status.conditions[0]?.type ?? `진행 중 (active=${item.data.status.active})` : item.data.status.phase}</span>) : "아직 생성되지 않음"}
                </span>
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="배치 실행 구성 요소 선택">
        {concepts.slice(3).map((concept) => <button key={concept.id} className="learning-button" aria-pressed={selected === concept.id} onClick={() => setSelected(concept.id)}>{concept.label}</button>)}
      </div>
      <p className="text-xs text-slate-400">파란 테두리: 현재 단계 · 노란 테두리: 선택한 구성 요소. 생성·상태 변경은 API Server를 거칩니다.</p>
      <div className="rounded-lg bg-slate-900 p-3 space-y-2"><h2 className="font-bold text-blue-200">{detail.label}</h2><p className="text-sm leading-7 text-slate-300">{detail.detail}</p></div>
      <p data-testid="batch-result" className="text-sm text-emerald-200 leading-7">{step.result}</p>
      <div className="space-y-2 text-xs" aria-label="배치 Pod 상태">
        {records.filter((record) => record.type === "Pod").map((record) => <p key={record.key} className="rounded border border-slate-700 p-3 break-words leading-6">{record.data.metadata.name} · {record.data.status.phase}<br />UID: {record.data.metadata.uid} · 재시작: {record.data.status.containerStatuses[0]?.restartCount ?? 0} · 노드: {record.data.spec.nodeName ?? "미배정"}</p>)}
      </div>
    </section>
  );
}

export function JobCronJobYaml({ example }: { example: string }) {
  const cron = ["cron", "forbid", "suspended"].includes(example);
  const jobYaml = example === "failed" ? JOB_YAML.replace("backoffLimit: 2", "backoffLimit: 0").replace("echo batch-done; sleep 5", "echo simulated-error; exit 1") : JOB_YAML;
  const cronYaml = example === "suspended" ? CRONJOB_YAML.replace("suspend: false", "suspend: true") : example === "forbid" ? CRONJOB_YAML.replace("activeDeadlineSeconds: 120", "activeDeadlineSeconds: 600").replace("sleep 5", "sleep 360") : CRONJOB_YAML;
  return (
    <div className="space-y-4">
      <LearningSnippet title={cron ? "cronjob.yaml · Job 예약 생성" : "job.yaml · 작업 완료 관리"} code={cron ? cronYaml : jobYaml} />
      {example === "retry" ? <p className="text-sm leading-7 text-slate-300">재시도 시뮬레이션은 첫 Pod에서 오류가 났다가 다음 Pod가 성공한다고 가정합니다. 이 YAML은 정상 작업 예시이므로 재시도를 재현하려면 외부 상태를 이용해 첫 시도만 실패하는 작업으로 바꾸세요.</p> : null}
      <LearningSnippet title="등록과 상태 확인 · 직접 실행하는 명령" code={cron ? `kubectl apply -f cronjob.yaml
kubectl get cronjob,job,pod -n default
kubectl describe cronjob scheduled-demo -n default
# 예약을 기다리지 않고 수동 실행: 별도 Job 생성
kubectl create job manual-demo --from=cronjob/scheduled-demo -n default
kubectl logs job/manual-demo -n default` : `kubectl apply -f job.yaml
kubectl get job,pod -n default
kubectl describe job batch-demo -n default
kubectl logs job/batch-demo -n default
kubectl wait --for=condition=complete job/batch-demo -n default --timeout=180s
# 실패 원인과 이전 Pod도 확인
kubectl get pods -l batch.kubernetes.io/job-name=batch-demo -n default`} />
      <div className="flex flex-wrap gap-3 text-xs text-blue-400 underline">{BATCH_SOURCES.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer">{index === 0 ? "Job 공식 문서" : "CronJob 공식 문서"} ↗</a>)}</div>
    </div>
  );
}

export function JobCronJobSettings() {
  return (
    <section className="learning-panel space-y-4 text-sm leading-7">
      <h2 className="font-bold">설정은 어디에 적용될까?</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2"><h3 className="font-bold text-blue-200">Job · 완료와 재시도</h3>
          <p><code>completions</code>는 목표 성공 횟수, <code>parallelism</code>은 동시에 실행할 Pod 수의 상한입니다. 예시는 둘 다 1입니다.</p>
          <p><code>restartPolicy: Never</code>에서는 실패한 Pod 대신 새 Pod를 만들고, <code>OnFailure</code>에서는 같은 Pod 안의 컨테이너를 재시작할 수 있습니다. Job에서는 Always를 사용할 수 없습니다.</p>
          <p><code>backoffLimit</code>는 실패 재시도를 제한합니다. <code>activeDeadlineSeconds</code>는 Job 전체 실행 시간을 제한하며 재시도 한도보다 우선합니다.</p>
          <p><code>ttlSecondsAfterFinished</code>는 완료·실패 후 Job과 종속 Pod의 정리를 예약합니다. 로그는 별도로 보관하세요.</p>
        </div>
        <div className="space-y-2"><h3 className="font-bold text-blue-200">CronJob · 일정과 중복</h3>
          <p><code>*/5 * * * *</code>는 분·시·일·월·요일 순서로, 5분마다 실행한다는 뜻입니다. <code>timeZone: Asia/Seoul</code>을 명시합니다. timeZone은 Kubernetes 1.27부터 안정 기능입니다.</p>
          <p><code>concurrencyPolicy</code>: Allow는 동시 실행 허용(기본값), Forbid는 이전 Job 실행 중 새 예약을 건너뛰기, Replace는 실행 중인 Job을 새 Job으로 교체하기입니다. 같은 CronJob의 Job 사이에 적용됩니다.</p>
          <p><code>suspend</code>는 새 예약을 중지하며 실행 중인 Job은 계속됩니다. <code>startingDeadlineSeconds</code>는 늦어진 예약을 시작할 수 있는 유예 시간으로, Job 실행 제한 시간과 다릅니다.</p>
          <p><code>successfulJobsHistoryLimit</code>와 <code>failedJobsHistoryLimit</code>는 남길 완료·실패 Job 수를 정합니다. TTL도 설정하면 그보다 먼저 삭제될 수 있습니다. jobTemplate 변경은 이후 생성될 Job에 적용됩니다.</p>
        </div>
      </div>
    </section>
  );
}
