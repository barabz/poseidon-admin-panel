// assets/js/monitoring-ranges.js
// Displays Normal / Near-Critical / Critical ranges above the trend chart,
// based on the selected metric and the pond's thresholds.

(function () {
  const legendEl = document.getElementById("metricRangeLegend");
  if (!legendEl) return;

  function fmt(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return String(n ?? "--");
    // Keep it clean: pH/DO usually 2 decimals, temp often 1; but we don't know metric here.
    // We'll just trim trailing zeros via parseFloat.
    return String(parseFloat(x.toFixed(2)));
  }

  function buildRangeHTML(metric, thresholds) {
    if (!thresholds) return "No thresholds defined.";

    let min, max, unit = "";

    if (metric === "ph") {
      min = thresholds.phMin;
      max = thresholds.phMax;
    } else if (metric === "do") {
      min = thresholds.doMin;
      max = thresholds.doMax;
      unit = " mg/L";
    } else if (metric === "temp") {
      min = thresholds.tempMin;
      max = thresholds.tempMax;
      unit = " °C";
    } else {
      return "Select a metric to view safe and critical ranges.";
    }

    if (min == null || max == null) return "No thresholds defined.";

    const a = Number(min), b = Number(max);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b) return "Invalid thresholds.";

    const range = b - a;
    const buffer = Math.max(range * 0.10, 0.01); // 10% band = near-critical
    const nearLowMax = a + buffer;
    const nearHighMin = b - buffer;

    return `
      <div class="leading-5">
        <span class="font-semibold text-green-700">Normal:</span>
        ${fmt(a)} – ${fmt(b)}${unit}
        <span class="text-gray-300 px-2">|</span>
        <span class="font-semibold text-yellow-700">Near-critical:</span>
        ${fmt(a)} – ${fmt(nearLowMax)}${unit} &nbsp;|&nbsp; ${fmt(nearHighMin)} – ${fmt(b)}${unit}
        <span class="text-gray-300 px-2">|</span>
        <span class="font-semibold text-red-700">Critical:</span>
        &lt; ${fmt(a)}${unit} or &gt; ${fmt(b)}${unit}
      </div>
    `;
  }

  // Expose updater so monitoring.js can call it
  window.updateMetricRangeLegend = function (metric, thresholds) {
    legendEl.innerHTML = buildRangeHTML(metric, thresholds);
  };
})();
