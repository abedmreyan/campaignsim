import { defineStore } from "pinia";
import router from "@/router/index.js";
import {
  createSimulationProject,
  uploadBrandBrief as uploadBriefApi,
  prepareGraph as prepareGraphApi,
  getPreparationStatus,
  getGraphRelations,
  generateProfiles,
  getProfiles,
  startAbTest as startAbTestApi,
  stopSimulation as stopSimulationApi,
  getSimulationRunStatus,
  getVariantResults,
  generateReport as generateReportApi,
  getReport,
  interviewPersona as interviewPersonaApi,
  getHistory,
} from "@/api/campaignApi";

const PROJECT_KEY = "campaignsim_current_project";
const STEP_KEY = "campaignsim_current_step";
const VARIANTS_KEY = "campaignsim_variants";
const MOCK_STATE_KEY = "campaignsim_mock_state";

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeError(error, fallback = "Something went wrong.") {
  if (error?.error?.message) return error.error.message;
  return error?.message || fallback;
}

function toApiVariant(variant) {
  return {
    variant_id: variant.variant_id,
    variant_name: variant.variant_name,
    channel: variant.channel,
    content: {
      format: variant.content?.format || variant.format,
      headline: variant.content?.headline || variant.headline,
      body: variant.content?.body || variant.body,
      cta: variant.content?.cta || variant.cta,
      visual_desc: variant.content?.visual_desc || variant.visual_desc || "",
      email_subject: variant.content?.email_subject || variant.email_subject || "",
      tone: variant.content?.tone || variant.tone,
    },
    target_segment: variant.target_segment || "",
    max_rounds: Number(variant.max_rounds || 10),
    status: variant.status || "pending",
  };
}

const persistedProject = readJson(PROJECT_KEY, null);
const persistedState = readJson(MOCK_STATE_KEY, null);

export const useCampaignStore = defineStore("campaign", {
  state: () => ({
    currentStep: Number(localStorage.getItem(STEP_KEY) || persistedState?.currentStep || 1),
    notice: null,

    project: persistedProject || persistedState?.project || null,
    simulationId: persistedProject?.simulation_id || persistedState?.simulationId || null,
    graphId: persistedProject?.graph_id || persistedState?.graphId || null,
    reportId: persistedState?.reportId || null,
    uploadedFile: persistedState?.uploadedFile || null,

    graph: persistedState?.graph || {
      nodes: [],
      edges: [],
      loading: false,
      error: null,
      progress: 0,
      statusText: "",
    },

    personas: persistedState?.personas || {
      items: [],
      loading: false,
      error: null,
      progress: 0,
    },

    variants: readJson(VARIANTS_KEY, persistedState?.variants || []),

    simulationRun: persistedState?.simulationRun || {
      runId: null,
      status: "idle",
      progress: 0,
      variants: [],
      results: [],
      loading: false,
      error: null,
    },

    report: persistedState?.report || {
      data: null,
      loading: false,
      error: null,
    },

    history: persistedState?.history || {
      items: [],
      loading: false,
      error: null,
    },

    interviewMessages: persistedState?.interviewMessages || [],
  }),

  getters: {
    graphReady: (state) => state.graph.nodes.length > 0 && state.graph.edges.length > 0,
    personasReady: (state) => state.personas.items.length > 0,
    canStartSimulation: (state) => state.variants.length >= 2 && state.variants.length <= 3,
    simulationCompleted: (state) => state.simulationRun.status === "completed",
    modeLabel: () => (import.meta.env.VITE_USE_MOCKS === "false" ? "Live API" : "Mock mode"),
    isMockMode: () => import.meta.env.VITE_USE_MOCKS !== "false",

    /** Presentation-only: drives .app-shell ambient canvas (idle | running | complete | error). */
    shellAmbientStatus(state) {
      if (state.graph.error || state.personas.error || state.simulationRun.error || state.report.error) {
        return "error";
      }
      if (
        state.graph.loading ||
        state.personas.loading ||
        state.report.loading ||
        state.simulationRun.loading ||
        state.simulationRun.status === "running"
      ) {
        return "running";
      }
      if (state.simulationRun.status === "completed" || state.report.data) {
        return "complete";
      }
      return "idle";
    },

    /** Presentation-only: command sidebar activity strip copy from existing store state. */
    shellActivityMessage(state) {
      if (state.graph.loading) {
        return state.graph.statusText || "Building graph…";
      }
      if (state.personas.loading) {
        return "Generating personas…";
      }
      if (state.report.loading) {
        return "Generating report…";
      }
      if (state.simulationRun.status === "running" || state.simulationRun.loading) {
        return state.simulationRun.progress
          ? `Running simulation… ${state.simulationRun.progress}%`
          : "Running simulation…";
      }
      if (state.currentStep === 1) {
        if (!state.uploadedFile && !state.graphId) return "Uploading brief…";
        if (state.graphId && !state.graph.nodes.length) return "Extracting entities…";
        if (state.graphReady) return "Graph ready — explore or continue.";
      }
      if (state.currentStep === 2 && !state.personas.items.length) {
        return "Generate audience personas.";
      }
      if (state.currentStep === 3 && state.variants.length < 2) {
        return "Add at least two campaign variants.";
      }
      if (state.currentStep === 4 && !state.report.data) {
        return state.simulationCompleted ? "Generate insights report." : "Complete simulation first.";
      }
      return "Ready for next action.";
    },

    workflowProgressPercent(state) {
      let completed = 0;
      if (state.graphId && state.graph.nodes.length) completed += 1;
      if (state.personas.items.length) completed += 1;
      if (state.variants.length >= 2) completed += 1;
      if (state.simulationRun.status === "completed") completed += 1;
      if (state.report.data) completed += 1;
      return Math.round((completed / 5) * 100);
    },

    stepStatuses(state) {
      const graphSubtitle = state.graph.loading
        ? "Building…"
        : state.graph.nodes.length
          ? "Graph ready"
          : state.graphId
            ? "Brief uploaded"
            : "Awaiting brief";
      const personaSubtitle = state.personas.loading
        ? "Generating…"
        : state.personas.items.length
          ? `${state.personas.items.length} personas`
          : "Not generated";
      const variantSubtitle =
        state.variants.length >= 2
          ? `${state.variants.length} variants ready`
          : state.variants.length
            ? `${state.variants.length} variant — need 2+`
            : "No variants";
      const reportSubtitle = state.report.data
        ? "Report ready"
        : state.simulationRun.status === "completed"
          ? "Generate report"
          : "After simulation";
      const interviewSubtitle = state.interviewMessages.length
        ? `${state.interviewMessages.length} messages`
        : "Chat with personas";

      return {
        1: graphSubtitle,
        2: personaSubtitle,
        3: variantSubtitle,
        4: reportSubtitle,
        5: interviewSubtitle,
      };
    },

    canNavigateToStep: (state) => (step) => {
      if (step <= 1) return true;
      if (step === 2) return Boolean(state.graphId) && state.graph.nodes.length > 0;
      if (step === 3) return state.personas.items.length > 0;
      if (step === 4) return state.simulationRun.status === "completed" || Boolean(state.report.data);
      if (step === 5) return Boolean(state.report.data);
      return false;
    },

    commandCtaLabel(state) {
      if (state.currentStep === 1 && !state.graphReady) return "Prepare knowledge graph";
      if (state.currentStep === 1 && state.graphReady) return "Continue to personas";
      if (state.currentStep === 2 && !state.personas.items.length) return "Generate personas";
      if (state.currentStep === 2) return "Build campaign variants";
      if (state.currentStep === 3 && state.variants.length < 2) return "Add more variants";
      if (state.currentStep === 3) return "Launch simulation";
      if (state.currentStep === 4 && !state.report.data) return "Generate insights report";
      if (state.currentStep === 4) return "Open persona insights";
      return "Continue workflow";
    },
  },

  actions: {
    persist() {
      localStorage.setItem(STEP_KEY, String(this.currentStep));
      localStorage.setItem(VARIANTS_KEY, JSON.stringify(this.variants));
      localStorage.setItem(
        MOCK_STATE_KEY,
        JSON.stringify({
          currentStep: this.currentStep,
          project: this.project,
          simulationId: this.simulationId,
          graphId: this.graphId,
          reportId: this.reportId,
          uploadedFile: this.uploadedFile,
          graph: this.graph,
          personas: this.personas,
          variants: this.variants,
          simulationRun: this.simulationRun,
          report: this.report,
          history: this.history,
          interviewMessages: this.interviewMessages,
        }),
      );
      if (this.project) localStorage.setItem(PROJECT_KEY, JSON.stringify(this.project));
    },

    setNotice(message) {
      this.notice = message;
      window.setTimeout(() => {
        if (this.notice === message) this.notice = null;
      }, 4200);
    },

    async createSimulationProject(payload = {}) {
      const project = await createSimulationProject({
        project_name: payload.project_name || "FreshBrew Launch Campaign",
        description: payload.description || "Testing campaign variants for cold brew product launch",
      });
      this.project = project;
      this.simulationId = project.simulation_id;
      this.graphId = project.graph_id || this.graphId;
      this.persist();
      return project;
    },

    async uploadBrandBrief(file) {
      if (!file) throw new Error("Select a PDF or TXT brand brief first.");
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "txt"].includes(extension)) {
        throw new Error("Only PDF and TXT brand briefs are supported.");
      }

      this.graph.loading = true;
      this.graph.error = null;
      try {
        if (!this.simulationId) await this.createSimulationProject();
        const data = await uploadBriefApi({ file, simulation_id: this.simulationId });
        this.simulationId = data.simulation_id;
        this.graphId = data.graph_id;
        this.uploadedFile = data.file;
        this.project = {
          ...(this.project || {}),
          simulation_id: data.simulation_id,
          graph_id: data.graph_id,
          status: "preparing",
        };
        this.persist();
        return data;
      } catch (error) {
        this.graph.error = normalizeError(error, "Upload failed.");
        throw error;
      } finally {
        this.graph.loading = false;
      }
    },

    async prepareGraph() {
      if (!this.simulationId || !this.graphId) {
        this.graph.error = "Upload a brand brief before building the graph.";
        return null;
      }

      this.graph.loading = true;
      this.graph.error = null;
      this.graph.progress = 0;
      try {
        const task = await prepareGraphApi({
          simulation_id: this.simulationId,
          graph_id: this.graphId,
        });
        await this.pollPreparationStatus(task.task_id);
        await this.loadGraphRelations(this.graphId);
        this.project = { ...(this.project || {}), status: "ready" };
        this.persist();
        return task;
      } catch (error) {
        this.graph.error = normalizeError(error, "Graph build failed.");
        throw error;
      } finally {
        this.graph.loading = false;
      }
    },

    async pollPreparationStatus(taskId) {
      let status = "running";
      let attempts = 0;
      while (status === "running" || status === "processing") {
        attempts += 1;
        const data = await getPreparationStatus({
          task_id: taskId,
          simulation_id: this.simulationId,
        });
        status = data.status;
        this.graph.progress = data.progress || 0;
        this.graph.statusText = data.current_step || "";
        this.persist();
        if (status === "completed") return data;
        if (status === "failed" || attempts > 40) throw new Error(data.message || "Graph build failed.");
      }
      return null;
    },

    async loadGraphRelations(graphId = this.graphId) {
      this.graph.loading = true;
      this.graph.error = null;
      try {
        const data = await getGraphRelations(graphId);
        this.graph.nodes = data.nodes || [];
        this.graph.edges = data.edges || [];
        this.graphId = data.graph_id || graphId;
        this.persist();
        return data;
      } catch (error) {
        this.graph.error = normalizeError(error, "Could not load graph relations.");
        throw error;
      } finally {
        this.graph.loading = false;
      }
    },

    async generatePersonas(count = 30) {
      if (!this.graphReady) {
        this.personas.error = "Build the knowledge graph before generating personas.";
        return null;
      }

      this.personas.loading = true;
      this.personas.error = null;
      this.personas.progress = 15;
      try {
        await generateProfiles({
          simulation_id: this.simulationId,
          graph_id: this.graphId,
          count,
          language: "en",
        });
        this.personas.progress = 70;
        const data = await this.loadPersonas();
        this.personas.progress = 100;
        this.persist();
        return data;
      } catch (error) {
        this.personas.error = normalizeError(error, "Persona generation failed.");
        throw error;
      } finally {
        this.personas.loading = false;
      }
    },

    async loadPersonas() {
      const data = await getProfiles(this.simulationId);
      this.personas.items = data.personas || data.items || data.profiles || [];
      this.persist();
      return data;
    },

    addVariant(variant) {
      const apiVariant = toApiVariant({
        ...variant,
        variant_id: variant.variant_id || `v${Date.now()}`,
      });
      this.variants.push(apiVariant);
      this.persist();
    },

    updateVariant(id, payload) {
      const index = this.variants.findIndex((variant) => variant.variant_id === id);
      if (index === -1) return;
      this.variants[index] = toApiVariant({
        ...this.variants[index],
        ...payload,
        variant_id: id,
      });
      this.persist();
    },

    deleteVariant(id) {
      this.variants = this.variants.filter((variant) => variant.variant_id !== id);
      this.persist();
    },

    async startAbTest() {
      if (!this.canStartSimulation) {
        throw new Error("Create 2 to 3 variants before starting the A/B simulation.");
      }

      this.simulationRun.loading = true;
      this.simulationRun.error = null;
      try {
        const data = await startAbTestApi({
          simulation_id: this.simulationId,
          variants: this.variants.map(toApiVariant),
        });
        this.simulationRun.runId = data.run_id;
        this.simulationRun.status = data.status || "running";
        this.simulationRun.progress = 0;
        this.simulationRun.variants = this.variants.map((variant) => ({
          variant_id: variant.variant_id,
          variant_name: variant.variant_name,
          status: "pending",
          progress: 0,
        }));
        this.project = { ...(this.project || {}), status: "running" };
        this.persist();
        return data;
      } catch (error) {
        this.simulationRun.error = normalizeError(error, "Simulation failed to start.");
        throw error;
      } finally {
        this.simulationRun.loading = false;
      }
    },

    async pollSimulationStatus() {
      if (!this.simulationId) return null;
      this.simulationRun.loading = true;
      try {
        const data = await getSimulationRunStatus(this.simulationId, this.simulationRun.runId);
        this.simulationRun.status = data.status || "running";
        this.simulationRun.progress = data.progress || 0;
        this.simulationRun.variants = data.variants || [];
        if (data.run_id) this.simulationRun.runId = data.run_id;
        if (data.status === "completed") {
          this.project = { ...(this.project || {}), status: "completed" };
          await this.loadVariantResults();
        }
        this.persist();
        return data;
      } catch (error) {
        this.simulationRun.error = normalizeError(error, "Could not refresh simulation status.");
        throw error;
      } finally {
        this.simulationRun.loading = false;
      }
    },

    async stopSimulation() {
      try {
        const data = await stopSimulationApi({
          simulation_id: this.simulationId,
          run_id: this.simulationRun.runId,
        });
        this.simulationRun.status = data.status || "stopped";
        this.persist();
        return data;
      } catch (error) {
        this.simulationRun.error = normalizeError(error, "Could not stop simulation.");
        throw error;
      }
    },

    async loadVariantResults() {
      const variantIds = this.variants.map((variant) => variant.variant_id);
      const results = await Promise.all(variantIds.map((id) => getVariantResults(id)));
      this.simulationRun.results = results.filter(Boolean);
      this.persist();
      return this.simulationRun.results;
    },

    async generateReport() {
      if (!this.simulationCompleted) {
        this.report.error = "Complete a simulation before generating the report.";
        return null;
      }

      this.report.loading = true;
      this.report.error = null;
      try {
        const seed = await generateReportApi({
          simulation_id: this.simulationId,
          run_id: this.simulationRun.runId,
          variant_ids: this.variants.map((variant) => variant.variant_id),
        });
        this.reportId = seed.report_id;
        const report = await this.loadReport(seed.report_id);
        this.persist();
        return report;
      } catch (error) {
        this.report.error = normalizeError(error, "Report generation failed.");
        throw error;
      } finally {
        this.report.loading = false;
      }
    },

    async loadReport(reportId = this.reportId) {
      try {
        const report = await getReport(reportId);
        this.report.data = report;
        this.reportId = report.report_id || reportId;
        this.persist();
        return report;
      } catch (error) {
        this.report.error = normalizeError(error, "Could not load report.");
        throw error;
      }
    },

    async interviewPersona(personaId, question) {
      if (!this.report.data || this.personas.items.length === 0) {
        throw new Error("Generate a report and personas before interviewing personas.");
      }
      const userMessage = {
        role: "user",
        persona_id: personaId,
        content: question,
        created_at: new Date().toISOString(),
      };
      this.interviewMessages.push(userMessage);
      const answer = await interviewPersonaApi({
        simulation_id: this.simulationId,
        report_id: this.reportId,
        persona_id: personaId,
        question,
      });
      this.interviewMessages.push({
        role: "assistant",
        persona_id: answer.persona_id,
        persona_name: answer.persona_name,
        content: answer.answer,
        created_at: new Date().toISOString(),
      });
      this.persist();
      return answer;
    },

    async loadHistory() {
      this.history.loading = true;
      this.history.error = null;
      try {
        const data = await getHistory();
        this.history.items = data.items || data.history || [];
        this.persist();
        return data;
      } catch (error) {
        this.history.error = normalizeError(error, "Could not load campaign history.");
        throw error;
      } finally {
        this.history.loading = false;
      }
    },

    goToStep(stepNumber) {
      if (!this.canNavigateToStep(stepNumber) && stepNumber !== this.currentStep) {
        const notices = {
          2: "Upload a brand brief and build the graph before continuing.",
          3: "Generate personas before defining campaign variants.",
          4: "Start and complete a simulation before opening the report.",
          5: "Generate the recommendation report before interviewing personas.",
        };
        this.setNotice(notices[stepNumber] || "Complete the previous step first.");
        return false;
      }
      this.currentStep = stepNumber;
      this.persist();

      const routeName = router.currentRoute.value.name;
      const workflowShellRoutes = new Set(["report", "interaction", "simulation-run"]);
      if (workflowShellRoutes.has(routeName)) {
        router.push({ name: "process" });
      }

      return true;
    },

    resetProject() {
      this.currentStep = 1;
      this.notice = null;
      this.project = null;
      this.simulationId = null;
      this.graphId = null;
      this.reportId = null;
      this.uploadedFile = null;
      this.graph = { nodes: [], edges: [], loading: false, error: null, progress: 0, statusText: "" };
      this.personas = { items: [], loading: false, error: null, progress: 0 };
      this.variants = [];
      this.simulationRun = {
        runId: null,
        status: "idle",
        progress: 0,
        variants: [],
        results: [],
        loading: false,
        error: null,
      };
      this.report = { data: null, loading: false, error: null };
      this.interviewMessages = [];
      [PROJECT_KEY, STEP_KEY, VARIANTS_KEY, MOCK_STATE_KEY].forEach((key) => localStorage.removeItem(key));
    },
  },
});
