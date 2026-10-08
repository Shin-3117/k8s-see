export type K8sComponentId = 
  | 'developer'
  | 'apiserver'
  | 'etcd'
  | 'scheduler'
  | 'controllerManager'
  | 'cloudControllerManager'
  | 'csiController'
  | 'kubelet-1'
  | 'kubelet-2'
  | 'runtime-1'
  | 'runtime-2'
  | 'objects-1'
  | 'objects-2'
  | 'kube-proxy-1'
  | 'kube-proxy-2'
  | 'endusers'
  | 'awsCloud'
  | 'ingressController';

export type PodStatus = 'Pending' | 'ContainerCreating' | 'Running' | 'Ready' | 'Terminating' | 'Failed';

export interface PodInstance {
  id: string;
  name: string;
  nodeId: 'worker-1' | 'worker-2';
  status: PodStatus; // Learning display status, separate from official podPhase
  podPhase?: 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';
  learningStage?: string;
  uid?: string;
  containerState?: 'Waiting' | 'Running' | 'Terminated';
  ready: string; // e.g. "1/1"
  restarts: number;
  age: string;
  ip: string;
}

export interface PacketPath {
  from: K8sComponentId;
  to: K8sComponentId;
  label: string;
  method?: string; // e.g. "POST /apis/apps/v1/deployments", "Raft Propose", "Binding"
  color?: string;
  kind?: 'management' | 'traffic' | 'configuration';
}

export interface EtcdRecord {
  key: string;
  type:
    | 'Deployment'
    | 'StatefulSet'
    | 'Job'
    | 'CronJob'
    | 'ReplicaSet'
    | 'Pod'
    | 'EndpointSlice'
    | 'Service'
    | 'ConfigMap'
    | 'Secret'
    | 'StorageClass'
    | 'PersistentVolumeClaim'
    | 'PersistentVolume'
    | 'VolumeAttachment'
    | 'Ingress'
    | 'ClusterIssuer'
    | 'Certificate'
    | 'CertificateRequest'
    | 'Order'
    | 'Challenge'
    | 'IngressClass';
  action: 'created' | 'updated' | 'unchanged';
  revision: number;
  highlightFields?: string[];
  data: Record<string, any>;
}

export interface Mode1Step {
  stepNumber: number;
  title: string;
  subTitle: string;
  activeComponents: K8sComponentId[];
  packets: PacketPath[];
  description: string;
  k8sMechanism: string; // Behind the scenes deep dive
  cliLogs: {
    command: string;
    output: string[];
  }[];
  podsState: PodInstance[];
  highlightYamlLines?: number[];
  activeNodeId?: string;
  etcdState?: {
    revision: number;
    raftTerm: number;
    records: EtcdRecord[];
  };
}

export interface Mode4Step extends Mode1Step {
  phase: 'pvc-request' | 'scheduling' | 'aws-provision' | 'node-attach' | 'kubelet-mount' | 'verified';
  targetYaml: 'storageclass' | 'pvc' | 'deployment' | 'all';
  awsEbsState?: {
    volumeId: string;
    size: string;
    type: string;
    status: 'creating' | 'available' | 'attached';
    attachedNode?: string;
    devicePath?: string;
  };
}

export interface Mode5Step extends Mode1Step {
  phase:
    | 'ingress-create'
    | 'controller-watch'
    | 'dynamic-reload'
    | 'https-ingress'
    | 'path-routing-order'
    | 'path-routing-product'
    | 'client-response';
  targetYaml: 'ingress' | 'service-order' | 'service-product' | 'nginx-conf' | 'all';
  activeRoute?: {
    host: string;
    path: string;
    targetService: string;
    targetPodIp: string;
    targetNode: 'worker-1' | 'worker-2';
    statusCode: number;
  };
  ingressControllerState?: {
    status: 'syncing' | 'reloaded' | 'routing' | 'ready';
    reloadsCount: number;
    sslCert: string;
    activeConnections: number;
    upstreams: {
      name: string;
      service: string;
      backends: { ip: string; port: number; status: 'up' | 'draining' }[];
    }[];
  };
}

export interface FlowchartNode {
  id: string;
  name: string;
  subName: string;
  componentId: K8sComponentId | 'controller-bypassed';
  type: 'client' | 'control-plane' | 'worker' | 'bypassed';
  status: 'pending' | 'active' | 'completed' | 'skipped';
}

export type AppMode = 'mode1-manifest' | 'mode2-pod-lifecycle' | 'mode3-separated-apply' | 'mode4-pvc' | 'mode5-ingress';
