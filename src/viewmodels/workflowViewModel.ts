import { createSignal, createMemo } from 'solid-js';
import * as yaml from 'yaml';
import { Workflow, WorkflowJob, JobDependency } from '../models/workflow';

export class WorkflowViewModel {
  private _yamlInput = createSignal('');
  private _workflow = createSignal<Workflow | null>(null);
  private _error = createSignal<string | null>(null);
  private _isLoading = createSignal(false);
  private _isCodeCollapsed = createSignal(false);

  // Getters públicos
  get yamlInput() { return this._yamlInput[0]; }
  get setYamlInput() { return this._yamlInput[1]; }
  get workflow() { return this._workflow[0]; }
  get setWorkflow() { return this._workflow[1]; }
  get error() { return this._error[0]; }
  get setError() { return this._error[1]; }
  get isLoading() { return this._isLoading[0]; }
  get setIsLoading() { return this._isLoading[1]; }

  // Computed values
  jobDependencies = createMemo(() => this.analyzeJobDependencies());
  workflowStats = createMemo(() => this.calculateWorkflowStats());
  jobExecutionOrder = createMemo(() => this.calculateJobExecutionOrder());

  async parseYaml(): Promise<void> {
    const input = this.yamlInput();
    if (!input.trim()) {
      this.setError('Por favor, insira algum conteúdo YAML');
      return;
    }

    this.setIsLoading(true);
    this.setError(null);

    try {
      const parsed = yaml.parse(input);
      this.validateWorkflow(parsed);
      this.setWorkflow(parsed);
    } catch (err) {
      this.setError(`Erro ao fazer parse do YAML: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      this.setWorkflow(null);
    } finally {
      this.setIsLoading(false);
    }
  }

  private validateWorkflow(data: any): void {
    if (!data.name) {
      throw new Error('Workflow deve ter um nome');
    }
    if (!data.on) {
      throw new Error('Workflow deve ter triggers definidos');
    }
    if (!data.jobs || Object.keys(data.jobs).length === 0) {
      throw new Error('Workflow deve ter pelo menos um job');
    }
  }

  private analyzeJobDependencies(): JobDependency[] {
    const workflow = this.workflow();
    if (!workflow) return [];

    return Object.entries(workflow.jobs).map(([jobName, job]) => {
      const needs = job.needs;
      const dependsOn = Array.isArray(needs) ? needs : needs ? [needs] : [];

      return {
        jobName,
        dependsOn,
        hasConditions: !!job.if,
        conditions: job.if ? [job.if] : []
      };
    });
  }

  private calculateWorkflowStats() {
    const workflow = this.workflow();
    if (!workflow) return null;

    const jobs = workflow.jobs;
    const totalJobs = Object.keys(jobs).length;
    const totalSteps = Object.values(jobs).reduce((sum, job) => sum + job.steps.length, 0);

    const triggers = Object.keys(workflow.on).filter(key => workflow.on[key] !== null);
    const hasMatrix = Object.values(jobs).some(job => job.strategy?.matrix);
    const hasConditions = Object.values(jobs).some(job => job.if);
    const hasDependencies = Object.values(jobs).some(job => job.needs);

    return {
      totalJobs,
      totalSteps,
      triggers,
      hasMatrix,
      hasConditions,
      hasDependencies
    };
  }

  private calculateJobExecutionOrder(): string[][] {
    const workflow = this.workflow();
    if (!workflow) return [];

    const jobs = workflow.jobs;
    const visited = new Set<string>();
    const order: string[][] = [];
    const jobDeps = this.jobDependencies();

    // Jobs sem dependências vão primeiro
    const independentJobs = jobDeps.filter(job => job.dependsOn.length === 0);
    if (independentJobs.length > 0) {
      order.push(independentJobs.map(job => job.jobName));
      independentJobs.forEach(job => visited.add(job.jobName));
    }

    // Processar jobs dependentes
    while (visited.size < Object.keys(jobs).length) {
      const currentLevel: string[] = [];

      jobDeps.forEach(job => {
        if (visited.has(job.jobName)) return;

        const canExecute = job.dependsOn.every(dep => visited.has(dep));
        if (canExecute) {
          currentLevel.push(job.jobName);
          visited.add(job.jobName);
        }
      });

      if (currentLevel.length === 0) {
        // Ciclo detectado ou jobs isolados
        const remainingJobs = jobDeps.filter(job => !visited.has(job.jobName));
        if (remainingJobs.length > 0) {
          order.push(remainingJobs.map(job => job.jobName));
          remainingJobs.forEach(job => visited.add(job.jobName));
        }
        break;
      }

      order.push(currentLevel);
    }

    return order;
  }

  clearWorkflow(): void {
    this.setYamlInput('');
    this.setWorkflow(null);
    this.setError(null);
  }


  getJobById(jobId: string): WorkflowJob | null {
    const workflow = this.workflow();
    return workflow?.jobs[jobId] || null;
  }

  getJobDependencies(jobId: string): string[] {
    const deps = this.jobDependencies();
    const job = deps.find(dep => dep.jobName === jobId);
    return job?.dependsOn || [];
  }

  getJobsThatDependOn(jobId: string): string[] {
    const deps = this.jobDependencies();
    return deps
      .filter(dep => dep.dependsOn.includes(jobId))
      .map(dep => dep.jobName);
  }
}
