import { apiClient } from "./client";
import { endpoints } from "./endpoints";

const unwrap = (response) => response.data?.data ?? response.data;

export async function healthCheck() {
  return unwrap(await apiClient.get(endpoints.health));
}

export async function createSimulationProject(payload = {}) {
  return unwrap(await apiClient.post(endpoints.simulationCreate, payload));
}

export async function uploadBrandBrief({ file, simulation_id }) {
  const formData = new FormData();
  formData.append("file", file);
  if (simulation_id) formData.append("simulation_id", simulation_id);

  return unwrap(
    await apiClient.post(endpoints.graphUpload, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  );
}

export async function prepareGraph(payload) {
  return unwrap(await apiClient.post(endpoints.simulationPrepare, payload));
}

export async function getPreparationStatus(payload) {
  return unwrap(await apiClient.post(endpoints.simulationPrepareStatus, payload));
}

export async function getGraphRelations(graphId) {
  return unwrap(await apiClient.get(endpoints.graphRelations(graphId)));
}

export async function generateProfiles(payload) {
  return unwrap(await apiClient.post(endpoints.generateProfiles, payload));
}

export async function getProfiles(simulationId) {
  return unwrap(await apiClient.get(endpoints.profiles(simulationId)));
}

export async function startAbTest(payload) {
  return unwrap(await apiClient.post(endpoints.simulationAbTest, payload));
}

export async function stopSimulation(payload) {
  return unwrap(await apiClient.post(endpoints.simulationStop, payload));
}

export async function getSimulationRunStatus(simulationId, runId) {
  const config = runId ? { params: { run_id: runId } } : undefined;
  return unwrap(await apiClient.get(endpoints.simulationRunStatus(simulationId), config));
}

export async function getVariantResults(variantId) {
  return unwrap(await apiClient.get(endpoints.variantResults(variantId)));
}

export async function generateReport(payload) {
  return unwrap(await apiClient.post(endpoints.reportGenerate, payload));
}

export async function getReport(reportId) {
  return unwrap(await apiClient.get(endpoints.reportById(reportId)));
}

export async function interviewPersona(payload) {
  return unwrap(await apiClient.post(endpoints.reportInterview, payload));
}

export async function getHistory() {
  return unwrap(await apiClient.get(endpoints.simulationHistory));
}
