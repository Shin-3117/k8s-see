import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Layers, Menu } from "lucide-react";
import {
  LEARNING_PAGES,
  LearningPageId,
  pageHref,
} from "../../data/learningPages";
export function Header({ onOpenDocs }: { onOpenDocs: () => void }) {
  return (
    <header className="learning-header">
      <a href={pageHref("overview")} className="brand">
        <Layers aria-hidden="true" />
        <span>
          K8s<span className="text-blue-400">See</span>
        </span>
      </a>
      <span className="hidden sm:block text-sm text-slate-400">
        구조부터 라이프사이클까지
      </span>
      <button className="learning-button" onClick={onOpenDocs}>
        <BookOpen size={16} aria-hidden="true" /> 구성 요소 백과사전
      </button>
    </header>
  );
}
export function LearningSidebar({ page }: { page: LearningPageId }) {
  const [open, setOpen] = useState(false);
  const current = LEARNING_PAGES.findIndex((p) => p.id === page);
  return (
    <aside className="learning-sidebar">
      <button
        className="learning-button lg:hidden w-full"
        aria-expanded={open}
        aria-controls="learning-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Menu size={16} aria-hidden="true" />
        학습 목차 · {current + 1}/8
      </button>
      <nav
        id="learning-menu"
        aria-label="학습 목차"
        className={`${open ? "block" : "hidden"} lg:block`}
      >
        <p className="text-xs font-bold text-slate-500 tracking-widest mb-4 mt-3">
          LEARNING PATH
        </p>
        <ol>
          {LEARNING_PAGES.map((p, i) => (
            <li key={p.id}>
              <a
                href={pageHref(p.id)}
                onClick={() => setOpen(false)}
                aria-current={p.id === page ? "page" : undefined}
                className={`learning-link ${p.id === page ? "active" : ""}`}
              >
                <span className="learning-number">{i + 1}</span>
                <span>{p.title}</span>
              </a>
            </li>
          ))}
        </ol>
        <p className="text-xs text-slate-500 leading-6 mt-6">
          실제 클러스터 연결 없이
          <br />
          단계별로 탐색하는 교육용 시뮬레이션
        </p>
      </nav>
    </aside>
  );
}
export function LearningNavigation({ page }: { page: LearningPageId }) {
  const index = LEARNING_PAGES.findIndex((p) => p.id === page);
  const previous = LEARNING_PAGES[index - 1];
  const next = LEARNING_PAGES[index + 1];
  return (
    <nav aria-label="이전·다음 학습" className="learning-navigation">
      {previous ? (
        <a href={pageHref(previous.id)} className="learning-button">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>
            이전 학습
            <span className="block text-xs text-slate-400">
              {previous.title}
            </span>
          </span>
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a href={pageHref(next.id)} className="learning-button text-right">
          <span>
            다음 학습
            <span className="block text-xs text-slate-400">{next.title}</span>
          </span>
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      ) : (
        <a href={pageHref("overview")} className="learning-button">
          전체 구조 다시 보기
        </a>
      )}
    </nav>
  );
}
