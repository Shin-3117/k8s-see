import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  LEARNING_PAGES,
  pageFromHash,
  pageHref,
  sourceUrl,
} from "./data/learningPages";
import { initialLearningState, learningReducer } from "./hooks/learningState";
import {
  CREATION_STEPS,
  SERVICE_STEPS,
  RESOURCE_STEPS,
  STORAGE_STEPS,
  INGRESS_STEPS,
  StepExplanation,
} from "./data/learningScenarios";
import { MODE2_STEPS } from "./data/mode2Steps";
import { LIFECYCLE_EXAMPLES } from "./data/lifecycleExamples";
import { YAML_PRESETS } from "./data/yamlPresets";
import { STATEFULSET_PRESET, STATEFULSET_STEPS } from "./data/statefulsetSteps";
import { StatefulSetIdentity } from "./components/Learning/StatefulSetIdentity";
import { batchSteps } from "./data/jobCronJobSteps";
import { JobCronJobCanvas, JobCronJobLesson, JobCronJobSettings, JobCronJobYaml } from "./components/Learning/JobCronJobLesson";
import { CONFIG_SECRET_STEPS, CONFIG_SECRET_YAML } from "./data/configSecretSteps";
import { ConfigSecretLesson } from "./components/Learning/ConfigSecretLesson";
import { certManagerSteps } from "./data/certManagerSteps";
import { CertManagerCanvas, CertManagerLesson, CertManagerYaml } from "./components/Learning/CertManagerLesson";
import { volumeExample, volumeSteps } from "./data/volumeExamples";
import { VolumeLesson, VolumeMountCanvas } from "./components/Learning/VolumeLesson";
import {
  Mode1Step,
  Mode4Step,
  Mode5Step,
  K8sComponentId,
} from "./types/pipeline";
import { Mode3Step } from "./data/mode3Steps";
import { COMPONENT_DETAILS } from "./data/componentDetails";
import { Header } from "./components/Header";
import {
  LearningSidebar,
  LearningNavigation,
} from "./components/Learning/LearningLayout";
import {
  LearningSnippet,
  IDENTITY_EXAMPLE,
} from "./components/Learning/LearningSnippet";
import { ConceptCanvas } from "./components/Learning/ConceptCanvas";
import { YamlEditor } from "./components/YamlInspector/YamlEditor";
import { LineImpactCard } from "./components/YamlInspector/LineImpactCard";
import { SeparatedYamlViewer } from "./components/YamlInspector/SeparatedYamlViewer";
import { PvcYamlViewer } from "./components/YamlInspector/PvcYamlViewer";
import { IngressYamlViewer } from "./components/YamlInspector/IngressYamlViewer";
import { ReactFlowClusterCanvas } from "./components/Mode1Cluster/ReactFlowClusterCanvas";
import { PodDeepDiveCanvas } from "./components/Mode2Pod/PodDeepDiveCanvas";
import { PlaybackBar } from "./components/Common/PlaybackBar";
import { StepExplainer } from "./components/Common/StepExplainer";
import { TerminalStream } from "./components/Common/TerminalStream";
import { EtcdLiveViewer } from "./components/Common/EtcdLiveViewer";
import { ComponentDetailModal } from "./components/Common/ComponentDetailModal";

type ClusterStep = (Mode1Step | Mode3Step | Mode4Step | Mode5Step) &
  StepExplanation;
const INGRESS_ERRORS: Record<string, string> = {
  "no-controller":
    "Controller가 설치되지 않으면 Ingress 규칙을 프록시에 반영할 주체가 없습니다. 리소스 생성만으로 외부 접근이 준비되지는 않습니다.",
  unmatched:
    "Host 또는 Path가 일치하지 않으면 설정된 기본 백엔드나 Controller의 기본 동작을 따릅니다. 구체적인 HTTP 상태 코드는 구현과 설정에 따라 다릅니다.",
  "no-backend":
    "규칙은 일치하지만 Ready 백엔드가 없습니다. Service selector·EndpointSlice·Pod Ready를 확인합니다. 오류 응답은 프록시 설정에 따라 다릅니다.",
};
function Encyclopedia({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (id: K8sComponentId) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      className="learning-dialog"
      aria-labelledby="encyclopedia-title"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 id="encyclopedia-title" className="font-bold">
          구성 요소 백과사전
        </h2>
        <button className="learning-button" onClick={onClose} autoFocus>
          닫기
        </button>
      </div>
      <p className="text-sm text-slate-400 mb-4">
        역할을 확인할 구성 요소를 선택하세요.
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {Object.values(COMPONENT_DETAILS).map((info) => (
          <button
            key={info.id}
            className="learning-button text-left justify-start"
            onClick={() => {
              onClose();
              onSelect(info.id);
            }}
          >
            {info.name}
          </button>
        ))}
      </div>
    </dialog>
  );
}
export function App() {
  const [state, dispatch] = useReducer(
    learningReducer,
    window.location.hash,
    (hash) => initialLearningState(pageFromHash(hash)),
  );
  const pageIndex = LEARNING_PAGES.findIndex((p) => p.id === state.page);
  const page = LEARNING_PAGES[pageIndex];
  const progress = state.progress[state.page];
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [detailId, setDetailId] = useState<K8sComponentId | null>(null);
  const [docsOpen, setDocsOpen] = useState(false);
  const closeDetail = useCallback(() => setDetailId(null), []);
  const selectComponent = useCallback(
    (id: K8sComponentId) => setDetailId(id),
    [],
  );
  const update = (value: Partial<typeof progress>) =>
    dispatch({ type: "update", patch: value });
  useEffect(() => {
    const navigate = () => {
      const pageId = pageFromHash(window.location.hash);
      dispatch({ type: "navigate", page: pageId });
      setDetailId(null);
      setDocsOpen(false);
      if (window.location.hash !== pageHref(pageId))
        window.history.replaceState(null, "", pageHref(pageId));
    };
    navigate();
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, [pageFromHash, pageHref]);
  useEffect(() => {
    document.title = `${pageIndex + 1}. ${page.title} | K8sSee`;
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page.id, page.title, pageIndex]);

  const lifecycle = state.page === "pod-lifecycle";
  const statefulset = state.page === "statefulset-creation";
  const batch = state.page === "jobs-cronjobs";
  const batchScenario = batch ? batchSteps(progress.example) : [];
  const configuration = state.page === "configmap-secret";
  const certificates = state.page === "cert-manager-ingress";
  const certificateScenario = certificates ? certManagerSteps(progress.example) : [];
  const volumes = state.page === "volume-types";
  const volumePreset = volumeExample(progress.example);
  const volumeScenario = volumes ? volumeSteps(volumePreset) : [];
  const internal = state.page === "pod-internals";
  const podSteps = internal
    ? MODE2_STEPS.filter((s) => s.id !== "terminating")
    : (LIFECYCLE_EXAMPLES[progress.example] ?? LIFECYCLE_EXAMPLES.normal).steps;
  let clusterSteps: ClusterStep[] = configuration
    ? CONFIG_SECRET_STEPS
    : state.page === "pod-creation"
      ? CREATION_STEPS
      : statefulset
        ? STATEFULSET_STEPS
        : state.page === "service-networking"
          ? SERVICE_STEPS
          : state.page === "resource-relations"
            ? RESOURCE_STEPS
            : state.page === "ingress"
              ? INGRESS_STEPS
              : STORAGE_STEPS;
  if (volumes) clusterSteps = volumeScenario;
  if (certificates) clusterSteps = certificateScenario;
  if (batch) clusterSteps = batchScenario;
  if (state.page === "ingress" && INGRESS_ERRORS[progress.example]) {
    const base = INGRESS_STEPS[0];
    clusterSteps = [
      base,
      {
        ...base,
        stepNumber: 2,
        title: "전달 조건 확인",
        summary: INGRESS_ERRORS[progress.example],
        description: INGRESS_ERRORS[progress.example],
        actor: "Controller / Service / Pod",
        action: "규칙과 준비된 백엔드를 확인합니다.",
        reason: "실패 지점을 구분하기 위해",
        result: "요청이 앱에 전달되지 않은 상태",
        activeComponents: [],
        packets: [],
        activeRoute: undefined,
      } as Mode5Step & StepExplanation,
    ];
  }
  if (state.page === "persistent-storage" && progress.example !== "normal") {
    const base = STORAGE_STEPS[7];
    const retain = progress.example === "retain";
    clusterSteps = [
      base,
      {
        ...base,
        stepNumber: 2,
        title: retain ? "PVC 삭제 후 Retain" : "PVC 삭제 후 Delete",
        summary: retain
          ? "PVC는 삭제되지만 PV와 외부 볼륨은 남아 수동 회수합니다."
          : "사용 중인 볼륨 보호가 해제되면 PV와 외부 볼륨을 삭제합니다.",
        actor: "PV 컨트롤러 / CSI",
        action: "PVC 삭제 후 실제 PV의 회수 정책을 적용합니다.",
        reason: "사용을 끝낸 저장소를 회수하기 위해",
        result: retain
          ? "PV Released · EBS 유지 · 관리자 수동 회수"
          : "PV와 EBS 삭제 · 같은 PVC 재사용과 다른 결과",
        description:
          "Pod 삭제는 PVC 삭제가 아닙니다. 사용 중인 PVC 보호와 finalizer 때문에 삭제가 지연될 수 있습니다.",
        k8sMechanism:
          "동적 PV는 StorageClass의 reclaimPolicy를 이어받습니다. 별도 설정이 없으면 Delete가 기본입니다. 실제 PV의 정책을 확인하세요.",
        activeComponents: ["csiController"],
        packets: [],
        awsEbsState:
          retain && base.awsEbsState
            ? {
                ...base.awsEbsState,
                status: "available",
                attachedNode: undefined,
                devicePath: undefined,
              }
            : undefined,
        podsState: [],
        etcdState: {
          revision: (base.etcdState?.revision ?? 0) + 1,
          raftTerm: 3,
          records: retain
            ? (base.etcdState?.records ?? [])
                .filter((r) => r.type === "PersistentVolume")
                .map((r) => ({
                  ...r,
                  action: "updated",
                  data: {
                    ...r.data,
                    spec: {
                      ...r.data.spec,
                      persistentVolumeReclaimPolicy: "Retain",
                    },
                    status: { phase: "Released" },
                  },
                }))
            : [],
        },
        cliLogs: [
          {
            command: "kubectl get pvc,pv",
            output: retain
              ? ["PVC: 삭제됨", "PV: Released (Retain)", "외부 EBS: 유지됨"]
              : ["PVC: 삭제됨", "PV: 삭제됨", "외부 EBS: 삭제됨"],
          },
        ],
      } satisfies Mode4Step & StepExplanation,
    ];
  }
  const hasPlayback = state.page !== "overview";
  const total = internal || lifecycle ? podSteps.length : clusterSteps.length;
  const index = Math.min(progress.index, total - 1);
  const podStep = podSteps[index];
  const clusterStep = clusterSteps[index];
  const step = internal || lifecycle ? podStep : clusterStep;
  useEffect(() => {
    if (!progress.playing || !hasPlayback) return;
    const timer = window.setTimeout(
      () => dispatch({ type: "advance", page: state.page, total }),
      3200 / progress.speed,
    );
    return () => window.clearTimeout(timer);
  }, [
    progress.playing,
    progress.speed,
    progress.index,
    state.page,
    total,
    hasPlayback,
  ]);
  const source = sourceUrl(page.source);
  const preset = statefulset
    ? STATEFULSET_PRESET
    : (YAML_PRESETS.find((p) => p.id === progress.example) ?? YAML_PRESETS[0]);
  const impact =
    preset.impacts.find(
      (i) =>
        progress.selectedLine !== null &&
        progress.selectedLine >= i.startLine &&
        progress.selectedLine <= i.endLine,
    ) ?? null;
  const selectStep = (index: number) => update({ index, playing: false });
  const selectedStorage = clusterStep as Mode4Step;
  const selectedIngress = clusterStep as Mode5Step;
  const selectedResource = clusterStep as Mode3Step;
  const description =
    internal || lifecycle ? podStep.description : clusterStep.description;
  const explanation: StepExplanation =
    internal || lifecycle
      ? {
          summary: podStep.description,
          actor: "kubelet / 런타임",
          action: podStep.title,
          reason: "Pod의 실제 실행 상태를 관리하기 위해",
          result: `phase=${podStep.phase} · Ready=${podStep.ready} · UID=${podStep.uid} · restartCount=${podStep.restartCount}`,
        }
      : clusterStep;
  return (
    <div className="min-h-screen bg-[#070C16] text-slate-100">
      <a
        href="#learning-content"
        onClick={(event) => {
          event.preventDefault();
          headingRef.current?.focus();
          headingRef.current?.scrollIntoView({ behavior: "smooth" });
        }}
        className="sr-only focus:not-sr-only focus:block p-3"
      >
        학습 본문으로 건너뛰기
      </a>
      <Header onOpenDocs={() => setDocsOpen(true)} />
      <div className="learning-shell">
        <LearningSidebar page={page.id} />
        <main id="learning-content" className="learning-main space-y-5">
          <section className="learning-panel">
            <p className="text-xs text-blue-400 mb-2">
              학습 {pageIndex + 1} / {LEARNING_PAGES.length}
            </p>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-2xl sm:text-3xl font-bold tracking-tight"
            >
              {page.title}
            </h1>
            <p className="text-sm text-slate-400 mt-3">{page.question}</p>
            <p className="text-base text-slate-200 leading-8 mt-3">
              {page.summary}
            </p>
          </section>
          {page.id === "pod-creation" ? (
            <div className="learning-panel flex flex-wrap items-center gap-3">
              <label htmlFor="creation-preset" className="text-sm">
                YAML 예시
              </label>
              <select
                id="creation-preset"
                className="learning-button max-w-full"
                value={preset.id}
                onChange={(e) => {
                  if (e.target.value === "service-ingress")
                    window.location.hash = pageHref("service-networking");
                  else
                    update({
                      example: e.target.value,
                      index: 0,
                      playing: false,
                      selectedLine: 1,
                    });
                }}
              >
                {YAML_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-400">
                Service 단독 적용은 내부 통신 페이지에서 확인합니다.
              </span>
            </div>
          ) : null}
          {internal ? (
            <section className="learning-panel space-y-3">
              <label className="flex flex-wrap items-center gap-3 text-sm">
                공유 네트워크 예시
                <select
                  aria-label="공유 포트 예시"
                  className="learning-button"
                  value={progress.example}
                  onChange={(event) => update({ example: event.target.value })}
                >
                  <option value="normal">A:8080 · B:9090</option>
                  <option value="collision">A:8080 · B:8080</option>
                </select>
              </label>
              <p className="text-sm leading-7">
                같은 Pod의 컨테이너는 Pod IP와 포트 공간을 공유하며 localhost로
                통신합니다.{" "}
                {progress.example === "collision"
                  ? "같은 주소의 8080 포트를 두 프로세스가 일반적인 단독 바인딩으로 동시에 사용할 수 없어 두 번째 바인딩이 실패합니다."
                  : "A는 localhost:9090으로 B에 접근할 수 있습니다. 컨테이너마다 별도 Pod IP가 생기지 않습니다."}
              </p>
            </section>
          ) : null}
          {page.id === "service-networking" ? (
            <section className="learning-panel text-sm space-y-2">
              <h2 className="font-bold">접근 주소 비교</h2>
              <p>
                localhost: 같은 Pod의 네트워크 공간 · Pod IP: 특정 Pod에 직접
                접근 · Service DNS/ClusterIP: 선택된 Ready 백엔드로 접근하는
                안정적인 진입점
              </p>
              <p className="text-slate-400">
                DNS 조회 패킷과 앱 요청 패킷은 별개입니다. 일반 Service에서
                readiness가 실패한 Pod는 트래픽 대상에서 제외됩니다.
              </p>
            </section>
          ) : null}
          {lifecycle ? (
            <section className="learning-panel text-sm space-y-2">
              <p>
                종료 시 트래픽 대상 변경과 노드의 컨테이너 종료는 병행됩니다.
                저장소 수명은 별도로 관리합니다.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  className="text-blue-400 underline"
                  href={pageHref("service-networking")}
                >
                  Service와 Ready 백엔드 복습
                </a>
                <a
                  className="text-blue-400 underline"
                  href={pageHref("persistent-storage")}
                >
                  Pod 교체와 PVC 수명 복습
                </a>
              </div>
            </section>
          ) : null}
          {lifecycle ? (
            <label className="learning-panel flex flex-wrap gap-3 items-center text-sm">
              라이프사이클 예시
              <select
                aria-label="라이프사이클 예시"
                className="learning-button max-w-full"
                value={progress.example}
                onChange={(e) =>
                  update({ example: e.target.value, index: 0, playing: false })
                }
              >
                {Object.entries(LIFECYCLE_EXAMPLES).map(([id, ex]) => (
                  <option key={id} value={id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {page.id === "ingress" ? (
            <label className="learning-panel flex flex-wrap gap-3 items-center text-sm">
              요청 조건
              <select
                aria-label="Ingress 요청 조건"
                className="learning-button"
                value={progress.example}
                onChange={(e) =>
                  update({ example: e.target.value, index: 0, playing: false })
                }
              >
                <option value="normal">Host·Path 정상 라우팅 비교</option>
                <option value="no-controller">Controller 부재</option>
                <option value="unmatched">Host / Path 불일치</option>
                <option value="no-backend">Ready 백엔드 부재</option>
              </select>
              <p className="text-xs text-slate-400">
                /orders와 /products는 별도 요청 · 외부 진입 주소와 Controller가
                준비된 예시
              </p>
            </label>
          ) : null}
          {page.id === "persistent-storage" ? (
            <label className="learning-panel flex flex-wrap gap-3 items-center text-sm">
              저장소 예시
              <select
                aria-label="저장소 예시"
                className="learning-button"
                value={progress.example}
                onChange={(e) =>
                  update({ example: e.target.value, index: 0, playing: false })
                }
              >
                <option value="normal">
                  PVC 요청 → 마운트 → 같은 PVC 재사용
                </option>
                <option value="delete">PVC 삭제 · Delete 정책</option>
                <option value="retain">PVC 삭제 · Retain 정책</option>
              </select>
            </label>
          ) : null}
          {page.id === "overview" ? (
            <ConceptCanvas key={page.id} variant="overview" />
          ) : (
            <>
              {statefulset ? (
                <StatefulSetIdentity records={clusterStep.etcdState?.records ?? []} />
              ) : null}
              {configuration ? <ConfigSecretLesson stepIndex={index} /> : null}
              {batch ? <JobCronJobLesson example={progress.example} onExampleChange={(example) => update({ example, index: 0, playing: false })} /> : null}
              {certificates ? (
                <CertManagerLesson example={progress.example} tlsReady={certificateScenario[index].tlsReady} onExampleChange={(example) => update({ example, index: 0, playing: false })} />
              ) : null}
              {volumes ? (
                <VolumeLesson example={volumePreset} onExampleChange={(example) => update({ example, index: 0, playing: false })} />
              ) : null}
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
                <div className="min-w-0">
                  {batch ? (
                    <JobCronJobCanvas key={`${page.id}-${progress.example}`} step={batchScenario[index]} example={progress.example} />
                  ) : certificates ? (
                    <CertManagerCanvas key={page.id} active={certificateScenario[index].activeConcepts} />
                  ) : volumes ? (
                    <VolumeMountCanvas example={volumePreset} step={volumeScenario[index]} />
                  ) : internal || lifecycle ? (
                    <PodDeepDiveCanvas
                      currentStep={podStep}
                      showLifecycleActions={lifecycle}
                      onSimulateDelete={() => {
                        const normal = LIFECYCLE_EXAMPLES.normal.steps;
                        update({
                          example: "normal",
                          index: normal.findIndex(
                            (s) => s.id === "terminating",
                          ),
                          playing: false,
                        });
                      }}
                      onResetLifecycle={() => dispatch({ type: "reset" })}
                    />
                  ) : page.id === "service-networking" ||
                    page.id === "resource-relations" ? (
                    <ConceptCanvas
                      key={page.id}
                      variant={
                        page.id === "service-networking"
                          ? "networking"
                          : "resources"
                      }
                      active={
                        page.id === "service-networking"
                          ? [
                              ["service"],
                              ["service"],
                              ["a", "b"],
                              ["rules", "path"],
                              ["client", "dns", "service", "path", "a"],
                            ][index]
                          : [
                              ["config"],
                              ["config"],
                              ["config", "deployment"],
                              ["deployment"],
                              ["deployment", "replicaset", "pod"],
                              ["pod"],
                              ["config", "pod"],
                            ][index]
                      }
                    />
                  ) : (
                    <ReactFlowClusterCanvas
                      key={page.id}
                      activeComponents={clusterStep.activeComponents}
                      packets={clusterStep.packets}
                      podsState={clusterStep.podsState}
                      selectedComponent={detailId}
                      onSelectComponent={selectComponent}
                      yamlHighlightedComponents={
                        page.id === "pod-creation" || statefulset
                          ? (impact?.affectedComponents ?? [])
                          : []
                      }
                      showAwsNode={page.id === "persistent-storage"}
                      showCsiNode={statefulset}
                      statefulset={statefulset}
                      awsEbsState={selectedStorage.awsEbsState}
                      showIngressNode={page.id === "ingress"}
                      ingressControllerState={
                        selectedIngress.ingressControllerState
                      }
                      activeRoute={selectedIngress.activeRoute}
                    />
                  )}
                </div>
                <StepExplainer
                  stepNumber={index + 1}
                  totalSteps={total}
                  title={step.title}
                  subTitle={step.subTitle}
                  description={description}
                  k8sMechanism={
                    internal || lifecycle
                      ? podStep.deepDive
                      : clusterStep.k8sMechanism
                  }
                  {...explanation}
                  sources={configuration || certificates || batch ? clusterStep.sources : [source]}
                />
              </div>
              {!internal && !lifecycle && clusterStep.podsState.length ? (
                <div className="learning-panel overflow-x-auto">
                  <table className="text-xs w-full text-left">
                    <caption className="text-left text-slate-400 mb-3">
                      Pod 상태 · 공식 phase와 준비 조건은 별도
                    </caption>
                    <thead>
                      <tr>
                        {[
                          "Pod",
                          "phase",
                          "학습 단계",
                          "Ready",
                          "UID",
                          "재시작",
                        ].map((label) => (
                          <th key={label} className="p-2">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {clusterStep.podsState.map((p) => (
                        <tr key={p.id} className="border-t border-slate-800">
                          <td className="p-2">{p.name}</td>
                          <td>{p.podPhase}</td>
                          <td>{p.learningStage}</td>
                          <td>{p.ready}</td>
                          <td>{p.uid}</td>
                          <td>{p.restarts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              <PlaybackBar
                currentStepIndex={index}
                totalSteps={total}
                isPlaying={progress.playing}
                speed={progress.speed}
                onPlayPause={() =>
                  update({
                    playing: !progress.playing,
                    index: index === total - 1 ? 0 : index,
                  })
                }
                onPrevStep={() => selectStep(Math.max(0, index - 1))}
                onNextStep={() => selectStep(Math.min(total - 1, index + 1))}
                onReset={() => dispatch({ type: "reset" })}
                onStepSelect={selectStep}
                onSpeedChange={(speed) => update({ speed })}
                stepTitles={(internal || lifecycle
                  ? podSteps
                  : clusterSteps
                ).map((s) => s.title)}
              />
              <p className="text-xs text-slate-500" aria-live="polite">
                현재 단계 {index + 1}/{total} · {step.title} ·{" "}
                {progress.playing ? "재생 중" : "일시정지"}
              </p>
              <details className="learning-details">
                <summary>전체 과정과 단계 선택</summary>
                <ol className="grid sm:grid-cols-2 gap-2">
                  {(internal || lifecycle ? podSteps : clusterSteps).map(
                    (s, i) => (
                      <li key={i}>
                        <button
                          className="learning-button w-full justify-start text-left"
                          aria-current={index === i ? "step" : undefined}
                          onClick={() => selectStep(i)}
                        >
                          {i + 1}. {s.title}
                        </button>
                      </li>
                    ),
                  )}
                </ol>
              </details>
              <details key={`yaml-${page.id}`} className="learning-details">
                <summary>YAML · 줄별 분석 · 설정 비교</summary>
                <p className="text-xs text-slate-400 mb-3">
                  시뮬레이션 예시 · Apply와 재생은 실제 클러스터를 변경하지
                  않습니다.
                </p>
                {batch ? (
                  <JobCronJobYaml example={progress.example} />
                ) : certificates ? (
                  <CertManagerYaml />
                ) : volumes ? (
                  <LearningSnippet title={`${volumePreset.name} · volumes와 volumeMounts`} code={volumePreset.yaml} />
                ) : configuration ? (
                  <LearningSnippet title="ConfigMap·Secret와 Pod 환경변수·파일 참조" code={CONFIG_SECRET_YAML} />
                ) : page.id === "pod-creation" || statefulset ? (
                  <>
                    <YamlEditor
                      preset={preset}
                      activeLines={clusterStep.highlightYamlLines ?? []}
                      selectedLine={progress.selectedLine}
                      onSelectLine={(selectedLine) => update({ selectedLine })}
                      onApplyManifest={() =>
                        update({ index: 0, playing: true })
                      }
                      isSimulating={progress.playing}
                    />
                    <LineImpactCard
                      impact={impact}
                      onComponentClick={selectComponent}
                    />
                  </>
                ) : page.id === "ingress" ? (
                  <IngressYamlViewer
                    currentStepPhase={selectedIngress.phase}
                    targetYaml={selectedIngress.targetYaml}
                    stepNumber={selectedIngress.stepNumber}
                  />
                ) : page.id === "persistent-storage" ? (
                  <PvcYamlViewer
                    currentStepPhase={selectedStorage.phase}
                    targetYaml={selectedStorage.targetYaml}
                    stepNumber={selectedStorage.stepNumber}
                  />
                ) : internal || lifecycle ? (
                  <p className="text-sm text-slate-300 leading-7">
                    <a
                      className="text-blue-400 underline"
                      href={pageHref("pod-creation")}
                    >
                      Pod 생성 YAML
                    </a>
                    과{" "}
                    <a
                      className="text-blue-400 underline"
                      href={sourceUrl("workloads/pods/probes")}
                    >
                      프로브 설정
                    </a>
                    을 함께 확인하세요. restartPolicy의 Always·OnFailure·Never는
                    종료 결과에 따른 재시작을 제어합니다.
                  </p>
                ) : (
                  <SeparatedYamlViewer
                    currentStepPhase={selectedResource.phase}
                    targetYaml={selectedResource.targetYaml}
                    stepNumber={selectedResource.stepNumber}
                  />
                )}
                {page.id === "resource-relations" ? (
                  <LearningSnippet
                    title="설정·ServiceAccount·Role·Binding YAML"
                    code={IDENTITY_EXAMPLE}
                  />
                ) : null}
              </details>
              <details className="learning-details">
                <summary>명령과 로그 · 시뮬레이션 예시</summary>
                <TerminalStream
                  logs={
                    internal || lifecycle
                      ? [
                          {
                            command: "kubectl describe pod web-server",
                            output: podStep.describeOutput,
                          },
                          {
                            command: "journalctl -u kubelet",
                            output: podStep.terminalLogs,
                          },
                        ]
                      : clusterStep.cliLogs
                  }
                />
              </details>
              {!internal && !lifecycle ? (
                <details className="learning-details">
                  <summary>API 리소스와 etcd · 시뮬레이션 예시</summary>
                  {certificates ? <p className="text-xs text-slate-400 mb-3">발급 단계별 API 객체의 주요 필드만 표시합니다. 경로는 논리적 위치이며 실제 etcd 키가 아닙니다. 인증서·CSR·개인 키는 생략한 표시용 값입니다.</p> : null}
                  <EtcdLiveViewer etcdState={clusterStep.etcdState} compact />
                </details>
              ) : null}
            </>
          )}
          {batch ? <JobCronJobSettings /> : null}
          <section className="learning-panel">
            <h2 className="text-sm font-bold text-blue-200">
              이 페이지에서 기억할 내용
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-7">
              {page.takeaway}
            </p>
            <a
              href={source}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-3 text-xs underline text-blue-400"
            >
              {certificates ? "cert-manager 공식 설명 ↗" : "Kubernetes 공식 설명 ↗"}
            </a>
          </section>
          <LearningNavigation page={page.id} />
        </main>
      </div>
      {docsOpen ? (
        <Encyclopedia
          onClose={() => setDocsOpen(false)}
          onSelect={selectComponent}
        />
      ) : null}
      <ComponentDetailModal componentId={detailId} onClose={closeDetail} />
    </div>
  );
}

export default App;
