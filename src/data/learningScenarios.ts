import { MODE1_STEPS } from "./mode1Steps";
import { MODE3_STEPS, Mode3Step } from "./mode3Steps";
import { MODE4_STEPS } from "./mode4Steps";
import { MODE5_STEPS } from "./mode5Steps";
import { Mode1Step, PacketPath, Mode4Step, Mode5Step } from "../types/pipeline";
export interface StepExplanation {
  summary: string;
  actor: string;
  action: string;
  reason: string;
  result: string;
  sources?: string[];
}
export type LearningClusterStep = Mode1Step & StepExplanation & { id: string };
type ExplanationRow = [string, string, string, string];
function enrich<T extends Mode1Step>(
  step: T,
  index: number,
  row: ExplanationRow,
): T & StepExplanation & { id: string } {
  const [actor, action, reason, result] = row;
  return {
    ...step,
    id: step.activeNodeId ?? `step-${index}`,
    stepNumber: index + 1,
    actor,
    action,
    reason,
    result,
    summary: action,
    podsState: step.podsState.map((p) => ({
      ...p,
      podPhase:
        p.status === "Failed"
          ? "Failed"
          : ["Running", "Ready", "Terminating"].includes(p.status)
            ? "Running"
            : "Pending",
      learningStage: p.status,
      uid: p.id,
      containerState: ["Running", "Ready", "Terminating"].includes(p.status)
        ? "Running"
        : "Waiting",
    })),
    packets: step.packets.map((p) => ({
      ...p,
      kind:
        p.kind ??
        (p.from === "endusers" || p.to === "endusers"
          ? "traffic"
          : "management"),
    })),
  };
}
const creationRows: ExplanationRow[] = [
  [
    "사용자 / kubectl",
    "원하는 상태를 YAML로 제출합니다.",
    "반복 가능한 배포를 선언하기 위해",
    "API Server에 Deployment 요청 도착",
  ],
  [
    "API Server",
    "인증·인가·Admission을 거쳐 요청을 검증합니다.",
    "유효하고 허용된 변경만 처리하기 위해",
    "검증된 리소스 사양",
  ],
  [
    "API Server / etcd",
    "Deployment 사양을 저장합니다.",
    "컨트롤러가 원하는 상태를 관찰하도록",
    "Deployment 객체 생성",
  ],
  [
    "Deployment·ReplicaSet 컨트롤러",
    "ReplicaSet과 필요한 Pod 객체를 생성합니다.",
    "원하는 복제본 수를 맞추기 위해",
    "노드 미배정 Pending Pod",
  ],
  [
    "Scheduler",
    "노드를 선택하고 API에 배정을 기록합니다.",
    "자원·배치 제약을 충족하기 위해",
    "Pod spec.nodeName 기록",
  ],
  [
    "배정된 노드의 kubelet",
    "자기 노드의 Pod 사양을 감지하고 실행을 준비합니다.",
    "노드에서 실제 실행 상태를 맞추기 위해",
    "공식 phase Pending · 학습 단계 ContainerCreating",
  ],
  [
    "런타임 / CNI / kubelet",
    "sandbox·네트워크·이미지를 준비해 앱을 시작합니다.",
    "컨테이너 실행 환경을 구성하기 위해",
    "Running · Ready는 별도 확인",
  ],
  [
    "kubelet / Service 구현",
    "준비 상태를 보고하고 기존 Service의 백엔드 정보를 반영합니다.",
    "준비된 앱으로 요청을 전달하기 위해",
    "Ready=True · Service가 별도 적용된 예시",
  ],
];
export const CREATION_STEPS = MODE1_STEPS.map((s, i) =>
  enrich(s, i, creationRows[i]),
);
const serviceRows: ExplanationRow[] = [
  [
    "사용자 / API Server",
    "Service YAML을 등록합니다.",
    "Pod 집합에 안정적인 접근점을 제공하기 위해",
    "Pod 생성 없이 Service 요청 처리",
  ],
  [
    "API Server",
    "ClusterIP를 할당하고 Service를 저장합니다.",
    "Pod가 교체되어도 접근 주소를 유지하기 위해",
    "ClusterIP 10.96.182.44",
  ],
  [
    "EndpointSlice 컨트롤러",
    "selector가 일치하는 Pod의 주소·준비 상태를 반영합니다.",
    "실제 백엔드를 연결하기 위해",
    "Ready 백엔드와 targetPort 연결",
  ],
  [
    "kube-proxy 또는 대체 구현",
    "Service 전달 규칙을 노드의 데이터 경로에 반영합니다.",
    "ClusterIP 요청을 백엔드에 전달하기 위해",
    "iptables/IPVS/eBPF 등 구현별 경로",
  ],
  [
    "클라이언트 / 노드 데이터 경로",
    "Service 주소로 들어온 요청을 앱 Pod에 전달합니다.",
    "앱에 실제 요청을 처리하도록",
    "앱 응답 반환 · API Server를 통과하지 않음",
  ],
];
export const SERVICE_STEPS = MODE3_STEPS.filter(
  (s) => s.phase === "service",
).map((s, i) => enrich(s, i, serviceRows[i]));
const configRows: ExplanationRow[] = [
  [
    "사용자 / API Server",
    "ConfigMap을 독립 리소스로 등록합니다.",
    "앱 이미지와 설정을 분리하기 위해",
    "설정 데이터 제출",
  ],
  [
    "API Server / etcd",
    "ConfigMap을 저장합니다.",
    "Pod가 이름으로 설정을 참조하도록",
    "ConfigMap만으로 Pod를 생성하지 않음",
  ],
  [
    "사용자",
    "Deployment의 volumes·volumeMounts에서 ConfigMap을 참조합니다.",
    "컨테이너에 설정 파일을 제공하기 위해",
    "같은 Namespace의 ConfigMap 참조",
  ],
  [
    "API Server",
    "Deployment 사양을 저장합니다.",
    "배포와 설정 사이의 관계를 유지하기 위해",
    "API 리소스로 저장된 배포 사양",
  ],
  [
    "컨트롤러",
    "Deployment→ReplicaSet→Pod 관계를 만듭니다.",
    "원하는 복제본을 유지하기 위해",
    "설정을 참조하는 Pod 생성",
  ],
  [
    "Scheduler",
    "Pod를 실행할 노드를 선택합니다.",
    "자원·배치 제약에 맞추기 위해",
    "API를 통한 노드 배정",
  ],
  [
    "kubelet / 런타임",
    "ConfigMap 파일을 컨테이너의 /config 경로에 제공합니다.",
    "앱이 설정 파일을 읽도록",
    "ConfigMap 볼륨 · 외부 CSI Attach와 구분",
  ],
];
export const RESOURCE_STEPS: (Mode3Step & StepExplanation & { id: string })[] =
  MODE3_STEPS.filter((s) => s.phase !== "service").map((s, i) =>
    enrich(s, i, configRows[i]),
  );
const storageRows: ExplanationRow[] = [
  [
    "사용자 / API Server",
    "20Gi PVC를 등록하고 소비 Pod를 기다립니다.",
    "WaitForFirstConsumer가 배치 제약을 고려하도록",
    "PVC Pending · 아직 볼륨 없음",
  ],
  [
    "Scheduler",
    "노드 후보와 AZ를 선택해 PVC에 선택 노드 정보를 기록합니다.",
    "Pod와 볼륨의 토폴로지를 함께 맞추기 위해",
    "후보 worker-1 · 최종 배정은 바인딩 뒤",
  ],
  [
    "external-provisioner / CSI controller",
    "PVC·StorageClass·노드 토폴로지로 볼륨 생성을 요청합니다.",
    "해당 노드에서 사용할 수 있는 볼륨을 만들기 위해",
    "CSI CreateVolume 요청",
  ],
  [
    "CSI 드라이버 / AWS API / PV 컨트롤러",
    "EBS·PV를 생성하고 PVC와 바인딩합니다.",
    "요청과 실제 저장소를 연결하기 위해",
    "PVC Bound · 볼륨 준비 뒤 최종 Pod 배정",
  ],
  [
    "CSI controller / external-attacher",
    "VolumeAttachment를 통해 볼륨을 노드에 연결합니다.",
    "노드에서 블록 장치를 사용할 수 있도록",
    "Attach 완료 · Mount는 다음 과정",
  ],
  [
    "kubelet / CSI node",
    "볼륨을 준비하고 마운트합니다.",
    "컨테이너가 파일 경로로 접근하도록",
    "새 볼륨만 필요 시 초기화 · 기존 데이터 재포맷 안 함",
  ],
  [
    "런타임 / MySQL",
    "volumeMounts 경로 /var/lib/mysql에서 데이터를 씁니다.",
    "컨테이너와 저장소 수명을 분리하기 위해",
    "Running / Ready · 디스크 I/O는 API Server를 통과하지 않음",
  ],
  [
    "컨트롤러 / kubelet / CSI",
    "같은 PVC를 참조하는 새 Pod에서 기존 데이터를 읽습니다.",
    "Pod 교체 후 기록된 데이터를 재사용하기 위해",
    "새 Pod UID · 같은 PVC/PV/볼륨 · 쓰기 완료 데이터 확인",
  ],
];
export const STORAGE_STEPS = MODE4_STEPS.map((s, i) => {
  const step = enrich(s, i, storageRows[i]);
  // Preserve YAML, storage snapshots and resource inspection while correcting the teaching model.
  const packets: PacketPath[] = step.packets.map((p) => ({
    ...p,
    from: p.from === "cloudControllerManager" ? "csiController" : p.from,
    to: p.to === "cloudControllerManager" ? "csiController" : p.to,
    label: p.label.replace(
      "Pod Scheduled to worker-1",
      "PVC selected-node: worker-1",
    ),
  }));
  const etcdState = step.etcdState
    ? structuredClone(step.etcdState)
    : undefined;
  etcdState?.records.forEach((record) => {
    if (record.type === "Pod" && i < 3 && record.data.spec)
      delete record.data.spec.nodeName;
    if (record.type === "PersistentVolumeClaim" && i === 1)
      record.data.metadata.annotations = {
        "volume.kubernetes.io/selected-node": "worker-1",
      };
  });
  return {
    ...step,
    title: [
      "PVC 요청과 소비 Pod 대기",
      "노드 후보와 AZ 선택",
      "CSI 프로비저닝 요청",
      "EBS 생성·PV/PVC 바인딩",
      "VolumeAttachment와 노드 Attach",
      "CSI node의 볼륨 준비·Mount",
      "MySQL 실행과 파일 경로",
      "같은 PVC 재사용과 영속성",
    ][i],
    description: `${step.action} ${step.result}`,
    k8sMechanism: `${step.reason}. CSI controller와 cloud-controller-manager는 별도 구성 요소입니다.`,
    podsState: step.podsState.map((p) => ({
      ...p,
      uid: i === 7 ? "pod-mysql-002" : "pod-mysql-001",
    })),
    activeComponents: step.activeComponents.map((id) =>
      id === "cloudControllerManager" ? "csiController" : id,
    ),
    packets,
    etcdState,
    awsEbsState: i < 3 ? undefined : step.awsEbsState,
    cliLogs:
      i === 7
        ? [
            {
              command: "kubectl get pvc mysql-data-pvc",
              output: [
                "mysql-data-pvc  Bound  pvc-7d8a9b0c  20Gi  RWO  ebs-gp3-sc",
                "Pod 교체 후 같은 PVC의 기록된 데이터 조회 예시",
                "PVC 삭제: Delete는 외부 볼륨 삭제, Retain은 수동 회수",
                "영속 저장소는 미완료 쓰기의 무손실 복구를 보장하지 않음",
              ],
            },
          ]
        : [
            {
              command: [
                "kubectl describe pvc mysql-data-pvc",
                "kubectl get pvc mysql-data-pvc -o yaml",
                "kubectl describe pvc mysql-data-pvc",
                "kubectl get pvc,pv",
                "kubectl get volumeattachments",
                "kubectl describe pod mysql-db",
                "kubectl exec mysql-db -- df -h /var/lib/mysql",
              ][i],
              output: [step.action, step.result],
            },
          ],
  } satisfies Mode4Step & StepExplanation & { id: string };
});
const ingressRows: ExplanationRow[] = [
  [
    "사용자 / API Server",
    "Host·Path·TLS 규칙을 등록합니다.",
    "외부 요청의 전달 규칙을 선언하기 위해",
    "Ingress 생성 · Controller는 별도 설치 필요",
  ],
  [
    "Ingress Controller",
    "API의 Ingress·Service·EndpointSlice·Secret을 감시합니다.",
    "담당 클래스의 최신 설정을 반영하기 위해",
    "규칙과 준비된 백엔드 수집",
  ],
  [
    "Controller / 프록시",
    "라우팅·인증서 설정을 갱신합니다.",
    "요청 처리에 선언된 규칙을 적용하기 위해",
    "NGINX 설정 예시 · 갱신 방식은 구현에 따라 다름",
  ],
  [
    "외부 사용자 / 프록시",
    "외부 DNS·진입 주소를 통해 HTTPS 요청을 받습니다.",
    "외부 클라이언트의 접속을 처리하기 위해",
    "이 예시에서 Controller가 TLS 종료",
  ],
  [
    "Ingress 프록시",
    "Host와 /orders 경로를 판단해 order-service 백엔드로 전달합니다.",
    "주문 API에 요청을 보내기 위해",
    "order-api Pod:8080",
  ],
  [
    "Ingress 프록시",
    "별도 /products 요청을 product-service 백엔드로 전달합니다.",
    "상품 API에 요청을 보내기 위해",
    "product-api Pod:8080 · orders를 거쳐 가지 않음",
  ],
  [
    "앱 / Ingress 프록시",
    "선택된 앱의 응답을 외부 사용자에게 반환합니다.",
    "요청을 완료하기 위해",
    "앱→프록시→사용자 응답",
  ],
];
export const INGRESS_STEPS = MODE5_STEPS.map((s, i) => {
  const step = enrich(s, i, ingressRows[i]);
  return {
    ...step,
    description: `${step.action} ${step.result}`,
    k8sMechanism: `${step.reason}. Controller는 Service ClusterIP 또는 Pod IP로 전달할 수 있습니다. 이 화면은 Pod IP 직접 전달 예시입니다. TLS·reload·헤더 설정은 구현별로 다릅니다.`,
  } satisfies Mode5Step & StepExplanation & { id: string };
});
