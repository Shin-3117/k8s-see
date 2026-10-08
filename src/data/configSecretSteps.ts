import type { EtcdRecord, Mode1Step } from "../types/pipeline";
import type { LearningClusterStep } from "./learningScenarios";

// All credentials in this lesson are deliberately public, fictional examples.
export const CONFIG_SECRET_YAML = `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-settings
  namespace: default
data:
  APP_MODE: "production"
  app.conf: |
    mode=production
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
  namespace: default
type: Opaque
stringData:
  password: "demo-only" # 공개용 가상 값 · 실제 비밀번호 사용 금지
---
apiVersion: v1
kind: Pod
metadata:
  name: settings-demo
  namespace: default
spec:
  containers:
    - name: app
      image: busybox:1.37
      command: ["sh", "-c", "sleep 3600"]
      env:
        - name: APP_MODE
          valueFrom:
            configMapKeyRef:
              name: app-settings
              key: APP_MODE
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secret
              key: password
      volumeMounts:
        - name: settings
          mountPath: /etc/app
          readOnly: true
        - name: credentials
          mountPath: /etc/credentials
          readOnly: true
  volumes:
    - name: settings
      configMap:
        name: app-settings
        items:
          - key: app.conf
            path: app.conf
    - name: credentials
      secret:
        secretName: app-secret`;

const podSpec = {
  containers: [{
    name: "app", image: "busybox:1.37", command: ["sh", "-c", "sleep 3600"],
    env: [
      { name: "APP_MODE", valueFrom: { configMapKeyRef: { name: "app-settings", key: "APP_MODE" } } },
      { name: "DB_PASSWORD", valueFrom: { secretKeyRef: { name: "app-secret", key: "password" } } },
    ],
    volumeMounts: [
      { name: "settings", mountPath: "/etc/app", readOnly: true },
      { name: "credentials", mountPath: "/etc/credentials", readOnly: true },
    ],
  }],
  volumes: [
    { name: "settings", configMap: { name: "app-settings", items: [{ key: "app.conf", path: "app.conf" }] } },
    { name: "credentials", secret: { secretName: "app-secret" } },
  ],
};

function settingsRecords(updated: boolean): EtcdRecord[] {
  return [
    {
      key: "/registry/configmaps/default/app-settings", type: "ConfigMap",
      action: updated ? "updated" : "unchanged", revision: updated ? 705 : 701,
      data: {
        apiVersion: "v1", kind: "ConfigMap",
        metadata: { name: "app-settings", namespace: "default" },
        data: { APP_MODE: updated ? "debug" : "production", "app.conf": `mode=${updated ? "debug" : "production"}\n` },
      },
    },
    {
      key: "/registry/secrets/default/app-secret", type: "Secret",
      action: updated ? "updated" : "unchanged", revision: updated ? 705 : 701,
      data: {
        apiVersion: "v1", kind: "Secret", type: "Opaque",
        metadata: { name: "app-secret", namespace: "default" },
        // stringData is merged into data by the API server; these are Base64 encodings of dummy values.
        data: { password: updated ? "ZGVtby1vbmx5LXYy" : "ZGVtby1vbmx5" },
      },
    },
  ];
}

type LessonRow = Pick<LearningClusterStep,
  "title" | "actor" | "action" | "reason" | "result" | "k8sMechanism" | "activeComponents" | "packets" | "cliLogs"
>;
const rows: LessonRow[] = [
  {
    title: "일반 설정과 민감한 값 분리", actor: "사용자 / kubectl",
    action: "앱 모드는 ConfigMap, 비밀번호는 Secret으로 별도 제출합니다.",
    reason: "컨테이너 이미지와 환경별 설정을 분리하기 위해", result: "두 API 리소스 요청 · 아직 Pod 없음",
    k8sMechanism: "ConfigMap과 Secret은 key-value 데이터를 관리하는 Namespace 범위의 리소스입니다. Secret의 data는 Base64로 표현하고 stringData는 문자열을 입력받습니다. 예시의 demo-only는 실제 자격증명이 아닙니다.",
    activeComponents: ["developer", "apiserver"],
    packets: [{ from: "developer", to: "apiserver", label: "ConfigMap / Secret 등록" }],
    cliLogs: [{ command: "kubectl apply -f settings.yaml", output: ["configmap/app-settings created", "secret/app-secret created", "이 단계의 settings.yaml에는 ConfigMap과 Secret만 포함합니다."] }],
  },
  {
    title: "둘 다 API Server를 통해 etcd에 저장", actor: "API Server / etcd",
    action: "검증한 ConfigMap과 Secret을 각자의 etcd 경로에 저장합니다.",
    reason: "Pod와 별도로 설정을 조회·관리하도록", result: "ConfigMap·Secret 저장 · 두 리소스만으로 Pod가 생기지 않음",
    k8sMechanism: "Secret의 stringData 입력은 API 처리 후 data로 합쳐집니다. 아래 JSON은 API 객체를 읽기 좋게 표현한 예시이며 실제 etcd 저장 바이트 형식이 아닙니다. Base64는 암호화가 아니고 기본 Kubernetes 설정은 Secret의 저장 암호화를 보장하지 않습니다.",
    activeComponents: ["apiserver", "etcd"],
    packets: [{ from: "apiserver", to: "etcd", label: "ConfigMap / Secret 저장" }],
    cliLogs: [{ command: "kubectl get configmap app-settings; kubectl get secret app-secret", output: ["app-settings   DATA 2", "app-secret     Opaque   DATA 1", "일반 조회가 값을 숨겨도 읽기 권한이 있는 사용자는 Secret 내용을 조회할 수 있습니다."] }],
  },
  {
    title: "Pod가 이름과 키로 설정 참조", actor: "사용자 / API Server / Scheduler",
    action: "같은 Namespace의 설정을 참조하는 Pod를 별도로 생성하고 노드에 배정합니다.",
    reason: "앱에 필요한 값과 파일을 명시적으로 연결하기 위해", result: "settings-demo Pending · worker-node-1 배정",
    k8sMechanism: "env.valueFrom의 configMapKeyRef·secretKeyRef와 volumes의 configMap·secret으로 참조합니다. Deployment나 StatefulSet에서는 같은 설정을 spec.template.spec에 넣습니다. 필수 리소스나 키가 없으면 컨테이너 시작이 차단될 수 있습니다.",
    activeComponents: ["developer", "apiserver", "scheduler"],
    packets: [{ from: "developer", to: "apiserver", label: "설정 참조 Pod 생성" }, { from: "scheduler", to: "apiserver", label: "노드 배정" }],
    cliLogs: [{ command: "kubectl apply -f pod.yaml; kubectl get pod settings-demo -o wide", output: ["pod/settings-demo created", "settings-demo   0/1   Pending   worker-node-1"] }],
  },
  {
    title: "kubelet이 API에서 받아 환경변수·파일 준비", actor: "배정된 노드의 kubelet",
    action: "API Server에서 필요한 값을 받아 컨테이너 환경변수와 읽기 전용 파일을 준비합니다.",
    reason: "Pod가 etcd에 직접 접근하지 않고 설정을 사용하도록", result: "APP_MODE·DB_PASSWORD 환경변수 / 설정·비밀번호 파일 준비",
    k8sMechanism: "kubelet의 API 조회에는 노드의 권한을 사용합니다. 일반적인 환경변수·볼륨 주입을 위해 앱 ServiceAccount에 Secret 조회 권한을 추가할 필요는 없습니다. 앱이 직접 Kubernetes API를 호출하는 방식은 별도 인증·인가가 필요합니다.",
    activeComponents: ["apiserver", "kubelet-1", "runtime-1"],
    packets: [{ from: "kubelet-1", to: "apiserver", label: "설정 조회 / 감시" }, { from: "apiserver", to: "kubelet-1", label: "필요한 데이터 전달" }],
    cliLogs: [{ command: "kubectl describe pod settings-demo", output: ["APP_MODE: ConfigMap app-settings / APP_MODE", "DB_PASSWORD: Secret app-secret / password", "/etc/app/app.conf: ConfigMap 파일", "/etc/credentials/password: Secret 파일 (읽기 전용)"] }],
  },
  {
    title: "앱에서 환경변수 또는 파일 읽기", actor: "컨테이너 / 애플리케이션",
    action: "실행된 컨테이너 안에서 주입된 환경변수와 마운트 파일을 사용할 수 있습니다.",
    reason: "같은 이미지에 환경별 설정을 제공하기 위해", result: "settings-demo Running · 설정 사용 가능",
    k8sMechanism: "이 예시의 컨테이너는 sleep으로 유지합니다. 실제 앱은 환경변수나 파일을 읽는 코드가 필요합니다. Secret 파일 주입은 PVC/PV를 사용하는 외부 저장소 마운트와 다른 방식이며, imagePullSecrets는 kubelet의 비공개 이미지 다운로드 인증에 사용하는 별도 용도입니다.",
    activeComponents: ["kubelet-1", "runtime-1"], packets: [],
    cliLogs: [{ command: "kubectl exec settings-demo -- printenv APP_MODE", output: ["production", "Secret 값은 진단 로그에 출력하지 않습니다."] }],
  },
  {
    title: "설정 변경 · 환경변수와 파일의 차이", actor: "사용자 / API Server / kubelet / 앱",
    action: "ConfigMap과 Secret을 변경하고 기존 컨테이너의 환경변수와 마운트 파일 반영을 비교합니다.",
    reason: "리소스 변경과 앱의 설정 적용을 구분하기 위해", result: "환경변수는 기존 값 · 일반 볼륨 파일은 지연 후 갱신 · 앱 재읽기 필요",
    k8sMechanism: "실행 중인 컨테이너의 환경변수는 자동 갱신되지 않아 새 값 주입을 위해 재생성하는 방식이 필요합니다. 일반 ConfigMap·Secret 볼륨은 kubelet 동기화 후 갱신되지만 subPath 마운트는 자동 갱신되지 않습니다. 파일 갱신만으로 앱이 새 값을 다시 읽는 것은 아닙니다.",
    activeComponents: ["developer", "apiserver", "etcd", "kubelet-1"],
    packets: [{ from: "developer", to: "apiserver", label: "설정 값 변경" }, { from: "apiserver", to: "etcd", label: "새 값 저장" }, { from: "apiserver", to: "kubelet-1", label: "변경 감지 후 파일 갱신" }],
    cliLogs: [{ command: "kubectl exec settings-demo -- printenv APP_MODE", output: ["production (기존 환경변수 유지)"] }, { command: "kubectl exec settings-demo -- cat /etc/app/app.conf", output: ["mode=debug (볼륨 갱신 이후)", "앱이 파일을 다시 열어 읽거나 설정 reload를 수행해야 새 값이 적용됩니다."] }],
  },
];

export const CONFIG_SECRET_STEPS: LearningClusterStep[] = rows.map((row, index) => {
  const records = index === 0 ? [] : settingsRecords(index === 5);
  if (index === 1) records.forEach((record) => { record.action = "created"; });
  const running = index >= 4;
  if (index >= 2) records.push({
    key: "/registry/pods/default/settings-demo", type: "Pod",
    action: index === 2 ? "created" : index === 4 ? "updated" : "unchanged",
    revision: running ? 704 : 702,
    data: {
      apiVersion: "v1", kind: "Pod",
      metadata: { name: "settings-demo", namespace: "default", uid: "settings-demo-uid" },
      spec: { ...podSpec, nodeName: "worker-node-1" },
      status: { phase: running ? "Running" : "Pending", ...(running ? { podIP: "10.244.1.30" } : {}), conditions: [{ type: "Ready", status: running ? "True" : "False" }] },
    },
  });
  const podsState: Mode1Step["podsState"] = index < 2 ? [] : [{
    id: "settings-demo-uid", uid: "settings-demo-uid", name: "settings-demo",
    nodeId: "worker-1", status: running ? "Ready" : "ContainerCreating",
    podPhase: running ? "Running" : "Pending", learningStage: running ? "Ready" : "ContainerCreating",
    containerState: running ? "Running" : "Waiting", ready: running ? "1/1" : "0/1",
    restarts: 0, age: "시뮬레이션", ip: running ? "10.244.1.30" : "미할당",
  }];
  return {
    ...row, id: `config-secret-${index}`, stepNumber: index + 1,
    subTitle: row.result, summary: row.action, description: row.action,
    sources: ["https://kubernetes.io/docs/concepts/configuration/configmap/", "https://kubernetes.io/docs/concepts/configuration/secret/"],
    packets: row.packets.map((packet) => ({ ...packet, kind: "management" })),
    podsState, etcdState: { revision: 700 + index, raftTerm: 3, records },
  };
});
