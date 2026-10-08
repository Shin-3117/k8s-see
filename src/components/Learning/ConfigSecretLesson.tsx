import { sourceUrl } from "../../data/learningPages";

export function ConfigSecretLesson({ stepIndex }: { stepIndex: number }) {
  const running = stepIndex >= 4;
  const updated = stepIndex === 5;
  return (
    <section className="learning-panel space-y-4" aria-labelledby="config-secret-title">
      <h2 id="config-secret-title" className="font-bold text-blue-200">일반 설정과 민감한 값 비교</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <caption className="sr-only">ConfigMap과 Secret의 용도·저장·전달 비교</caption>
          <thead><tr>{["구분", "ConfigMap", "Secret"].map((label) => <th key={label} scope="col" className="p-2">{label}</th>)}</tr></thead>
          <tbody className="text-slate-300">
            {[
              ["용도", "일반 설정", "민감한 정보"],
              ["예시", "DB 주소·앱 모드·설정 파일", "비밀번호·API 키·인증서"],
              ["API 입력", "data / binaryData", "data(Base64) / stringData(문자열)"],
              ["저장", "API Server → etcd", "API Server → etcd"],
              ["Pod 전달", "환경변수 또는 파일", "환경변수 또는 파일"],
            ].map(([label, config, secret]) => (
              <tr key={label} className="border-t border-slate-800">
                <th scope="row" className="p-2 font-medium">{label}</th><td className="p-2">{config}</td><td className="p-2">{secret}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-xl border border-cyan-800 bg-cyan-950/20 p-4 text-sm leading-7">
        <p className="font-semibold text-cyan-200">저장·전달 경로</p>
        <p>kubectl → API Server → etcd에 ConfigMap·Secret 저장</p>
        <p>kubelet ↔ API Server → 컨테이너 환경변수·읽기 전용 파일 준비</p>
        <p className="text-slate-400">Pod가 etcd에 직접 접근하지 않습니다. 설정만 생성하면 Pod가 생기지 않으며, 같은 Namespace의 리소스를 Pod 설정에서 참조해야 합니다.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3" aria-label="설정 변경 반영 비교">
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 space-y-2">
          <h3 className="font-bold text-blue-200">환경변수</h3>
          <p className="text-sm" data-testid="config-env-value">APP_MODE: {running ? "production" : "컨테이너 실행 전"}</p>
          <p className="text-xs text-slate-400 leading-6">{updated ? "API의 새 값은 debug지만 기존 컨테이너 환경변수는 production입니다." : "컨테이너 시작 시 값을 주입합니다."} 실행 중인 환경변수는 자동 갱신되지 않습니다.</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 space-y-2">
          <h3 className="font-bold text-cyan-200">일반 볼륨 파일</h3>
          <p className="text-sm break-all" data-testid="config-file-value">/etc/app/app.conf: {running ? `mode=${updated ? "debug" : "production"}` : "실행 준비 중"}</p>
          <p className="text-xs text-slate-400 leading-6">{updated ? "kubelet 동기화로 파일이 갱신된 이후를 표시합니다." : "ConfigMap·Secret 키를 읽기 전용 파일로 제공합니다."} 앱은 새 파일을 다시 읽어야 하며, subPath 마운트는 자동 갱신되지 않습니다.</p>
        </div>
      </div>
      <div className="rounded-xl border border-amber-800 bg-amber-950/20 p-4 space-y-2 text-sm leading-7">
        <h3 className="font-bold text-amber-200">Secret의 Base64는 암호화가 아닙니다</h3>
        <p>Secret도 기본 Kubernetes 설정에서는 etcd 저장 암호화가 보장되지 않습니다. 저장 암호화를 활성화하고 RBAC로 읽기 권한을 제한해야 합니다. Namespace에서 Pod를 생성할 수 있는 권한도 Secret에 간접 접근할 수 있어 함께 관리해야 합니다.</p>
        <p className="text-slate-400">실제 Secret 값을 담은 YAML은 Git에 올리거나 로그에 출력하지 마세요. 이 페이지의 demo-only는 공개용 가상 값입니다. 아래 etcd 뷰어는 API 객체의 예시이며 실제 저장 바이트나 암호화 상태를 나타내지 않습니다.</p>
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-blue-400 underline">
        <a href={sourceUrl("configuration/configmap")} target="_blank" rel="noreferrer">ConfigMap 공식 설명 ↗</a>
        <a href={sourceUrl("configuration/secret")} target="_blank" rel="noreferrer">Secret 공식 설명 ↗</a>
      </div>
    </section>
  );
}
