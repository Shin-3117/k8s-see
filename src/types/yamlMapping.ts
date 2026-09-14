import { K8sComponentId } from './pipeline';

export interface YamlLineImpact {
  startLine: number;
  endLine: number;
  keyword: string;
  title: string;
  affectedComponents: K8sComponentId[];
  summary: string;
  deepDive: string;
  kernelOrInternal: string;
  cliCommand?: string;
  nodeImpact?: {
    cpuPercent?: number;
    memPercent?: number;
    replicas?: number;
  };
}

export interface YamlPreset {
  id: string;
  name: string;
  description: string;
  content: string;
  impacts: YamlLineImpact[];
}
