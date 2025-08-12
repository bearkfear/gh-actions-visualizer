import { Component } from 'solid-js';
import { WorkflowViewModel } from '../viewmodels/workflowViewModel';

interface JobDependencyGraphProps {
  viewModel: WorkflowViewModel;
}

export const JobDependencyGraph: Component<JobDependencyGraphProps> = (props) => {
  return (
    <div class="bg-white rounded p-3 border">
      <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Ordem de Execução dos Jobs
      </h3>
      
      {props.viewModel.jobExecutionOrder().length > 0 ? (
        <div class="space-y-4">
          {props.viewModel.jobExecutionOrder().map((level, levelIndex) => (
            <div class="border-l-4 border-blue-400 pl-4">
              <div class="text-sm font-medium text-blue-600 mb-2">
                Nível {levelIndex + 1} {level.length > 1 ? `(${level.length} jobs paralelos)` : ''}
              </div>
              <div class="flex flex-wrap gap-2">
                {level.map(jobName => {
                  const deps = props.viewModel.getJobDependencies(jobName);
                  const dependents = props.viewModel.getJobsThatDependOn(jobName);
                  const job = props.viewModel.getJobById(jobName);
                  
                  return (
                    <div class="relative group">
                      <div class="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg border border-blue-200 hover:bg-blue-200 transition-colors cursor-pointer">
                        <div class="font-medium">{jobName}</div>
                        {job?.['runs-on'] && (
                          <div class="text-xs text-blue-600">{job['runs-on']}</div>
                        )}
                      </div>
                      
                      {/* Tooltip com dependências */}
                      <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <div class="mb-1">
                          <span class="font-medium">Depende de:</span>
                          {deps.length > 0 ? deps.join(', ') : 'Nenhum'}
                        </div>
                        <div>
                          <span class="font-medium">Dependentes:</span>
                          {dependents.length > 0 ? dependents.join(', ') : 'Nenhum'}
                        </div>
                        {job?.if && (
                          <div class="mt-1 text-yellow-300">
                            <span class="font-medium">Condição:</span> {job.if}
                          </div>
                        )}
                        <div class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div class="text-center text-gray-500 py-8">
          <p>Nenhum workflow carregado</p>
        </div>
      )}
    </div>
  );
};
