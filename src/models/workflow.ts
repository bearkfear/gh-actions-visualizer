export interface WorkflowStep {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, any>;
  if?: string;
  env?: Record<string, string>;
  working_directory?: string;
  shell?: string;
  timeout_minutes?: number;
  continue_on_error?: boolean;
}

export interface WorkflowJob {
  name?: string;
  'runs-on'?: string;
  needs?: string | string[];
  if?: string;
  strategy?: {
    matrix?: Record<string, any[]>;
    'fail-fast'?: boolean;
    'max-parallel'?: number;
  };
  steps: WorkflowStep[];
  env?: Record<string, string>;
  timeout_minutes?: number;
  container?: any;
  services?: Record<string, any>;
}

export interface WorkflowTrigger {
  push?: any;
  pull_request?: any;
  schedule?: Array<{ cron: string }>;
  workflow_dispatch?: any;
  repository_dispatch?: any;
  release?: any;
  page_build?: any;
  watch?: any;
  gollum?: any;
  issues?: any;
  issue_comment?: any;
  discussion?: any;
  discussion_comment?: any;
  fork?: any;
  create?: any;
  delete?: any;
  deployment?: any;
  deployment_status?: any;
  public?: any;
  merge_group?: any;
  pull_request_target?: any;
  workflow_call?: any;
}

export interface Workflow {
  name: string;
  on: WorkflowTrigger;
  jobs: Record<string, WorkflowJob>;
  env?: Record<string, string>;
  defaults?: {
    run?: {
      shell?: string;
      'working-directory'?: string;
    };
  };
  permissions?: Record<string, string>;
  concurrency?: any;
}

export interface JobDependency {
  jobName: string;
  dependsOn: string[];
  hasConditions: boolean;
  conditions: string[];
}
