import { MODE2_STEPS } from "./mode2Steps";
import { PodLifecycleStep } from "../types/podLifecycle";
const running = MODE2_STEPS.find((step) => step.id === "ready")!;
function snapshot(
  id: string,
  title: string,
  description: string,
  patch: Partial<PodLifecycleStep>,
): PodLifecycleStep {
  const step = {
    ...running,
    ...patch,
    id,
    title,
    subTitle: title,
    description,
    deepDive: description,
  };
  return {
    ...step,
    describeOutput: [
      `Status: ${step.phase}`,
      `UID: ${step.uid}`,
      `Ready: ${step.ready}`,
      `Container state: ${step.containerState}`,
      `Restart count: ${step.restartCount}`,
      `kubectl STATUS: ${step.displayStatus}`,
    ],
    terminalLogs: [description],
  };
}
const notReady = snapshot(
  "readiness-failed",
  "Readiness 실패: 실행은 계속",
  "Ready=False가 되어 일반 Service 트래픽 대상에서 제외됩니다. Readiness 실패만으로 컨테이너를 재시작하지 않습니다.",
  {
    learningStage: "ReadinessFailed",
    ready: false,
    probes: { ...running.probes, readiness: "failed" },
  },
);
const restarting = snapshot(
  "liveness-restart",
  "Liveness 실패 임계치: 재시작",
  "연속 실패 임계치에 도달하면 컨테이너를 종료하고 이 예시의 Always 정책에 따라 재시작합니다. Pod UID는 유지됩니다.",
  {
    learningStage: "Restarting",
    ready: false,
    restartCount: 1,
    containerState: "Waiting",
    containers: {
      ...running.containers,
      main: { ...running.containers.main, status: "waiting" },
    },
    probes: { startup: "idle", readiness: "idle", liveness: "idle" },
  },
);
const terminated = {
  ...running.containers,
  main: { ...running.containers.main, status: "stopped" as const },
};
const completion = snapshot(
  "succeeded",
  "작업 정상 완료: Succeeded",
  "restartPolicy: Never인 작업의 모든 컨테이너가 exit code 0으로 종료된 예시입니다. 완료 Pod는 API에 남을 수 있습니다.",
  {
    phase: "Succeeded",
    learningStage: "Completed",
    ready: false,
    containerState: "Terminated",
    displayStatus: "Completed",
    containers: terminated,
    probes: { startup: "idle", readiness: "idle", liveness: "idle" },
  },
);
const failed = snapshot(
  "failed",
  "작업 실패: Failed",
  "restartPolicy: Never인 작업의 모든 컨테이너가 종료되고 하나 이상 실패했습니다. 컨테이너 반복 재시작과는 다릅니다.",
  {
    ...completion,
    id: "failed",
    title: "작업 실패: Failed",
    phase: "Failed",
    learningStage: "Failed",
    displayStatus: "Error",
  },
);
const replaced = snapshot(
  "replacement",
  "컨트롤러가 새 Pod 생성",
  "Deployment가 필요한 복제본 수를 유지하도록 새 UID의 Pod를 생성합니다. 기존 Pod가 다른 노드로 이동하는 것은 아닙니다. 직접 생성한 Pod에는 자동 교체가 보장되지 않습니다.",
  { uid: "pod-web-002", learningStage: "Replaced", restartCount: 0 },
);
const cleanup = snapshot(
  "terminated",
  "정상 종료 후 정리",
  "preStop을 포함한 유예 시간 안에 정상 종료했습니다. SIGKILL 없이 sandbox·네트워크·마운트를 정리합니다. PVC의 수명은 별도로 유지됩니다.",
  {
    phase: "Succeeded",
    learningStage: "Terminated",
    ready: false,
    containerState: "Terminated",
    displayStatus: "Completed",
    containers: { ...terminated, pause: { status: "none" } },
    volumeStatus: { ...running.volumeStatus, mounted: false },
    probes: { startup: "idle", readiness: "idle", liveness: "idle" },
  },
);
export const LIFECYCLE_EXAMPLES: Record<
  string,
  { name: string; steps: PodLifecycleStep[] }
> = {
  normal: { name: "생성 → 준비 → 정상 종료", steps: [...MODE2_STEPS, cleanup] },
  readiness: {
    name: "Readiness 실패와 회복",
    steps: [
      running,
      notReady,
      snapshot(
        "readiness-recovery",
        "Readiness 회복",
        "Ready=True가 반영되면 일반 Service 트래픽 대상으로 복귀할 수 있습니다.",
        {},
      ),
    ],
  },
  liveness: {
    name: "Liveness 실패와 재시작",
    steps: [
      running,
      snapshot(
        "liveness-failed",
        "Liveness 연속 실패",
        "실패 임계치에 도달하면 컨테이너 종료를 시작합니다.",
        { ready: false, probes: { ...running.probes, liveness: "failed" } },
      ),
      restarting,
      snapshot(
        "restarted",
        "동일 Pod 안에서 회복",
        "컨테이너는 새로 시작했지만 Pod UID는 동일하고 restartCount는 증가했습니다.",
        { restartCount: 1 },
      ),
    ],
  },
  startup: {
    name: "Startup 실패",
    steps: [
      MODE2_STEPS.find((step) => step.id === "app-start")!,
      snapshot(
        "startup-failed",
        "Startup 실패 임계치",
        "Startup이 성공하기 전에는 Readiness·Liveness 검사를 시작하지 않습니다. 실패 임계치에 도달하면 종료 후 정책에 따라 재시작합니다.",
        {
          ready: false,
          probes: { startup: "failed", readiness: "idle", liveness: "idle" },
        },
      ),
      restarting,
    ],
  },
  crashloop: {
    name: "반복 실패 · CrashLoopBackOff",
    steps: [
      running,
      snapshot(
        "crashloop",
        "반복 실패로 재시작 지연",
        "CrashLoopBackOff는 공식 phase가 아닙니다. 같은 UID에서 컨테이너 재시작 사이의 지연이 증가하는 상태입니다.",
        {
          learningStage: "CrashLoopBackOff",
          ready: false,
          restartCount: 4,
          containerState: "Waiting",
          displayStatus: "CrashLoopBackOff",
          containers: {
            ...running.containers,
            main: { ...running.containers.main, status: "waiting" },
          },
          probes: { startup: "idle", readiness: "idle", liveness: "idle" },
        },
      ),
    ],
  },
  completion: { name: "작업 정상 완료 · Never", steps: [running, completion] },
  failure: { name: "작업 실패 · Never", steps: [running, failed] },
  replacement: {
    name: "Pod 교체와 새 UID",
    steps: [
      running,
      MODE2_STEPS.find((step) => step.id === "terminating")!,
      replaced,
    ],
  },
  forced: {
    name: "유예 시간 초과 · 강제 종료",
    steps: [
      running,
      MODE2_STEPS.find((step) => step.id === "terminating")!,
      snapshot(
        "sigkill",
        "유예 시간 종료: 남은 프로세스 SIGKILL",
        "기본 30초는 preStop을 포함합니다. 유예 시간 안에 끝나지 않은 프로세스만 SIGKILL로 종료하고 정리합니다.",
        {
          ...cleanup,
          id: "sigkill",
          title: "유예 시간 종료: 남은 프로세스 SIGKILL",
          phase: "Failed",
          displayStatus: "Error",
        },
      ),
    ],
  },
};
