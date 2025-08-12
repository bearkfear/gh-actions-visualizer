import { Component } from 'solid-js';
import { WorkflowViewModel } from '../viewmodels/workflowViewModel';
import { CodeEditor } from '../components/CodeEditor';
import { WorkflowStats } from '../components/WorkflowStats';
import { JobDependencyGraph } from '../components/JobDependencyGraph';
import { WorkflowVisualizer } from '../components/WorkflowVisualizer';
import { WorkflowGraph } from '../components/WorkflowGraph';

const Home: Component = () => {
  const viewModel = new WorkflowViewModel();

  return (
    <div class="h-screen w-full">
      <div class="flex gap-3 overflow-hidden max-h-screen p-3">

        <CodeEditor viewModel={viewModel} />


        <div class='flex flex-col gap-3 overflow-auto w-full'>
          <WorkflowStats viewModel={viewModel} />
          <JobDependencyGraph viewModel={viewModel} />
          <WorkflowVisualizer viewModel={viewModel} />
          <WorkflowGraph viewModel={viewModel} />
        </div>

      </div>
    </div >

  );
};

export default Home;