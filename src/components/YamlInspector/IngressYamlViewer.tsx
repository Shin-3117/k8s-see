import React, { useState } from 'react';
import { Network, Server, FileCode, Copy, Check, Columns, Sparkles } from 'lucide-react';
import {
  INGRESS_YAML,
  ORDER_SERVICE_YAML,
  PRODUCT_SERVICE_YAML,
  NGINX_CONF_RAW
} from '../../data/mode5Steps';

interface IngressYamlViewerProps {
  currentStepPhase: string;
  targetYaml: 'ingress' | 'service-order' | 'service-product' | 'nginx-conf' | 'all';
  stepNumber: number;
}

export const IngressYamlViewer: React.FC<IngressYamlViewerProps> = ({
  currentStepPhase,
  targetYaml,
  stepNumber
}) => {
  const [activeTab, setActiveTab] = useState<'ingress' | 'service-order' | 'service-product' | 'nginx-conf' | 'split'>(
    targetYaml === 'all' ? 'ingress' : targetYaml
  );
  const [copied, setCopied] = useState(false);

  // Sync active tab with targetYaml when step advances
  React.useEffect(() => {
    if (targetYaml === 'all') {
      setActiveTab('split');
    } else {
      setActiveTab(targetYaml);
    }
  }, [targetYaml, stepNumber]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getHighlightLines = (type: 'ingress' | 'service-order' | 'service-product' | 'nginx-conf'): number[] => {
    if (stepNumber === 1 && type === 'ingress') return [1, 2, 3, 11, 12, 13, 18, 19, 26, 27];
    if (stepNumber === 2 && type === 'ingress') return [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
    if (stepNumber === 3 && type === 'nginx-conf') return [6, 7, 8, 9, 10, 11, 12, 13, 23, 24, 25, 30, 31, 32];
    if (stepNumber === 4 && type === 'ingress') return [11, 12, 13, 14, 15, 16];
    if (stepNumber === 5) {
      if (type === 'ingress') return [18, 19, 20, 21, 22, 23, 24, 25];
      if (type === 'service-order') return [2, 4, 8, 13, 14, 15];
      if (type === 'nginx-conf') return [6, 7, 8, 9, 23, 24, 25];
    }
    if (stepNumber === 6) {
      if (type === 'ingress') return [26, 27, 28, 29, 30, 31, 32];
      if (type === 'service-product') return [2, 4, 8, 13, 14, 15];
      if (type === 'nginx-conf') return [11, 12, 13, 14, 30, 31, 32];
    }
    if (stepNumber === 7 && type === 'ingress') return [1, 2, 3, 11, 12, 13, 18, 19, 26, 27];
    return [];
  };

  const renderCodeBlock = (
    content: string,
    type: 'ingress' | 'service-order' | 'service-product' | 'nginx-conf',
    title: string
  ) => {
    const lines = content.split('\n');
    const highlights = getHighlightLines(type);

    return (
      <div className="flex flex-col h-full bg-slate-950/60 rounded-xl border border-slate-800/80 overflow-hidden">
        <div className="bg-slate-950 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-mono text-slate-300 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            {title}
          </span>
          <button
            onClick={() => handleCopy(content)}
            className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded transition-colors"
            title="코드 복사"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-2 scrollbar-thin scrollbar-thumb-slate-700">
          <pre className="font-mono text-[11px] leading-relaxed select-text">
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isHighlighted = highlights.includes(lineNum);
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 py-0.5 px-2 -mx-1 rounded transition-colors ${
                    isHighlighted
                      ? 'bg-purple-500/25 text-purple-200 border-l-2 border-purple-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <span className="text-slate-600 select-none w-5 text-right shrink-0 text-[10px] font-mono">
                    {lineNum}
                  </span>
                  <span className="whitespace-pre">{line}</span>
                </div>
              );
            })}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full">
      {/* Header Bar with Tabs */}
      <div className="bg-slate-950 px-3 py-2 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 flex-wrap">
          <button
            onClick={() => setActiveTab('ingress')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ingress'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>ingress.yaml</span>
            {targetYaml === 'ingress' && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-300 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('service-order')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'service-order'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>order-svc.yaml</span>
            {targetYaml === 'service-order' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('service-product')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'service-product'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>product-svc.yaml</span>
            {targetYaml === 'service-product' && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('nginx-conf')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'nginx-conf'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>nginx.conf (렌더링)</span>
            {targetYaml === 'nginx-conf' && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('split')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'split'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>통합 비교</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            L7 Ingress Controller
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-3 overflow-hidden">
        {activeTab === 'ingress' && renderCodeBlock(INGRESS_YAML, 'ingress', 'networking.k8s.io/v1 Ingress')}
        {activeTab === 'service-order' && renderCodeBlock(ORDER_SERVICE_YAML, 'service-order', 'v1 Service (order-service)')}
        {activeTab === 'service-product' && renderCodeBlock(PRODUCT_SERVICE_YAML, 'service-product', 'v1 Service (product-service)')}
        {activeTab === 'nginx-conf' && renderCodeBlock(NGINX_CONF_RAW, 'nginx-conf', '/etc/nginx/nginx.conf (자동 생성된 리버스 프록시 설정)')}
        {activeTab === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full overflow-auto">
            {renderCodeBlock(INGRESS_YAML, 'ingress', '1. Ingress YAML (선언)')}
            {renderCodeBlock(NGINX_CONF_RAW, 'nginx-conf', '2. NGINX Conf (동적 변환)')}
          </div>
        )}
      </div>

      {/* Footer Insight Banner */}
      <div className="bg-slate-950/90 px-4 py-2 border-t border-slate-800/80 flex flex-wrap gap-2 items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span>규칙: api.example.com (/orders ➔ order-svc:8080 | /products ➔ product-svc:8080)</span>
        </div>
        <span className="text-purple-400 font-semibold hidden sm:inline">Direct Pod Proxying ({currentStepPhase})</span>
      </div>
    </div>
  );
};
