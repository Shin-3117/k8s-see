import React, { useState, useEffect } from 'react';
import { AppMode, K8sComponentId } from './types/pipeline';
import { YAML_PRESETS } from './data/yamlPresets';
import { MODE1_STEPS, MODE1_FLOWCHART_NODES } from './data/mode1Steps';
import { MODE2_STEPS } from './data/mode2Steps';
import { MODE3_STEPS, MODE3_FLOWCHART_NODES } from './data/mode3Steps';
import { MODE4_STEPS, MODE4_FLOWCHART_NODES } from './data/mode4Steps';
import { MODE5_STEPS, MODE5_FLOWCHART_NODES } from './data/mode5Steps';
import { Header } from './components/Header';
import { YamlEditor } from './components/YamlInspector/YamlEditor';
import { SeparatedYamlViewer } from './components/YamlInspector/SeparatedYamlViewer';
import { PvcYamlViewer } from './components/YamlInspector/PvcYamlViewer';
import { IngressYamlViewer } from './components/YamlInspector/IngressYamlViewer';
import { LineImpactCard } from './components/YamlInspector/LineImpactCard';
import { ReactFlowClusterCanvas } from './components/Mode1Cluster/ReactFlowClusterCanvas';
import { PodDeepDiveCanvas } from './components/Mode2Pod/PodDeepDiveCanvas';
import { FlowchartSequence } from './components/Common/FlowchartSequence';
import { PlaybackBar } from './components/Common/PlaybackBar';
import { StepExplainer } from './components/Common/StepExplainer';
import { TerminalStream } from './components/Common/TerminalStream';
import { EtcdLiveViewer } from './components/Common/EtcdLiveViewer';
import { ComponentDetailModal } from './components/Common/ComponentDetailModal';
import { AlertCircle, HardDrive, Network } from 'lucide-react';

export const App: React.FC = () => {
  // App Mode (Mode 1: Manifest apply / Mode 2: Pod lifecycle / Mode 3: Separated apply / Mode 4: PVC & AWS EBS)
  const [currentMode, setCurrentMode] = useState<AppMode>('mode1-manifest');

  // Preset Selection
  const [selectedPresetId, setSelectedPresetId] = useState<string>('nginx-deployment');
  const currentPreset = YAML_PRESETS.find((p) => p.id === selectedPresetId) || YAML_PRESETS[0];

  // Mode 1: Step state & playback
  const [mode1StepIndex, setMode1StepIndex] = useState<number>(0);
  const [isMode1Playing, setIsMode1Playing] = useState<boolean>(false);
  const [mode1Speed, setMode1Speed] = useState<number>(1);
  const [selectedLine, setSelectedLine] = useState<number | null>(6);

  // Mode 2: Step state & playback
  const [mode2StepIndex, setMode2StepIndex] = useState<number>(0);
  const [isMode2Playing, setIsMode2Playing] = useState<boolean>(false);
  const [mode2Speed, setMode2Speed] = useState<number>(1);

  // Mode 3: Step state & playback
  const [mode3StepIndex, setMode3StepIndex] = useState<number>(0);
  const [isMode3Playing, setIsMode3Playing] = useState<boolean>(false);
  const [mode3Speed, setMode3Speed] = useState<number>(1);

  // Mode 4: Step state & playback (PVC & AWS EBS)
  const [mode4StepIndex, setMode4StepIndex] = useState<number>(0);
  const [isMode4Playing, setIsMode4Playing] = useState<boolean>(false);
  const [mode4Speed, setMode4Speed] = useState<number>(1);

  // Mode 5: Step state & playback (Ingress L7 Routing)
  const [mode5StepIndex, setMode5StepIndex] = useState<number>(0);
  const [isMode5Playing, setIsMode5Playing] = useState<boolean>(false);
  const [mode5Speed, setMode5Speed] = useState<number>(1);

  // Detail Modal Component
  const [detailComponentId, setDetailComponentId] = useState<K8sComponentId | null>(null);

  // Find impact for the selected line (Mode 1)
  const currentLineImpact = currentPreset.impacts.find(
    (imp) => selectedLine !== null && selectedLine >= imp.startLine && selectedLine <= imp.endLine
  ) || null;

  const yamlHighlightedComponents = currentLineImpact ? currentLineImpact.affectedComponents : [];

  // Current Step objects
  const currentMode1Step = MODE1_STEPS[mode1StepIndex];
  const currentMode2Step = MODE2_STEPS[mode2StepIndex];
  const currentMode3Step = MODE3_STEPS[mode3StepIndex];
  const currentMode4Step = MODE4_STEPS[mode4StepIndex];
  const currentMode5Step = MODE5_STEPS[mode5StepIndex];

  // Mode 1 Playback Timer Effect
  useEffect(() => {
    if (!isMode1Playing) return;
    const intervalTime = 3000 / mode1Speed;
    const timer = setInterval(() => {
      setMode1StepIndex((prev) => {
        if (prev < MODE1_STEPS.length - 1) {
          return prev + 1;
        } else {
          setIsMode1Playing(false);
          return prev;
        }
      });
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isMode1Playing, mode1Speed]);

  // Mode 2 Playback Timer Effect
  useEffect(() => {
    if (!isMode2Playing) return;
    const intervalTime = 3200 / mode2Speed;
    const timer = setInterval(() => {
      setMode2StepIndex((prev) => {
        if (prev < MODE2_STEPS.length - 1) {
          return prev + 1;
        } else {
          setIsMode2Playing(false);
          return prev;
        }
      });
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isMode2Playing, mode2Speed]);

  // Mode 3 Playback Timer Effect
  useEffect(() => {
    if (!isMode3Playing) return;
    const intervalTime = 3200 / mode3Speed;
    const timer = setInterval(() => {
      setMode3StepIndex((prev) => {
        if (prev < MODE3_STEPS.length - 1) {
          return prev + 1;
        } else {
          setIsMode3Playing(false);
          return prev;
        }
      });
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isMode3Playing, mode3Speed]);

  // Mode 4 Playback Timer Effect (PVC & AWS EBS)
  useEffect(() => {
    if (!isMode4Playing) return;
    const intervalTime = 3200 / mode4Speed;
    const timer = setInterval(() => {
      setMode4StepIndex((prev) => {
        if (prev < MODE4_STEPS.length - 1) {
          return prev + 1;
        } else {
          setIsMode4Playing(false);
          return prev;
        }
      });
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isMode4Playing, mode4Speed]);

  // Mode 5 Playback Timer Effect (Ingress L7 Routing)
  useEffect(() => {
    if (!isMode5Playing) return;
    const intervalTime = 3200 / mode5Speed;
    const timer = setInterval(() => {
      setMode5StepIndex((prev) => {
        if (prev < MODE5_STEPS.length - 1) {
          return prev + 1;
        } else {
          setIsMode5Playing(false);
          return prev;
        }
      });
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isMode5Playing, mode5Speed]);

  // Trigger Apply Manifest: start mode 1 from step 0
  const handleApplyManifest = () => {
    setMode1StepIndex(0);
    setIsMode1Playing(true);
  };

  // Simulate Pod Deletion (Jump to step 5: Terminating)
  const handleSimulateDelete = () => {
    setMode2StepIndex(5);
    setIsMode2Playing(false);
  };

  // Reset Pod Lifecycle
  const handleResetLifecycle = () => {
    setMode2StepIndex(0);
    setIsMode2Playing(true);
  };

  return (
    <div className="min-h-screen bg-[#070C16] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* 1. Global Header */}
      <Header
        currentMode={currentMode}
        onModeChange={(mode) => {
          setCurrentMode(mode);
          setIsMode1Playing(false);
          setIsMode2Playing(false);
          setIsMode3Playing(false);
          setIsMode4Playing(false);
        }}
        selectedPresetId={selectedPresetId}
        onPresetChange={(id) => {
          setSelectedPresetId(id);
          setSelectedLine(1);
          setMode1StepIndex(0);
          setIsMode1Playing(false);
        }}
        onOpenArchitectureDocs={() => setDetailComponentId('apiserver')}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-3 sm:p-4 flex flex-col gap-4">
        {/* ========================================================================= */}
        {/* MODE 1: MANIFEST APPLY SCENARIO (Cluster Orchestration View)               */}
        {/* ========================================================================= */}
        {currentMode === 'mode1-manifest' && (
          <div className="flex flex-col gap-4">
            {/* Top Flowchart Sequence for Mode 1 */}
            <FlowchartSequence
              nodes={MODE1_FLOWCHART_NODES}
              activeNodeId={currentMode1Step.activeNodeId || 'm1-client'}
              currentStepIndex={mode1StepIndex}
              onSelectStep={(idx) => {
                setMode1StepIndex(idx);
                setIsMode1Playing(false);
              }}
              title="Deployment 생성 및 오케스트레이션 순서도 (Flowchart)"
              subTitle="kubectl apply ➔ API Server ➔ etcd ➔ Controller Reconcile ➔ Scheduler ➔ Kubelet ➔ CRI ➔ Service/Proxy"
              badgeText="8-Step Orchestration Pipeline"
              badgeColorClass="bg-blue-500/20 text-blue-300 border-blue-500/30"
              isMode1={true}
            />

            {/* Service Preset Notice (Explaining why Service alone does not create Pods) */}
            {selectedPresetId === 'service-ingress' && (
              <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-3.5 text-xs text-amber-200 flex items-start gap-3 shadow-lg shadow-amber-950/30">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-300 flex items-center gap-2">
                    <span>💡 [주의] Service 매니페스트 적용 시 동작 원리 안내</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Service 단독 vs Deployment 연동
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    쿠버네티스에서 <strong>Service(<code className="text-amber-300">kind: Service</code>)는 결코 ReplicaSet이나 Pod를 직접 생성하지 않습니다.</strong> 
                    현재 상단 및 하단의 8단계 시나리오는 파드가 없는 상태에서 Deployment와 Service가 유기적으로 연계 배포되는 클러스터 전역 표준 오케스트레이션 파이프라인을 보여주기 위한 것입니다.
                  </p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    만약 실제 환경에서 Service만 단독 <code className="text-slate-200">kubectl apply</code>할 경우: 
                    <strong> 4~7단계(ReplicaSet 생성, Scheduler 노드 바인딩, Kubelet, CRI)는 일절 개입하지 않으며</strong>, 
                    오직 <strong className="text-cyan-300">API Server의 ClusterIP VIP 할당</strong> ➔ <strong className="text-cyan-300">EndpointSlice 생성</strong> ➔ <strong className="text-cyan-300">kube-proxy iptables 반영</strong>의 3단계로 초고속 완료됩니다.
                  </p>
                </div>
              </div>
            )}

            {/* Top Workspace Grid: Left(YAML & Line Impact) + Right(Cluster Canvas) */}
            <div className="grid grid-cols-12 gap-4 items-start">
              {/* Left Column: YAML Editor & Line Impact Card (4 cols) */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
                <YamlEditor
                  preset={currentPreset}
                  activeLines={currentMode1Step.highlightYamlLines || []}
                  selectedLine={selectedLine}
                  onSelectLine={(line) => setSelectedLine(line)}
                  onApplyManifest={handleApplyManifest}
                  isSimulating={isMode1Playing}
                />

                <LineImpactCard
                  impact={currentLineImpact}
                  onComponentClick={(compId) => setDetailComponentId(compId)}
                />
              </div>

              {/* Right Column: Cluster Architecture Canvas (8 cols) */}
              <div className="col-span-12 lg:col-span-8 overflow-x-auto">
                <ReactFlowClusterCanvas
                  activeComponents={currentMode1Step.activeComponents}
                  packets={currentMode1Step.packets}
                  podsState={currentMode1Step.podsState}
                  selectedComponent={detailComponentId}
                  onSelectComponent={(compId) => setDetailComponentId(compId)}
                  yamlHighlightedComponents={yamlHighlightedComponents}
                />
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <PlaybackBar
              currentStepIndex={mode1StepIndex}
              totalSteps={MODE1_STEPS.length}
              isPlaying={isMode1Playing}
              speed={mode1Speed}
              onPlayPause={() => setIsMode1Playing(!isMode1Playing)}
              onPrevStep={() => setMode1StepIndex((prev) => Math.max(0, prev - 1))}
              onNextStep={() => setMode1StepIndex((prev) => Math.min(MODE1_STEPS.length - 1, prev + 1))}
              onReset={() => {
                setMode1StepIndex(0);
                setIsMode1Playing(false);
              }}
              onStepSelect={(idx) => {
                setMode1StepIndex(idx);
                setIsMode1Playing(false);
              }}
              onSpeedChange={(s) => setMode1Speed(s)}
              stepTitles={MODE1_STEPS.map((s) => s.title)}
            />

            {/* Observability Row: Step Explainer & CLI Terminal Stream (Side-by-Side) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              <StepExplainer
                stepNumber={currentMode1Step.stepNumber}
                totalSteps={MODE1_STEPS.length}
                title={currentMode1Step.title}
                subTitle={currentMode1Step.subTitle}
                description={currentMode1Step.description}
                k8sMechanism={currentMode1Step.k8sMechanism}
              />
              <TerminalStream logs={currentMode1Step.cliLogs} />
            </div>

            {/* Full-Width Large etcd Live Storage Inspector */}
            <div className="w-full">
              <EtcdLiveViewer etcdState={currentMode1Step.etcdState} />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 2: POD LIFECYCLE DEEP-DIVE (Runtime Anatomy View)                    */}
        {/* ========================================================================= */}
        {currentMode === 'mode2-pod-lifecycle' && (
          <div className="flex flex-col gap-4">
            {/* Top Pod Canvas */}
            <PodDeepDiveCanvas
              currentStep={currentMode2Step}
              onSimulateDelete={handleSimulateDelete}
              onResetLifecycle={handleResetLifecycle}
            />

            {/* Playback Controls */}
            <PlaybackBar
              currentStepIndex={mode2StepIndex}
              totalSteps={MODE2_STEPS.length}
              isPlaying={isMode2Playing}
              speed={mode2Speed}
              onPlayPause={() => setIsMode2Playing(!isMode2Playing)}
              onPrevStep={() => setMode2StepIndex((prev) => Math.max(0, prev - 1))}
              onNextStep={() => setMode2StepIndex((prev) => Math.min(MODE2_STEPS.length - 1, prev + 1))}
              onReset={() => {
                setMode2StepIndex(0);
                setIsMode2Playing(false);
              }}
              onStepSelect={(idx) => {
                setMode2StepIndex(idx);
                setIsMode2Playing(false);
              }}
              onSpeedChange={(s) => setMode2Speed(s)}
              stepTitles={MODE2_STEPS.map((s) => s.title)}
            />

            {/* Bottom Dual Panels: Step Explainer & Real-time Describe Terminal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              <StepExplainer
                stepNumber={currentMode2Step.stepNumber}
                totalSteps={MODE2_STEPS.length}
                title={currentMode2Step.title}
                subTitle={currentMode2Step.subTitle}
                description={currentMode2Step.description}
                k8sMechanism={currentMode2Step.deepDive}
              />

              <TerminalStream
                title="kubectl describe pod & Kubelet logs"
                logs={[
                  {
                    command: 'kubectl describe pod web-server-794d6c-4k8x1',
                    output: currentMode2Step.describeOutput
                  },
                  {
                    command: 'journalctl -u kubelet -f --no-pager',
                    output: currentMode2Step.terminalLogs
                  }
                ]}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 3: SEPARATED DEPLOYMENT & SERVICE APPLY SCENARIO                     */}
        {/* ========================================================================= */}
        {currentMode === 'mode3-separated-apply' && (
          <div className="flex flex-col gap-4">
            {/* Top Phase Header / Banner */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    currentMode3Step.phase === 'configmap'
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40'
                      : currentMode3Step.phase === 'deployment'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                      : 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      currentMode3Step.phase === 'configmap'
                        ? 'bg-amber-400'
                        : currentMode3Step.phase === 'deployment'
                        ? 'bg-blue-400'
                        : 'bg-cyan-400'
                    } animate-ping`}
                  />
                  <span>
                    {currentMode3Step.phase === 'configmap'
                      ? 'Phase 1: ConfigMap 독립 배포 (H2 DB 설정)'
                      : currentMode3Step.phase === 'deployment'
                      ? 'Phase 2: Deployment 배포 (볼륨 마운트 & Pod 기동)'
                      : 'Phase 3: Service 배포 & 듀얼 포트 연결'}
                  </span>
                </div>

                <div className="text-xs text-slate-300 hidden md:block font-medium">
                  {currentMode3Step.phase === 'configmap'
                    ? 'Spring Boot H2 DB 설정(application-prod.yaml)을 etcd에 선제 배포하여 볼륨 마운트 준비를 마치는 단계입니다.'
                    : currentMode3Step.phase === 'deployment'
                    ? 'ConfigMap을 /config에 tmpfs로 마운트하여 Spring Boot H2 DB를 초기화하고 Pod를 기동하는 단계입니다. (Service 미배포)'
                    : 'ClusterIP 할당 및 EndpointSlice 라벨 매칭으로 8080(H2 콘솔/API) & 8081(Actuator) 듀얼 트래픽을 처리하는 단계입니다.'}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">배포 타겟:</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[11px] border border-slate-700">
                  {currentMode3Step.targetYaml === 'configmap'
                    ? 'configmap.yaml'
                    : currentMode3Step.targetYaml === 'deployment'
                    ? 'deployment.yaml'
                    : currentMode3Step.targetYaml === 'service'
                    ? 'service.yaml'
                    : '3종 1:1 연결'}
                </span>
              </div>
            </div>

            {/* Sequence Flowchart (12 Steps) */}
            <FlowchartSequence
              nodes={MODE3_FLOWCHART_NODES}
              activeNodeId={currentMode3Step.activeNodeId || 'm3-1-cm-apply'}
              currentStepIndex={mode3StepIndex}
              onSelectStep={(idx) => {
                setMode3StepIndex(idx);
                setIsMode3Playing(false);
              }}
              title="ConfigMap ➔ Deploy ➔ Service 3종 분리 배포 순서도 (Flowchart)"
              subTitle="Phase 1 (1~2단계: configmap.yaml) ➔ Phase 2 (3~7단계: deployment.yaml & H2 기동) ➔ Phase 3 (8~12단계: service.yaml & 듀얼 트래픽)"
              badgeText="12-Step Decoupled Pipeline"
              badgeColorClass="bg-amber-500/20 text-amber-300 border-amber-500/30"
              isMode1={true}
            />

            {/* Top Workspace: Cluster Canvas (React Flow) & Separated YAML Viewer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Cluster Canvas */}
              <div className="lg:col-span-7 xl:col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative min-h-[480px] flex flex-col">
                <ReactFlowClusterCanvas
                  activeComponents={currentMode3Step.activeComponents}
                  packets={currentMode3Step.packets}
                  podsState={currentMode3Step.podsState}
                  selectedComponent={detailComponentId}
                  onSelectComponent={(cid) => setDetailComponentId(cid)}
                  yamlHighlightedComponents={[]}
                />
              </div>

              {/* Separated YAML Viewer */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
                <SeparatedYamlViewer
                  currentStepPhase={currentMode3Step.phase}
                  targetYaml={currentMode3Step.targetYaml}
                  stepNumber={currentMode3Step.stepNumber}
                />
              </div>
            </div>

            {/* Playback Controls */}
            <PlaybackBar
              currentStepIndex={mode3StepIndex}
              totalSteps={MODE3_STEPS.length}
              isPlaying={isMode3Playing}
              speed={mode3Speed}
              onPlayPause={() => setIsMode3Playing(!isMode3Playing)}
              onPrevStep={() => setMode3StepIndex((prev) => Math.max(0, prev - 1))}
              onNextStep={() => setMode3StepIndex((prev) => Math.min(MODE3_STEPS.length - 1, prev + 1))}
              onReset={() => {
                setMode3StepIndex(0);
                setIsMode3Playing(false);
              }}
              onStepSelect={(idx) => {
                setMode3StepIndex(idx);
                setIsMode3Playing(false);
              }}
              onSpeedChange={(s) => setMode3Speed(s)}
              stepTitles={MODE3_STEPS.map((s) => s.title)}
            />

            {/* Observability Row: Step Explainer & CLI Terminal Stream (Side-by-Side) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              <StepExplainer
                stepNumber={currentMode3Step.stepNumber}
                totalSteps={MODE3_STEPS.length}
                title={currentMode3Step.title}
                subTitle={currentMode3Step.subTitle}
                description={currentMode3Step.description}
                k8sMechanism={currentMode3Step.k8sMechanism}
              />
              <TerminalStream logs={currentMode3Step.cliLogs} />
            </div>

            {/* Full-Width Large etcd Live Storage Inspector */}
            <div className="w-full">
              <EtcdLiveViewer etcdState={currentMode3Step.etcdState} />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 4: PVC & EXTERNAL CLOUD (AWS EBS) DYNAMIC STORAGE PROVISIONING       */}
        {/* ========================================================================= */}
        {currentMode === 'mode4-pvc' && (
          <div className="flex flex-col gap-4">
            {/* Phase Banner */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5" />
                    {currentMode4Step.phase === 'pvc-request'
                      ? 'Phase 1: PVC 생성 요청 및 대기 (Pending - WaitForFirstConsumer)'
                      : currentMode4Step.phase === 'scheduling'
                      ? 'Phase 2: Pod 스케줄링 및 노드 선정 (Worker-1 AZ: us-east-1a)'
                      : currentMode4Step.phase === 'aws-provision'
                      ? 'Phase 3: AWS API 호출 & EBS 볼륨 생성 (vol-0a91f4b2 gp3 20Gi)'
                      : currentMode4Step.phase === 'node-attach'
                      ? 'Phase 4: AWS EC2 인스턴스에 EBS 하드웨어 Attach (VolumeAttachment)'
                      : currentMode4Step.phase === 'kubelet-mount'
                      ? 'Phase 5: Kubelet mkfs.ext4 포맷 & MySQL /var/lib/mysql 마운트'
                      : 'Phase 6: Pod 재시작 시 AWS EBS 데이터 무손실 영속성(Persistence) 검증 완료'}
                  </span>
                </div>

                <div className="text-xs text-slate-300 hidden md:block font-medium">
                  {currentMode4Step.phase === 'pvc-request'
                    ? 'StorageClass의 WaitForFirstConsumer 정책에 의해 파드가 뜰 때까지 볼륨 생성을 안전하게 지연합니다.'
                    : currentMode4Step.phase === 'scheduling'
                    ? 'kube-scheduler가 볼륨 토폴로지(us-east-1a)와 노드 연결 한계를 계산하여 Worker Node 1을 확정합니다.'
                    : currentMode4Step.phase === 'aws-provision'
                    ? 'AWS EBS CSI Controller가 ec2:CreateVolume API를 호출하여 실제 gp3 볼륨을 생성하고 PV를 Bound합니다.'
                    : currentMode4Step.phase === 'node-attach'
                    ? 'Attach/Detach Controller가 ec2:AttachVolume을 호출하여 가상 디스크(/dev/nvme1n1)를 호스트에 물리 연결합니다.'
                    : currentMode4Step.phase === 'kubelet-mount'
                    ? 'Kubelet VolumeManager가 NodeStage(mkfs.ext4) 및 NodePublish(바인드 마운트)로 MySQL에 디스크를 전달합니다.'
                    : '파드가 삭제되거나 다른 노드로 이동해도 etcd의 PV/PVC와 AWS EBS 볼륨에 데이터가 100% 영구 보존됩니다.'}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">AWS 상태:</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono text-[11px] border border-amber-500/30">
                  {currentMode4Step.awsEbsState?.status.toUpperCase()} ({currentMode4Step.awsEbsState?.volumeId})
                </span>
              </div>
            </div>

            {/* Sequence Flowchart (8 Steps) */}
            <FlowchartSequence
              nodes={MODE4_FLOWCHART_NODES}
              activeNodeId={currentMode4Step.activeNodeId || 'm4-1-pvc'}
              currentStepIndex={mode4StepIndex}
              onSelectStep={(idx) => {
                setMode4StepIndex(idx);
                setIsMode4Playing(false);
              }}
              title="PVC ➔ AWS EBS 볼륨 동적 프로비저닝 및 마운트 순서도 (Flowchart)"
              subTitle="PVC 요청 ➔ Scheduler 노드 확정 ➔ CSI Provisioner ➔ AWS CreateVolume ➔ EC2 Attach ➔ Kubelet mkfs & Mount ➔ MySQL 가동 ➔ 영속성 검증"
              badgeText="8-Step CSI Pipeline"
              badgeColorClass="bg-amber-500/20 text-amber-300 border-amber-500/30"
              isMode1={true}
            />

            {/* Top Workspace: Cluster Canvas (React Flow with AWS Node) & PVC YAML Viewer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Cluster Canvas */}
              <div className="lg:col-span-7 xl:col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative min-h-[480px] flex flex-col">
                <ReactFlowClusterCanvas
                  activeComponents={currentMode4Step.activeComponents}
                  packets={currentMode4Step.packets}
                  podsState={currentMode4Step.podsState}
                  selectedComponent={detailComponentId}
                  onSelectComponent={(cid) => setDetailComponentId(cid)}
                  yamlHighlightedComponents={[]}
                  showAwsNode={true}
                  awsEbsState={currentMode4Step.awsEbsState}
                />
              </div>

              {/* PVC YAML Viewer */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
                <PvcYamlViewer
                  currentStepPhase={currentMode4Step.phase}
                  targetYaml={currentMode4Step.targetYaml}
                  stepNumber={currentMode4Step.stepNumber}
                />
              </div>
            </div>

            {/* Playback Controls */}
            <PlaybackBar
              currentStepIndex={mode4StepIndex}
              totalSteps={MODE4_STEPS.length}
              isPlaying={isMode4Playing}
              speed={mode4Speed}
              onPlayPause={() => setIsMode4Playing(!isMode4Playing)}
              onPrevStep={() => setMode4StepIndex((prev) => Math.max(0, prev - 1))}
              onNextStep={() => setMode4StepIndex((prev) => Math.min(MODE4_STEPS.length - 1, prev + 1))}
              onReset={() => {
                setMode4StepIndex(0);
                setIsMode4Playing(false);
              }}
              onStepSelect={(idx) => {
                setMode4StepIndex(idx);
                setIsMode4Playing(false);
              }}
              onSpeedChange={(s) => setMode4Speed(s)}
              stepTitles={MODE4_STEPS.map((s) => s.title)}
            />

            {/* Observability Row: Step Explainer & CLI Terminal Stream (Side-by-Side) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              <StepExplainer
                stepNumber={currentMode4Step.stepNumber}
                totalSteps={MODE4_STEPS.length}
                title={currentMode4Step.title}
                subTitle={currentMode4Step.subTitle}
                description={currentMode4Step.description}
                k8sMechanism={currentMode4Step.k8sMechanism}
              />
              <TerminalStream logs={currentMode4Step.cliLogs} />
            </div>

            {/* Full-Width Large etcd Live Storage Inspector */}
            <div className="w-full">
              <EtcdLiveViewer etcdState={currentMode4Step.etcdState} />
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* MODE 5: INGRESS L7 TRAFFIC ROUTING WORKSPACE                   */}
        {/* =============================================================== */}
        {currentMode === 'mode5-ingress' && (
          <div className="space-y-4">
            {/* Mode 5 Phase Banner */}
            <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-slate-900 border border-purple-800/60 rounded-xl p-3 shadow-lg flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow">
                  <Network className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      L7 Ingress Controller
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      PHASE: {currentMode5Step.phase.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 hidden md:block font-medium mt-0.5">
                    {currentMode5Step.phase === 'ingress-create'
                      ? 'Ingress 리소스(api.example.com) 생성 ➔ TLS 인증서 및 /orders, /products L7 라우팅 규칙 etcd 등록'
                      : currentMode5Step.phase === 'controller-watch'
                      ? 'Ingress Controller(ingress-nginx)가 Watch API를 통해 백엔드 파드 IP 목록(EndpointSlices) 직접 수집'
                      : currentMode5Step.phase === 'dynamic-reload'
                      ? '템플릿 엔진으로 /etc/nginx/nginx.conf 렌더링 ➔ SIGHUP 및 동적 Lua 모듈을 통한 무중단 리로드'
                      : currentMode5Step.phase === 'https-ingress'
                      ? '클라이언트 HTTPS/443 진입 ➔ TLS Handshake & Termination(SSL 복호화) 수행'
                      : currentMode5Step.phase === 'path-routing-order'
                      ? '/orders 경로 매칭 ➔ Worker Node 1의 order-api 파드(10.244.1.25:8080)로 직접 L7 역방향 프록시'
                      : currentMode5Step.phase === 'path-routing-product'
                      ? '/products 경로 매칭 ➔ Worker Node 2의 product-api 파드(10.244.2.18:8080)로 직접 L7 역방향 프록시'
                      : '파드 JSON 응답 수신 ➔ Ingress Controller TLS 암호화 ➔ End User 클라이언트에 200 OK 최종 반환'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">활성 라우트:</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono text-[11px] border border-purple-500/30">
                  {currentMode5Step.activeRoute
                    ? `${currentMode5Step.activeRoute.path} ➔ ${currentMode5Step.activeRoute.targetPodIp}`
                    : '대기 중 (Ready)'}
                </span>
              </div>
            </div>

            {/* Sequence Flowchart (7 Steps) */}
            <FlowchartSequence
              nodes={MODE5_FLOWCHART_NODES}
              activeNodeId={currentMode5Step.activeNodeId || 'm5-1-ingress-apply'}
              currentStepIndex={mode5StepIndex}
              onSelectStep={(idx) => {
                setMode5StepIndex(idx);
                setIsMode5Playing(false);
              }}
              title="Ingress L7 트래픽 라우팅 & 리버스 프록시 순서도 (Flowchart)"
              subTitle="Ingress 생성 ➔ Controller Watch ➔ NGINX 리로드 ➔ HTTPS 요청 & TLS 종료 ➔ /orders 라우팅 ➔ /products 라우팅 ➔ 200 OK 응답"
              badgeText="7-Step L7 Pipeline"
              badgeColorClass="bg-purple-500/20 text-purple-300 border-purple-500/30"
              isMode1={true}
            />

            {/* Top Workspace: Cluster Canvas (React Flow with Ingress Node) & Ingress YAML Viewer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Cluster Canvas */}
              <div className="lg:col-span-7 xl:col-span-8 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative min-h-[480px] flex flex-col">
                <ReactFlowClusterCanvas
                  activeComponents={currentMode5Step.activeComponents}
                  packets={currentMode5Step.packets}
                  podsState={currentMode5Step.podsState}
                  selectedComponent={detailComponentId}
                  onSelectComponent={(cid) => setDetailComponentId(cid)}
                  yamlHighlightedComponents={[]}
                  showAwsNode={false}
                  showIngressNode={true}
                  ingressControllerState={currentMode5Step.ingressControllerState}
                  activeRoute={currentMode5Step.activeRoute}
                />
              </div>

              {/* Ingress YAML Viewer */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
                <IngressYamlViewer
                  currentStepPhase={currentMode5Step.phase}
                  targetYaml={currentMode5Step.targetYaml}
                  stepNumber={currentMode5Step.stepNumber}
                />
              </div>
            </div>

            {/* Playback Controls */}
            <PlaybackBar
              currentStepIndex={mode5StepIndex}
              totalSteps={MODE5_STEPS.length}
              isPlaying={isMode5Playing}
              speed={mode5Speed}
              onPlayPause={() => setIsMode5Playing(!isMode5Playing)}
              onPrevStep={() => setMode5StepIndex((prev) => Math.max(0, prev - 1))}
              onNextStep={() => setMode5StepIndex((prev) => Math.min(MODE5_STEPS.length - 1, prev + 1))}
              onReset={() => {
                setMode5StepIndex(0);
                setIsMode5Playing(false);
              }}
              onStepSelect={(idx) => {
                setMode5StepIndex(idx);
                setIsMode5Playing(false);
              }}
              onSpeedChange={(s) => setMode5Speed(s)}
              stepTitles={MODE5_STEPS.map((s) => s.title)}
            />

            {/* Observability Row: Step Explainer & CLI Terminal Stream (Side-by-Side) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              <StepExplainer
                stepNumber={currentMode5Step.stepNumber}
                totalSteps={MODE5_STEPS.length}
                title={currentMode5Step.title}
                subTitle={currentMode5Step.subTitle}
                description={currentMode5Step.description}
                k8sMechanism={currentMode5Step.k8sMechanism}
              />
              <TerminalStream logs={currentMode5Step.cliLogs} />
            </div>

            {/* Full-Width Large etcd Live Storage Inspector */}
            <div className="w-full">
              <EtcdLiveViewer etcdState={currentMode5Step.etcdState} />
            </div>
          </div>
        )}
      </main>

      {/* 3. Component Deep Dive Encyclopedia Modal */}
      <ComponentDetailModal
        componentId={detailComponentId}
        onClose={() => setDetailComponentId(null)}
      />
    </div>
  );
};
export default App;
