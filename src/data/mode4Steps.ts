import { FlowchartNode, Mode4Step, EtcdRecord } from '../types/pipeline';

// ============================================================================
// MODE 4 FLOWCHART NODES (8-Step CSI Storage Provisioning Pipeline)
// ============================================================================
export const MODE4_FLOWCHART_NODES: FlowchartNode[] = [
  { id: 'm4-1-pvc', name: '1. [PVC] 요청 접수', subName: 'etcd 등록 & Pending', componentId: 'apiserver', type: 'client', status: 'pending' },
  { id: 'm4-2-pod-sched', name: '2. [Pod] 노드 배치', subName: 'Scheduler ➔ Worker-1', componentId: 'scheduler', type: 'control-plane', status: 'pending' },
  { id: 'm4-3-csi-detect', name: '3. [CSI] 프로비저너', subName: 'AZ 확인 & 볼륨 트리거', componentId: 'cloudControllerManager', type: 'control-plane', status: 'pending' },
  { id: 'm4-4-aws-create', name: '4. [AWS] EBS 볼륨 생성', subName: 'API 호출 ➔ PV Bound', componentId: 'awsCloud', type: 'control-plane', status: 'pending' },
  { id: 'm4-5-csi-attach', name: '5. [Attach] 노드 연결', subName: 'VolumeAttachment', componentId: 'awsCloud', type: 'control-plane', status: 'pending' },
  { id: 'm4-6-format-mount', name: '6. [Mount] 포맷 & 마운트', subName: 'mkfs.ext4 & Bind', componentId: 'kubelet-1', type: 'worker', status: 'pending' },
  { id: 'm4-7-container-run', name: '7. [Run] DB 컨테이너', subName: 'MySQL /var/lib/mysql', componentId: 'runtime-1', type: 'worker', status: 'pending' },
  { id: 'm4-8-data-persist', name: '8. [Persist] 영속성 검증', subName: '재시작 시 데이터 보존', componentId: 'awsCloud', type: 'control-plane', status: 'pending' }
];

// ============================================================================
// BASE ETCD RECORDS FOR CUMULATIVE PERSISTENCE
// ============================================================================
const BASE_SC_RECORD: EtcdRecord = {
  key: '/registry/storageclasses/ebs-gp3-sc',
  type: 'StorageClass',
  action: 'unchanged',
  revision: 101,
  data: {
    apiVersion: 'storage.k8s.io/v1',
    kind: 'StorageClass',
    metadata: { name: 'ebs-gp3-sc' },
    provisioner: 'ebs.csi.aws.com',
    volumeBindingMode: 'WaitForFirstConsumer',
    parameters: {
      type: 'gp3',
      iops: '3000',
      throughput: '125',
      encrypted: 'true'
    },
    allowVolumeExpansion: true
  }
};

const BASE_PVC_RECORD: EtcdRecord = {
  key: '/registry/persistentvolumeclaims/default/mysql-data-pvc',
  type: 'PersistentVolumeClaim',
  action: 'unchanged',
  revision: 102,
  data: {
    apiVersion: 'v1',
    kind: 'PersistentVolumeClaim',
    metadata: { name: 'mysql-data-pvc', namespace: 'default' },
    spec: {
      accessModes: ['ReadWriteOnce'],
      storageClassName: 'ebs-gp3-sc',
      resources: { requests: { storage: '20Gi' } }
    },
    status: {
      phase: 'Pending'
    }
  }
};

const BASE_DEPLOY_RECORD: EtcdRecord = {
  key: '/registry/deployments/default/mysql-db',
  type: 'Deployment',
  action: 'unchanged',
  revision: 105,
  data: {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: { name: 'mysql-db', namespace: 'default' },
    spec: {
      replicas: 1,
      template: {
        spec: {
          containers: [{ name: 'mysql', image: 'mysql:8.0', volumeMounts: [{ name: 'db-vol', mountPath: '/var/lib/mysql' }] }],
          volumes: [{ name: 'db-vol', persistentVolumeClaim: { claimName: 'mysql-data-pvc' } }]
        }
      }
    }
  }
};

const BASE_PV_RECORD: EtcdRecord = {
  key: '/registry/persistentvolumes/pvc-7d8a9b0c-1234-5678-abcd',
  type: 'PersistentVolume',
  action: 'unchanged',
  revision: 110,
  data: {
    apiVersion: 'v1',
    kind: 'PersistentVolume',
    metadata: { name: 'pvc-7d8a9b0c-1234-5678-abcd' },
    spec: {
      capacity: { storage: '20Gi' },
      accessModes: ['ReadWriteOnce'],
      claimRef: { name: 'mysql-data-pvc', namespace: 'default' },
      csi: {
        driver: 'ebs.csi.aws.com',
        volumeHandle: 'vol-0a91f4b2',
        fsType: 'ext4'
      },
      nodeAffinity: {
        required: {
          nodeSelectorTerms: [{ matchExpressions: [{ key: 'topology.ebs.csi.aws.com/zone', operator: 'In', values: ['us-east-1a'] }] }]
        }
      }
    },
    status: { phase: 'Bound' }
  }
};

const BASE_ATTACH_RECORD: EtcdRecord = {
  key: '/registry/volumeattachments/csi-vol-0a91f4b2-worker-1',
  type: 'VolumeAttachment',
  action: 'unchanged',
  revision: 114,
  data: {
    apiVersion: 'storage.k8s.io/v1',
    kind: 'VolumeAttachment',
    metadata: { name: 'csi-vol-0a91f4b2-worker-1' },
    spec: {
      attacher: 'ebs.csi.aws.com',
      nodeName: 'worker-1',
      source: { persistentVolumeName: 'pvc-7d8a9b0c-1234-5678-abcd' }
    },
    status: {
      attached: true,
      attachmentMetadata: { devicePath: '/dev/nvme1n1' }
    }
  }
};

const BASE_POD_RECORD: EtcdRecord = {
  key: '/registry/pods/default/mysql-db-689f4b-x9z2l',
  type: 'Pod',
  action: 'unchanged',
  revision: 120,
  data: {
    metadata: { name: 'mysql-db-689f4b-x9z2l', namespace: 'default', labels: { app: 'mysql-db' } },
    spec: {
      nodeName: 'worker-1',
      containers: [{ name: 'mysql', image: 'mysql:8.0' }],
      volumes: [{ name: 'db-vol', persistentVolumeClaim: { claimName: 'mysql-data-pvc' } }]
    },
    status: { phase: 'Running', podIP: '10.244.1.42', conditions: [{ type: 'Ready', status: 'True' }] }
  }
};

// ============================================================================
// MODE 4 STEPS (8-Step Orchestration Journey)
// ============================================================================
export const MODE4_STEPS: Mode4Step[] = [
  // --------------------------------------------------------------------------
  // STEP 1: PVC Creation & etcd Registration (Pending - WaitForFirstConsumer)
  // --------------------------------------------------------------------------
  {
    stepNumber: 1,
    title: 'PVC 요청 접수 & etcd 등록 (Pending 대기)',
    subTitle: 'kubectl apply -f pvc.yaml ➔ WaitForFirstConsumer 정책에 따른 볼륨 생성 지연',
    phase: 'pvc-request',
    targetYaml: 'pvc',
    activeNodeId: 'm4-1-pvc',
    activeComponents: ['developer', 'apiserver', 'etcd'],
    packets: [
      { from: 'developer', to: 'apiserver', label: 'HTTP POST /api/v1/namespaces/default/persistentvolumeclaims', method: 'REST Post', color: '#60A5FA' },
      { from: 'apiserver', to: 'etcd', label: 'Store PVC (Status: Pending)', method: 'gRPC Put', color: '#06B6D4' }
    ],
    description: '개발자가 20Gi 스토리지를 요청하는 `mysql-data-pvc` 매니페스트를 적용합니다. API Server가 요청을 검증하고 etcd에 등록합니다. StorageClass에 `volumeBindingMode: WaitForFirstConsumer`가 설정되어 있으므로, 볼륨을 지금 즉시 생성하지 않고 파드가 어느 노드에 스케줄링될지 결정될 때까지 대기(Pending)합니다.',
    k8sMechanism: '클라우드 환경에서는 AZ(가용영역, 예: us-east-1a)마다 EBS 볼륨이 분리되어 있습니다. 파드가 아직 어느 노드에 뜰지 모르는 상태에서 볼륨을 미리 만들면, 다른 AZ 노드에 파드가 배치될 경우 볼륨 마운트가 영구 실패할 수 있습니다. 이를 방지하는 핵심 K8s 기법이 바로 WaitForFirstConsumer입니다.',
    cliLogs: [
      {
        command: 'kubectl apply -f pvc.yaml',
        output: [
          'persistentvolumeclaim/mysql-data-pvc created'
        ]
      },
      {
        command: 'kubectl get pvc mysql-data-pvc',
        output: [
          'NAME             STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE',
          'mysql-data-pvc   Pending                                      ebs-gp3-sc     2s'
        ]
      },
      {
        command: 'kubectl describe pvc mysql-data-pvc',
        output: [
          'Events:',
          '  Type    Reason                Age   From                         Message',
          '  ----    ------                ----  ----                         -------',
          '  Normal  WaitForFirstConsumer  2s    persistentvolume-controller  waiting for first consumer to be created before binding'
        ]
      }
    ],
    podsState: [],
    highlightYamlLines: [1, 2, 7, 8, 9, 10, 11, 12],
    etcdState: {
      revision: 102,
      raftTerm: 3,
      records: [
        BASE_SC_RECORD,
        {
          ...BASE_PVC_RECORD,
          action: 'created',
          highlightFields: ['metadata.name', 'spec.resources.requests.storage', 'status.phase']
        }
      ]
    },
    awsEbsState: {
      volumeId: '미생성',
      size: '20 GiB (요청됨)',
      type: 'gp3',
      status: 'creating'
    }
  },

  // --------------------------------------------------------------------------
  // STEP 2: Pod Deployment & Scheduler Node Binding
  // --------------------------------------------------------------------------
  {
    stepNumber: 2,
    title: 'Pod 배포 & 스케줄러의 노드 선정 (Node Binding)',
    subTitle: 'kube-scheduler가 스토리지 가용영역과 자원을 분석하여 Worker Node 1로 확정',
    phase: 'scheduling',
    targetYaml: 'deployment',
    activeNodeId: 'm4-2-pod-sched',
    activeComponents: ['developer', 'apiserver', 'scheduler', 'etcd'],
    packets: [
      { from: 'developer', to: 'apiserver', label: 'HTTP POST /apis/apps/v1/namespaces/default/deployments (mysql-db)', method: 'REST Post', color: '#60A5FA' },
      { from: 'apiserver', to: 'scheduler', label: 'Watch Pod Scheduled (mysql-data-pvc 참조 확인)', method: 'Watch Event', color: '#A855F7' },
      { from: 'scheduler', to: 'apiserver', label: 'Bind Pod ➔ worker-1 (Zone: us-east-1a)', method: 'Binding Post', color: '#C084FC' },
      { from: 'apiserver', to: 'etcd', label: 'Update Pod spec.nodeName: worker-1', method: 'gRPC Put', color: '#06B6D4' }
    ],
    description: '개발자가 `mysql-db` Deployment를 배포합니다. `kube-scheduler`는 파드가 PVC `mysql-data-pvc`를 참조하고 있음을 확인하고, 클러스터 노드 중 EBS 프로비저닝이 가능한 가용영역(AZ: `us-east-1a`)에 위치한 `Worker Node 1`을 최종 선정하여 파드를 바인딩합니다.',
    k8sMechanism: '스케줄러의 VolumeZonePredicate/NodeVolumeLimits 플러그인이 작동합니다. 워커 노드 1에 장착 가능한 최대 볼륨 수(AWS EC2 인스턴스당 EBS 연결 한계: 통상 28개)를 검사하고, 파드의 spec.nodeName 필드를 worker-1로 갱신하여 볼륨 프로비저너에게 위치를 알립니다.',
    cliLogs: [
      {
        command: 'kubectl apply -f mysql-deployment.yaml',
        output: [
          'deployment.apps/mysql-db created'
        ]
      },
      {
        command: 'kubectl get pods -o wide',
        output: [
          'NAME                        READY   STATUS    RESTARTS   AGE   IP       NODE       NOMINATED NODE',
          'mysql-db-689f4b-x9z2l       0/1     Pending   0          3s    <none>   worker-1   <none>'
        ]
      }
    ],
    podsState: [
      { id: 'pod-mysql', name: 'mysql-db-689f4b-x9z2l', nodeId: 'worker-1', status: 'Pending', ready: '0/1', restarts: 0, age: '3s', ip: '-' }
    ],
    highlightYamlLines: [15, 16, 26, 27, 28, 29, 30, 31, 32],
    etcdState: {
      revision: 106,
      raftTerm: 3,
      records: [
        BASE_SC_RECORD,
        BASE_PVC_RECORD,
        {
          ...BASE_DEPLOY_RECORD,
          action: 'created',
          highlightFields: ['metadata.name', 'spec.template.spec.volumes']
        },
        {
          key: '/registry/pods/default/mysql-db-689f4b-x9z2l',
          type: 'Pod',
          action: 'created',
          revision: 106,
          highlightFields: ['spec.nodeName', 'status.phase'],
          data: {
            metadata: { name: 'mysql-db-689f4b-x9z2l', namespace: 'default' },
            spec: { nodeName: 'worker-1', volumes: [{ name: 'db-vol', persistentVolumeClaim: { claimName: 'mysql-data-pvc' } }] },
            status: { phase: 'Pending' }
          }
        }
      ]
    },
    awsEbsState: {
      volumeId: '미생성',
      size: '20 GiB',
      type: 'gp3',
      status: 'creating',
      attachedNode: 'worker-1 (스케줄링 완료)'
    }
  },

  // --------------------------------------------------------------------------
  // STEP 3: CSI External Provisioner Detects & Triggers Volume Provisioning
  // --------------------------------------------------------------------------
  {
    stepNumber: 3,
    title: 'CSI Provisioner 감지 & 스토리지 생성 트리거',
    subTitle: 'ebs.csi.aws.com 컨트롤러가 Pod의 위치(us-east-1a)를 감지하고 AWS API 호출 준비',
    phase: 'aws-provision',
    targetYaml: 'storageclass',
    activeNodeId: 'm4-3-csi-detect',
    activeComponents: ['apiserver', 'cloudControllerManager', 'etcd'],
    packets: [
      { from: 'apiserver', to: 'cloudControllerManager', label: 'Watch Event: Pod Scheduled to worker-1 ➔ Trigger Provisioning', method: 'CSI Watch', color: '#0284C7' },
      { from: 'cloudControllerManager', to: 'apiserver', label: 'CSI Claim Validation: ebs-gp3-sc (AZ: us-east-1a, 20Gi)', method: 'CSI Reconcile', color: '#38BDF8' }
    ],
    description: '쿠버네티스 컨트롤 플레인에 상주하는 AWS EBS CSI Controller(`ebs.csi.aws.com`)의 `csi-provisioner` 사이드카 컨테이너가 파드가 `worker-1`에 스케줄링된 것을 감지합니다. StorageClass 파라미터(gp3, 3000 IOPS, 125 MB/s, 암호화)를 취합하여 AWS EC2 API 호출 페이로드를 생성합니다.',
    k8sMechanism: 'CSI Provisioner는 Pod의 nodeAffinity와 워커 노드 1의 토폴로지 레이블(`topology.ebs.csi.aws.com/zone=us-east-1a`)을 읽어와서 볼륨이 동일한 물리적 데이터센터 랙에 생성되도록 확정합니다.',
    cliLogs: [
      {
        command: 'kubectl describe pvc mysql-data-pvc',
        output: [
          'Events:',
          '  Type    Reason                 Age   From                                                                           Message',
          '  ----    ------                 ----  ----                                                                           -------',
          '  Normal  WaitForFirstConsumer   12s   persistentvolume-controller                                                    waiting for first consumer to be created before binding',
          '  Normal  Provisioning           1s    ebs.csi.aws.com_ebs-csi-controller_78dfbc97                                    External provisioner is provisioning volume for claim "default/mysql-data-pvc"'
        ]
      }
    ],
    podsState: [
      { id: 'pod-mysql', name: 'mysql-db-689f4b-x9z2l', nodeId: 'worker-1', status: 'Pending', ready: '0/1', restarts: 0, age: '12s', ip: '-' }
    ],
    highlightYamlLines: [1, 4, 5, 7, 8, 9, 10, 11],
    etcdState: {
      revision: 107,
      raftTerm: 3,
      records: [
        BASE_SC_RECORD,
        BASE_PVC_RECORD,
        BASE_DEPLOY_RECORD,
        {
          key: '/registry/pods/default/mysql-db-689f4b-x9z2l',
          type: 'Pod',
          action: 'unchanged',
          revision: 106,
          data: {
            metadata: { name: 'mysql-db-689f4b-x9z2l', namespace: 'default' },
            spec: { nodeName: 'worker-1' },
            status: { phase: 'Pending' }
          }
        }
      ]
    },
    awsEbsState: {
      volumeId: 'API 호출 준비 중...',
      size: '20 GiB',
      type: 'gp3',
      status: 'creating',
      attachedNode: 'worker-1 (AZ: us-east-1a)'
    }
  },

  // --------------------------------------------------------------------------
  // STEP 4: AWS API ec2:CreateVolume ➔ EBS Volume Created & PV Bound
  // --------------------------------------------------------------------------
  {
    stepNumber: 4,
    title: '외부 AWS API 호출 & EBS 실물 생성 ➔ PV 생성 및 Bound',
    subTitle: 'AWS 클라우드에 vol-0a91f4b2 생성 ➔ etcd에 PV 등록 및 PVC 상태가 Bound로 전이',
    phase: 'aws-provision',
    targetYaml: 'pvc',
    activeNodeId: 'm4-4-aws-create',
    activeComponents: ['cloudControllerManager', 'awsCloud', 'apiserver', 'etcd'],
    packets: [
      { from: 'cloudControllerManager', to: 'awsCloud', label: 'AWS SDK ec2:CreateVolume (Size: 20Gi, Type: gp3, AZ: us-east-1a)', method: 'HTTPS API', color: '#F59E0B' },
      { from: 'awsCloud', to: 'cloudControllerManager', label: '200 OK: VolumeCreated (vol-0a91f4b2, Status: available)', method: 'HTTPS Response', color: '#10B981' },
      { from: 'cloudControllerManager', to: 'apiserver', label: 'Create PersistentVolume (pvc-7d8a9b0c, volumeHandle: vol-0a91f4b2)', method: 'REST Post', color: '#0284C7' },
      { from: 'apiserver', to: 'etcd', label: 'Store PV & Update PVC ➔ Status: Bound', method: 'gRPC Put', color: '#06B6D4' }
    ],
    description: 'CSI 컨트롤러가 AWS 엔드포인트(`ec2.us-east-1.amazonaws.com`)로 `ec2:CreateVolume` HTTPS API를 호출합니다. AWS 데이터센터 SAN 스토리지에 실제 20Gi gp3 볼륨(`vol-0a91f4b2`)이 초고속 생성됩니다. 이후 API Server에 `PersistentVolume (PV)` 오브젝트가 등록되고, `mysql-data-pvc`의 상태가 비로소 `Bound`로 승격됩니다.',
    k8sMechanism: '쿠버네티스의 1:1 양방향 바인딩(Bi-directional Binding)이 완성됩니다. PV의 spec.claimRef는 mysql-data-pvc를 가리키고, PVC의 spec.volumeName은 pvc-7d8a9b0c를 가리킵니다. 이제 이 볼륨은 다른 어떤 Pod나 PVC도 가로챌 수 없도록 격리 바인딩됩니다.',
    cliLogs: [
      {
        command: 'aws ec2 describe-volumes --volume-ids vol-0a91f4b2 --region us-east-1',
        output: [
          '{',
          '  "Volumes": [{',
          '    "VolumeId": "vol-0a91f4b2",',
          '    "Size": 20,',
          '    "VolumeType": "gp3",',
          '    "State": "available",',
          '    "AvailabilityZone": "us-east-1a",',
          '    "Iops": 3000,',
          '    "Throughput": 125,',
          '    "Encrypted": true',
          '  }]',
          '}'
        ]
      },
      {
        command: 'kubectl get pvc,pv',
        output: [
          'NAME                                   STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE',
          'persistentvolumeclaim/mysql-data-pvc   Bound    pvc-7d8a9b0c-1234-5678-abcd                20Gi       RWO            ebs-gp3-sc     25s',
          '',
          'NAME                                                        CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                    STORAGECLASS',
          'persistentvolume/pvc-7d8a9b0c-1234-5678-abcd                20Gi       RWO            Delete           Bound    default/mysql-data-pvc   ebs-gp3-sc'
        ]
      }
    ],
    podsState: [
      { id: 'pod-mysql', name: 'mysql-db-689f4b-x9z2l', nodeId: 'worker-1', status: 'Pending', ready: '0/1', restarts: 0, age: '25s', ip: '-' }
    ],
    highlightYamlLines: [1, 2, 7, 8, 9, 10, 11, 12],
    etcdState: {
      revision: 110,
      raftTerm: 3,
      records: [
        BASE_SC_RECORD,
        {
          ...BASE_PVC_RECORD,
          action: 'updated',
          highlightFields: ['spec.volumeName', 'status.phase'],
          data: {
            ...BASE_PVC_RECORD.data,
            spec: { ...BASE_PVC_RECORD.data.spec, volumeName: 'pvc-7d8a9b0c-1234-5678-abcd' },
            status: { phase: 'Bound' }
          }
        },
        BASE_DEPLOY_RECORD,
        {
          ...BASE_PV_RECORD,
          action: 'created',
          highlightFields: ['metadata.name', 'spec.csi.volumeHandle', 'status.phase']
        }
      ]
    },
    awsEbsState: {
      volumeId: 'vol-0a91f4b2',
      size: '20 GiB',
      type: 'gp3',
      status: 'available',
      attachedNode: '클라우드 생성 완료 (미연결)'
    }
  },

  // --------------------------------------------------------------------------
  // STEP 5: VolumeAttachment & AWS ec2:AttachVolume (Node Attachment)
  // --------------------------------------------------------------------------
  {
    stepNumber: 5,
    title: 'AWS EC2 인스턴스에 EBS 하드웨어 Attach (VolumeAttachment)',
    subTitle: 'K8s Attach/Detach Controller ➔ AWS ec2:AttachVolume ➔ /dev/nvme1n1 블록 디바이스 연결',
    phase: 'node-attach',
    targetYaml: 'deployment',
    activeNodeId: 'm4-5-csi-attach',
    activeComponents: ['cloudControllerManager', 'awsCloud', 'kubelet-1', 'etcd'],
    packets: [
      { from: 'cloudControllerManager', to: 'awsCloud', label: 'AWS SDK ec2:AttachVolume (vol-0a91f4b2 ➔ i-worker-1)', method: 'HTTPS API', color: '#F59E0B' },
      { from: 'awsCloud', to: 'kubelet-1', label: 'Hardware Bus Attach: Virtual Block Device (/dev/nvme1n1)', method: 'PCIe Hotplug', color: '#10B981' },
      { from: 'cloudControllerManager', to: 'etcd', label: 'Create VolumeAttachment (Status: Attached=True)', method: 'gRPC Put', color: '#06B6D4' }
    ],
    description: '`kube-controller-manager`의 Attach/Detach Controller 및 `csi-attacher`가 작동하여, AWS API(`ec2:AttachVolume`)를 호출해 볼륨을 `Worker Node 1`(EC2 인스턴스: `i-09f18a2bc81`)에 가상 디바이스로 핫플러그(Hotplug) 연결합니다. etcd에 `VolumeAttachment` 오브젝트가 등록됩니다.',
    k8sMechanism: '이 단계는 K8s 워커 노드 운영체제 레벨에서 PCI/NVMe 버스를 통해 디스크가 꽂히는 단계입니다. 리눅스 udev 커널 서브시스템이 새 하드웨어를 인식하고 호스트의 /dev/nvme1n1(또는 /dev/xvdf) 블록 디바이스 노드를 생성합니다.',
    cliLogs: [
      {
        command: 'kubectl get volumeattachments',
        output: [
          'NAME                                                                 ATTACHER          PV                            NODE       ATTACHED   AGE',
          'csi-vol-0a91f4b2-worker-1                                            ebs.csi.aws.com   pvc-7d8a9b0c-1234-5678-abcd   worker-1   true       6s'
        ]
      },
      {
        command: 'ssh worker-1 "lsblk"',
        output: [
          'NAME        MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS',
          'nvme0n1     259:0    0   50G  0 disk (Root OS)',
          '├─nvme0n1p1 259:1    0   50G  0 part /',
          'nvme1n1     259:2    0   20G  0 disk  <-- [HOTPLUG ATTACHED FROM AWS EBS!]'
        ]
      }
    ],
    podsState: [
      { id: 'pod-mysql', name: 'mysql-db-689f4b-x9z2l', nodeId: 'worker-1', status: 'ContainerCreating', ready: '0/1', restarts: 0, age: '35s', ip: '-' }
    ],
    highlightYamlLines: [26, 27, 28, 29, 30, 31, 32],
    etcdState: {
      revision: 114,
      raftTerm: 3,
      records: [
        BASE_SC_RECORD,
        BASE_PVC_RECORD,
        BASE_DEPLOY_RECORD,
        BASE_PV_RECORD,
        {
          ...BASE_ATTACH_RECORD,
          action: 'created',
          highlightFields: ['metadata.name', 'spec.nodeName', 'status.attached']
        }
      ]
    },
    awsEbsState: {
      volumeId: 'vol-0a91f4b2',
      size: '20 GiB',
      type: 'gp3',
      status: 'attached',
      attachedNode: 'worker-1 (i-09f18a2bc81)',
      devicePath: '/dev/nvme1n1'
    }
  },

  // --------------------------------------------------------------------------
  // STEP 6: Kubelet VolumeManager Format & Mount (NodeStage & NodePublish)
  // --------------------------------------------------------------------------
  {
    stepNumber: 6,
    title: 'Kubelet VolumeManager 포맷 & 마운트 (NodeStage & NodePublish)',
    subTitle: '디스크 포맷(mkfs.ext4) ➔ 글로벌 스테이지 마운트 ➔ Pod 고유 볼륨 디렉터리 바인드',
    phase: 'kubelet-mount',
    targetYaml: 'deployment',
    activeNodeId: 'm4-6-format-mount',
    activeComponents: ['kubelet-1', 'runtime-1'],
    packets: [
      { from: 'kubelet-1', to: 'runtime-1', label: 'gRPC NodeStageVolume: Format mkfs.ext4 /dev/nvme1n1', method: 'CSI gRPC', color: '#10B981' },
      { from: 'runtime-1', to: 'kubelet-1', label: 'gRPC NodePublishVolume: Bind Mount /var/lib/kubelet/pods/.../volumes', method: 'CSI gRPC', color: '#34D399' }
    ],
    description: '`Worker Node 1`의 `kubelet VolumeManager`와 데몬셋으로 구동 중인 `aws-ebs-csi-node`가 협업합니다. 신규 연결된 디바이스(`/dev/nvme1n1`)에 파일시스템이 없는 것을 확인하고 `mkfs.ext4`로 포맷한 뒤, 글로벌 스테이징 경로(`/var/lib/kubelet/plugins/kubernetes.io/csi/...`)를 거쳐 파드 전용 마운트 경로로 바인드 마운트합니다.',
    k8sMechanism: 'CSI 2단계 노드 마운트 표준: 1) NodeStageVolume: 디바이스를 특정 노드 전역 디렉터리에 ext4/xfs로 최초 포맷 및 마운트. 2) NodePublishVolume: 파드마다 격리된 /var/lib/kubelet/pods/<pod-uid>/volumes/kubernetes.io~csi/<pv-name>/mount 디렉터리로 리눅스 bind mount를 실행합니다.',
    cliLogs: [
      {
        command: 'ssh worker-1 "dmesg | tail -n 5"',
        output: [
          '[   42.102] nvme nvme1: pci function 0000:00:1f.0',
          '[   42.105] nvme1n1: nvme1: Amazon Elastic Block Store (vol0a91f4b2)',
          '[   43.210] EXT4-fs (nvme1n1): mounted filesystem with ordered data mode. Quota mode: none.'
        ]
      },
      {
        command: 'ssh worker-1 "findmnt /dev/nvme1n1"',
        output: [
          'TARGET                                                                              SOURCE      FSTYPE OPTIONS',
          '/var/lib/kubelet/plugins/kubernetes.io/csi/ebs.csi.aws.com/.../globalmount          /dev/nvme1n1 ext4   rw,relatime',
          '└─/var/lib/kubelet/pods/b23a-4c/volumes/kubernetes.io~csi/pvc-7d8a9b0c/mount        /dev/nvme1n1 ext4   rw,relatime'
        ]
      }
    ],
    podsState: [
      { id: 'pod-mysql', name: 'mysql-db-689f4b-x9z2l', nodeId: 'worker-1', status: 'ContainerCreating', ready: '0/1', restarts: 0, age: '45s', ip: '10.244.1.42' }
    ],
    highlightYamlLines: [22, 23, 24, 25, 26],
    etcdState: {
      revision: 116,
      raftTerm: 3,
      records: [
        BASE_SC_RECORD,
        BASE_PVC_RECORD,
        BASE_DEPLOY_RECORD,
        BASE_PV_RECORD,
        BASE_ATTACH_RECORD,
        {
          key: '/registry/pods/default/mysql-db-689f4b-x9z2l',
          type: 'Pod',
          action: 'updated',
          revision: 116,
          highlightFields: ['status.phase', 'status.podIP'],
          data: {
            metadata: { name: 'mysql-db-689f4b-x9z2l', namespace: 'default' },
            spec: { nodeName: 'worker-1' },
            status: { phase: 'Pending', podIP: '10.244.1.42' }
          }
        }
      ]
    },
    awsEbsState: {
      volumeId: 'vol-0a91f4b2',
      size: '20 GiB',
      type: 'gp3',
      status: 'attached',
      attachedNode: 'worker-1 (/dev/nvme1n1 ➔ ext4 마운트 완료)',
      devicePath: '/dev/nvme1n1'
    }
  },

  // --------------------------------------------------------------------------
  // STEP 7: Container Starts & MySQL Database Ready
  // --------------------------------------------------------------------------
  {
    stepNumber: 7,
    title: '컨테이너 실행 & MySQL 데이터베이스 정상 가동 (Running & Ready)',
    subTitle: '컨테이너 내부 /var/lib/mysql 디렉터리로 볼륨 연결 ➔ MySQL 데이터 I/O 개시',
    phase: 'kubelet-mount',
    targetYaml: 'deployment',
    activeNodeId: 'm4-7-container-run',
    activeComponents: ['runtime-1', 'objects-1', 'kubelet-1', 'apiserver', 'etcd'],
    packets: [
      { from: 'runtime-1', to: 'objects-1', label: 'CRI RunContainer: mount /var/lib/mysql ➔ PID namespace', method: 'Linux Namespace', color: '#10B981' },
      { from: 'kubelet-1', to: 'apiserver', label: 'Report Pod Status: Running & Ready (1/1)', method: 'Heartbeat Patch', color: '#60A5FA' },
      { from: 'apiserver', to: 'etcd', label: 'Update Pod Status ➔ Ready=True', method: 'gRPC Put', color: '#06B6D4' }
    ],
    description: '컨테이너 런타임(containerd)이 MySQL 8.0 컨테이너를 기동하며, 호스트의 마운트 포인트를 컨테이너 내부 `/var/lib/mysql`에 바인드 주입합니다. MySQL 서버 데몬(mysqld)이 기동되어 InnoDB 테이블스페이스(ibdata1)와 리두 로그를 영구 EBS 볼륨에 기록하기 시작하며 파드가 `Running` 및 `Ready: 1/1` 상태가 됩니다.',
    k8sMechanism: '리눅스 마운트 네임스페이스(Mount Namespace) 격리 원리를 통해 컨테이너 내부 프로세스는 오직 자신에게 허용된 /var/lib/mysql 디렉터리만을 보지만, 실제 물리적 I/O는 AWS 데이터센터의 EBS gp3 SAN 컨트롤러로 직접 전송됩니다.',
    cliLogs: [
      {
        command: 'kubectl get pods mysql-db-689f4b-x9z2l',
        output: [
          'NAME                    READY   STATUS    RESTARTS   AGE',
          'mysql-db-689f4b-x9z2l   1/1     Running   0          55s'
        ]
      },
      {
        command: 'kubectl exec -it mysql-db-689f4b-x9z2l -- df -h /var/lib/mysql',
        output: [
          'Filesystem      Size  Used Avail Use% Mounted on',
          '/dev/nvme1n1     20G  180M   19G   1% /var/lib/mysql  <-- [AWS EBS gp3 20Gi 정상 마운트 확인!]'
        ]
      },
      {
        command: 'kubectl logs mysql-db-689f4b-x9z2l | grep "ready for connections"',
        output: [
          '2026-09-14T05:15:32.410Z 0 [System] [MY-010931] [Server] /usr/sbin/mysqld: ready for connections. Version: \'8.0.36\'  port: 3306'
        ]
      }
    ],
    podsState: [
      { id: 'pod-mysql', name: 'mysql-db-689f4b-x9z2l', nodeId: 'worker-1', status: 'Running', ready: '1/1', restarts: 0, age: '55s', ip: '10.244.1.42' }
    ],
    highlightYamlLines: [15, 16, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32],
    etcdState: {
      revision: 120,
      raftTerm: 3,
      records: [
        BASE_SC_RECORD,
        BASE_PVC_RECORD,
        BASE_DEPLOY_RECORD,
        BASE_PV_RECORD,
        BASE_ATTACH_RECORD,
        {
          ...BASE_POD_RECORD,
          action: 'updated',
          highlightFields: ['status.phase', 'status.conditions']
        }
      ]
    },
    awsEbsState: {
      volumeId: 'vol-0a91f4b2',
      size: '20 GiB',
      type: 'gp3',
      status: 'attached',
      attachedNode: 'worker-1 (MySQL 활성 I/O 실행 중)',
      devicePath: '/dev/nvme1n1'
    }
  },

  // --------------------------------------------------------------------------
  // STEP 8: Pod Restart & Data Persistence Verification
  // --------------------------------------------------------------------------
  {
    stepNumber: 8,
    title: '데이터 영속성 검증 (Pod 재시작 시 AWS EBS 데이터 100% 보존)',
    subTitle: 'Pod 삭제/재스케줄링 시에도 etcd의 PV/PVC 매핑을 통해 AWS EBS 볼륨과 기존 데이터 무손실 재연결',
    phase: 'verified',
    targetYaml: 'all',
    activeNodeId: 'm4-8-data-persist',
    activeComponents: ['awsCloud', 'apiserver', 'etcd', 'kubelet-1', 'runtime-1'],
    packets: [
      { from: 'apiserver', to: 'etcd', label: 'PV State: Retained (pvc-7d8a9b0c is Bound to mysql-data-pvc)', method: 'State Check', color: '#06B6D4' },
      { from: 'awsCloud', to: 'kubelet-1', label: 'EBS 영속성 유지: vol-0a91f4b2 (Pod 독립 보존)', method: 'Storage Independence', color: '#10B981' }
    ],
    description: '쿠버네티스 스토리지 오케스트레이션의 핵심인 `영속성(Data Persistence)`을 최종 검증합니다. 파드가 충돌하거나 노드가 재부팅되어도 etcd에 기록된 PV/PVC 바인딩 정보가 보존되므로, 새로 생성된 파드가 기존 AWS EBS 볼륨(`vol-0a91f4b2`)에 다시 연결되어 저장된 데이터(테이블, 레코드)를 단 1바이트도 잃지 않고 그대로 복구합니다.',
    k8sMechanism: '쿠버네티스 리클레임 정책(PersistentVolumeReclaimPolicy): 기본값인 Delete(또는 Retain) 정책에 따라 PVC가 삭제되기 전까지 PV와 AWS 실물 EBS 볼륨은 영구 유지됩니다. 파드(컴퓨팅)와 스토리지(데이터)가 완전히 분리(Decoupled)되어 영속성이 달성됩니다.',
    cliLogs: [
      {
        command: 'kubectl delete pod mysql-db-689f4b-x9z2l && kubectl get pods',
        output: [
          'pod "mysql-db-689f4b-x9z2l" deleted',
          'NAME                    READY   STATUS    RESTARTS   AGE',
          'mysql-db-689f4b-z7k1p   1/1     Running   0          12s  <-- [신규 파드가 기존 EBS 볼륨 즉시 재마운트!]'
        ]
      },
      {
        command: 'kubectl exec -it mysql-db-689f4b-z7k1p -- mysql -u root -e "SELECT * FROM my_service.orders LIMIT 1;"',
        output: [
          '+----------+---------------------+------------+--------+',
          '| order_id | customer_name       | amount     | status |',
          '+----------+---------------------+------------+--------+',
          '|    10852 | sk085               | 125000 KRW | PAID   |',
          '+----------+---------------------+------------+--------+',
          '1 row in set (0.01 sec)  <-- [기존 저장된 데이터 무손실 보존 입증 완료!]'
        ]
      }
    ],
    podsState: [
      { id: 'pod-mysql', name: 'mysql-db-689f4b-z7k1p', nodeId: 'worker-1', status: 'Running', ready: '1/1', restarts: 0, age: '12s', ip: '10.244.1.43' }
    ],
    highlightYamlLines: [1, 7, 8, 15, 26, 27, 28, 29, 30, 31, 32],
    etcdState: {
      revision: 125,
      raftTerm: 3,
      records: [
        BASE_SC_RECORD,
        BASE_PVC_RECORD,
        BASE_DEPLOY_RECORD,
        BASE_PV_RECORD,
        BASE_ATTACH_RECORD,
        {
          key: '/registry/pods/default/mysql-db-689f4b-z7k1p',
          type: 'Pod',
          action: 'created',
          revision: 125,
          highlightFields: ['metadata.name', 'status.phase', 'spec.volumes'],
          data: {
            metadata: { name: 'mysql-db-689f4b-z7k1p', namespace: 'default' },
            spec: { nodeName: 'worker-1', volumes: [{ name: 'db-vol', persistentVolumeClaim: { claimName: 'mysql-data-pvc' } }] },
            status: { phase: 'Running', podIP: '10.244.1.43' }
          }
        }
      ]
    },
    awsEbsState: {
      volumeId: 'vol-0a91f4b2',
      size: '20 GiB',
      type: 'gp3',
      status: 'attached',
      attachedNode: 'worker-1 (영속성 검증 통과 - 무손실 복구 완료)',
      devicePath: '/dev/nvme1n1'
    }
  }
];
