import { pageHref } from "../../data/learningPages";
import { VOLUME_EXAMPLES, VOLUME_TYPES } from "../../data/volumeExamples";
import type { VolumeExample, VolumeStep } from "../../data/volumeExamples";

export function VolumeLesson({ example, onExampleChange }: {
  example: VolumeExample;
  onExampleChange: (id: string) => void;
}) {
  return (
    <section className="learning-panel space-y-4" aria-labelledby="volume-types-title">
      <h2 id="volume-types-title" className="font-bold text-blue-200">볼륨 종류별 용도와 수명</h2>
      <p className="text-sm text-slate-300 leading-7">
        볼륨은 컨테이너에 연결하는 저장 공간이나 파일 소스입니다. 임시 파일, 설정 파일, 외부 저장소처럼 용도가 다르며 모든 볼륨이 영구 저장소인 것은 아닙니다.
      </p>
      <p className="sm:hidden text-xs text-slate-500">표를 좌우로 움직여 용도와 특징을 확인하세요.</p>
      <div className="overflow-x-auto" role="region" aria-label="볼륨 종류 비교표" tabIndex={0}>
        <table className="w-full min-w-[680px] text-sm text-left">
          <caption className="sr-only">주요 Kubernetes 볼륨 종류 비교</caption>
          <thead><tr>{["종류", "용도", "수명·특징"].map((label) => <th key={label} scope="col" className="p-2">{label}</th>)}</tr></thead>
          <tbody className="text-slate-300">
            {VOLUME_TYPES.map(([name, purpose, lifetime]) => (
              <tr key={name} className="border-t border-slate-800">
                <th scope="row" className="p-2 font-mono text-xs whitespace-nowrap text-cyan-200">{name}</th>
                <td className="p-2">{purpose}</td><td className="p-2">{lifetime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 text-sm leading-7">
        <div className="p-3 rounded-xl border border-slate-700 bg-slate-950"><h3 className="font-bold text-blue-200">컨테이너 재시작</h3><p>같은 Pod의 볼륨은 유지됩니다. 컨테이너의 쓰기 레이어와 볼륨을 구분하세요.</p></div>
        <div className="p-3 rounded-xl border border-slate-700 bg-slate-950"><h3 className="font-bold text-amber-200">Pod 삭제</h3><p>emptyDir 데이터는 사라집니다. 원본 ConfigMap·Secret이나 기존 PVC는 별도로 관리합니다.</p></div>
        <div className="p-3 rounded-xl border border-slate-700 bg-slate-950"><h3 className="font-bold text-cyan-200">다른 노드의 새 Pod</h3><p>hostPath·local 데이터는 원래 노드에 종속됩니다. 외부 저장소도 드라이버·접근 모드·배치 조건을 충족해야 합니다.</p></div>
      </div>
      <p className="text-xs text-slate-400 leading-6">
        CSI는 스토리지 드라이버 규격이며 PV 기반 영구 볼륨과 CSI 임시 볼륨 등을 지원합니다. CSI라고 모두 영구 저장되는 것은 아닙니다.
        local은 PV에서 정의하고 Pod에서는 PVC로 참조합니다. 볼륨의 사용자 파일은 etcd가 아니라 해당 노드·외부 저장소 등에 존재합니다. ConfigMap·Secret 원본 값은 API 리소스로 etcd에 저장됩니다.
      </p>
      <label className="flex flex-wrap gap-3 items-center text-sm">
        볼륨 수명 예시
        <select aria-label="볼륨 수명 예시" className="learning-button max-w-full" value={example.id} onChange={(event) => onExampleChange(event.target.value)}>
          {Object.values(VOLUME_EXAMPLES).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <p className="text-sm text-slate-300 leading-7">{example.note}</p>
      <div className="flex flex-wrap gap-4 text-xs text-blue-400 underline">
        <a href={pageHref("configmap-secret")}>ConfigMap·Secret의 저장과 변경 반영</a>
        <a href={pageHref("persistent-storage")}>PVC·PV·CSI의 생성과 마운트 살펴보기</a>
      </div>
    </section>
  );
}

export function VolumeMountCanvas({ example, step }: { example: VolumeExample; step: VolumeStep }) {
  const { mounted, content, sourceState, podUid, node } = step.volumeState;
  return (
    <section className="learning-panel space-y-4" aria-labelledby="volume-mount-title">
      <h2 id="volume-mount-title" className="font-bold">volumes ↔ volumeMounts 연결</h2>
      <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800 text-sm space-y-2">
        <p className="text-cyan-200 font-semibold break-words">소스: {example.source}</p>
        <p className="text-slate-300" data-testid="volume-source-state">{sourceState}</p>
      </div>
      <div className="text-center text-blue-400 text-sm" aria-hidden="true">↓</div>
      <div className="rounded-xl border border-blue-700 bg-blue-950/20 p-4 space-y-2 text-sm">
        <p className="font-bold text-blue-200">Pod volumes · name: {example.volumeName}</p>
        <p className="break-all" data-testid="volume-pod-identity">UID: {podUid ?? "Pod 없음"} · 노드: {node ?? "미배정"}</p>
        <p className="text-xs text-slate-400">각 컨테이너의 volumeMounts.name이 이 이름을 참조합니다.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {[["writer", example.mountPath], ["reader", "/shared"]].map(([name, path]) => (
          <div key={name} className="p-4 rounded-xl border border-slate-700 bg-slate-950 text-sm space-y-2 min-w-0">
            <h3 className="font-bold text-blue-200">컨테이너 {name}</h3>
            <p className="text-xs text-slate-400">volumeMounts · name: {example.volumeName}</p>
            <p className="font-mono text-xs break-all">{path}/{example.file}</p>
            <p className="font-mono text-cyan-200 break-all" data-testid={`volume-content-${name}`}>{content}</p>
            <p className="text-xs text-slate-500">{mounted ? "같은 볼륨 · 서로 다른 마운트 경로" : "현재 연결된 마운트 없음"}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 leading-6">volumes는 Pod 수준에서 소스를 정의하고, volumeMounts는 컨테이너별 연결 경로를 지정합니다. 이 화면은 파일 내용과 저장소 수명을 비교하는 시뮬레이션입니다.</p>
    </section>
  );
}
