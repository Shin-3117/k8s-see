export const LEARNING_PAGES = [
  {
    id: "overview",
    title: "Kubernetes 전체 구조",
    question: "누가 상태를 관리하고 누가 Pod를 실행할까?",
    summary:
      "Control Plane은 원하는 상태를 관리하고, Worker Node는 Pod를 실행합니다.",
    guide: "1. 클러스터 구성",
    source: "overview/components",
    takeaway:
      "관리 요청과 앱 트래픽의 경로를 구분하고 Pod 생성 과정으로 이동합니다.",
  },
  {
    id: "pod-creation",
    title: "Pod가 생성되는 과정",
    question: "YAML 제출 뒤 누가 무엇을 할까?",
    summary:
      "Deployment를 등록하면 컨트롤러가 ReplicaSet과 Pod를 만들고, 스케줄러의 배정을 감지한 kubelet이 실행을 준비합니다.",
    guide: "2. Deployment에서 Pod가 실행되기까지",
    source: "workloads/controllers/deployment",
    takeaway:
      "스케줄러는 노드를 선택하고, kubelet과 런타임이 실제 컨테이너를 실행합니다.",
  },
  {
    id: "pod-internals",
    title: "Pod 내부 구조",
    question: "같은 Pod의 컨테이너는 무엇을 공유할까?",
    summary:
      "같은 Pod의 컨테이너는 IP·포트 공간·localhost를 공유합니다. pause는 공유 환경을 유지합니다.",
    guide: "3. Pod 내부와 pause 컨테이너",
    source: "workloads/pods",
    takeaway:
      "pause는 패킷을 중계하지 않습니다. 같은 주소·포트를 동시에 사용하면 충돌할 수 있습니다.",
  },
  {
    id: "service-networking",
    title: "Service와 내부 통신",
    question: "Pod IP·DNS·Service는 어떻게 연결될까?",
    summary:
      "Service가 안정적인 이름과 주소를 제공하고, 노드의 데이터 경로가 준비된 백엔드 Pod로 요청을 전달합니다.",
    guide: "4. 실제 통신과 Service",
    source: "services-networking/service",
    takeaway:
      "DNS는 이름을 해석하고, CNI와 Service 구현은 실제 네트워크 경로를 구성합니다.",
  },
  {
    id: "ingress",
    title: "Ingress와 외부 요청",
    question: "외부 HTTP(S) 요청은 어떤 앱으로 전달될까?",
    summary:
      "Ingress는 Host·Path·TLS 규칙입니다. 설치된 Controller와 프록시가 규칙을 반영해 요청을 처리합니다.",
    guide: "4. Ingress 상세 설명",
    source: "services-networking/ingress",
    takeaway:
      "/orders와 /products는 서로 다른 요청입니다. TLS 종료와 백엔드 연결 방식은 구현에 따라 달라집니다.",
  },
  {
    id: "resource-relations",
    title: "주요 리소스 관계",
    question: "설정·Namespace·권한은 Pod와 어떻게 연결될까?",
    summary:
      "워크로드·설정·통신·권한 리소스는 API에 저장되고, 각자의 관계를 통해 Pod에 적용됩니다.",
    guide: "5. 주요 리소스의 관계",
    source: "overview/working-with-objects",
    takeaway:
      "ServiceAccount는 신원이고 RBAC Binding이 권한을 연결합니다. 다음 학습에서는 저장소 관계를 확장합니다.",
  },
  {
    id: "persistent-storage",
    title: "PVC와 외부 스토리지",
    question: "저장소는 어떻게 생성·마운트되고 유지될까?",
    summary:
      "Pod가 PVC를 참조하고 PVC가 PV에 연결됩니다. CSI 구성 요소가 외부 볼륨의 생성·연결·마운트를 조정합니다.",
    guide: "5. PVC와 외부 스토리지 상세 설명",
    source: "storage/persistent-volumes",
    takeaway:
      "Pod 교체와 PVC 삭제는 다릅니다. 저장소 영속성과 앱의 쓰기 완료·복구도 구분해야 합니다.",
  },
  {
    id: "pod-lifecycle",
    title: "Pod 라이프사이클",
    question: "준비·실행·실패·재시작·종료는 어떻게 다를까?",
    summary:
      "공식 phase, Ready 조건, 컨테이너 상태를 함께 읽으면 Pod가 실행 중인지 요청을 받을 수 있는지 구별할 수 있습니다.",
    guide: "6. Pod 라이프사이클",
    source: "workloads/pods/pod-lifecycle",
    takeaway:
      "컨테이너 재시작은 같은 Pod의 UID, Pod 교체는 새 UID입니다. 종료와 데이터 수명은 별도로 관리됩니다.",
  },
] as const;
export type LearningPageId = (typeof LEARNING_PAGES)[number]["id"];
export type LearningPage = (typeof LEARNING_PAGES)[number];
export const pageHref = (id: LearningPageId) => `#/learn/${id}`;
export const sourceUrl = (path: string) =>
  `https://kubernetes.io/docs/concepts/${path}/`;
export function pageFromHash(hash: string): LearningPageId {
  const id = hash.replace(/^#\/learn\//, "");
  return LEARNING_PAGES.find((page) => page.id === id)?.id ?? "overview";
}
