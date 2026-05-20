import { getMockData } from "@/data/mockData";

const delay = (ms = 550) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = (value) => JSON.parse(JSON.stringify(value));

const state = {
  preparationProgress: 0,
  simulationProgress: 0,
  stopped: false,
  variants: [],
  personaCount: 30,
};

const mock = () => getMockData();

export async function healthCheck() {
  await delay(180);
  return {
    status: "ok",
    service: "CampaignSim Mock API",
    version: "mock-1.0.0",
    timestamp: new Date().toISOString(),
  };
}

export async function createSimulationProject(payload = {}) {
  await delay();
  const data = mock();
  return {
    ...data.project,
    project_name: payload.project_name || data.project.project_name,
    status: "draft",
  };
}

export async function uploadBrandBrief({ file }) {
  await delay(700);
  const data = mock();
  return {
    simulation_id: data.project.simulation_id,
    graph_id: data.project.graph_id,
    file: {
      file_id: "file_mock_123",
      filename: file?.name || "mock-brand-brief.pdf",
      mime_type: file?.type || "application/pdf",
      size_bytes: file?.size || 1240000,
    },
  };
}

export async function prepareGraph({ simulation_id, graph_id }) {
  await delay(400);
  state.preparationProgress = 0;
  return {
    task_id: "task_prepare_mock",
    simulation_id,
    graph_id,
    status: "processing",
  };
}

export async function getPreparationStatus({ task_id, simulation_id }) {
  await delay(420);
  state.preparationProgress = Math.min(100, state.preparationProgress + 28);
  const completed = state.preparationProgress >= 100;
  const data = mock();

  return {
    task_id,
    simulation_id,
    status: completed ? "completed" : "running",
    progress: state.preparationProgress,
    current_step: completed ? "Knowledge graph ready" : "Extracting marketing entities",
    graph_id: data.graph.graph_id,
    summary: completed
      ? {
          nodes_count: data.graph.nodes.length,
          edges_count: data.graph.edges.length,
          entity_types: [...new Set(data.graph.nodes.map((node) => node.type))],
        }
      : undefined,
  };
}

export async function getGraphRelations() {
  await delay();
  return clone(mock().graph);
}

export async function generateProfiles({ simulation_id, count = 30 }) {
  await delay(650);
  state.personaCount = count;
  return {
    task_id: "task_personas_mock",
    simulation_id,
    status: "processing",
  };
}

export async function getProfiles() {
  await delay(650);
  const basePersonas = clone(mock().personas);
  const personas = Array.from({ length: state.personaCount }, (_item, index) => {
    const base = basePersonas[index % basePersonas.length];
    const suffix = index < basePersonas.length ? "" : ` ${index + 1}`;
    return {
      ...base,
      user_id: index + 1,
      user_name: `${base.user_name}_${index + 1}`,
      name: `${base.name}${suffix}`,
    };
  });
  return {
    personas,
  };
}

export async function startAbTest({ simulation_id, variants }) {
  await delay(650);
  state.simulationProgress = 0;
  state.stopped = false;
  state.variants = clone(variants);
  return {
    simulation_id,
    run_id: "run_ab_123",
    status: "running",
  };
}

export async function stopSimulation({ simulation_id, run_id }) {
  await delay(300);
  state.stopped = true;
  return {
    simulation_id,
    run_id,
    status: "stopped",
  };
}

export async function getSimulationRunStatus(simulationId) {
  await delay(420);
  if (state.stopped) {
    return {
      simulation_id: simulationId,
      run_id: "run_ab_123",
      status: "stopped",
      progress: state.simulationProgress,
      variants: state.variants,
    };
  }

  state.simulationProgress = Math.min(100, state.simulationProgress + 18);
  const completed = state.simulationProgress >= 100;
  const variants = (state.variants.length ? state.variants : mock().variants).map((variant, index) => {
    const offset = index * 12;
    const progress = Math.min(100, Math.max(0, state.simulationProgress - offset + 10));
    return {
      variant_id: variant.variant_id || `v${index + 1}`,
      variant_name: variant.variant_name,
      status: completed ? "completed" : progress > 8 ? "running" : "pending",
      progress,
      current_round: Math.ceil(progress / 10),
      max_rounds: variant.max_rounds || 10,
    };
  });

  return {
    simulation_id: simulationId,
    run_id: "run_ab_123",
    status: completed ? "completed" : "running",
    progress: state.simulationProgress,
    current_round: Math.ceil(state.simulationProgress / 10),
    max_rounds: 10,
    variants,
  };
}

export async function getVariantResults(variantId) {
  await delay(300);
  return clone(mock().results.find((result) => result.variant_id === variantId) || mock().results[0]);
}

export async function generateReport({ simulation_id }) {
  await delay(750);
  return {
    report_id: mock().report.report_id,
    simulation_id,
    status: "processing",
  };
}

export async function getReport() {
  await delay(500);
  const data = mock();
  return {
    ...clone(data.report),
    results: clone(data.results),
  };
}

export async function interviewPersona({ persona_id, question }) {
  await delay(550);
  const persona = mock().personas.find((item) => item.user_id === Number(persona_id)) || mock().personas[0];
  return {
    persona_id: persona.user_id,
    persona_name: persona.name,
    answer: `As ${persona.name}, I would say: ${question.toLowerCase().includes("email") ? "the email needs a clearer personal reason to click" : "the strongest message feels quick, useful, and aligned with my routine"}. The campaign works best when it respects my time and shows the product in a realistic moment.`,
    related_variant_id: "v1",
  };
}

export async function getHistory() {
  await delay(350);
  return {
    items: clone(mock().history),
  };
}
