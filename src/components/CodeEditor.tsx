import { Component } from 'solid-js';
import { WorkflowViewModel } from '../viewmodels/workflowViewModel';
import { Editor } from 'solid-prism-editor';
import { basicSetup } from 'solid-prism-editor/setups';

// Adding the TSX grammar
import 'solid-prism-editor/prism/languages/yaml';

// Adds comment toggling and auto-indenting for TSX
import 'solid-prism-editor/languages/yaml';

import 'solid-prism-editor/layout.css';
import 'solid-prism-editor/themes/dracula.css';
import 'solid-prism-editor/scrollbar.css';

// Required by the basic setup
import 'solid-prism-editor/search.css';
import 'solid-prism-editor/invisibles.css';

interface CodeEditorProps {
  viewModel: WorkflowViewModel;
}

export const CodeEditor: Component<CodeEditorProps> = (props) => {
  const handleFileUpload = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        props.viewModel.setYamlInput(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div class="bg-white rounded border flex flex-col grow space-y-2 py-2 max-w-screen-md w-full">


      {/* File Upload */}
      <div class="px-3">
        <input
          type="file"
          accept=".yaml,.yml,.txt"
          onChange={handleFileUpload}
          placeholder='Escolher arquivo'
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      <Editor language="yaml" class='max-h-full w-full h-full' value={props.viewModel.yamlInput()} extensions={basicSetup} onUpdate={(e) => props.viewModel.setYamlInput(e)} />


      {/* Actions */}
      <div class="flex gap-3 px-3">
        <button
          onClick={() => props.viewModel.parseYaml()}
          disabled={props.viewModel.isLoading() || !props.viewModel.yamlInput().trim()}
          class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {props.viewModel.isLoading() ? 'Processando...' : 'Visualizar Workflow'}
        </button>

        <button
          onClick={() => props.viewModel.clearWorkflow()}
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Limpar
        </button>
      </div>
    </div>
  );
};
