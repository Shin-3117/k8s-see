import { useState } from "react";
export function LearningSnippet({
  title,
  code,
}: {
  title: string;
  code: string;
}) {
  const [message, setMessage] = useState("");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setMessage("복사 완료");
    } catch {
      setMessage("복사할 수 없습니다. 코드 영역에서 직접 선택해 복사하세요.");
    }
  };
  return (
    <section className="learning-panel">
      <div className="flex flex-wrap justify-between gap-2 mb-3">
        <h3 className="text-sm font-bold">{title}</h3>
        <button className="learning-button" onClick={copy}>
          예시 코드 복사
        </button>
      </div>
      <pre className="overflow-x-auto text-xs text-blue-200 leading-6 p-3 bg-slate-950 rounded-lg">
        <code>{code}</code>
      </pre>
      <p className="text-xs text-slate-400 mt-2" role="status">
        {message}
      </p>
    </section>
  );
}
export const IDENTITY_EXAMPLE = `# 같은 Namespace의 설정·신원·권한 연결 예시
apiVersion: v1
kind: ServiceAccount
metadata:
  name: reader
  namespace: default
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: config-reader
  namespace: default
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: reader-config
  namespace: default
subjects:
- kind: ServiceAccount
  name: reader
  namespace: default
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: config-reader
---
apiVersion: v1
kind: Pod
metadata:
  name: settings-demo
  namespace: default
spec:
  serviceAccountName: reader
  containers:
  - name: app
    image: nginx:1.25
    env:
    - name: APP_MODE
      valueFrom:
        configMapKeyRef:
          name: app-settings
          key: mode
    - name: APP_PASSWORD
      valueFrom:
        secretKeyRef:
          name: app-secret
          key: password
# app-settings와 app-secret은 같은 Namespace에 별도 생성되어 있어야 합니다.
# 볼륨으로 설정 파일을 읽는 것과 앱이 Kubernetes API를 조회하는 권한은 별개입니다.`;
