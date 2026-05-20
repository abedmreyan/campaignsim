<template>
  <div class="graph-shell">
    <div class="graph-toolbar">
      <label>
        <span>Search</span>
        <input v-model="query" type="search" placeholder="Find nodes" />
      </label>
      <label>
        <span>Type</span>
        <select v-model="selectedType">
          <option value="">All types</option>
          <option v-for="type in entityTypes" :key="type" :value="type">{{ type }}</option>
        </select>
      </label>
    </div>
    <div ref="container" class="graph-panel"></div>
    <div class="graph-legend">
      <span v-for="type in entityTypes" :key="type">
        <i :style="{ backgroundColor: colorFor(type) }"></i>{{ type }}
      </span>
    </div>
    <p v-if="activeNode" class="eyebrow" style="margin-top: 0.75rem">
      Selected: {{ activeNode.label }} — click node for details panel
    </p>
  </div>
</template>

<script setup>
import * as d3 from "d3";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  nodes: {
    type: Array,
    default: () => [],
  },
  edges: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["select-node"]);

const container = ref(null);
const query = ref("");
const selectedType = ref("");
const activeNode = ref(null);
const focusNodeId = ref(null);

const colors = {
  Brand: "#818cf8",
  Product: "#34d399",
  CustomerPersona: "#fbbf24",
  MarketingChannel: "#a78bfa",
  ContentFormat: "#f87171",
  Campaign: "#22d3ee",
  Competitor: "#fb7185",
  Influencer: "#e879f9",
  Market: "#94a3b8",
};

const entityTypes = computed(() => [...new Set(props.nodes.map((node) => node.type))]);
const visibleNodes = computed(() =>
  props.nodes.filter((node) => {
    const matchesType = selectedType.value ? node.type === selectedType.value : true;
    const matchesQuery = query.value
      ? node.label.toLowerCase().includes(query.value.toLowerCase())
      : true;
    return matchesType && matchesQuery;
  }),
);
const visibleEdges = computed(() => {
  const ids = new Set(visibleNodes.value.map((node) => node.id));
  return props.edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target));
});

function colorFor(type) {
  return colors[type] || "#64748b";
}

function neighborIds(nodeId, links) {
  const ids = new Set([nodeId]);
  links.forEach((edge) => {
    const sourceId = edge.source?.id ?? edge.source;
    const targetId = edge.target?.id ?? edge.target;
    if (sourceId === nodeId) ids.add(targetId);
    if (targetId === nodeId) ids.add(sourceId);
  });
  return ids;
}

function render() {
  if (!container.value) return;
  d3.select(container.value).selectAll("*").remove();
  const width = container.value.clientWidth || 740;
  const height = 480;
  const nodes = visibleNodes.value.map((node) => ({ ...node }));
  const links = visibleEdges.value.map((edge) => ({ ...edge }));

  if (!nodes.length) return;

  const svg = d3
    .select(container.value)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr("aria-label", "Marketing knowledge graph");

  const defs = svg.append("defs");
  const edgeGradient = defs
    .append("linearGradient")
    .attr("id", "graph-edge-glow")
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", width)
    .attr("y2", height);
  edgeGradient.append("stop").attr("offset", "0%").attr("stop-color", "#6366f1");
  edgeGradient.append("stop").attr("offset", "100%").attr("stop-color", "#06b6d4");

  const nodeGlow = defs.append("filter").attr("id", "node-glow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
  nodeGlow.append("feGaussianBlur").attr("stdDeviation", "3.5").attr("result", "blur");
  const merge = nodeGlow.append("feMerge");
  merge.append("feMergeNode").attr("in", "blur");
  merge.append("feMergeNode").attr("in", "SourceGraphic");

  const layer = svg.append("g");
  svg.call(
    d3.zoom().scaleExtent([0.5, 2.5]).on("zoom", (event) => {
      layer.attr("transform", event.transform);
    }),
  );

  const tooltip = d3
    .select(container.value)
    .append("div")
    .attr("class", "graph-tooltip")
    .style("opacity", 0);

  const simulation = d3
    .forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((node) => node.id).distance(115))
    .force("charge", d3.forceManyBody().strength(-360))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius((node) => 28 + Number(node.degree || 1)));

  const link = layer
    .append("g")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("class", "graph-edge")
    .attr("stroke", "url(#graph-edge-glow)")
    .attr("stroke-width", (edge) => Math.max(1.2, (edge.weight || 1) * 1.1));

  const label = layer
    .append("g")
    .selectAll("text")
    .data(links)
    .join("text")
    .attr("class", "graph-edge-label")
    .text((edge) => edge.type);

  const node = layer
    .append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", "graph-node")
    .call(
      d3
        .drag()
        .on("start", (event) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        })
        .on("drag", (event) => {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        })
        .on("end", (event) => {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }),
    );

  node
    .append("circle")
    .attr("r", (item) => 13 + Number(item.degree || 1) * 2)
    .attr("fill", (item) => colorFor(item.type))
    .attr("stroke", "rgba(15, 17, 24, 0.9)")
    .attr("stroke-width", 2);

  node
    .append("text")
    .attr("x", 16)
    .attr("y", 4)
    .text((item) => item.label);

  function applyFocus(focusId) {
    const highlighted = focusId ? neighborIds(focusId, links) : null;
    node.classed("is-selected", (d) => d.id === focusId);
    node.classed("is-dimmed", (d) => (highlighted ? !highlighted.has(d.id) : false));
    link.classed("is-dimmed", (d) => {
      if (!highlighted) return false;
      const sourceId = d.source?.id ?? d.source;
      const targetId = d.target?.id ?? d.target;
      return !highlighted.has(sourceId) || !highlighted.has(targetId);
    });
    node.select("circle").attr("filter", (d) => (d.id === focusId ? "url(#node-glow)" : null));
  }

  node
    .on("mouseenter", (event, item) => {
      focusNodeId.value = item.id;
      applyFocus(item.id);
      tooltip
        .style("opacity", 1)
        .style("left", `${event.offsetX + 14}px`)
        .style("top", `${event.offsetY + 14}px`)
        .html(`<strong>${item.label}</strong><br>${item.type}`);
    })
    .on("mouseleave", () => {
      tooltip.style("opacity", 0);
      if (activeNode.value) {
        applyFocus(activeNode.value.id);
      } else {
        focusNodeId.value = null;
        applyFocus(null);
      }
    })
    .on("click", (_event, item) => {
      activeNode.value = item;
      emit("select-node", item);
      applyFocus(item.id);
    });

  if (activeNode.value) {
    applyFocus(activeNode.value.id);
  }

  simulation.on("tick", () => {
    link
      .attr("x1", (edge) => edge.source.x)
      .attr("y1", (edge) => edge.source.y)
      .attr("x2", (edge) => edge.target.x)
      .attr("y2", (edge) => edge.target.y);

    label
      .attr("x", (edge) => (edge.source.x + edge.target.x) / 2)
      .attr("y", (edge) => (edge.source.y + edge.target.y) / 2);

    node.attr("transform", (item) => `translate(${item.x},${item.y})`);
  });
}

watch([visibleNodes, visibleEdges], () => nextTick(render), { deep: true });
onMounted(() => nextTick(render));
onBeforeUnmount(() => d3.select(container.value).selectAll("*").remove());
</script>
