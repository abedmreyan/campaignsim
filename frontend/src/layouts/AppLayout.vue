<template>
  <div
    class="app-shell"
    :data-step="store.currentStep"
    :data-status="store.shellAmbientStatus"
  >
    <header class="topbar">
      <RouterLink class="brand" to="/">
        <span>CS</span>
        <strong>CampaignSim</strong>
      </RouterLink>
      <div class="topbar__status">
        <StatusBadge :status="store.project?.status || 'draft'" :label="store.project?.status || 'Draft'" />
        <div
          v-if="store.isMockMode"
          class="demo-chip"
          title="Responses come from the built-in mock API. Set VITE_USE_MOCKS=false to use a live backend."
        >
          <span class="demo-chip__dot" aria-hidden="true" />
          <span class="demo-chip__label">Demo mode</span>
          <span class="demo-chip__hint">Instant mock data — no live API</span>
        </div>
        <StatusBadge v-else status="ready" label="Live API" />
        <RouterLink class="history-link" to="/history">History</RouterLink>
      </div>
    </header>

    <div v-if="store.notice" class="notice">{{ store.notice }}</div>

    <main class="dashboard-grid">
      <aside class="workflow-panel">
        <Stepper :current-step="store.currentStep" :steps="stepperSteps" @select="onSelectStep" />
      </aside>

      <section class="content-panel">
        <slot />
      </section>

      <aside class="command-card">
        <div class="command-card__head">
          <div>
            <p class="eyebrow">Project</p>
            <h2>{{ store.project?.name || "Campaign workspace" }}</h2>
          </div>
          <ProgressRing :percent="store.workflowProgressPercent" :size="52" />
        </div>
        <div class="command-card__stats">
          <StatusBadge :status="store.simulationRun.status" :label="simulationLabel" />
          <p class="command-card__activity" aria-live="polite">{{ store.shellActivityMessage }}</p>
          <div class="command-card__metrics">
            <MetricTile label="Personas" :value="store.personas.items.length" />
            <MetricTile label="Variants" :value="store.variants.length" />
            <MetricTile
              label="Simulation"
              :value="store.simulationRun.status"
              :hint="store.simulationRun.progress ? `${store.simulationRun.progress}%` : ''"
            />
          </div>
        </div>
        <div class="command-card__cta">
          <AppButton block @click="runCommandCta">{{ store.commandCtaLabel }}</AppButton>
        </div>
        <details class="command-card__ids">
          <summary>Technical IDs</summary>
          <dl>
            <div>
              <dt>Graph ID</dt>
              <dd>{{ store.graphId || "—" }}</dd>
            </div>
            <div>
              <dt>Simulation ID</dt>
              <dd>{{ store.simulationId || "—" }}</dd>
            </div>
            <div>
              <dt>Report ID</dt>
              <dd>{{ store.reportId || "—" }}</dd>
            </div>
          </dl>
        </details>
        <AppButton variant="ghost" size="sm" block style="margin-top: 0.75rem" @click="store.resetProject">
          Reset demo
        </AppButton>
      </aside>
    </main>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import AppButton from "@/components/common/AppButton.vue";
import MetricTile from "@/components/common/MetricTile.vue";
import ProgressRing from "@/components/common/ProgressRing.vue";
import StatusBadge from "@/components/common/StatusBadge.vue";
import Stepper from "@/components/common/Stepper.vue";
import { useCampaignStore } from "@/stores/campaignStore";

const store = useCampaignStore();
const router = useRouter();

const stepLabels = [
  { number: 1, label: "Knowledge Graph" },
  { number: 2, label: "Audience Personas" },
  { number: 3, label: "Campaign Variants" },
  { number: 4, label: "Insights Report" },
  { number: 5, label: "Persona Insights" },
];

const stepperSteps = computed(() =>
  stepLabels.map((step) => ({
    ...step,
    subtitle: store.stepStatuses[step.number],
    disabled: !store.canNavigateToStep(step.number) && step.number !== store.currentStep,
  })),
);

const simulationLabel = computed(() => {
  const status = store.simulationRun.status;
  if (status === "completed") return "Simulation complete";
  if (status === "running") return "Simulation running";
  return "Simulation idle";
});

function onSelectStep(step) {
  if (store.canNavigateToStep(step) || step === store.currentStep) {
    store.goToStep(step);
  }
}

async function runCommandCta() {
  const step = store.currentStep;
  if (step === 1 && !store.graphReady && store.graphId) {
    await store.prepareGraph();
    return;
  }
  if (step === 1 && store.graphReady) {
    store.goToStep(2);
    return;
  }
  if (step === 2 && !store.personas.items.length) {
    await store.generatePersonas(30);
    return;
  }
  if (step === 2) {
    store.goToStep(3);
    return;
  }
  if (step === 3 && store.canStartSimulation) {
    await store.startAbTest();
    router.push({ name: "simulation-run", params: { simulationId: store.simulationId } });
    return;
  }
  if (step === 4 && !store.report.data) {
    const report = await store.generateReport();
    router.push({ name: "report", params: { reportId: report.report_id } });
    return;
  }
  if (step === 4) {
    await store.goToStep(5);
    return;
  }
  store.goToStep(Math.min(5, step + 1));
}
</script>
