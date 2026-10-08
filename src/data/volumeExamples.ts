import type { EtcdRecord, PodInstance } from "../types/pipeline";
import type { LearningClusterStep } from "./learningScenarios";

export const VOLUME_TYPES = [
  ["emptyDir", "임시 파일·캐시·Pod 안의 파일 공유", "Pod 삭제 시 데이터 삭제 · medium: Memory로 메모리 사용 가능"],
  ["hostPath", "노드의 파일·디렉터리 접근", "데이터는 해당 노드에 종속 · 호스트 접근 권한에 주의"],
  ["configMap", "일반 설정을 파일로 제공", "Pod 삭제 후에도 API 리소스는 유지 · 새 Pod에 다시 투영"],
  ["secret", "비밀번호·인증서를 파일로 제공", "Pod 삭제 후에도 API 리소스는 유지 · Base64는 암호화가 아님"],
  ["downwardAPI", "Pod 이름·Namespace·라벨 등을 파일로 제공", "현재 Pod의 메타데이터를 투영"],
  ["projected", "여러 소스를 한 디렉터리에 조합", "ConfigMap·Secret·ServiceAccount 토큰 등을 함께 투영"],
  ["persistentVolumeClaim", "PVC에 연결된 PV를 Pod에서 사용", "Pod 삭제와 저장소 삭제는 별개 · PV 회수 정책 확인"],
  ["nfs", "외부 NFS 서버의 디렉터리 사용", "데이터는 NFS 서버에 존재 · 서버와 접근 권한 구성 필요"],
  ["local", "노드의 로컬 디스크를 PV로 제공", "PV에서 정의 · nodeAffinity로 해당 노드에 배치"],
  ["image", "이미지·OCI 아티팩트의 파일 사용", "읽기 전용 · Kubernetes 버전과 런타임 지원 확인"],
] as const;

export type VolumeExampleId = "emptydir" | "configuration" | "pvc";
export interface VolumeExample {
  id: VolumeExampleId;
  name: string;
  source: string;
  volumeName: string;
  mountPath: string;
  file: string;
  note: string;
  yaml: string;
}

const podYaml = (volume: string, mountPath: string) => `apiVersion: v1
kind: Pod
metadata:
  name: volume-demo
  namespace: default
spec:
  containers:
    - name: writer
      image: busybox:1.37
      command: ["sh", "-c", "sleep 3600"]
      volumeMounts:
        - name: shared
          mountPath: ${mountPath}
    - name: reader
      image: busybox:1.37
      command: ["sh", "-c", "sleep 3600"]
      volumeMounts:
        - name: shared
          mountPath: /shared
          readOnly: true
  volumes:
    - name: shared
${volume}`;

export const VOLUME_EXAMPLES: Record<VolumeExampleId, VolumeExample> = {
  emptydir: {
    id: "emptydir", name: "emptyDir · 임시 파일 공유", source: "노드의 임시 저장소",
    volumeName: "shared", mountPath: "/cache", file: "note.txt",
    note: "writer가 만든 파일을 reader가 같은 볼륨에서 읽습니다. 같은 Pod 안에서 컨테이너만 재시작하면 유지되지만 Pod 삭제 시 사라집니다.",
    yaml: podYaml("      emptyDir: {}", "/cache"),
  },
  configuration: {
    id: "configuration", name: "ConfigMap + Secret · 설정 파일", source: "API의 ConfigMap / Secret",
    volumeName: "shared", mountPath: "/etc/app", file: "app.conf",
    note: "projected로 ConfigMap과 Secret을 한 디렉터리에 읽기 전용 파일로 제공합니다. Pod 삭제는 원본 API 리소스 삭제가 아닙니다.",
    yaml: `apiVersion: v1
kind: ConfigMap
metadata:
  name: volume-settings
  namespace: default
data:
  app.conf: "mode=production"
---
apiVersion: v1
kind: Secret
metadata:
  name: volume-secret
  namespace: default
type: Opaque
stringData:
  password: "demo-only" # 공개용 가상 값
---
${podYaml(`      projected:
        sources:
          - configMap:
              name: volume-settings
          - secret:
              name: volume-secret`, "/etc/app").replace("mountPath: /etc/app", "mountPath: /etc/app\n          readOnly: true")}`,
  },
  pvc: {
    id: "pvc", name: "PVC · 영구 데이터 재사용", source: "data-pvc → data-pv → 외부 저장소",
    volumeName: "shared", mountPath: "/data", file: "note.txt",
    note: "PVC가 이미 Bound이고 다른 노드에서도 사용 가능한 외부 CSI 저장소를 가정합니다. 기존 Pod의 종료·볼륨 해제 후 새 Pod가 같은 PVC를 마운트합니다.",
    yaml: `# 동적 프로비저닝 가능한 기본 StorageClass가 필요합니다.
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-pvc
  namespace: default
spec:
  accessModes: ["ReadWriteOnce"]
  resources:
    requests:
      storage: 1Gi
---
${podYaml("      persistentVolumeClaim:\n        claimName: data-pvc", "/data")}`,
  },
};

export interface VolumeStep extends LearningClusterStep {
  volumeState: {
    mounted: boolean;
    content: string;
    sourceState: string;
    podUid: string | null;
    node: string | null;
  };
}

export function volumeExample(id: string): VolumeExample {
  return VOLUME_EXAMPLES[id as VolumeExampleId] ?? VOLUME_EXAMPLES.emptydir;
}

function sourceRecords(id: VolumeExampleId): EtcdRecord[] {
  const make = (type: EtcdRecord["type"], key: string, data: EtcdRecord["data"]): EtcdRecord => ({
    type, key, data, action: "unchanged", revision: 800,
  });
  if (id === "configuration") return [
    make("ConfigMap", "/registry/configmaps/default/volume-settings", {
      apiVersion: "v1", kind: "ConfigMap", metadata: { name: "volume-settings", namespace: "default" }, data: { "app.conf": "mode=production" },
    }),
    make("Secret", "/registry/secrets/default/volume-secret", {
      apiVersion: "v1", kind: "Secret", metadata: { name: "volume-secret", namespace: "default" }, type: "Opaque", data: { password: "ZGVtby1vbmx5" },
    }),
  ];
  if (id === "pvc") return [
    make("PersistentVolumeClaim", "/registry/persistentvolumeclaims/default/data-pvc", {
      apiVersion: "v1", kind: "PersistentVolumeClaim", metadata: { name: "data-pvc", namespace: "default", uid: "data-pvc-uid" },
      spec: { volumeName: "data-pv", accessModes: ["ReadWriteOnce"], resources: { requests: { storage: "1Gi" } } }, status: { phase: "Bound" },
    }),
    make("PersistentVolume", "/registry/persistentvolumes/data-pv", {
      apiVersion: "v1", kind: "PersistentVolume", metadata: { name: "data-pv" },
      spec: { capacity: { storage: "1Gi" }, accessModes: ["ReadWriteOnce"], persistentVolumeReclaimPolicy: "Retain", claimRef: { name: "data-pvc", namespace: "default", uid: "data-pvc-uid" } }, status: { phase: "Bound" },
    }),
  ];
  return [];
}

export function volumeSteps(example: VolumeExample): VolumeStep[] {
  const config = example.id === "configuration";
  const empty = example.id === "emptydir";
  const descriptions = [
    "Pod의 volumes에서 소스를 정의하고 각 컨테이너의 volumeMounts에서 같은 name으로 연결합니다.",
    config ? "kubelet이 API의 ConfigMap·Secret을 받아 두 컨테이너에 읽기 전용 파일로 투영합니다." : "writer 컨테이너가 note.txt를 쓰면 reader가 자신의 마운트 경로에서 같은 파일을 읽습니다.",
    "writer 컨테이너만 재시작합니다. 같은 Pod UID와 볼륨을 사용하므로 파일이 유지됩니다.",
    empty ? "Pod의 종료·삭제가 완료되면 이 Pod의 emptyDir 데이터도 삭제됩니다." : config ? "Pod의 마운트는 사라지지만 원본 ConfigMap·Secret API 리소스는 남습니다." : "Pod의 종료·볼륨 해제를 완료합니다. PVC·PV와 외부 저장소는 유지합니다.",
    empty ? "새 UID의 Pod는 새 emptyDir로 시작합니다. 이전 Pod의 파일은 복원되지 않습니다." : config ? "새 Pod에 같은 ConfigMap·Secret을 다시 투영합니다. 파일은 원본 API 데이터에서 제공됩니다." : "다른 노드의 새 Pod가 기존 PVC를 마운트해 외부 저장소의 파일을 다시 읽습니다.",
  ];
  const titles = ["소스와 마운트 경로 연결", config ? "두 컨테이너에 설정 파일 제공" : "같은 볼륨의 파일 공유", "컨테이너 재시작 · 볼륨 유지", "Pod 삭제 · 저장소 수명 확인", "새 Pod 생성 · 데이터 비교"];
  return titles.map((title, index) => {
    const deleted = index === 3;
    const mounted = index > 0 && !deleted;
    const uid = deleted ? null : index === 4 ? "volume-demo-new" : "volume-demo-original";
    const node = deleted ? null : index === 4 ? "worker-node-2" : "worker-node-1";
    const content = !mounted ? "마운트 없음" : empty && index === 4 ? "빈 디렉터리" : config ? "mode=production" : "hello-volume";
    const sourceState = empty ? (index === 3 ? "emptyDir 데이터 삭제됨" : index === 4 ? "새 emptyDir · 이전 파일 없음" : index === 0 ? "Pod 생성 요청" : "Pod 수명 동안 유지") : config ? "ConfigMap·Secret API 리소스 유지" : "동일 PVC/PV·외부 저장소 유지";
    const source = sourceRecords(example.id);
    const volumes = empty ? [{ name: "shared", emptyDir: {} }] : config ? [{ name: "shared", projected: { sources: [{ configMap: { name: "volume-settings" } }, { secret: { name: "volume-secret" } }] } }] : [{ name: "shared", persistentVolumeClaim: { claimName: "data-pvc" } }];
    const records: EtcdRecord[] = [...source];
    if (!deleted) records.push({
      key: "/registry/pods/default/volume-demo", type: "Pod", revision: 800 + index,
      action: index === 0 || index === 4 ? "created" : "updated",
      data: {
        apiVersion: "v1", kind: "Pod", metadata: { name: "volume-demo", namespace: "default", uid },
        spec: { ...(index > 0 ? { nodeName: node } : {}), volumes, containers: [
          { name: "writer", image: "busybox:1.37", volumeMounts: [{ name: "shared", mountPath: example.mountPath, readOnly: config }] },
          { name: "reader", image: "busybox:1.37", volumeMounts: [{ name: "shared", mountPath: "/shared", readOnly: true }] },
        ] },
        status: { phase: index === 0 ? "Pending" : "Running", conditions: [{ type: "Ready", status: index === 0 ? "False" : "True" }], containerStatuses: [{ name: "writer", restartCount: index === 2 ? 1 : 0 }, { name: "reader", restartCount: 0 }] },
      },
    });
    const podsState: PodInstance[] = !mounted ? [] : [{
      id: uid!, uid: uid!, name: "volume-demo", nodeId: index === 4 ? "worker-2" : "worker-1",
      status: "Ready", podPhase: "Running", learningStage: "Ready", containerState: "Running",
      ready: "2/2", restarts: index === 2 ? 1 : 0, age: "시뮬레이션", ip: index === 4 ? "10.244.2.40" : "10.244.1.40",
    }];
    return {
      id: `volume-${example.id}-${index}`, stepNumber: index + 1, title,
      subTitle: sourceState, description: descriptions[index], summary: descriptions[index],
      actor: index === 0 ? "사용자 / API Server" : index === 3 ? "사용자 / kubelet" : "kubelet / 컨테이너",
      action: descriptions[index], reason: "컨테이너·Pod·저장소의 수명을 구분하기 위해",
      result: `${uid ?? "Pod 없음"} · ${sourceState}`,
      k8sMechanism: `${example.note} volumes는 Pod 수준, volumeMounts는 컨테이너 수준입니다. 같은 volume name을 참조하면 경로가 달라도 같은 데이터를 봅니다. 파일 데이터는 etcd의 Pod 객체에 저장되지 않습니다. 이 예시는 정상 종료와 필요한 마운트 준비가 완료된 시점을 비교합니다.`,
      activeComponents: index === 0 ? ["developer", "apiserver"] : [index === 4 ? "kubelet-2" : "kubelet-1"],
      packets: [], podsState, etcdState: { revision: 800 + index, raftTerm: 3, records },
      cliLogs: index === 0 ? [{ command: "kubectl apply -f volume-demo.yaml", output: ["pod/volume-demo created", "ConfigMap·Secret / PVC 예시는 소스를 별도로 준비합니다."] }] : deleted ? [{ command: "kubectl delete pod volume-demo", output: ["pod/volume-demo deleted (정상 종료 완료)", sourceState] }] : [
        ...(!config && index === 1 ? [{ command: `kubectl exec volume-demo -c writer -- sh -c 'echo hello-volume > ${example.mountPath}/${example.file}'`, output: ["writer가 공유 볼륨에 파일을 작성했습니다."] }] : []),
        { command: `kubectl exec volume-demo -c reader -- cat /shared/${example.file}`, output: [empty && index === 4 ? "cat: /shared/note.txt: No such file or directory" : content] },
      ],
      volumeState: { mounted, content, sourceState, podUid: uid, node: index === 0 ? null : node },
    };
  });
}
