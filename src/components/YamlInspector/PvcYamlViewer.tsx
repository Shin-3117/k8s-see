import React, { useState } from 'react';
import { Database, HardDrive, Server, Copy, Check, Columns } from 'lucide-react';

interface PvcYamlViewerProps {
  currentStepPhase: string;
  targetYaml: 'storageclass' | 'pvc' | 'deployment' | 'all';
  stepNumber: number;
}

const STORAGECLASS_YAML = `apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ebs-gp3-sc
provisioner: ebs.csi.aws.com
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
  encrypted: "true"`;

const PVC_YAML = `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-data-pvc
  namespace: default
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: ebs-gp3-sc
  resources:
    requests:
      storage: 20Gi`;

const DEPLOYMENT_YAML = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql-db
  namespace: default
  labels:
    app: mysql-db
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql-db
  template:
    metadata:
      labels:
        app: mysql-db
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        env:
        - name: MYSQL_ROOT_PASSWORD
          value: "k8s-root-secret"
        - name: MYSQL_DATABASE
          value: "my_service"
        ports:
        - containerPort: 3306
        volumeMounts:
        - name: mysql-persistent-storage
          mountPath: /var/lib/mysql
      volumes:
      - name: mysql-persistent-storage
        persistentVolumeClaim:
          claimName: mysql-data-pvc`;

export const PvcYamlViewer: React.FC<PvcYamlViewerProps> = ({
  currentStepPhase,
  targetYaml,
  stepNumber
}) => {
  const [activeTab, setActiveTab] = useState<'storageclass' | 'pvc' | 'deployment' | 'split'>(
    targetYaml === 'all' ? 'split' : targetYaml
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

  const getHighlightLines = (type: 'storageclass' | 'pvc' | 'deployment'): number[] => {
    if (stepNumber === 1 && type === 'pvc') return [1, 2, 7, 8, 9, 10, 11, 12];
    if (stepNumber === 2 && type === 'deployment') return [15, 16, 26, 27, 28, 29, 30, 31, 32];
    if (stepNumber === 3 && type === 'storageclass') return [1, 4, 5, 7, 8, 9, 10, 11];
    if (stepNumber === 4 && type === 'pvc') return [1, 2, 7, 8, 9, 10, 11, 12];
    if (stepNumber === 5 && type === 'deployment') return [26, 27, 28, 29, 30, 31, 32];
    if (stepNumber === 6 && type === 'deployment') return [22, 23, 24, 25, 26];
    if (stepNumber === 7 && type === 'deployment') return [15, 16, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
    if (stepNumber === 8) {
      if (type === 'pvc') return [7, 8];
      if (type === 'deployment') return [26, 27, 28, 29, 30, 31, 32];
    }
    return [];
  };

  const renderYamlContent = (content: string, type: 'storageclass' | 'pvc' | 'deployment') => {
    const lines = content.split('\n');
    const highlights = getHighlightLines(type);

    return (
      <pre className="font-mono text-[11px] leading-relaxed select-text p-3">
        {lines.map((line, idx) => {
          const lineNum = idx + 1;
          const isHighlighted = highlights.includes(lineNum);
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 py-0.5 px-2 -mx-2 rounded transition-colors ${
                isHighlighted
                  ? 'bg-amber-500/20 text-amber-200 border-l-2 border-amber-400 font-semibold'
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
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full">
      {/* Header Bar with Tabs */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('storageclass')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'storageclass'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>storageclass.yaml</span>
            {targetYaml === 'storageclass' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('pvc')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'pvc'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>pvc.yaml</span>
            {targetYaml === 'pvc' && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('deployment')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'deployment'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>mysql-deploy.yaml</span>
            {targetYaml === 'deployment' && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('split')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'split'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>3종 나란히 비교</span>
          </button>
        </div>

        {/* Copy Button & CSI Status */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 hidden sm:inline">
            Driver: ebs.csi.aws.com
          </span>
          <button
            onClick={() => {
              const currentContent =
                activeTab === 'storageclass'
                  ? STORAGECLASS_YAML
                  : activeTab === 'pvc'
                  ? PVC_YAML
                  : activeTab === 'deployment'
                  ? DEPLOYMENT_YAML
                  : `${STORAGECLASS_YAML}\n---\n${PVC_YAML}\n---\n${DEPLOYMENT_YAML}`;
              handleCopy(currentContent);
            }}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">복사됨</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>복사</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* CSI Binding Info Banner */}
      <div className="bg-slate-950/70 border-b border-slate-800/80 px-4 py-2 text-[11px] text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold">🔗 CSI Dynamic Binding:</span>
          <span className="font-mono text-cyan-300">
            StorageClass(gp3) ➔ PVC(20Gi) ➔ AWS EBS(vol-0a91f4b2) ➔ Pod(/var/lib/mysql)
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          Phase: {currentStepPhase}
        </span>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto max-h-[560px]">
        {activeTab === 'storageclass' && renderYamlContent(STORAGECLASS_YAML, 'storageclass')}
        {activeTab === 'pvc' && renderYamlContent(PVC_YAML, 'pvc')}
        {activeTab === 'deployment' && renderYamlContent(DEPLOYMENT_YAML, 'deployment')}
        {activeTab === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
            <div>
              <div className="bg-slate-950/90 px-3 py-1.5 text-[10px] font-bold text-amber-300 border-b border-slate-800 flex items-center gap-1.5 sticky top-0 z-10">
                <Database className="w-3 h-3" />
                <span>storageclass.yaml (gp3)</span>
              </div>
              {renderYamlContent(STORAGECLASS_YAML, 'storageclass')}
            </div>
            <div>
              <div className="bg-slate-950/90 px-3 py-1.5 text-[10px] font-bold text-blue-300 border-b border-slate-800 flex items-center gap-1.5 sticky top-0 z-10">
                <HardDrive className="w-3 h-3" />
                <span>pvc.yaml (20Gi)</span>
              </div>
              {renderYamlContent(PVC_YAML, 'pvc')}
            </div>
            <div>
              <div className="bg-slate-950/90 px-3 py-1.5 text-[10px] font-bold text-indigo-300 border-b border-slate-800 flex items-center gap-1.5 sticky top-0 z-10">
                <Server className="w-3 h-3" />
                <span>mysql-deploy.yaml (/var/lib/mysql)</span>
              </div>
              {renderYamlContent(DEPLOYMENT_YAML, 'deployment')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
