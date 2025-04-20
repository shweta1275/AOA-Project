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

// Add gradient definition
const defs = svg.append("defs");
const gradient = defs.append("linearGradient")
  .attr("id", "barGradient")
  .attr("x1", "0%").attr("y1", "0%")
  .attr("x2", "0%").attr("y2", "100%");
gradient.append("stop").attr("offset", "0%").attr("stop-color", "#ffdb92");
gradient.append("stop").attr("offset", "100%").attr("stop-color", "#b58900");

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
  drawArray(array);
  document.getElementById("status").textContent = "New array generated. Click “Run Selection Sort” to start.";
}

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

document.getElementById("toggleView").addEventListener("click", () => {
  is3D = !is3D;
  drawArray(arr); // Re-render with 3D or normal class
});

function getSpeed() {
  return parseInt(document.getElementById("speedControl").value);
}

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
    await delay(getSpeed());

    for (let j = currentJ || i + 1; j < n; j++) {
      currentJ = j;
      if (stopRequested) {
        isSorting = false;
        return;
      }

      drawArray(arr, j, minIdx, i - 1);
      saveHistory();
      await delay(getSpeed());

      if (arr[j] < arr[minIdx]) {
        minIdx = j;
        status.textContent = `New minimum found at index ${j} (Value: ${arr[j]})`;
        drawArray(arr, j, minIdx, i - 1);
        saveHistory();
        await delay(getSpeed());
      }
    }

    currentJ = 0;

    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      status.textContent = `Swapped elements at index ${i} and ${minIdx}`;
      drawArray(arr, i, minIdx, i - 1);
      saveHistory();
      await delay(getSpeed());
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

function delay() {
  const raw = parseInt(document.getElementById("speedControl").value);
  const adjusted = 2100 - raw; // Invert logic: 2000 = fast, 100 = slow
  return new Promise(resolve => setTimeout(resolve, adjusted));
}


generateArray();
