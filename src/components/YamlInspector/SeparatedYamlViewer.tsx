import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Layers,
  Network,
  Columns,
  Sliders,
  CheckCircle2,
  ArrowRightLeft,
  Database
} from 'lucide-react';
import {
  MODE3_CONFIGMAP_YAML,
  MODE3_DEPLOYMENT_YAML,
  MODE3_SERVICE_YAML,
  DEFAULT_TEMPLATE_VARS,
  substituteVariables
} from '../../data/mode3Steps';

interface SeparatedYamlViewerProps {
  currentStepPhase: 'configmap' | 'deployment' | 'service';
  targetYaml: 'configmap' | 'deployment' | 'service' | 'all';
  stepNumber: number;
}

export const SeparatedYamlViewer: React.FC<SeparatedYamlViewerProps> = ({
  currentStepPhase: _currentStepPhase,
  targetYaml,
  stepNumber: _stepNumber
}) => {
  // Tab view: 'configmap' | 'deployment' | 'service' | 'split'
  const [activeTab, setActiveTab] = useState<'configmap' | 'deployment' | 'service' | 'split'>('split');
  // Variable toggle: raw template vs substituted values
  const [useRenderedVars, setUseRenderedVars] = useState<boolean>(true);
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const configMapContent = useRenderedVars
    ? substituteVariables(MODE3_CONFIGMAP_YAML)
    : MODE3_CONFIGMAP_YAML;

  const deploymentContent = useRenderedVars
    ? substituteVariables(MODE3_DEPLOYMENT_YAML)
    : MODE3_DEPLOYMENT_YAML;

  const serviceContent = useRenderedVars
    ? substituteVariables(MODE3_SERVICE_YAML)
    : MODE3_SERVICE_YAML;

  const handleCopy = (tab: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 1500);
  };

  const renderYamlCode = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="font-mono text-[11px] leading-5 overflow-x-auto select-all">
        {lines.map((line, idx) => {
          const lineNum = idx + 1;
          const isConfigMapRef = line.includes('sk085-myfirst-configmap') || line.includes('config-volume') || line.includes('/config');
          const isH2Line = line.includes('h2') || line.includes('jdbc:h2') || line.includes('datasource');
          const isLabelLine = line.includes('app:');
          const isSelectorLine = line.includes('selector:') || line.includes('matchLabels:');
          const isPortLine = line.includes('8080') || line.includes('8081') || line.includes('port:');
          const isActuatorLine = line.includes('actuator') || line.includes('prometheus');

          let highlightBg = '';
          if (isConfigMapRef || isH2Line) highlightBg = 'bg-amber-950/40 text-amber-200 font-semibold';
          else if (isLabelLine || isSelectorLine) highlightBg = 'bg-cyan-950/40 text-cyan-200 font-semibold';
          else if (isPortLine) highlightBg = 'bg-emerald-950/30 text-emerald-200';
          else if (isActuatorLine) highlightBg = 'bg-purple-950/30 text-purple-200';

          return (
            <div
              key={idx}
              className={`flex items-start px-2.5 py-0.5 hover:bg-slate-800/60 transition-colors ${highlightBg}`}
            >
              <span className="w-6 shrink-0 select-none text-right pr-2 text-slate-500 text-[10px]">
                {lineNum}
              </span>
              <span className="flex-1 whitespace-pre break-all">
                {line}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-[#0B1220] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full font-mono-code">
      {/* 1. Top Controls & Header */}
      <div className="bg-slate-900/95 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-blue-600 to-indigo-500 p-0.5 flex items-center justify-center shadow-md">
            <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center text-blue-400">
              <FileCode className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 tracking-tight">
                분리 매니페스트 인스펙터
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                ConfigMap + Deploy + Service
              </span>
            </div>
          </div>
        </div>

        {/* View Switchers & Variable Mode */}
        <div className="flex items-center gap-2">
          {/* Variable Toggle: Raw Template vs Substituted */}
          <button
            onClick={() => setUseRenderedVars(!useRenderedVars)}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 transition-all border ${
              useRenderedVars
                ? 'bg-blue-600/30 text-blue-200 border-blue-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="템플릿 변수({{...}}) 치환 상태 전환"
          >
            <Sliders className="w-3 h-3 text-blue-400" />
            <span>{useRenderedVars ? '치환값 (sk085/class-3)' : '템플릿 ({{...}})'}</span>
          </button>

          {/* Tab / Split Buttons */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setActiveTab('configmap')}
              className={`px-2 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'configmap'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>configmap.yaml</span>
              {targetYaml === 'configmap' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('deployment')}
              className={`px-2 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'deployment'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>deploy.yaml</span>
              {targetYaml === 'deployment' && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('service')}
              className={`px-2 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'service'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>service.yaml</span>
              {targetYaml === 'service' && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('split')}
              className={`px-2 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                activeTab === 'split'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3 h-3" />
              <span className="hidden sm:inline">3종 비교</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Binding Linkage Banners (2-Level Loose Coupling Bridge) */}
      <div className="bg-gradient-to-r from-amber-950/40 via-blue-950/30 to-indigo-950/40 px-3 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Link 1: Config Connection */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono bg-slate-900/80 px-2 py-1 rounded-lg border border-amber-500/30">
            <span className="text-amber-400 font-bold">1. 설정 연결:</span>
            <span className="text-amber-200 font-semibold">ConfigMap(sk085-myfirst-configmap)</span>
            <ArrowRightLeft className="w-3 h-3 text-amber-400" />
            <span className="text-slate-300">Pod.volumes.configMap (마운트: /config)</span>
          </div>

          {/* Link 2: Service Connection */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono bg-slate-900/80 px-2 py-1 rounded-lg border border-cyan-500/30">
            <span className="text-cyan-400 font-bold">2. 라우팅 연결:</span>
            <span className="text-blue-300">Pod.labels.app({DEFAULT_TEMPLATE_VARS.USER_NAME}-myfirst-api-server)</span>
            <span className="text-cyan-400 font-bold">🔗</span>
            <span className="text-indigo-300">Service.selector.app</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>3종 독립 오브젝트 1:1 매칭 완료</span>
        </div>
      </div>

      {/* 3. Sub-indicator: H2 & Dual Ports */}
      <div className="bg-slate-950/80 px-4 py-1.5 border-b border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-amber-300">
            <Database className="w-3 h-3 text-amber-400" />
            DB: <strong className="text-white font-mono">jdbc:h2:mem:testdb (/h2-console)</strong>
          </span>
          <span className="flex items-center gap-1 text-cyan-300">
            포트: <strong className="text-white font-mono">8080 (http)</strong> & <strong className="text-white font-mono">8081 (mgmt)</strong>
          </span>
        </div>
        <span className="text-[10px] text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30">
          Actuator Prometheus: /actuator/prometheus
        </span>
      </div>

      {/* 4. Code Body */}
      <div className="flex-1 overflow-hidden min-h-[400px]">
        {activeTab === 'split' ? (
          /* Split 3-Column Side-by-Side View */
          <div className="grid grid-cols-1 md:grid-cols-3 h-full divide-y md:divide-y-0 md:divide-x divide-slate-800">
            {/* 1. ConfigMap */}
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-3 py-1.5 bg-amber-950/30 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px]">
                  <Database className="w-3 h-3 text-amber-400" />
                  1. configmap.yaml (설정 & H2)
                </span>
                <button
                  onClick={() => handleCopy('configmap', configMapContent)}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                >
                  {copiedTab === 'configmap' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedTab === 'configmap' ? '복사됨' : '복사'}</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {renderYamlCode(configMapContent)}
              </div>
            </div>

            {/* 2. Deployment */}
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-3 py-1.5 bg-blue-950/30 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-blue-300 text-[11px]">
                  <Layers className="w-3 h-3 text-blue-400" />
                  2. deployment.yaml (워크로드)
                </span>
                <button
                  onClick={() => handleCopy('deployment', deploymentContent)}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                >
                  {copiedTab === 'deployment' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedTab === 'deployment' ? '복사됨' : '복사'}</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {renderYamlCode(deploymentContent)}
              </div>
            </div>

            {/* 3. Service */}
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-3 py-1.5 bg-indigo-950/30 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-indigo-300 text-[11px]">
                  <Network className="w-3 h-3 text-indigo-400" />
                  3. service.yaml (네트워크)
                </span>
                <button
                  onClick={() => handleCopy('service', serviceContent)}
                  className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                >
                  {copiedTab === 'service' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedTab === 'service' ? '복사됨' : '복사'}</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {renderYamlCode(serviceContent)}
              </div>
            </div>
          </div>
        ) : activeTab === 'configmap' ? (
          /* Single Tab: ConfigMap */
          <div className="flex flex-col h-full overflow-hidden">
            <div className="px-4 py-2 bg-amber-950/30 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300 text-xs">configmap.yaml (Spring Boot H2 DB 설정 & 개발자 정보)</span>
              <button
                onClick={() => handleCopy('configmap', configMapContent)}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-xs"
              >
                {copiedTab === 'configmap' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === 'configmap' ? '복사 완료' : '전체 복사'}</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3">
              {renderYamlCode(configMapContent)}
            </div>
          </div>
        ) : activeTab === 'deployment' ? (
          /* Single Tab: Deployment */
          <div className="flex flex-col h-full overflow-hidden">
            <div className="px-4 py-2 bg-blue-950/30 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-blue-300 text-xs">deployment.yaml (ConfigMap 볼륨 마운트 & 컨테이너 구동)</span>
              <button
                onClick={() => handleCopy('deployment', deploymentContent)}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-xs"
              >
                {copiedTab === 'deployment' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === 'deployment' ? '복사 완료' : '전체 복사'}</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3">
              {renderYamlCode(deploymentContent)}
            </div>
          </div>
        ) : (
          /* Single Tab: Service */
          <div className="flex flex-col h-full overflow-hidden">
            <div className="px-4 py-2 bg-indigo-950/30 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-300 text-xs">service.yaml (ClusterIP & 8080/8081 듀얼 포트 라우팅)</span>
              <button
                onClick={() => handleCopy('service', serviceContent)}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-xs"
              >
                {copiedTab === 'service' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === 'service' ? '복사 완료' : '전체 복사'}</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3">
              {renderYamlCode(serviceContent)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
