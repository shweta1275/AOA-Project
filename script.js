const svg = d3.select("#chart");
const width = +svg.attr("width");
const height = +svg.attr("height");
let array = [];
let arr = []; // Global working array to preserve state
let stopRequested = false;
let isPaused = false; // Track if the sorting is paused
let currentI = 0; // Track the current index of the outer loop
let currentJ = 0; // Track the current index of the inner loop
let isSorting = false; // Prevent multiple calls to selectionSort
let minIdx = 0; // Track the current minimum index

function generateArray() {
  array = Array.from({ length: 20 }, () => Math.floor(Math.random() * 90) + 10);
  arr = [...array]; // Initialize the working array
  currentI = 0; // Reset the outer loop index
  currentJ = 0; // Reset the inner loop index
  minIdx = 0; // Reset the minimum index
  stopRequested = false; // Reset stop flag
  isPaused = false; // Reset pause flag
  isSorting = false; // Reset sorting flag
  drawArray(array);
  document.getElementById("status").textContent = "New array generated. Click “Run Selection Sort” to start.";
}

function drawArray(data, currentIdx = -1, minIdx = -1, sortedUpto = -1) {
  svg.selectAll("*").remove();
  const gap = 3; // Gap on both sides of each bar
  const barWidth = (width / data.length) - gap; // Adjust bar width to account for gaps

  svg.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", (_, i) => {
      if (i <= sortedUpto) return "bar sorted";
      if (i === minIdx) return "bar min";
      if (i === currentIdx) return "bar current";
      return "bar";
    })
    .attr("x", (_, i) => i * (barWidth + gap) + gap / 2) // Add half the gap to the left of each bar
    .attr("y", d => height - d * 3)
    .attr("width", barWidth) // Use adjusted bar width
    .attr("height", d => d * 3);

  svg.selectAll(".label")
    .data(data)
    .enter()
    .append("text")
    .attr("x", (_, i) => i * (barWidth + gap) + (barWidth + gap) / 2) // Center label within the bar
    .attr("y", d => height - d * 3 - 5)
    .attr("text-anchor", "middle")
    .attr("fill", "#1f2937")
    .attr("font-size", "12px")
    .text(d => d);
}

function stopOrResumeSort() {
  const stopButton = document.getElementById("stopButton");
  if (!isPaused) {
    // Pause the sorting
    stopRequested = true;
    isPaused = true;
    stopButton.textContent = "▶️ Resume"; // Change button text to "Resume"
    document.getElementById("status").textContent = "⏸ Sorting paused. Click 'Resume' to continue.";
  } else {
    // Resume the sorting
    stopRequested = false;
    isPaused = false;
    stopButton.textContent = "⛔ Stop"; // Change button text back to "Stop"
    document.getElementById("status").textContent = "▶ Resuming sort...";
    if (!isSorting) {
      selectionSort(); // Resume the sorting process
    }
  }
}

async function selectionSort() {
  if (isSorting) return; // Prevent multiple calls to selectionSort
  isSorting = true;

  const n = arr.length; // Use the global working array
  const status = document.getElementById("status");

  for (let i = currentI; i < n - 1; i++) {
    currentI = i; // Save the current state of the outer loop
    if (stopRequested) {
      isSorting = false; // Allow resuming
      return; // Exit if sorting is paused
    }

    if (currentJ === 0) minIdx = i; // Reset minIdx only if starting a new outer loop iteration
    status.textContent = `Looking for the smallest element from index ${i} to ${n - 1}`;
    drawArray(arr, i, minIdx, i - 1);
    await delay(500);

    for (let j = currentJ || i + 1; j < n; j++) {
      currentJ = j; // Save the current state of the inner loop
      if (stopRequested) {
        isSorting = false; // Allow resuming
        return; // Exit if sorting is paused
      }

      drawArray(arr, j, minIdx, i - 1);
      await delay(300);

      if (arr[j] < arr[minIdx]) {
        minIdx = j; // Update the minimum index
        status.textContent = `New minimum found at index ${j} (Value: ${arr[j]})`;
        drawArray(arr, j, minIdx, i - 1);
        await delay(400);
      }
    }

    currentJ = 0; // Reset inner loop index after completion

    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      status.textContent = `Swapped elements at index ${i} and ${minIdx}`;
      drawArray(arr, i, minIdx, i - 1);
      await delay(700);
    }

    drawArray(arr, -1, -1, i);
  }

  drawArray(arr, -1, -1, n - 1);
  status.textContent = "✅ Array is now fully sorted!";
  currentI = 0; // Reset outer loop index after completion
  currentJ = 0; // Reset inner loop index after completion
  isSorting = false; // Allow new sorting to start
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Auto-generate on page load
generateArray();

