const svg = d3.select("#chart");
const width = +svg.attr("width");
const height = +svg.attr("height");

let array = [];
let arr = [];
let stopRequested = false;
let isPaused = false;
let currentI = 0;
let currentJ = 0;
let isSorting = false;
let minIdx = 0;
let history = [];
let is3D = false;
let swapCount = 0;
let startTime = 0;

// Add gradient definition
const defs = svg.append("defs");
const gradient = defs.append("linearGradient")
  .attr("id", "barGradient")
  .attr("x1", "0%").attr("y1", "0%")
  .attr("x2", "0%").attr("y2", "100%");
gradient.append("stop").attr("offset", "0%").attr("stop-color", "#ffdb92");
gradient.append("stop").attr("offset", "100%").attr("stop-color", "#b58900");

// Generate array and reset everything
function generateArray() {
  const size = parseInt(document.getElementById("arraySize").value);
  array = Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
  arr = [...array];
  currentI = 0;
  currentJ = 0;
  minIdx = 0;
  stopRequested = false;
  isPaused = false;
  isSorting = false;
  history = [];
  document.getElementById("rewindControl").value = 0;
  swapCount = 0;
  startTime = Date.now();
  updateMetrics();
  drawArray(array);
  document.getElementById("status").textContent = "New array generated. Click “Run Selection Sort” to start.";
}

// Draw the bars and labels
function drawArray(data, currentIdx = -1, minIdx = -1, sortedUpto = -1) {
  svg.selectAll("*:not(defs)").remove();
  const gap = 3;
  const barWidth = (width / data.length) - gap;

  svg.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", (_, i) => {
      let cls = "bar";
      if (i <= sortedUpto) cls += " sorted";
      else if (i === minIdx) cls += " min";
      else if (i === currentIdx) cls += " current";
      return is3D ? cls + " three-d" : cls;
    })
    .attr("x", (_, i) => i * (barWidth + gap) + gap / 2)
    .attr("y", d => height - d * 3)
    .attr("width", barWidth)
    .attr("height", d => d * 3)
    .attr("fill", "url(#barGradient)");

  svg.selectAll(".label")
    .data(data)
    .enter()
    .append("text")
    .attr("x", (_, i) => i * (barWidth + gap) + (barWidth + gap) / 2)
    .attr("y", d => height - d * 3 - 5)
    .attr("text-anchor", "middle")
    .attr("fill", "#1f2937")
    .attr("font-size", "12px")
    .text(d => d);
}

// Update swaps and time
function updateMetrics() {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  document.getElementById("metrics").textContent = `🔁 Swaps: ${swapCount} | ⏱️ Time: ${elapsed}s`;
}

// Reapply previous state
function saveHistory() {
  history.push([...arr]);
  const rewindSlider = document.getElementById("rewindControl");
  rewindSlider.max = history.length - 1;
}

document.getElementById("rewindControl").addEventListener("input", function () {
  const idx = parseInt(this.value);
  if (idx < history.length) {
    arr = [...history[idx]];
    drawArray(arr);
    document.getElementById("status").textContent = `⏪ Rewound to step ${idx}`;
  }
});

// Toggle 2D/3D view
document.getElementById("toggleView").addEventListener("click", () => {
  is3D = !is3D;
  drawArray(arr);
});

// 🌗 Toggle Dark Mode on switch toggle
document.getElementById("themeSwitch").addEventListener("change", function () {
  document.body.classList.toggle("dark-mode");
});

// Delay based on speed slider (reversed: higher = faster)
function delay() {
  const raw = parseInt(document.getElementById("speedControl").value);
  const adjusted = 2100 - raw;
  return new Promise(resolve => setTimeout(resolve, adjusted));
}

// Stop or resume sorting
function stopOrResumeSort() {
  const stopButton = document.getElementById("stopButton");
  if (!isPaused) {
    stopRequested = true;
    isPaused = true;
    stopButton.textContent = "▶️ Resume";
    document.getElementById("status").textContent = "⏸ Sorting paused. Click 'Resume' to continue.";
  } else {
    stopRequested = false;
    isPaused = false;
    stopButton.textContent = "⛔ Stop";
    document.getElementById("status").textContent = "▶ Resuming sort...";
    if (!isSorting) {
      selectionSort();
    }
  }
}

// Main Selection Sort algorithm
async function selectionSort() {
  if (isSorting) return;
  isSorting = true;
  const n = arr.length;
  const status = document.getElementById("status");

  for (let i = currentI; i < n - 1; i++) {
    currentI = i;
    if (stopRequested) {
      isSorting = false;
      return;
    }

    if (currentJ === 0) minIdx = i;
    status.textContent = `Looking for the smallest element from index ${i} to ${n - 1}`;
    drawArray(arr, i, minIdx, i - 1);
    saveHistory();
    await delay();

    for (let j = currentJ || i + 1; j < n; j++) {
      currentJ = j;
      if (stopRequested) {
        isSorting = false;
        return;
      }

      drawArray(arr, j, minIdx, i - 1);
      saveHistory();
      await delay();

      if (arr[j] < arr[minIdx]) {
        minIdx = j;
        status.textContent = `New minimum found at index ${j} (Value: ${arr[j]})`;
        drawArray(arr, j, minIdx, i - 1);
        saveHistory();
        await delay();
      }
    }

    currentJ = 0;

    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      swapCount++;
      updateMetrics();
      status.textContent = `Swapped elements at index ${i} and ${minIdx}`;
      drawArray(arr, i, minIdx, i - 1);
      saveHistory();
      await delay();
    }

    drawArray(arr, -1, -1, i);
    saveHistory();
  }

  drawArray(arr, -1, -1, n - 1);
  status.textContent = "✅ Array is now fully sorted!";
  currentI = 0;
  currentJ = 0;
  isSorting = false;
}

// Auto-generate array on page load
generateArray();
