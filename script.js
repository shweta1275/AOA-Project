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
let swapCount = 0;
let startTime = 0;
let historicalData = [];

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
  swapCount = 0;
  startTime = Date.now();
  updateMetrics();
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
      return cls;
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

function updateMetrics() {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  document.getElementById("metrics").textContent = `🔁 Swaps: ${swapCount} | ⏱️ Time: ${elapsed}s`;
}

function saveHistory() {
  history.push([...arr]);
  const rewindSlider = document.getElementById("rewindControl");
  rewindSlider.max = history.length - 1;
  rewindSlider.value = history.length - 1;
}

document.getElementById("rewindControl").addEventListener("input", function () {
  const idx = parseInt(this.value);
  if (idx < history.length) {
    stopRequested = true;
    isPaused = true;
    document.getElementById("stopButton").textContent = "▶️ Resume";

    arr = [...history[idx]];
    drawArray(arr);
    document.getElementById("status").textContent = `⏪ Rewound to step ${idx}`;
  }
});

document.getElementById("themeSwitch").addEventListener("change", function () {
  document.body.classList.toggle("dark-mode");
});

document.getElementById("speedControl").addEventListener("input", function () {
  const speed = parseInt(this.value);
  const slider = this;
  const currentSpeed = document.getElementById("currentSpeed");

  // Update the speed value
  currentSpeed.textContent = `${speed}`;

  // Dynamically position the current speed below the slider circle
  const sliderWidth = slider.offsetWidth;
  const min = parseInt(slider.min);
  const max = parseInt(slider.max);
  const percent = ((speed - min) / (max - min)) * 100;
  const offset = (percent / 100) * sliderWidth - currentSpeed.offsetWidth / 2;

  currentSpeed.style.left = `${offset}px`;
});

function delay() {
  const raw = parseInt(document.getElementById("speedControl").value);
  const adjusted = 2100 - raw;
  return new Promise(resolve => setTimeout(resolve, adjusted));
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

  for (let i = 0; i < n - 1; i++) {
    if (stopRequested) {
      isSorting = false;
      return;
    }

    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
      drawArray(arr, j, minIdx, i - 1);
      saveHistory(); // Save the current state for rewind functionality
      await delay();
    }

    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      swapCount++;
      updateMetrics();
    }

    drawArray(arr, -1, -1, i);
    saveHistory();
  }

  drawArray(arr, -1, -1, n - 1);
  status.textContent = "✅ Array is now fully sorted!";
  enableRewind(); // Enable the rewind slider after sorting is complete
  isSorting = false;
}

function enableRewind() {
  const rewindWrapper = document.getElementById("rewindWrapper");
  const rewindSlider = document.getElementById("rewindControl");

  rewindWrapper.style.display = "block"; // Make rewind slider visible
  rewindSlider.disabled = false; // Enable the slider
  rewindSlider.max = history.length - 1; // Set the max value to the number of steps
  rewindSlider.value = history.length - 1; // Set the slider to the last step

  rewindSlider.addEventListener("input", function () {
    const idx = parseInt(this.value);
    if (idx < history.length) {
      arr = [...history[idx]]; // Load the array state at the selected step
      drawArray(arr); // Redraw the array
      document.getElementById("status").textContent = `⏪ Rewound to step ${idx}`;
    }
  });
}

function generateAnalysis() {
  const modal = document.getElementById("analysisModal");
  const closeBtn = document.querySelector(".modal-content .close");
  const analysisGraph = document.getElementById("analysisGraph");
  const speedInfo = document.getElementById("speedInfo");

  // Clear previous graph
  analysisGraph.innerHTML = "";

  // Get the speed value
  const speed = parseInt(document.getElementById("speedControl").value);
  speedInfo.textContent = `Simulation Speed: ${speed}ms`;

  // Create the graph using D3.js
  const margin = { top: 20, right: 30, bottom: 30, left: 40 };
  const width = 600 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const svg = d3
    .select("#analysisGraph")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3
    .scaleLinear()
    .domain([0, historicalData.length - 1])
    .range([0, width]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(historicalData, (d) => d.time)])
    .range([height, 0]);

  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(historicalData.length));

  svg.append("g").call(d3.axisLeft(y));

  svg
    .append("path")
    .datum(historicalData)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr(
      "d",
      d3
        .line()
        .x((d, i) => x(i))
        .y((d) => y(d.time))
    );

  svg
    .selectAll(".dot")
    .data(historicalData)
    .enter()
    .append("circle")
    .attr("cx", (d, i) => x(i))
    .attr("cy", (d) => y(d.time))
    .attr("r", 5)
    .attr("fill", "red");

  // Show the modal
  modal.style.display = "block";

  // Close the modal when the close button is clicked
  closeBtn.onclick = () => {
    modal.style.display = "none";
  };

  // Close the modal when clicking outside the modal content
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
}

generateArray();
