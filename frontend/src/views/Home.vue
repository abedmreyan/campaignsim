<template>
  <div class="home-page" data-step="0" data-status="idle">
    <header class="home-header">
      <div class="brand">
        <span>CS</span>
        <strong>CampaignSim</strong>
      </div>
      <div class="home-header__actions">
        <div
          v-if="isMockMode"
          class="demo-chip"
          title="Responses come from the built-in mock API. Set VITE_USE_MOCKS=false to use a live backend."
        >
          <span class="demo-chip__dot" aria-hidden="true" />
          <span class="demo-chip__label">Demo mode</span>
          <span class="demo-chip__hint">Instant mock data</span>
        </div>
        <StatusBadge v-else :status="apiStatus" :label="statusLabel" />
        <RouterLink class="history-link" to="/history">History</RouterLink>
        <RouterLink
          class="app-button app-button--primary home-header__cta"
          to="/process"
        >
          Start simulation
        </RouterLink>
      </div>
    </header>

    <main class="home-main stagger-in">
      <section class="home-hero-split" aria-labelledby="home-hero-title">
        <div class="home-hero-split__copy">
          <p class="eyebrow">Campaign intelligence for thesis demos</p>
          <h1 id="home-hero-title">See which campaign wins before you launch.</h1>
          <p class="home-hero-split__lead">
            Upload a brand brief, build a knowledge graph and synthetic audience, run A/B
            simulations, and export a ranked report—with persona interviews on the winning
            variant.
          </p>
          <div class="home-proof" aria-label="Product highlights">
            <span>Mock-ready demo</span>
            <span>Knowledge graph</span>
            <span>Exportable report</span>
          </div>
          <div class="home-hero-split__actions">
            <RouterLink class="app-button app-button--primary app-button--lg" to="/process">
              Start simulation
            </RouterLink>
            <RouterLink class="app-button app-button--secondary" to="/history">
              View history
            </RouterLink>
          </div>
        </div>
        <div class="home-hero-split__preview-wrap">
          <HomeHeroPreview :step-labels="previewStepLabels" :active-step="3" />
        </div>
      </section>

      <HomeEntryBridge />

      <section class="home-transform" aria-labelledby="home-transform-title">
        <h2 id="home-transform-title">From guesswork to evidence</h2>
        <div class="home-transform__grid">
          <div class="home-transform__col">
            <h3>Without simulation</h3>
            <ul>
              <li>Launch budgets on gut feel and fragmented briefs.</li>
              <li>No shared view of audience segments or message fit.</li>
            </ul>
          </div>
          <div class="home-transform__col home-transform__col--highlight">
            <h3>With CampaignSim</h3>
            <ul>
              <li>Structured graph from your PDF or text upload.</li>
              <li>Personas and variants tested in one connected workflow.</li>
            </ul>
          </div>
          <div class="home-transform__col">
            <h3>What you get</h3>
            <ul>
              <li>Ranked variants with engagement and segment breakdowns.</li>
              <li>Interview winning personas and export stakeholder-ready insights.</li>
            </ul>
          </div>
        </div>
      </section>

      <HomeWorkflowJourney :steps="workflowSteps" />

      <section class="home-bento" aria-labelledby="home-bento-title">
        <h2 id="home-bento-title">Built for the full campaign loop</h2>
        <div class="home-bento__grid">
          <article
            v-for="cap in capabilities"
            :key="cap.title"
            class="home-bento__tile"
          >
            <div class="home-bento__icon" aria-hidden="true">
              <component :is="cap.icon" />
            </div>
            <div>
              <h3>{{ cap.title }}</h3>
              <p>{{ cap.description }}</p>
            </div>
          </article>
        </div>
      </section>

      <section class="home-close" aria-labelledby="home-close-title">
        <h2 id="home-close-title">Ready to run your first simulation?</h2>
        <p>Open the workflow with mock data—no backend required—or connect a live API when you are ready.</p>
        <div class="home-close__actions">
          <RouterLink class="app-button app-button--primary app-button--lg" to="/process">
            Start simulation
          </RouterLink>
          <RouterLink class="app-button app-button--secondary" to="/history">
            View history
          </RouterLink>
        </div>
      </section>

      <p v-if="isMockMode" class="home-footer-note">
        Demo runs in mock mode by default. Set <code>VITE_USE_MOCKS=false</code> in
        <code>.env</code> to connect a live API.
      </p>
    </main>
  </div>
</template>

<script setup>
import { computed, h, onMounted, ref } from "vue";
import StatusBadge from "@/components/common/StatusBadge.vue";
import HomeEntryBridge from "@/components/home/HomeEntryBridge.vue";
import HomeHeroPreview from "@/components/home/HomeHeroPreview.vue";
import HomeWorkflowJourney from "@/components/home/HomeWorkflowJourney.vue";
import { healthCheck, isMockMode } from "@/api/campaignApi";

const apiStatus = ref("pending");
const statusLabel = computed(() => {
  if (isMockMode) return "Mock mode";
  return apiStatus.value === "completed" ? "API healthy" : "API pending";
});

const previewStepLabels = ["Graph", "Personas", "Variants", "Report", "Chat"];

const workflowSteps = [
  {
    n: 1,
    title: "Knowledge Graph",
    detail: "Extract entities and relationships from your brand brief.",
  },
  {
    n: 2,
    title: "Audience Personas",
    detail: "Build segment-aware synthetic customers at scale.",
  },
  {
    n: 3,
    title: "Campaign Variants",
    detail: "Draft message variants across channels for testing.",
  },
  {
    n: 4,
    title: "Insights Report",
    detail: "Rank variants with engagement and segment breakdowns.",
  },
  {
    n: 5,
    title: "Persona Insights",
    detail: "Interview winning personas and export findings.",
  },
];

const iconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  "aria-hidden": "true",
};

const IconGraph = () =>
  h("svg", iconProps, [
    h("circle", { cx: "6", cy: "6", r: "2.5" }),
    h("circle", { cx: "18", cy: "8", r: "2.5" }),
    h("circle", { cx: "12", cy: "18", r: "2.5" }),
    h("path", { d: "M8 7l4 9M16 9l-2 7" }),
  ]);

const IconUsers = () =>
  h("svg", iconProps, [
    h("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
    h("circle", { cx: "9", cy: "7", r: "3" }),
    h("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
    h("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" }),
  ]);

const IconZap = () =>
  h("svg", iconProps, [
    h("path", { d: "M13 2 3 14h9l-1 8 10-12h-9l1-8z" }),
  ]);

const IconChart = () =>
  h("svg", iconProps, [
    h("path", { d: "M3 3v18h18" }),
    h("path", { d: "M7 16v-5M12 16V8M17 16v-9" }),
  ]);

const capabilities = [
  {
    title: "Knowledge graph extraction",
    description:
      "Turn PDFs and text briefs into a searchable graph of brand entities, claims, and relationships.",
    icon: IconGraph,
  },
  {
    title: "Synthetic persona panel",
    description:
      "Generate segment-aware audiences grounded in your uploaded context—not generic personas.",
    icon: IconUsers,
  },
  {
    title: "A/B simulation run",
    description:
      "Compare variants with live-style progress, per-variant metrics, and mission-control visibility.",
    icon: IconZap,
  },
  {
    title: "Report and persona chat",
    description:
      "Surface a ranked winner with charts, then interview personas on the winning message.",
    icon: IconChart,
  },
];

onMounted(async () => {
  if (isMockMode) {
    apiStatus.value = "completed";
    return;
  }
  try {
    await healthCheck();
    apiStatus.value = "completed";
  } catch {
    apiStatus.value = "failed";
  }
});
</script>
