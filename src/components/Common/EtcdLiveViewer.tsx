import React, { useState, useEffect } from 'react';
import { EtcdRecord } from '../../types/pipeline';
import {
  Database,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Copy,
  Check,
  Info,
  Layers,
  Maximize2,
  Minimize2,
  Search,
  LayoutGrid,
  Columns
} from 'lucide-react';

interface EtcdLiveViewerProps {
  etcdState?: {
    revision: number;
    raftTerm: number;
    records: EtcdRecord[];
  };
  compact?: boolean;
}

export const EtcdLiveViewer: React.FC<EtcdLiveViewerProps> = ({ etcdState, compact = false }) => {
  const records = etcdState?.records || [];
  const revision = etcdState?.revision || 42915;
  const raftTerm = etcdState?.raftTerm || 3;

  // View mode: 'split' (Master-Detail: list on left, large JSON on right) vs 'cards' (full expandable cards)
  const [viewMode, setViewMode] = useState<'split' | 'cards'>(compact ? 'cards' : 'split');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isEnlarged, setIsEnlarged] = useState<boolean>(false);

  // Auto-select and auto-expand created and updated records when step changes
  useEffect(() => {
    if (records.length === 0) {
      setSelectedKey(null);
      return;
    }

    // Find the first created or updated record to highlight
    const activeRec = records.find((r) => r.action === 'created' || r.action === 'updated') || records[0];
    if (activeRec) {
      setSelectedKey(activeRec.key);
    }

    const newExpanded: Record<string, boolean> = {};
    records.forEach((rec) => {
      if (rec.action === 'created' || rec.action === 'updated') {
        newExpanded[rec.key] = true;
      }
    });
    setExpandedKeys(newExpanded);
  }, [etcdState?.revision, records.length]);

  const toggleCardKey = (key: string) => {
    setExpandedKeys((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleExpandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    records.forEach((r) => {
      allExpanded[r.key] = true;
    });
    setExpandedKeys(allExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedKeys({});
  };

  const handleCopy = (key: string, data: Record<string, any>) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Filter records based on search query
  const filteredRecords = records.filter(
    (r) =>
      r.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.highlightFields && r.highlightFields.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // Currently selected record in split view
  const currentRecord = records.find((r) => r.key === selectedKey) || records[0] || null;
  const allAreExpanded = records.length > 0 && records.every((r) => expandedKeys[r.key]);

  // Height sizing
  const contentHeight = isEnlarged ? 'h-[640px]' : compact ? 'h-[280px]' : 'h-[460px]';

  return (
    <div className="bg-[#080E1A] rounded-2xl border-2 border-cyan-500/40 shadow-2xl shadow-cyan-950/30 overflow-hidden flex flex-col font-mono-code text-xs w-full transition-all">
      {/* 1. Global Title & Controls Bar */}
      <div className="bg-slate-900/95 px-4 py-3 border-b border-cyan-900/50 flex flex-wrap items-center justify-between gap-3">
        {/* Left Title & SSOT Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 p-0.5 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-300">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm tracking-tight">etcd 리소스 저장 예시</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                Single Source of Truth (SSOT)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                총 {records.length}개 리소스 등록됨
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              API Server를 통해서만 접근 가능한 분산 합의 스토리지 — 모든 오브젝트는 독립된 경로에 MVCC 버전으로 저장됩니다.
            </p>
          </div>
        </div>

        {/* Right Metrics & View Switchers */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* Status Metrics */}
          <div className="hidden lg:flex items-center gap-2.5 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Quorum (3/3)
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-300">
              Rev: <strong className="text-white font-mono">{revision}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              Raft Term: <strong className="text-white font-mono">{raftTerm}</strong>
            </span>
          </div>

          {/* View Mode Switcher: Split vs Cards */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'split'
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="2열 분할 뷰: 좌측 키 목록 + 우측 대형 JSON 뷰어"
            >
              <Columns className="w-3 h-3" />
              <span>분할 와이드 뷰</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'cards'
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="카드 펼치기 뷰: 모든 키를 목록 카드로 확인"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>전체 카드 뷰</span>
            </button>
          </div>

          {/* Height Enlargement Toggle */}
          <button
            onClick={() => setIsEnlarged(!isEnlarged)}
            className={`p-1.5 rounded-lg border text-[11px] transition-all flex items-center gap-1 ${
              isEnlarged
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isEnlarged ? '기본 크기로 축소 (460px)' : '와이드 대형 확대 모드 (640px)'}
          >
            {isEnlarged ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isEnlarged ? '기본 크기' : '크게 보기'}</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Header Notice & Search Bar */}
      <div className="bg-cyan-950/20 px-4 py-2 border-b border-cyan-900/30 text-xs text-cyan-300/90 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px]">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>
            각 API 리소스는 <strong className="text-white">독립된 경로</strong>에 저장됩니다. 관리 관계는 <strong className="text-cyan-200">ownerReferences</strong>, 선택·참조 관계는 selector와 리소스 이름 등으로 연결됩니다.
          </span>
        </div>

        {/* Quick Search / Filter Input */}
        {records.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="키 경로 또는 리소스 필터..."
                className="w-full bg-slate-950/90 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            {viewMode === 'cards' && (
              <button
                onClick={allAreExpanded ? handleCollapseAll : handleExpandAll}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] transition-colors shrink-0"
              >
                {allAreExpanded ? '모두 접기' : '모두 펼치기'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Main Content Area */}
      {records.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-600 shadow-inner">
            <Database className="w-7 h-7 text-slate-500 animate-pulse" />
          </div>
          <div>
            <p className="font-bold text-slate-300 text-sm">아직 etcd에 기록된 리소스가 없습니다.</p>
            <p className="text-xs mt-1 text-slate-500 max-w-md">
              현재 단계의 리소스 상태를 보여주는 시뮬레이션 예시입니다. 고정 UID·revision·시간·로그는 실제 클러스터의 실시간 결과가 아닙니다.
            </p>
          </div>
        </div>
      ) : viewMode === 'split' ? (
        /* ========================================================================= */
        /* SPLIT MASTER-DETAIL VIEW (Large, Spacious 2-Column Professional Layout)   */
        /* ========================================================================= */
        <div className={`grid grid-cols-1 md:grid-cols-12 ${contentHeight} divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-hidden`}>
          {/* Left Column: Key List (md:col-span-5 lg:col-span-4) */}
          <div className="md:col-span-5 lg:col-span-4 overflow-y-auto p-3 space-y-2 bg-[#060B14]">
            <div className="text-[10px] font-bold text-slate-400 px-1 uppercase tracking-wider flex items-center justify-between">
              <span>etcd Key 목록 ({filteredRecords.length})</span>
              <span className="text-cyan-400">클릭하여 상세 JSON 조회</span>
            </div>

            {filteredRecords.map((rec) => {
              const isSelected = selectedKey === rec.key;

              return (
                <div
                  key={rec.key}
                  onClick={() => setSelectedKey(rec.key)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none group relative ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400/80 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/30'
                      : rec.action === 'created'
                      ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/70'
                      : rec.action === 'updated'
                      ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/70'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {/* Action Badge */}
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tight ${
                          rec.action === 'created'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                            : rec.action === 'updated'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {rec.action === 'created' ? '+ CREATE' : rec.action === 'updated' ? '~ UPDATE' : 'UNCHANGED'}
                      </span>

                      {/* Type Badge */}
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 border border-cyan-800/40 font-semibold flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5 text-cyan-400" />
                        {rec.type}
                      </span>
                    </div>

                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-mono">
                      rev: {rec.revision}
                    </span>
                  </div>

                  {/* Key Path */}
                  <div className="text-[11px] font-bold text-slate-100 font-mono break-all leading-tight">
                    {rec.key}
                  </div>

                  {/* Highlight Fields Tag */}
                  {rec.highlightFields && rec.highlightFields.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1 text-[9px] text-amber-300">
                      {rec.highlightFields.slice(0, 2).map((f, fIdx) => (
                        <span key={fIdx} className="bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20 truncate max-w-[200px]">
                          {f}
                        </span>
                      ))}
                      {rec.highlightFields.length > 2 && (
                        <span className="text-slate-500">+{rec.highlightFields.length - 2}개 더보기</span>
                      )}
                    </div>
                  )}

                  {/* Active Selection Indicator Arrow */}
                  {isSelected && (
                    <div className="hidden md:block absolute -right-[9px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-cyan-400" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Large JSON Viewer & Deep-Dive Inspector (md:col-span-7 lg:col-span-8) */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full bg-[#050A14] overflow-hidden">
            {currentRecord ? (
              <div className="flex flex-col h-full">
                {/* Key Header Toolbar */}
                <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-x-auto min-w-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tight ${
                        currentRecord.action === 'created'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : currentRecord.action === 'updated'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {currentRecord.action === 'created' ? '+ CREATE' : currentRecord.action === 'updated' ? '~ UPDATE' : 'UNCHANGED'}
                    </span>
                    <span className="text-xs font-bold text-white font-mono truncate select-all">
                      {currentRecord.key}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800 font-mono">
                      Create/Mod Revision: {currentRecord.revision}
                    </span>
                    <button
                      onClick={() => handleCopy(currentRecord.key, currentRecord.data)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 text-xs transition-colors"
                      title="JSON 페이로드 클립보드 복사"
                    >
                      {copiedKey === currentRecord.key ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-300 font-semibold">복사됨!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>JSON 복사</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Highlighted Changes Banner */}
                {currentRecord.highlightFields && currentRecord.highlightFields.length > 0 && (
                  <div className="px-4 py-2 bg-amber-950/30 border-b border-amber-900/40 flex items-center gap-2 text-xs text-amber-200 flex-wrap">
                    <div className="flex items-center gap-1 font-bold text-amber-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>이번 단계에서 갱신된 필드:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {currentRecord.highlightFields.map((field, fIdx) => (
                        <span
                          key={fIdx}
                          className="bg-amber-500/20 text-amber-200 border border-amber-500/40 px-2 py-0.5 rounded text-[11px] font-semibold"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Big Preformatted JSON Code Viewer */}
                <div className="flex-1 p-3.5 overflow-y-auto">
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] text-cyan-100/90 leading-relaxed overflow-x-auto select-all h-full font-mono">
                    {JSON.stringify(currentRecord.data, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                좌측에서 etcd 키를 선택해주세요.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* CARDS VIEW (Spacious Expandable Cards)                                     */
        /* ========================================================================= */
        <div className={`p-4 overflow-y-auto space-y-3 ${contentHeight}`}>
          {filteredRecords.map((rec) => {
            const isExpanded = !!expandedKeys[rec.key];

            return (
              <div
                key={rec.key}
                className={`rounded-xl border transition-all ${
                  rec.action === 'created'
                    ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                    : rec.action === 'updated'
                    ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleCardKey(rec.key)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 select-none gap-3"
                >
                  <div className="flex items-center gap-2.5 overflow-x-auto min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}

                    {/* Action Badge */}
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0 uppercase tracking-tight ${
                        rec.action === 'created'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                          : rec.action === 'updated'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {rec.action === 'created' ? '+ CREATE' : rec.action === 'updated' ? '~ UPDATE' : 'UNCHANGED'}
                    </span>

                    {/* Type Badge */}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-cyan-800/40 shrink-0 flex items-center gap-1 font-semibold">
                      <Layers className="w-3 h-3 text-cyan-400" />
                      {rec.type}
                    </span>

                    {/* Key Path */}
                    <span className="text-xs font-bold text-slate-100 font-mono truncate select-all">
                      {rec.key}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      rev: {rec.revision}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(rec.key, rec.data);
                      }}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title="JSON 값 클립보드 복사"
                    >
                      {copiedKey === rec.key ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded JSON Body */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-800/80">
                    {/* Highlighted Changed Fields Notice */}
                    {rec.highlightFields && rec.highlightFields.length > 0 && (
                      <div className="mb-2.5 flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-800/40">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="font-semibold">변경된 필드:</span>
                        <div className="flex flex-wrap gap-1.5 font-bold">
                          {rec.highlightFields.map((f, fIdx) => (
                            <span key={fIdx} className="bg-amber-500/20 px-2 py-0.5 rounded text-[10px] border border-amber-500/30">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 leading-relaxed overflow-x-auto select-all max-h-[300px] font-mono">
                      {JSON.stringify(rec.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
