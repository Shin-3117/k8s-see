import type { EtcdRecord } from "../types/pipeline";
import type { LearningClusterStep } from "./learningScenarios";

export const BATCH_SOURCES = [
  "https://kubernetes.io/docs/concepts/workloads/controllers/job/",
  "https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/",
];
export const BATCH_EXAMPLES = {
  normal: "Job · 정상 완료",
  retry: "Job · 실패 후 새 Pod로 재시도",
  failed: "Job · 재시도 없이 실패",
  cron: "CronJob · 일정마다 새 Job 생성",
  forbid: "CronJob · 이전 Job 실행 중 (Forbid)",
  suspended: "CronJob · 예약 일시 중지 (suspend)",
};
export const JOB_YAML = `apiVersion: batch/v1
kind: Job
metadata:
  name: batch-demo
  namespace: default
spec:
  completions: 1
  parallelism: 1
  backoffLimit: 2
  activeDeadlineSeconds: 120
  ttlSecondsAfterFinished: 300
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: task
          image: busybox:1.37
          command: ["sh", "-c", "echo batch-done; sleep 5"]`;
export const CRONJOB_YAML = `apiVersion: batch/v1
kind: CronJob
metadata:
  name: scheduled-demo
  namespace: default
spec:
  schedule: "*/5 * * * *"
  timeZone: Asia/Seoul
  concurrencyPolicy: Forbid
  suspend: false
  startingDeadlineSeconds: 60
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      completions: 1
      parallelism: 1
      backoffLimit: 2
      activeDeadlineSeconds: 120
      ttlSecondsAfterFinished: 300
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: task
              image: busybox:1.37
              command: ["sh", "-c", "date; echo scheduled-done; sleep 5"]`;

type Phase = "Pending" | "Running" | "Succeeded" | "Failed";
type JobCondition = "Complete" | "Failed";
interface JobSnapshot {
  name: string;
  pods: { name: string; phase: Phase }[];
  condition?: JobCondition;
}
export type BatchStep = LearningClusterStep & {
  activeConcepts: string[];
  clock: string;
};
const jobSpec = (noRetry: boolean, cron = false, longRunning = false) => ({
  completions: 1, parallelism: 1, backoffLimit: noRetry ? 0 : 2,
  activeDeadlineSeconds: longRunning ? 600 : 120, ttlSecondsAfterFinished: 300,
  template: { spec: { restartPolicy: "Never", containers: [{ name: "task", image: "busybox:1.37", command: ["sh", "-c", noRetry ? "echo simulated-error; exit 1" : cron ? `date; echo scheduled-done; sleep ${longRunning ? 360 : 5}` : "echo batch-done; sleep 5"] }] } },
});
const owner = (kind: "Job" | "CronJob", name: string) => ({ apiVersion: "batch/v1", kind, name, uid: `uid-${name}`, controller: true });
function record(type: EtcdRecord["type"], name: string, spec: object, status: object, revision: number, owners: object[] = []): EtcdRecord {
  const plural = type === "Pod" ? "pods" : type === "Job" ? "jobs" : "cronjobs";
  return {
    key: `/registry/${plural}/default/${name}`, type, action: "updated", revision,
    data: { apiVersion: type === "Pod" ? "v1" : "batch/v1", kind: type, metadata: { name, namespace: "default", uid: `uid-${name}`, ...(owners.length ? { ownerReferences: owners } : {}) }, spec, status },
  };
}
export function batchSteps(example: string): BatchStep[] {
  const cron = ["cron", "forbid", "suspended"].includes(example);
  const noRetry = example === "failed";
  const steps: BatchStep[] = [];
  const spec = () => jobSpec(noRetry, cron, example === "forbid");
  const add = (title: string, actor: string, action: string, result: string, activeConcepts: string[], jobs: JobSnapshot[], clock = "수동 실행", mechanism = action) => {
    const revision = 6100 + steps.length;
    const records: EtcdRecord[] = [];
    if (cron) records.push(record("CronJob", "scheduled-demo", {
      schedule: "*/5 * * * *", timeZone: "Asia/Seoul", concurrencyPolicy: "Forbid", suspend: example === "suspended",
      startingDeadlineSeconds: 60, successfulJobsHistoryLimit: 3, failedJobsHistoryLimit: 1,
      jobTemplate: { spec: spec() },
    }, { active: jobs.filter((job) => !job.condition).map((job) => ({ apiVersion: "batch/v1", kind: "Job", name: job.name, namespace: "default", uid: `uid-${job.name}` })) }, revision));
    for (const job of jobs) {
      const count = (phase: Phase) => job.pods.filter((pod) => pod.phase === phase).length;
      records.push(record("Job", job.name, spec(), {
        active: count("Pending") + count("Running"), succeeded: count("Succeeded"), failed: count("Failed"),
        conditions: job.condition ? [{ type: job.condition, status: "True", ...(job.condition === "Failed" ? { reason: "BackoffLimitExceeded" } : {}) }] : [],
      }, revision, cron ? [owner("CronJob", "scheduled-demo")] : []));
      for (const pod of job.pods) {
        const assigned = pod.phase !== "Pending";
        const terminal = pod.phase === "Succeeded" || pod.phase === "Failed";
        records.push(record("Pod", pod.name, {
          ...spec().template.spec,
          ...(assigned ? { nodeName: "worker-node-1" } : {}),
        }, {
          phase: pod.phase,
          conditions: [{ type: "Ready", status: pod.phase === "Running" ? "True" : "False" }],
          containerStatuses: assigned ? [{ name: "task", restartCount: 0, ready: !terminal, state: terminal ? { terminated: { exitCode: pod.phase === "Succeeded" ? 0 : 1, reason: pod.phase === "Succeeded" ? "Completed" : "Error" } } : { running: {} } }] : [],
        }, revision, [owner("Job", job.name)]));
      }
    }
    const previous = steps.at(-1)?.etcdState?.records ?? [];
    for (const item of records) {
      const prior = previous.find((candidate) => candidate.key === item.key);
      item.action = !prior ? "created" : JSON.stringify(prior.data) === JSON.stringify(item.data) ? "unchanged" : "updated";
    }
    const number = steps.length + 1;
    steps.push({
      id: `batch-${example}-${number}`, stepNumber: number, title, subTitle: cron ? "CronJob → Job → Pod" : "Job → Pod",
      actor, action, summary: action, description: action, result, reason: cron ? "예약과 작업 완료를 서로 다른 컨트롤러가 관리하기 때문" : "성공한 작업 수와 실행 상태를 조정하기 위해",
      k8sMechanism: mechanism, activeComponents: [], packets: [], podsState: [], activeConcepts, clock, sources: BATCH_SOURCES,
      etcdState: { revision, raftTerm: 3, records },
      cliLogs: [{ command: cron ? "kubectl get cronjob,job,pod -n default" : "kubectl get job,pod -n default", output: [result, ...jobs.flatMap((job) => [`Job ${job.name}: ${job.condition ?? "작업 진행 중"}`, ...job.pods.map((pod) => `  Pod ${pod.name}: ${pod.phase} / restartCount=0`)])] }],
    });
  };
  const name = cron ? "scheduled-demo-0900" : "batch-demo";
  const snapshot = (phase?: Phase, condition?: JobCondition): JobSnapshot => ({ name, pods: phase ? [{ name: `${name}-a`, phase }] : [], condition });
  if (cron) {
    add("CronJob 등록 · 일정 대기", "사용자 / API Server", "CronJob과 jobTemplate을 저장합니다. 등록 직후에는 Job이나 Pod가 없습니다.", "CronJob 저장 · Job 0개 · Pod 0개", ["cronjob", "api"], [], "08:59 KST");
    if (example === "suspended") {
      add("예약 시각 · 새 Job 생성 중지", "CronJob 컨트롤러", "suspend=true이므로 09:00 예약 시각에도 새 Job을 생성하지 않습니다.", "일시 중지 · Job 0개 · Pod 0개", ["cronjob"], [], "09:00 KST", "suspend는 이미 시작된 Job을 중단하지 않습니다. false로 되돌리면 누락 일정이 startingDeadlineSeconds의 허용 범위 안에서 실행될 수 있습니다.");
      return steps;
    }
    add("예약 시각 · Job 생성", "CronJob 컨트롤러", "09:00 예약 시각에 jobTemplate으로 새 Job을 생성합니다.", `Job ${name} 생성 · 아직 Pod 없음`, ["cronjob", "job", "api"], [snapshot()], "09:00 KST");
  } else {
    add("Job 등록", "사용자 / API Server", "Job을 API Server에 등록합니다. Deployment와 ReplicaSet을 거치지 않습니다.", "Job batch-demo 저장 · Pod 0개", ["job", "api"], [snapshot()]);
  }
  add("Job 컨트롤러 · Pod 생성", "Job 컨트롤러", "Job의 Pod 템플릿으로 미배정 Pod를 생성합니다.", "Pod Pending · 아직 nodeName 없음", ["job", "pod", "api"], [snapshot("Pending")], cron ? "09:00 KST" : "수동 실행");
  add("노드 배정 · 작업 실행", "Scheduler / kubelet / 런타임", "스케줄러가 API에 노드 배정을 기록하고 해당 노드의 kubelet과 런타임이 작업을 실행합니다.", "Pod Running · 작업 진행 중", ["api", "execution", "pod"], [snapshot("Running")], cron ? "09:00 KST" : "수동 실행");
  if (example === "forbid") {
    add("다음 예약 · 중복 실행 방지", "CronJob 컨트롤러", "이전 Job이 계속 실행 중이라 Forbid 정책이 09:05의 새 Job 생성을 건너뜁니다.", "Job 1개 유지 · 새 Job 없음", ["cronjob", "job"], [snapshot("Running")], "09:05 KST", "이 분기는 작업이 5분 넘게 걸리도록 activeDeadlineSeconds=600으로 늘린 가정입니다. Forbid는 같은 CronJob이 만든 Job에만 적용됩니다. 누락 일정은 이후 deadline 범위에서 실행될 수 있습니다.");
    return steps;
  }
  if (example === "retry" || noRetry) {
    add("작업 오류 · Pod 실패", "작업 프로세스 / kubelet", "프로세스가 종료 코드 1로 끝납니다. restartPolicy=Never이므로 같은 Pod의 컨테이너는 재시작하지 않습니다.", "Pod Failed · restartCount=0", ["pod", "execution"], [snapshot("Failed")]);
    if (noRetry) {
      add("재시도 한도 · Job 실패", "Job 컨트롤러", "backoffLimit=0이므로 재시도 없이 Job을 Failed로 종료합니다.", "Job Failed=True · BackoffLimitExceeded", ["job"], [snapshot("Failed", "Failed")], "수동 실행", "Failed인 Job 자체가 자동으로 다시 시작되지는 않습니다. 원인을 해결한 뒤 새 Job을 생성합니다.");
      return steps;
    }
    const retried: JobSnapshot = { name, pods: [{ name: `${name}-a`, phase: "Failed" }, { name: `${name}-b`, phase: "Pending" }] };
    add("백오프 후 · 새 Pod로 재시도", "Job 컨트롤러", "재시도 한도 안에서 지연 후 새 UID의 Pod를 만듭니다. 실패한 Pod도 기록으로 남습니다.", "실패 Pod 1개 + 새 Pending Pod 1개", ["job", "pod", "api"], [retried]);
    add("새 Pod 실행", "Scheduler / kubelet / 런타임", "새 Pod를 배정하고 작업을 다시 실행합니다.", "새 Pod Running · restartCount=0", ["execution", "pod"], [{ ...retried, pods: [retried.pods[0], { name: `${name}-b`, phase: "Running" }] }]);
    add("재시도 성공 · Job 완료", "kubelet / Job 컨트롤러", "새 Pod가 성공하고 필요한 성공 횟수를 채워 Job이 Complete가 됩니다.", "Job Complete=True · succeeded=1 · failed=1", ["pod", "job"], [{ ...retried, condition: "Complete", pods: [retried.pods[0], { name: `${name}-b`, phase: "Succeeded" }] }]);
    return steps;
  }
  add("Pod 성공 · Job 완료", "kubelet / Job 컨트롤러", "작업이 종료 코드 0으로 끝나 Pod는 Succeeded가 되고, Job 컨트롤러가 성공 횟수를 확인해 Complete 조건을 기록합니다.", "Pod Succeeded · Job Complete=True", ["pod", "job"], [snapshot("Succeeded", "Complete")], cron ? "09:01 KST" : "수동 실행", "완료된 Job은 실행 중인 Pod 수를 계속 유지하지 않습니다. TTL 정리가 실행되기 전에는 Job과 종료된 Pod가 남아 상태와 로그를 조회할 수 있습니다.");
  if (cron) {
    const nextName = "scheduled-demo-0905";
    add("다음 예약 · 독립된 Job 생성", "CronJob 컨트롤러", "09:05에는 새로운 Job이 생성됩니다. 다음 Job의 Pod는 Job 컨트롤러가 이어서 만듭니다.", "서로 다른 Job 2개 · 첫 Job은 완료 기록", ["cronjob", "job", "api"], [snapshot("Succeeded", "Complete"), { name: nextName, pods: [] }], "09:05 KST");
  }
  return steps;
}
