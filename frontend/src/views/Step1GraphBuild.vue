<template>
  <div class="view-stack stagger-in">
    <PageHeader
      title="Knowledge Graph"
      eyebrow="Step 1"
      description="Upload a brand brief and build an explorable entity graph for downstream persona and variant generation."
    />

    <div class="step1-layout">
      <AppCard title="Brand brief" eyebrow="Upload">
        <label class="upload-zone">
          <input type="file" accept=".pdf,.txt,application/pdf,text/plain" @change="onFileChange" />
          <strong>Drop a PDF or TXT brand brief</strong>
          <span>Or click to browse — mock mode returns contract-ready IDs instantly.</span>
          <div class="file-chips">
            <span>PDF</span>
            <span>TXT</span>
          </div>
        </label>

        <div class="upload-summary" style="margin-top: 1rem">
          <EmptyState
            v-if="!selectedFile && !store.uploadedFile"
            title="Ready for a brief"
            message="Upload a brand brief to start building your marketing knowledge graph."
          />
          <div v-else>
            <p class="eyebrow">Selected file</p>
            <h3>{{ selectedFile?.name || store.uploadedFile?.filename }}</h3>
            <p>{{ readableSize(selectedFile?.size || store.uploadedFile?.size_bytes) }}</p>
          </div>
        </div>

        <div class="action-row" style="margin-top: 1rem">
          <AppButton :loading="store.graph.loading" @click="upload">Upload brief</AppButton>
          <AppButton variant="secondary" :disabled="!store.graphId" :loading="store.graph.loading" @click="prepare">
            Build graph
          </AppButton>
        </div>

        <div class="task-timeline">
          <div class="task-timeline__item" :class="timelineClass(0)">
            <span class="task-timeline__dot" />
            <div>
              <strong>Upload brief</strong>
              <span>{{ store.uploadedFile ? "File received" : "Waiting for file" }}</span>
            </div>
          </div>
          <div class="task-timeline__item" :class="timelineClass(1)">
            <span class="task-timeline__dot" />
            <div>
              <strong>Extract entities</strong>
              <span>{{ store.graphId ? "Graph ID assigned" : "Pending upload" }}</span>
            </div>
          </div>
          <div class="task-timeline__item" :class="timelineClass(2)">
            <span class="task-timeline__dot" />
            <div>
              <strong>Build relations</strong>
              <span>{{ store.graph.loading ? "In progress…" : store.graph.nodes.length ? "Complete" : "Queued" }}</span>
            </div>
          </div>
          <div class="task-timeline__item" :class="timelineClass(3)">
            <span class="task-timeline__dot" />
            <div>
              <strong>Graph ready</strong>
              <span>{{ store.graphReady ? "Explore visualization →" : "Awaiting build" }}</span>
            </div>
          </div>
        </div>

        <div v-if="store.graph.loading || store.graph.progress" class="progress-block">
          <div class="progress-bar">
            <span :style="{ width: `${store.graph.progress || 8}%` }"></span>
          </div>
          <p>{{ store.graph.statusText || "Preparing graph data…" }}</p>
        </div>

        <ErrorState v-if="store.graph.error" :message="store.graph.error" />
      </AppCard>

      <AppCard title="Graph visualization" eyebrow="D3">
        <template #header>
          <AppButton v-if="store.graphReady" size="sm" @click="store.goToStep(2)">Continue</AppButton>
        </template>
        <AppLoader v-if="store.graph.loading && !store.graph.nodes.length" label="Building graph…" />
        <EmptyState
          v-else-if="!store.graph.nodes.length"
          title="No graph yet"
          message="Upload and build a graph to explore brand entities and relationships."
        />
        <GraphPanel
          v-else
          :nodes="store.graph.nodes"
          :edges="store.graph.edges"
          @select-node="selectedNode = $event"
        />
      </AppCard>
    </div>

    <DrawerPanel
      :open="Boolean(selectedNode)"
      :title="selectedNode?.label || 'Node'"
      :eyebrow="selectedNode?.type"
      @close="selectedNode = null"
    >
      <template v-if="selectedNode">
        <p class="lead">{{ selectedNode.type }}</p>
        <dl style="margin-top: 1rem; display: grid; gap: 0.65rem">
          <div v-for="(value, key) in selectedNode.attributes" :key="key">
            <dt style="font-size: 0.72rem; color: var(--color-text-subtle); text-transform: uppercase">
              {{ key }}
            </dt>
            <dd style="margin: 0.2rem 0 0; font-weight: 600">
              {{ Array.isArray(value) ? value.join(", ") : value }}
            </dd>
          </div>
        </dl>
      </template>
    </DrawerPanel>
  </div>
</template>

<script setup>
import { ref } from "vue";
import AppButton from "@/components/common/AppButton.vue";
import AppCard from "@/components/common/AppCard.vue";
import AppLoader from "@/components/common/AppLoader.vue";
import DrawerPanel from "@/components/common/DrawerPanel.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import PageHeader from "@/components/common/PageHeader.vue";
import GraphPanel from "@/components/graph/GraphPanel.vue";
import { useCampaignStore } from "@/stores/campaignStore";

const store = useCampaignStore();
const selectedFile = ref(null);
const selectedNode = ref(null);

function onFileChange(event) {
  selectedFile.value = event.target.files?.[0] || null;
}

function readableSize(bytes = 0) {
  if (!bytes) return "Size unavailable";
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function timelineClass(index) {
  const uploaded = Boolean(store.uploadedFile || store.graphId);
  const building = store.graph.loading;
  const ready = store.graphReady;
  if (index === 0) return uploaded ? "is-done" : "";
  if (index === 1) return store.graphId ? "is-done" : building ? "is-active" : "";
  if (index === 2) return ready ? "is-done" : building ? "is-active" : store.graphId ? "is-active" : "";
  if (index === 3) return ready ? "is-done" : "";
  return "";
}

async function upload() {
  try {
    await store.uploadBrandBrief(selectedFile.value);
  } catch (error) {
    store.graph.error = error?.message || "Upload failed.";
  }
}

async function prepare() {
  await store.prepareGraph();
}
</script>
