import { ResourceStatusCondition } from './common-types';
import { K8sResourceCommon } from './k8s';

export type ResourceRequirements = {
  requests?: {
    memory: string;
    cpu: string;
  };
  limits?: {
    memory: string;
    cpu: string;
  };
};

export type ComponentSource = {
  git?: {
    url: string;
    devfileUrl?: string;
    dockerfileUrl?: string;
    revision?: string;
    context?: string;
  };
};

export enum NudgeStats {
  NUDGES = 'build-nudges-ref',
  NUDGED_BY = 'build-nudged-by',
}

export type ComponentSpecs = {
  componentName: string;
  application: string;
  secret?: string;
  source?: ComponentSource;
  containerImage?: string;
  resources?: ResourceRequirements;
  replicas?: number;
  releaseStrategies?: string[];
  targetPort?: number;
  route?: string;
  [NudgeStats.NUDGES]?: string[];
  env?: {
    name: string;
    value: string;
  }[];
};

export type ComponentKind = K8sResourceCommon & {
  spec: ComponentSpecs;
  status?: {
    containerImage?: string;
    conditions?: ResourceStatusCondition[];
    devfile?: string;
    gitops?: { repositoryURL?: string; branch?: string; context?: string; commitID?: string };
    webhook?: string;
    [NudgeStats.NUDGED_BY]?: string[];
  };
};
