export const endpoints = {
  health: "/api/health",

  graphUpload: "/api/graph/upload",
  graphById: (graphId) => `/api/graph/${graphId}`,
  graphRelations: (graphId) => `/api/graph/${graphId}/relations`,
  graphSearch: (graphId) => `/api/graph/${graphId}/search`,
  graphUpdateFromSimulation: (graphId) => `/api/graph/${graphId}/update-from-sim`,

  simulationCreate: "/api/simulation/create",
  simulationPrepare: "/api/simulation/prepare",
  simulationPrepareStatus: "/api/simulation/prepare/status",
  simulationList: "/api/simulation/list",
  simulationHistory: "/api/simulation/history",
  simulationById: (simulationId) => `/api/simulation/${simulationId}`,

  generateProfiles: "/api/simulation/generate-profiles",
  profiles: (simulationId) => `/api/simulation/${simulationId}/profiles`,
  profilesRealtime: (simulationId) => `/api/simulation/${simulationId}/profiles/realtime`,

  simulationStart: "/api/simulation/start",
  simulationAbTest: "/api/simulation/ab_test",
  simulationStop: "/api/simulation/stop",
  simulationRunStatus: (simulationId) => `/api/simulation/${simulationId}/run-status`,
  assignSegments: "/api/simulation/assign_segments",
  variantResults: (variantId) => `/api/simulation/${variantId}/results`,

  reportGenerate: "/api/report/generate",
  reportById: (reportId) => `/api/report/${reportId}`,
  reportInterview: "/api/report/interview",
};
