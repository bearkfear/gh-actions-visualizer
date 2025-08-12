import { Component, createEffect, onCleanup, createSignal, For, Show } from 'solid-js';
import cytoscape, { Core, ElementDefinition } from 'cytoscape';
import { WorkflowViewModel } from '../viewmodels/workflowViewModel';

interface WorkflowGraphProps {
  viewModel: WorkflowViewModel;
}

type HoverInfo = {
  x: number;
  y: number;
  jobId: string;
};

export const WorkflowGraph: Component<WorkflowGraphProps> = (props) => {
  let containerRef: HTMLDivElement | undefined;
  let cy: Core | undefined;
  const [selectedJobId, setSelectedJobId] = createSignal<string | null>(null);
  const [hoverInfo, setHoverInfo] = createSignal<HoverInfo | null>(null);

  const buildElements = (): ElementDefinition[] => {
    const wf = props.viewModel.workflow();
    if (!wf) return [];

    const elements: ElementDefinition[] = [];

    // Nós de jobs com dados ricos
    Object.keys(wf.jobs).forEach((jobId) => {
      const job = wf.jobs[jobId];
      const label = job.name || jobId;
      const runner = job['runs-on'] || '';
      const stepsCount = job.steps?.length || 0;
      const needsArr = Array.isArray(job.needs) ? job.needs : job.needs ? [job.needs] : [];
      const hasIf = Boolean(job.if);
      const hasMatrix = Boolean(job.strategy?.matrix);

      // Linha de resumo
      const summaryParts: string[] = [];
      if (runner) summaryParts.push(runner);
      summaryParts.push(`${stepsCount} step${stepsCount !== 1 ? 's' : ''}`);
      if (needsArr.length) summaryParts.push(`${needsArr.length} dependência${needsArr.length > 1 ? 's' : ''}`);
      if (hasIf) summaryParts.push('if');
      if (hasMatrix) summaryParts.push('matrix');
      const summary = summaryParts.join(' · ');

      elements.push({
        data: {
          id: jobId,
          label: `${label}\n${summary}`,
          runner,
          stepsCount,
          needsCount: needsArr.length,
          hasIf: hasIf ? 1 : 0,
          hasMatrix: hasMatrix ? 1 : 0,
        },
      });
    });

    // Arestas por needs
    Object.entries(wf.jobs).forEach(([jobId, job]) => {
      const needs = Array.isArray(job.needs) ? job.needs : job.needs ? [job.needs] : [];
      needs.forEach((dep) => {
        if (wf.jobs[dep]) {
          elements.push({ data: { id: `${dep}->${jobId}`, source: dep, target: jobId } });
        }
      });
    });

    return elements;
  };

  const computeRoots = (): string[] => {
    const wf = props.viewModel.workflow();
    if (!wf) return [];
    const all = new Set(Object.keys(wf.jobs));
    const nonRoots = new Set<string>();
    Object.values(wf.jobs).forEach((job) => {
      const needs = Array.isArray(job.needs) ? job.needs : job.needs ? [job.needs] : [];
      needs.forEach((n) => nonRoots.add(n));
    });
    const roots: string[] = [];
    all.forEach((id) => {
      if (!nonRoots.has(id)) roots.push(id);
    });
    return roots;
  };

  const initCy = () => {
    if (!containerRef) return;
    if (cy) {
      cy.destroy();
      cy = undefined;
    }

    const elements = buildElements();
    const roots = computeRoots();

    cy = cytoscape({
      container: containerRef,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#e0ecff',
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#0b2540',
            'font-weight': 600,
            'text-wrap': 'wrap',
            'text-max-width': '160px',
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.7,
            'text-background-padding': '4px',
            'border-width': 2,
            'border-color': '#60a5fa',
            'width': 'label',
            'height': 'label',
            'padding': '10px',
            'shape': 'round-rectangle',
          },
        },
        {
          selector: 'node[hasIf = 1]',
          style: {
            'border-color': '#f59e0b',
          },
        },
        {
          selector: 'node[hasMatrix = 1]',
          style: {
            'background-color': '#eee6ff',
            'border-color': '#a78bfa',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#93c5fd',
            'target-arrow-color': '#93c5fd',
            'target-arrow-shape': 'triangle',
            'curve-style': 'unbundled-bezier',
            'control-point-distances': 30,
            'control-point-weights': 0.2,
          },
        },
        {
          selector: ':selected',
          style: {
            'border-width': 3,
            'border-color': '#111827',
          },
        },
      ],
      layout: {
        name: 'breadthfirst',
        roots,
        directed: true,
        padding: 30,
        spacingFactor: 1.2,
        animate: false,
        circle: false,
      },
      wheelSensitivity: 0.2,
    });

    cy.on('select', 'node', (evt) => {
      const node = evt.target;
      setSelectedJobId(node.id());
    });

    cy.on('unselect', 'node', () => setSelectedJobId(null));

    cy.on('mouseover', 'node', (evt) => {
      const pos = (evt as any).renderedPosition || evt.target.renderedPosition();
      setHoverInfo({ x: pos.x, y: pos.y, jobId: evt.target.id() });
    });

    cy.on('mouseout', 'node', () => setHoverInfo(null));

    // Ajuste de viewport
    setTimeout(() => {
      cy && cy.fit(undefined, 30);
    }, 0);
  };

  createEffect(() => {
    // Recriar grafo quando workflow mudar
    const wf = props.viewModel.workflow();
    if (!wf) {
      if (cy) {
        cy.destroy();
        cy = undefined;
      }
      return;
    }

    initCy();
  });

  onCleanup(() => {
    if (cy) cy.destroy();
  });

  const getActionUrl = (uses: string): string | null => {
    if (!uses) return null;
    if (uses.startsWith('./') || uses.startsWith('../')) return null;
    if (uses.startsWith('docker://')) return null;
    const [left, ref = ''] = uses.split('@');
    const segments = left.split('/');
    if (segments.length < 2) return null;
    const owner = segments[0];
    const repo = segments[1];
    const subpath = segments.slice(2).join('/');
    const base = `https://github.com/${owner}/${repo}`;
    if (!ref) return base;
    return subpath ? `${base}/tree/${ref}/${subpath}` : `${base}/tree/${ref}`;
  };

  const SelectedJobPanel: Component = () => {
    const wf = props.viewModel.workflow();
    const jobId = selectedJobId();
    if (!wf || !jobId) return null as unknown as any;

    const job = wf.jobs[jobId];
    return (
      <div class="mt-4 bg-white rounded-lg border border-gray-200">
        <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500">Job selecionado</div>
            <div class="font-semibold text-gray-800">{job.name || jobId}</div>
          </div>
          <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
            {job['runs-on'] || 'runner não especificado'}
          </span>
        </div>
        <div class="p-4 space-y-3">
          {job.needs && (
            <div class="text-sm text-gray-700">
              <span class="font-medium">Depende de:</span> {Array.isArray(job.needs) ? job.needs.join(', ') : job.needs}
            </div>
          )}
          {job.if && (
            <div class="text-sm text-yellow-700">
              <span class="font-medium">Condição:</span> <span class="font-mono">{job.if}</span>
            </div>
          )}
          {job.strategy?.matrix && (
            <div class="text-sm text-purple-700">
              <span class="font-medium">Matrix:</span> <span class="font-mono">{JSON.stringify(job.strategy.matrix)}</span>
            </div>
          )}

          <div>
            <div class="font-medium text-gray-800 mb-1">Steps</div>
            <div class="space-y-2 max-h-64 overflow-auto pr-1">
              <For each={job.steps || []}>{(step) => {
                const url = step.uses ? getActionUrl(step.uses) : null;
                return (
                  <div class="text-sm">
                    {step.name && <div class="font-medium text-gray-700">{step.name}</div>}
                    {step.uses && (
                      <div>
                        <span class="text-gray-500 text-xs">Action:</span>{' '}
                        {url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" class="font-mono text-blue-600 underline hover:text-blue-700">
                            {step.uses}
                          </a>
                        ) : (
                          <span class="font-mono text-blue-700">{step.uses}</span>
                        )}
                      </div>
                    )}
                    {step.run && (
                      <div>
                        <span class="text-gray-500 text-xs">Command:</span>{' '}
                        <span class="font-mono text-green-700">{step.run}</span>
                      </div>
                    )}
                  </div>
                );
              }}</For>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const HoverTooltip: Component = () => {
    const info = hoverInfo();
    const wf = props.viewModel.workflow();
    if (!info || !wf) return null as unknown as any;
    const job = wf.jobs[info.jobId];
    const steps = job.steps || [];
    const preview = steps.slice(0, 4);

    return (
      <div
        class="pointer-events-none absolute z-20 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 max-w-xs"
        style={{ left: `${info.x}px`, top: `${info.y - 16}px`, transform: 'translate(-50%, -100%)' }}
      >
        <div class="font-semibold mb-1">{job.name || info.jobId}</div>
        <div class="text-gray-300 mb-1">{job['runs-on'] || 'runner não especificado'}</div>
        {job.if && (
          <div class="text-yellow-300 mb-1">if: <span class="font-mono">{job.if}</span></div>
        )}
        <div class="mt-1">
          <div class="text-gray-200 font-medium">Steps</div>
          <ul class="list-disc pl-4">
            <For each={preview}>{(step) => (
              <li>
                <Show when={step.uses} fallback={<span class="font-mono text-green-300">{(step.run || '').toString().slice(0, 40)}</span>}>
                  <a
                    href={getActionUrl(step.uses!) || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="font-mono text-blue-300 underline"
                  >
                    {step.uses}
                  </a>
                </Show>
              </li>
            )}</For>
            <Show when={steps.length > preview.length}>
              <li class="text-gray-400">... e mais {steps.length - preview.length} step(s)</li>
            </Show>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div class="bg-white border rounded p-3">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800 flex items-center">
          <svg class="w-5 h-5 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h8m-8 4h6" />
          </svg>
          Visualização em Grafo (Jobs)
        </h3>
        <div class="flex items-center gap-3 text-xs">
          <span class="inline-flex items-center gap-1">
            <span class="inline-block w-3 h-3 rounded bg-[#e0ecff] border border-[#60a5fa]"></span>
            job
          </span>
          <span class="inline-flex items-center gap-1">
            <span class="inline-block w-3 h-3 rounded bg-[#eee6ff] border border-[#a78bfa]"></span>
            matrix
          </span>
          <span class="inline-flex items-center gap-1">
            <span class="inline-block w-3 h-3 rounded border-2 border-[#f59e0b]"></span>
            if
          </span>
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2 relative">
          <div ref={containerRef} class="h-[520px] w-full bg-gray-50 border border-gray-200 rounded" />
          <HoverTooltip />
        </div>
        <div>
          <SelectedJobPanel />
        </div>
      </div>
    </div>
  );
};
