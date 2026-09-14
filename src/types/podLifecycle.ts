export type PodPhase = 
  | 'Pending'
  | 'SandboxCreating'
  | 'InitRunning'
  | 'ContainerCreating'
  | 'Running'
  | 'Terminating'
  | 'Terminated';

export type ProbeStatus = 'idle' | 'checking' | 'success' | 'failed';

export interface PodLifecycleStep {
  stepNumber: number;
  phase: PodPhase;
  title: string;
  subTitle: string;
  description: string;
  deepDive: string;
  linuxKernelDetails: {
    namespaces: { name: string; status: string; desc: string }[];
    cgroups: { resource: string; value: string; file: string }[];
  };
  probes: {
    startup: ProbeStatus;
    readiness: ProbeStatus;
    liveness: ProbeStatus;
  };
  containers: {
    pause: { status: 'none' | 'running'; ip?: string };
    init: { name: string; status: 'waiting' | 'running' | 'completed' | 'failed' }[];
    main: { name: string; status: 'waiting' | 'pulling' | 'running' | 'terminating' | 'stopped'; image: string };
  };
  volumeStatus: { name: string; type: string; mounted: boolean };
  terminalLogs: string[];
  describeOutput: string[];
}
