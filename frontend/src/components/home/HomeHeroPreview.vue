<template>
  <div
    class="home-preview"
    data-testid="home-hero-preview"
    aria-hidden="true"
  >
    <span class="home-preview__label">Live workflow preview</span>

    <div class="home-preview__graph">
      <svg
        class="home-preview__graph-svg"
        viewBox="0 0 280 120"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <line class="home-preview__edge" x1="72" y1="38" x2="140" y2="28" />
        <line class="home-preview__edge" x1="140" y1="28" x2="208" y2="42" />
        <line class="home-preview__edge" x1="72" y1="38" x2="56" y2="78" />
        <line class="home-preview__edge" x1="140" y1="28" x2="132" y2="82" />
        <line class="home-preview__edge" x1="208" y1="42" x2="224" y2="88" />
        <line class="home-preview__edge" x1="56" y1="78" x2="132" y2="82" />
        <line class="home-preview__edge" x1="132" y1="82" x2="224" y2="88" />
        <circle class="home-preview__node" cx="72" cy="38" r="10" fill="rgba(99,102,241,0.35)" stroke="#818cf8" stroke-width="1.5" />
        <circle class="home-preview__node" cx="140" cy="28" r="12" fill="rgba(6,182,212,0.25)" stroke="#22d3ee" stroke-width="1.5" />
        <circle class="home-preview__node" cx="208" cy="42" r="9" fill="rgba(99,102,241,0.3)" stroke="#818cf8" stroke-width="1.5" />
        <circle class="home-preview__node" cx="56" cy="78" r="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" />
        <circle class="home-preview__node" cx="132" cy="82" r="10" fill="rgba(52,211,153,0.2)" stroke="#34d399" stroke-width="1.5" />
        <circle class="home-preview__node" cx="224" cy="88" r="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" />
      </svg>
    </div>

    <div class="home-preview__stepper" role="presentation">
      <div
        v-for="(label, index) in stepLabels"
        :key="label"
        class="home-preview__step"
        :class="{
          'home-preview__step--done': index < activeStep,
          'home-preview__step--active': index === activeStep,
        }"
      >
        <span class="home-preview__step-dot" />
        <span class="home-preview__step-label">{{ label }}</span>
      </div>
    </div>

    <div class="home-preview__metrics" role="presentation">
      <div class="home-preview__metric">
        <span class="home-preview__metric-value home-preview__metric-value--win">+24%</span>
        <span class="home-preview__metric-label">Winner lift</span>
      </div>
      <div class="home-preview__metric">
        <span class="home-preview__metric-value">A</span>
        <span class="home-preview__metric-label">Top variant</span>
      </div>
      <div class="home-preview__metric">
        <span class="home-preview__metric-value">5</span>
        <span class="home-preview__metric-label">Steps done</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stepLabels: {
    type: Array,
    default: () => ["Graph", "Personas", "Variants", "Report", "Chat"],
  },
  activeStep: {
    type: Number,
    default: 3,
  },
});
</script>
