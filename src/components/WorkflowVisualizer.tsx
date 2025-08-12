import { Component } from 'solid-js';
import { WorkflowViewModel } from '../viewmodels/workflowViewModel';

interface WorkflowVisualizerProps {
  viewModel: WorkflowViewModel;
}

export const WorkflowVisualizer: Component<WorkflowVisualizerProps> = (props) => {
  const renderTrigger = (trigger: any) => {
    if (typeof trigger === 'string') {
      return <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{trigger}</span>;
    }
    if (Array.isArray(trigger)) {
      return (
        <div class="space-y-2">
          {trigger.map((item) => (
            <div class="bg-blue-50 p-2 rounded border-l-4 border-blue-400">
              {Object.entries(item).map(([key, value]) => (
                <div class="text-sm">
                  <span class="font-medium text-blue-700">{key}:</span> {String(value)}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }
    return <span class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">Configurado</span>;
  };

  const getActionUrl = (uses: string): string | null => {
    if (!uses) return null;
    if (uses.startsWith('./') || uses.startsWith('../')) return null; // ação local
    if (uses.startsWith('docker://')) return null; // imagem docker, não é repo GitHub

    const [left, ref = ''] = uses.split('@');
    const segments = left.split('/');
    if (segments.length < 2) return null;

    const owner = segments[0];
    const repo = segments[1];
    const subpath = segments.slice(2).join('/');

    const base = `https://github.com/${owner}/${repo}`;
    if (!ref) return base;

    if (subpath) {
      return `${base}/tree/${ref}/${subpath}`;
    }
    return `${base}/tree/${ref}`;
  };

  const renderStep = (step: any, index: number) => {
    const actionUrl = step.uses ? getActionUrl(step.uses) : null;

    return (
      <div class="bg-white border border-gray-200 rounded-lg p-4 mb-3">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-500">Step {index + 1}</span>
          {step.name && <span class="text-sm font-semibold text-gray-800">{step.name}</span>}
        </div>
        
        {step.uses && (
          <div class="mb-2">
            <span class="text-xs text-gray-500">Action:</span>
            {actionUrl ? (
              <a
                href={actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm font-mono text-blue-600 ml-1 underline hover:text-blue-700 inline-flex items-center gap-1"
                title={`Abrir ${step.uses} no GitHub`}
              >
                {step.uses}
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h4m0 0v4m0-4L10 14" />
                </svg>
              </a>
            ) : (
              <span class="text-sm font-mono text-blue-600 ml-1">{step.uses}</span>
            )}
          </div>
        )}
        
        {step.run && (
          <div class="mb-2">
            <span class="text-xs text-gray-500">Command:</span>
            <span class="text-sm font-mono text-green-600 ml-1">{step.run}</span>
          </div>
        )}
        
        {step.if && (
          <div class="mb-2">
            <span class="text-xs text-gray-500">Condition:</span>
            <span class="text-sm font-mono text-yellow-600 ml-1">{step.if}</span>
          </div>
        )}
        
        {step.with && (
          <div class="mt-2">
            <span class="text-xs text-gray-500">Parameters:</span>
            <div class="mt-1 space-y-1">
              {Object.entries(step.with).map(([key, value]) => (
                <div class="text-sm">
                  <span class="font-medium text-gray-700">{key}:</span> 
                  <span class="font-mono text-gray-600 ml-1">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderJob = (jobName: string, job: any) => (
    <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800">{jobName}</h3>
        <div class="flex items-center gap-2">
          {job.if && (
            <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm text-xs">
              Condicional
            </span>
          )}
          <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            {job['runs-on'] || 'No runner specified'}
          </span>
        </div>
      </div>
      
      {job.needs && (
        <div class="mb-4 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
          <h4 class="font-medium text-purple-800 mb-2">Dependências</h4>
          <div class="text-sm text-purple-700">
            Depende de: {Array.isArray(job.needs) ? job.needs.join(', ') : job.needs}
          </div>
        </div>
      )}
      
      {job.strategy && (
        <div class="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <h4 class="font-medium text-blue-800 mb-2">Strategy</h4>
          {Object.entries(job.strategy).map(([key, value]) => (
            <div class="text-sm">
              <span class="font-medium text-blue-700">{key}:</span>
              <span class="ml-2">{JSON.stringify(value)}</span>
            </div>
          ))}
        </div>
      )}
      
      <div class="space-y-2">
        <h4 class="font-medium text-gray-700">Steps ({job.steps?.length || 0})</h4>
        {job.steps?.map((step: any, index: number) => renderStep(step, index))}
      </div>
    </div>
  );

  return (
    <div class="bg-white rounded p-3 border">
      <h2 class="text-xl font-semibold text-gray-700 mb-4">
        Visualização do Workflow
      </h2>
      
      {props.viewModel.error() && (
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-800">{props.viewModel.error()}</p>
            </div>
          </div>
        </div>
      )}
      
      {props.viewModel.workflow() && (
        <div class="space-y-6">
          {/* Header do Workflow */}
          <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg">
            <h3 class="text-xl font-bold">{props.viewModel.workflow()?.name || 'Workflow sem nome'}</h3>
            <p class="text-blue-100 mt-1">GitHub Actions Workflow</p>
          </div>

          {/* Triggers */}
          {props.viewModel.workflow()?.on && (
            <div class="bg-white border border-gray-200 rounded-lg p-4">
              <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                <svg class="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Triggers
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(props.viewModel.workflow()!.on).map(([trigger, config]) => (
                  <div class="p-3 bg-gray-50 rounded-lg">
                    <div class="font-medium text-gray-700 mb-2">{trigger}</div>
                    {renderTrigger(config)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Jobs */}
          {props.viewModel.workflow()?.jobs && (
            <div class="space-y-4">
              <h4 class="font-semibold text-gray-800 text-lg flex items-center">
                <svg class="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Jobs ({Object.keys(props.viewModel.workflow()!.jobs).length})
              </h4>
              {Object.entries(props.viewModel.workflow()!.jobs).map(([jobName, job]) => renderJob(jobName, job))}
            </div>
          )}
        </div>
      )}
      
      {!props.viewModel.workflow() && !props.viewModel.error() && (
        <div class="text-center text-gray-500 py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="mt-2">Cole um YAML do GitHub Actions e clique em "Visualizar Workflow"</p>
        </div>
      )}
    </div>
  );
};
