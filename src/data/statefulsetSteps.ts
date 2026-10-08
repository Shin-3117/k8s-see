import type { EtcdRecord, PodInstance } from "../types/pipeline";
import type { YamlPreset } from "../types/yamlMapping";
import type { LearningClusterStep } from "./learningScenarios";

export const STATEFULSET_PRESET: YamlPreset = {
  id: "statefulset",
  name: "Headless Service + StatefulSet",
  description: "순차 생성과 Pod별 PVC를 사용하는 Nginx 예시",
  content: `apiVersion: v1
kind: Service
metadata:
  name: web-headless
spec:
  clusterIP: None
  selector:
    app: stateful-web
  ports:
    - port: 80
      name: http
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: web
spec:
  serviceName: web-headless
  replicas: 2
  podManagementPolicy: OrderedReady
  selector:
    matchLabels:
      app: stateful-web
  template:
    metadata:
      labels:
        app: stateful-web
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
          ports:
            - containerPort: 80
              name: http
          readinessProbe:
            tcpSocket:
              port: http
          volumeMounts:
            - name: data
              mountPath: /usr/share/nginx/html
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 1Gi`,
  impacts: [
    {
      startLine: 1, endLine: 11, keyword: "Headless Service",
      title: "Pod별 DNS 이름의 기반",
      affectedComponents: ["apiserver", "controllerManager"],
      summary: "clusterIP: None인 Service를 별도로 생성합니다.",
      deepDive: "Service selector가 Pod 라벨과 일치해야 합니다. 일반 ClusterIP 가상 주소 대신 준비된 Pod 주소를 DNS로 찾습니다. Service만으로 Pod를 생성하지 않습니다.",
      kernelOrInternal: "web-0.web-headless.default.svc.cluster.local → Ready Pod IP (기본 클러스터 도메인 예시)",
      cliCommand: "kubectl get service web-headless",
    },
    {
      startLine: 13, endLine: 20, keyword: "StatefulSet",
      title: "안정적인 이름과 순차 생성",
      affectedComponents: ["apiserver", "etcd", "controllerManager"],
      summary: "web-0이 Running·Ready가 된 뒤 web-1을 생성합니다.",
      deepDive: "serviceName은 Headless Service를 참조합니다. OrderedReady는 기본 생성 정책입니다. Parallel 정책은 생성 대기를 완화하지만 Pod별 이름과 저장소 관계는 유지합니다.",
      kernelOrInternal: "StatefulSet Controller → PVC / Pod 생성 요청 → API Server (ReplicaSet을 거치지 않음)",
      cliCommand: "kubectl get statefulset web",
    },
    {
      startLine: 21, endLine: 27, keyword: "selector / labels",
      title: "컨트롤러와 Service가 선택할 Pod",
      affectedComponents: ["apiserver", "controllerManager"],
      summary: "StatefulSet selector와 Pod template 라벨을 일치시킵니다.",
      deepDive: "Service selector도 같은 라벨을 참조합니다. selector는 리소스 사이의 선택 관계이며 네트워크 패킷을 직접 전달하는 프로세스가 아닙니다.",
      kernelOrInternal: "spec.selector.matchLabels.app = spec.template.metadata.labels.app",
    },
    {
      startLine: 28, endLine: 40, keyword: "Pod template",
      title: "컨테이너 준비 상태와 볼륨 마운트",
      affectedComponents: ["scheduler", "kubelet-1", "runtime-1"],
      summary: "배정된 노드에서 PVC를 마운트하고 컨테이너의 준비 상태를 검사합니다.",
      deepDive: "이 예시는 TCP readinessProbe로 포트 수신을 확인합니다. 데이터 동기화나 애플리케이션 수준의 정상 동작까지 보장하는 검사는 아닙니다.",
      kernelOrInternal: "kubelet → 볼륨 준비 / CRI → 컨테이너 실행 → readinessProbe",
    },
    {
      startLine: 41, endLine: 48, keyword: "volumeClaimTemplates",
      title: "Pod마다 독립적인 PVC 생성",
      affectedComponents: ["controllerManager", "csiController", "kubelet-1"],
      summary: "data-web-0, data-web-1 PVC를 각각 만들고 해당 Pod에 연결합니다.",
      deepDive: "동적 프로비저닝이 가능한 기본 StorageClass와 CSI 드라이버가 준비되었다고 가정합니다. Pod 교체는 기존 PVC를 재사용하며, PVC/PV는 앱 데이터 자동 복제 기능이 아닙니다.",
      kernelOrInternal: "<템플릿 이름>-<StatefulSet 이름>-<ordinal> → data-web-0",
      cliCommand: "kubectl get pvc data-web-0 data-web-1",
    },
  ],
};

type StatefulResource = "Service" | "StatefulSet" | "Pod" | "PersistentVolumeClaim" | "PersistentVolume";
const resourcePaths: Record<StatefulResource, string> = {
  Service: "services/specs", StatefulSet: "statefulsets", Pod: "pods",
  PersistentVolumeClaim: "persistentvolumeclaims", PersistentVolume: "persistentvolumes",
};
const record = (type: StatefulResource, name: string, data: EtcdRecord["data"]): EtcdRecord => ({
  key: type === "PersistentVolume"
    ? `/registry/persistentvolumes/${name}`
    : `/registry/${resourcePaths[type]}/default/${name}`,
  type, action: "unchanged", revision: 500,
  data: { apiVersion: type === "StatefulSet" ? "apps/v1" : "v1", kind: type, metadata: { name, ...(type !== "PersistentVolume" ? { namespace: "default" } : {}) }, ...data },
});
const service = record("Service", "web-headless", {
  spec: { clusterIP: "None", selector: { app: "stateful-web" }, ports: [{ name: "http", port: 80 }] },
});
const statefulset = record("StatefulSet", "web", {
  metadata: { name: "web", namespace: "default", uid: "sts-web" },
  spec: {
    serviceName: "web-headless", replicas: 2, podManagementPolicy: "OrderedReady",
    selector: { matchLabels: { app: "stateful-web" } },
    template: {
      metadata: { labels: { app: "stateful-web" } },
      spec: { containers: [{ name: "nginx", image: "nginx:1.27", ports: [{ containerPort: 80, name: "http" }], readinessProbe: { tcpSocket: { port: "http" } }, volumeMounts: [{ name: "data", mountPath: "/usr/share/nginx/html" }] }] },
    },
    volumeClaimTemplates: [{ metadata: { name: "data" }, spec: { accessModes: ["ReadWriteOnce"], resources: { requests: { storage: "1Gi" } } } }],
  },
});
function pvc(ordinal: number, bound: boolean) {
  return record("PersistentVolumeClaim", `data-web-${ordinal}`, {
    metadata: { name: `data-web-${ordinal}`, namespace: "default", uid: `pvc-data-web-${ordinal}` },
    spec: { accessModes: ["ReadWriteOnce"], resources: { requests: { storage: "1Gi" } }, ...(bound ? { volumeName: `pv-web-${ordinal}` } : {}) },
    status: { phase: bound ? "Bound" : "Pending" },
  });
}
function pv(ordinal: number) {
  return record("PersistentVolume", `pv-web-${ordinal}`, {
    spec: { capacity: { storage: "1Gi" }, claimRef: { name: `data-web-${ordinal}`, namespace: "default", uid: `pvc-data-web-${ordinal}` } },
    status: { phase: "Bound" },
  });
}
function pod(ordinal: number, stage: "pending" | "mounting" | "ready", replacement = false): EtcdRecord {
  const assigned = stage !== "pending";
  return record("Pod", `web-${ordinal}`, {
    metadata: { name: `web-${ordinal}`, namespace: "default", uid: `web-${ordinal}-${replacement ? "new" : "original"}`, labels: { app: "stateful-web" }, ownerReferences: [{ apiVersion: "apps/v1", kind: "StatefulSet", name: "web", uid: "sts-web", controller: true }] },
    spec: { hostname: `web-${ordinal}`, subdomain: "web-headless", ...(assigned ? { nodeName: `worker-node-${ordinal + 1}` } : {}), volumes: [{ name: "data", persistentVolumeClaim: { claimName: `data-web-${ordinal}` } }] },
    status: { phase: stage === "ready" ? "Running" : "Pending", ...(stage === "ready" ? { podIP: replacement ? "10.244.1.23" : `10.244.${ordinal + 1}.10` } : {}), conditions: [{ type: "Ready", status: stage === "ready" ? "True" : "False" }] },
  });
}
const resources = (ordinal: number) => [pvc(ordinal, true), pv(ordinal)];
const snapshots: EtcdRecord[][] = [
  [],
  [service, statefulset],
  [service, statefulset, pvc(0, false), pod(0, "pending")],
  [service, statefulset, ...resources(0), pod(0, "mounting")],
  [service, statefulset, ...resources(0), pod(0, "ready")],
  [service, statefulset, ...resources(0), pod(0, "ready"), pvc(1, false), pod(1, "pending")],
  [service, statefulset, ...resources(0), pod(0, "ready"), ...resources(1), pod(1, "ready")],
  [service, statefulset, ...resources(0), ...resources(1), pod(1, "ready")],
  [service, statefulset, ...resources(0), pod(0, "ready", true), ...resources(1), pod(1, "ready")],
];
type StepContent = Pick<LearningClusterStep, "title" | "actor" | "action" | "reason" | "result" | "activeComponents" | "packets" | "highlightYamlLines" | "cliLogs">;
const content: StepContent[] = [
  {
    title: "Headless Service와 StatefulSet 제출", actor: "사용자 / API Server",
    action: "Service와 StatefulSet YAML을 각각 API로 제출하고 검증합니다.", reason: "Pod별 이름과 저장소를 선언하기 위해", result: "selector·template 라벨과 serviceName 확인",
    activeComponents: ["developer", "apiserver"], packets: [{ from: "developer", to: "apiserver", label: "Service / StatefulSet 적용" }], highlightYamlLines: [2, 6, 14, 18, 19],
    cliLogs: [{ command: "kubectl apply -f statefulset.yaml", output: ["service/web-headless created", "statefulset.apps/web created", "이후 단계에서 저장된 상태를 확인합니다."] }],
  },
  {
    title: "API에 원하는 상태 저장", actor: "API Server / etcd",
    action: "Headless Service와 replicas: 2인 StatefulSet을 저장합니다.", reason: "컨트롤러가 원하는 복제본 수를 관찰하도록", result: "Service·StatefulSet 등록 · 아직 Pod 없음",
    activeComponents: ["apiserver", "etcd"], packets: [{ from: "apiserver", to: "etcd", label: "원하는 상태 저장" }], highlightYamlLines: [6, 18, 19, 20],
    cliLogs: [{ command: "kubectl get service web-headless; kubectl get sts web", output: ["NAME           TYPE        CLUSTER-IP", "web-headless   ClusterIP   None", "NAME   READY", "web    0/2"] }],
  },
  {
    title: "web-0과 전용 PVC 생성", actor: "StatefulSet 컨트롤러",
    action: "data-web-0 PVC와 미배정 Pending Pod web-0을 생성합니다.", reason: "첫 번째 ordinal부터 고유한 Pod와 저장소를 연결하기 위해", result: "web-0 → data-web-0 · web-1은 아직 없음",
    activeComponents: ["controllerManager", "apiserver"], packets: [{ from: "controllerManager", to: "apiserver", label: "PVC / Pod 생성" }], highlightYamlLines: [20, 41, 43],
    cliLogs: [{ command: "kubectl get pod,pvc", output: ["pod/web-0        0/1   Pending", "pvc/data-web-0   Pending", "web-0이 Ready가 되기 전에는 web-1을 생성하지 않습니다."] }],
  },
  {
    title: "저장소 바인딩과 노드 실행 준비", actor: "Scheduler / CSI / kubelet",
    action: "스토리지와 배치 조건을 조정해 PVC를 PV에 연결하고, 노드에 배정된 web-0에 마운트합니다.", reason: "컨테이너 시작 전에 전용 볼륨을 준비하기 위해", result: "data-web-0 Bound · web-0 Pending / ContainerCreating",
    activeComponents: ["scheduler", "apiserver", "csiController", "kubelet-1"], packets: [{ from: "scheduler", to: "apiserver", label: "노드 배정" }, { from: "csiController", to: "apiserver", label: "PV / PVC 바인딩" }], highlightYamlLines: [38, 39, 40, 45, 48],
    cliLogs: [{ command: "kubectl get pod web-0 -o wide; kubectl get pvc data-web-0", output: ["web-0   0/1   ContainerCreating   worker-node-1", "data-web-0   Bound   pv-web-0"] }],
  },
  {
    title: "web-0 Running·Ready 확인", actor: "kubelet / 런타임",
    action: "컨테이너를 실행하고 readinessProbe 성공을 API에 보고합니다.", reason: "OrderedReady의 다음 Pod 생성 조건을 충족하기 위해", result: "web-0 Running · Ready=True",
    activeComponents: ["kubelet-1", "runtime-1", "apiserver"], packets: [{ from: "kubelet-1", to: "apiserver", label: "Ready=True 보고" }], highlightYamlLines: [20, 35, 36, 37],
    cliLogs: [{ command: "kubectl get pod web-0", output: ["NAME    READY   STATUS", "web-0   1/1     Running"] }],
  },
  {
    title: "다음 ordinal web-1 생성", actor: "StatefulSet 컨트롤러",
    action: "web-0의 준비 상태를 확인한 뒤 web-1과 data-web-1을 생성합니다.", reason: "순서를 지키며 replicas: 2에 도달하기 위해", result: "web-1 Pending · 독립적인 두 번째 PVC",
    activeComponents: ["controllerManager", "apiserver"], packets: [{ from: "controllerManager", to: "apiserver", label: "web-1 / data-web-1 생성" }], highlightYamlLines: [19, 20, 41, 43],
    cliLogs: [{ command: "kubectl get pod,pvc", output: ["pod/web-0        1/1   Running", "pod/web-1        0/1   Pending", "pvc/data-web-0   Bound", "pvc/data-web-1   Pending"] }],
  },
  {
    title: "두 Pod 실행과 DNS 이름 확인", actor: "Scheduler / CSI / kubelet / DNS",
    action: "web-1의 저장소·실행을 준비하고 Ready Pod의 주소를 DNS에 반영합니다.", reason: "각 복제본에 이름으로 접근하도록", result: "web-0·web-1 Ready · 각자 별도 PVC/PV 사용",
    activeComponents: ["scheduler", "csiController", "kubelet-2", "runtime-2"], packets: [{ from: "kubelet-2", to: "apiserver", label: "web-1 Ready 보고" }], highlightYamlLines: [6, 18, 41],
    cliLogs: [{ command: "kubectl get pod,pvc -o wide", output: ["web-0   1/1   Running   10.244.1.10   worker-node-1", "web-1   1/1   Running   10.244.2.10   worker-node-2", "data-web-0 → pv-web-0; data-web-1 → pv-web-1", "Pod DNS: web-0.web-headless.default.svc.cluster.local", "Pod DNS: web-1.web-headless.default.svc.cluster.local"] }],
  },
  {
    title: "web-0 삭제 완료 · PVC 유지", actor: "사용자 / kubelet",
    action: "web-0의 정상 종료와 삭제를 마치고 기존 PVC/PV를 유지합니다.", reason: "Pod와 저장소의 수명을 구분하기 위해", result: "web-0 없음 · data-web-0 Bound 유지 · web-1 계속 실행",
    activeComponents: ["developer", "apiserver", "kubelet-1"], packets: [{ from: "developer", to: "apiserver", label: "web-0 삭제" }], highlightYamlLines: [41, 43],
    cliLogs: [{ command: "kubectl delete pod web-0; kubectl get pvc data-web-0", output: ["pod web-0 deleted (정상 종료 완료)", "data-web-0   Bound   pv-web-0", "컨트롤러가 대체 Pod를 생성하기 전의 순간을 표시합니다."] }],
  },
  {
    title: "같은 이름과 PVC로 Pod 교체", actor: "StatefulSet 컨트롤러 / Scheduler / kubelet",
    action: "새 UID의 web-0을 생성하고 기존 data-web-0을 다시 마운트해 실행합니다.", reason: "복제본 수를 복원하면서 저장소 연결을 유지하기 위해", result: "이름·DNS·PVC 유지 · UID 변경 · IP 변경 예시",
    activeComponents: ["controllerManager", "scheduler", "kubelet-1", "runtime-1"], packets: [{ from: "controllerManager", to: "apiserver", label: "새 UID의 web-0 생성" }, { from: "kubelet-1", to: "apiserver", label: "기존 PVC 재사용 · Ready" }], highlightYamlLines: [18, 19, 38, 39, 41],
    cliLogs: [{ command: "kubectl get pod web-0 -o wide; kubectl get pvc data-web-0", output: ["web-0   1/1   Running   10.244.1.23   worker-node-1", "UID: web-0-original → web-0-new", "data-web-0   Bound   pv-web-0 (동일 PVC/PV)", "DNS 이름은 유지됩니다. DNS 캐시 때문에 새 IP 반영에 시간이 걸릴 수 있습니다."] }],
  },
];

export const STATEFULSET_STEPS = content.reduce<LearningClusterStep[]>((steps, step, index) => {
  const previous = steps[index - 1]?.etcdState?.records ?? [];
  const records = snapshots[index].map((r): EtcdRecord => {
    const old = previous.find((p) => p.key === r.key);
    const changed = JSON.stringify(old?.data) !== JSON.stringify(r.data);
    return { ...r, action: !old ? "created" : changed ? "updated" : "unchanged", revision: changed ? 500 + index : old!.revision };
  });
  const podsState: PodInstance[] = records.filter((r) => r.type === "Pod" && r.data.spec.nodeName).map((r) => {
    const ready = r.data.status.phase === "Running";
    return { id: r.data.metadata.uid, uid: r.data.metadata.uid, name: r.data.metadata.name, nodeId: r.data.spec.nodeName === "worker-node-1" ? "worker-1" : "worker-2", status: ready ? "Ready" : "ContainerCreating", podPhase: ready ? "Running" : "Pending", learningStage: ready ? "Ready" : "ContainerCreating", containerState: ready ? "Running" : "Waiting", ready: ready ? "1/1" : "0/1", restarts: 0, age: "시뮬레이션", ip: r.data.status.podIP ?? "미할당" };
  });
  steps.push({
    ...step, id: `statefulset-${index}`, stepNumber: index + 1, subTitle: step.result,
    summary: step.action, description: step.action,
    k8sMechanism: "StatefulSet은 ReplicaSet 없이 Pod를 직접 관리합니다. 기본 StorageClass와 CSI 구성이 준비된 예시이며, 바인딩과 노드 배정 순서는 StorageClass의 volumeBindingMode에 따라 달라집니다. 일반 Headless Service의 DNS에는 Ready Pod가 반영됩니다. 저장소 준비의 세부 과정은 PVC 페이지에서 확인할 수 있습니다.",
    packets: step.packets.map((packet) => ({ ...packet, kind: "management" })), podsState,
    etcdState: { revision: 500 + index, raftTerm: 3, records },
  });
  return steps;
}, []);
