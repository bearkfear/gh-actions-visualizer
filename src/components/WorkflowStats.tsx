import { Component } from 'solid-js';
import { WorkflowViewModel } from '../viewmodels/workflowViewModel';

interface WorkflowStatsProps {
  viewModel: WorkflowViewModel;
}

export const WorkflowStats: Component<WorkflowStatsProps> = (props) => {
  return (
    <div class="bg-white rounded border p-3">
      <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <svg class="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v-6a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 002 2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Estatísticas do Workflow
      </h3>
      
      {props.viewModel.workflowStats() ? (
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-3 bg-blue-50 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{props.viewModel.workflowStats()?.totalJobs}</div>
            <div class="text-sm text-blue-700">Jobs</div>
          </div>
          
          <div class="text-center p-3 bg-green-50 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{props.viewModel.workflowStats()?.totalSteps}</div>
            <div class="text-sm text-green-700">Steps</div>
          </div>
          
          <div class="text-center p-3 bg-purple-50 rounded-lg">
            <div class="text-2xl font-bold text-purple-600">{props.viewModel.workflowStats()?.triggers.length}</div>
            <div class="text-sm text-purple-700">Triggers</div>
          </div>
          
          <div class="text-center p-3 bg-orange-50 rounded-lg">
            <div class="text-2xl font-bold text-orange-600">
              {props.viewModel.jobExecutionOrder().length}
            </div>
            <div class="text-sm text-orange-700">Níveis</div>
          </div>
        </div>
      ) : (
        <div class="text-center text-gray-500 py-8">
          <p>Nenhum workflow carregado</p>
        </div>
      )}
    </div>
  );
};
