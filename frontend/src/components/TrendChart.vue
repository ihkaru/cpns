<template>
  <div class="chart-container" style="position: relative; width: 100%;">
    <svg :viewBox="`0 0 ${chartData.width} ${chartData.height}`" style="width: 100%; height: auto; display: block;">
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="gradientStartColor" />
          <stop offset="100%" :stop-color="gradientEndColor" />
        </linearGradient>
      </defs>

      <!-- Grid Y Lines -->
      <line :x1="chartData.paddingLeft" :y1="chartData.paddingTop" :x2="chartData.width - 20" :y2="chartData.paddingTop" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
      <line :x1="chartData.paddingLeft" :y1="chartData.paddingTop + chartData.chartHeight / 2" :x2="chartData.width - 20" :y2="chartData.paddingTop + chartData.chartHeight / 2" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
      <line :x1="chartData.paddingLeft" :y1="chartData.paddingTop + chartData.chartHeight" :x2="chartData.width - 20" :y2="chartData.paddingTop + chartData.chartHeight" stroke="rgba(255,255,255,0.1)" stroke-width="1" />

      <!-- Y Axis Labels -->
      <text :x="chartData.paddingLeft - 8" :y="chartData.paddingTop + 4" fill="var(--text-muted)" font-size="10" font-weight="700" text-anchor="end">{{ yLabels[0] }}</text>
      <text :x="chartData.paddingLeft - 8" :y="chartData.paddingTop + chartData.chartHeight / 2 + 4" fill="var(--text-muted)" font-size="10" font-weight="700" text-anchor="end">{{ yLabels[1] }}</text>
      <text :x="chartData.paddingLeft - 8" :y="chartData.paddingTop + chartData.chartHeight + 4" fill="var(--text-muted)" font-size="10" font-weight="700" text-anchor="end">{{ yLabels[2] }}</text>

      <!-- BKN Safe target line -->
      <line :x1="chartData.paddingLeft" :y1="chartData.targetY" :x2="chartData.width - 20" :y2="chartData.targetY" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4,4" />
      <text :x="chartData.width - 24" :y="chartData.targetY - 6" fill="#10b981" font-size="9" font-weight="800" text-anchor="end">{{ targetLabel }}</text>

      <!-- Filled Area Path -->
      <path :d="chartData.areaPath" :fill="`url(#${gradientId})`" />

      <!-- Main Line Stroke -->
      <path :d="chartData.linePath" fill="none" :stroke="lineColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Circles at Data Points -->
      <g v-for="(p, i) in chartData.points" :key="i">
        <circle :cx="p.x" :cy="p.y" r="5" fill="#121826" :stroke="lineColor" stroke-width="2.5" />
        <text :x="p.x" :y="p.y - 10" fill="#fff" font-size="9" font-weight="800" text-anchor="middle" font-family="monospace">
          {{ formatPointValue(p) }}
        </text>
        <text :x="p.x" :y="chartData.paddingTop + chartData.chartHeight + 16" fill="var(--text-muted)" font-size="8" font-weight="600" text-anchor="middle">
          {{ p.date }}
        </text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
interface ChartPoint {
  x: number;
  y: number;
  score?: number;
  latency?: number;
  date: string;
}

interface ChartData {
  points: ChartPoint[];
  linePath: string;
  areaPath: string;
  targetY: number;
  height: number;
  width: number;
  paddingLeft: number;
  paddingTop: number;
  chartWidth: number;
  chartHeight: number;
}

const props = defineProps<{
  chartData: ChartData;
  lineColor: string;
  gradientId: string;
  gradientStartColor: string;
  gradientEndColor: string;
  targetLabel: string;
  yLabels: string[];
  valueKey: 'score' | 'latency';
}>();

const formatPointValue = (p: ChartPoint) => {
  if (props.valueKey === 'latency') {
    return `${((p.latency ?? 0) / 1000).toFixed(2)}s`;
  }
  return p.score ?? 0;
};
</script>
