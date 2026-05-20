import * as mockApi from "./mockApi";
import * as realApi from "./realApi";

const useMocks = import.meta.env.VITE_USE_MOCKS !== "false";
const api = useMocks ? mockApi : realApi;

export const isMockMode = useMocks;

export const healthCheck = api.healthCheck;
export const createSimulationProject = api.createSimulationProject;
export const uploadBrandBrief = api.uploadBrandBrief;
export const prepareGraph = api.prepareGraph;
export const getPreparationStatus = api.getPreparationStatus;
export const getGraphRelations = api.getGraphRelations;
export const generateProfiles = api.generateProfiles;
export const getProfiles = api.getProfiles;
export const startAbTest = api.startAbTest;
export const stopSimulation = api.stopSimulation;
export const getSimulationRunStatus = api.getSimulationRunStatus;
export const getVariantResults = api.getVariantResults;
export const generateReport = api.generateReport;
export const getReport = api.getReport;
export const interviewPersona = api.interviewPersona;
export const getHistory = api.getHistory;
