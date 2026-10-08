import type { EtcdRecord } from "../../types/pipeline";
import { pageHref } from "../../data/learningPages";

export function StatefulSetIdentity({ records }: { records: EtcdRecord[] }) {
  return (
    <section className="learning-panel space-y-3" aria-labelledby="statefulset-identity-title">
      <h2 id="statefulset-identity-title" className="font-bold text-blue-200">
        StatefulSet → Pod별 이름과 저장소
      </h2>
      <p className="text-sm text-slate-300 leading-7">
        Deployment는 ReplicaSet을 통해 Pod 수를 유지합니다. StatefulSet은 Pod를 직접 관리하며,
        OrderedReady에서는 앞선 Pod가 Running·Ready가 되어야 다음 Pod를 생성합니다.
        Headless Service는 별도로 생성하고 serviceName으로 연결합니다.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {[0, 1].map((ordinal) => {
          const name = `web-${ordinal}`;
          const pod = records.find((r) => r.type === "Pod" && r.data.metadata.name === name);
          const pvc = records.find((r) => r.type === "PersistentVolumeClaim" && r.data.metadata.name === `data-${name}`);
          const ready = pod?.data.status.conditions.some((condition: { type: string; status: string }) => condition.type === "Ready" && condition.status === "True");
          return (
            <div key={name} className="rounded-xl bg-slate-950 border border-slate-700 p-4 min-w-0 space-y-2" aria-label={`${name} 식별자와 저장소`}>
              <h3 className="font-bold text-cyan-200">{name} · ordinal {ordinal}</h3>
              <p className="text-sm">{pod ? `${pod.data.status.phase} · Ready=${ready ? "True" : "False"}` : "Pod 없음"}</p>
              <dl className="text-xs text-slate-400 space-y-2 break-all">
                <div><dt className="text-slate-500">Pod UID / IP</dt><dd>{pod ? `${pod.data.metadata.uid} / ${pod.data.status.podIP ?? "미할당"}` : "—"}</dd></div>
                <div><dt className="text-slate-500">노드</dt><dd>{pod?.data.spec.nodeName ?? "미배정"}</dd></div>
                <div><dt className="text-slate-500">Pod DNS 이름 (기본 도메인 예시)</dt><dd>{name}.web-headless.default.svc.cluster.local</dd></div>
                <div><dt className="text-slate-500">전용 PVC → PV</dt><dd>{pvc ? `${pvc.data.metadata.name} (${pvc.data.status.phase}) → ${pvc.data.spec.volumeName ?? "미바인딩"}` : "PVC 생성 전"}</dd></div>
              </dl>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-400 leading-6">
        동적 프로비저닝 가능한 기본 StorageClass와 CSI 구성이 준비된 예시입니다.
        DNS 이름의 주소 조회에는 Pod 준비 상태와 DNS 캐시가 영향을 줍니다.
        기본 PVC 보존 정책은 Retain이며, StatefulSet 삭제·축소 시 별도 정책을 설정할 수 있습니다.
        Pod별 볼륨 사이의 데이터 복제는 애플리케이션이 담당합니다.{" "}
        <a href={pageHref("persistent-storage")} className="text-blue-400 underline">PVC 바인딩·마운트·삭제 정책 살펴보기</a>
      </p>
    </section>
  );
}
