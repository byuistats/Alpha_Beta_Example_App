// script.js
function dnorm(x, mean, sd) {
    const variance = sd * sd;
    const density = (1 / (Math.sqrt(2 * Math.PI * variance))) * Math.exp(-Math.pow(x - mean, 2) / (2 * variance));
    return density;
}

function generateData(mean, sd, start, end, count) {
    const data = [];
    const step = (end - start) / count;
    for (let i = 0; i < count; i++) {
        const x = start + i * step;
        const y = dnorm(x, mean, sd);
        data.push({ x: x, y: y });
    }
    return data;
}

function generateFillDataLeft(distributionData, cutoff) {
    const fillData = [];

    // Add a point on the x-axis at the start of the distribution
    fillData.push({ x: distributionData[0].x, y: 0 });

    // Add points from the distribution up to the cutoff
    for (let i = 0; i < distributionData.length; i++) {
        const point = distributionData[i];
        if (point.x <= cutoff) {
            fillData.push({ x: point.x, y: point.y });
        } else {
            break; // Stop when we reach the cutoff
        }
    }

    // Add a point on the x-axis at the cutoff
    if (fillData.length > 1) { // Make sure we have at least one point from the distribution
        fillData.push({ x: fillData[fillData.length - 1].x, y: 0 });
    }

    console.log("Fill Data Left", fillData);
    return fillData;
}

function generateFillDataRight(distributionData, cutoff) {
    const fillData = [];

    // Find the last point in the distribution
    const lastPoint = distributionData[distributionData.length - 1];

    // Add a point on the x-axis at the *end* of the distribution
    fillData.push({ x: lastPoint.x, y: 0 });
    console.log("1. Added end point:", { x: lastPoint.x, y: 0 });

    // Add points from the distribution *after* the cutoff, iterating *backwards*
    for (let i = distributionData.length - 1; i >= 0; i--) {
        const point = distributionData[i];
        if (point.x >= cutoff) {
            fillData.push({ x: point.x, y: point.y });
            console.log("2. Added distribution point:", { x: point.x, y: point.y });
        }
    }

    // Add a point on the x-axis at the *cutoff*
    if (fillData.length > 1) { // Make sure we have at least one point from the distribution
        fillData.push({ x: fillData[fillData.length -1].x, y: 0 });
        console.log("3. Added cutoff point:", { x: fillData[0].x, y: 0 });
    }

    //Reverse
    fillData.reverse()

    console.log("4. Final Fill Data Right", fillData);
    return fillData;
}

function calculateErrorAreas(nullData, altData, cutoff) {
    let alpha = 0;
    let beta = 0;
    const step = nullData[1].x - nullData[0].x; // Assuming data points are equally spaced

    for (let i = 0; i < nullData.length; i++) {
        if (nullData[i].x <= cutoff) {
            alpha += nullData[i].y * step;
        }
    }

    for (let i = 0; i < altData.length; i++) {
        if (altData[i].x > cutoff) {
            beta += altData[i].y * step;
        }
    }

    return { alpha: alpha, beta: beta };
}

function addCutoffLine(chart, cutoff) {
    // Generate fill data
    const alpha_fill = generateFillDataLeft(null_data, cutoff);
    const beta_fill = generateFillDataRight(alt_data, cutoff);

    // Update the data for the fill and cutoff datasets
    chart.data.datasets[2].data = alpha_fill; // Alpha
    chart.data.datasets[3].data = beta_fill;  // Beta

    //Update the data for cutoff line
    chart.data.datasets[4].data = [{ x: cutoff, y: 0 }, { x: cutoff, y: Math.max(...chart.data.datasets[0].data.map(item => item.y), ...chart.data.datasets[1].data.map(item => item.y)) }]

    chart.update();
}

const mean_null = 12;
const sd_null = 0.5;
const mean_alt = 11.2;
const sd_alt = 0.5;

// Define null_data and alt_data *before* they are used
const null_data = generateData(mean_null, sd_null, 9.5, 14, 500); // Reduced count for performance
const alt_data = generateData(mean_alt, sd_alt, 9.5, 14, 500); // Reduced count for performance

const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [{
            label: 'Null Hypothesis Distribution',
            data: null_data,
            borderColor: '#FFB3B2',
            backgroundColor: 'rgba(255, 179, 178, 0.2)',  //Light color with transparency
            fill: false,
            tension: 0.4
        }, {
            label: 'Unknown True Distribution',
            data: alt_data,
            borderColor: '#91BAD6',
            backgroundColor: 'rgba(145, 186, 214, 0.2)', //Light color with transparency
            fill: false,
            tension: 0.4
        }, {
            label: 'Alpha (Type I Error)',
            data: [], // Data will be updated dynamically
            backgroundColor: 'rgba(255, 179, 178, 0.5)', // More opaque
            borderColor: 'rgba(255, 179, 178, 0)', // No border
            borderWidth: 0,
            fill: true,
            tension: 0.4
        }, {
            label: 'Beta (Type II Error)',
            data: [], // Data will be updated dynamically
            backgroundColor: 'rgba(145, 186, 214, 0.5)', // More opaque
            borderColor: 'rgba(145, 186, 214, 0)',  // No border
            borderWidth: 0,
            fill: true,
            tension: 0.4
        },
        {
            label: 'Cutoff',
            data: [], // Data will be updated dynamically
            borderColor: 'black',
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
            tension: 0,
            borderWidth: 2
        }]
    },
    options: {
        scales: {
            x: {
                type: 'linear',
                position: 'bottom'
            },
            y: {
               beginAtZero: true
            }
        },
        animation: false // Disable animation for smoother updates
    }
});

const cutoffInput = document.getElementById('cutoff');
const alphaValue = document.getElementById('alphaValue');
const betaValue = document.getElementById('betaValue');

cutoffInput.addEventListener('input', function() {
    const cutoff = parseFloat(this.value);
    addCutoffLine(myChart, cutoff);
    const errors = calculateErrorAreas(null_data, alt_data, cutoff);
    alphaValue.textContent = errors.alpha.toFixed(3);
    betaValue.textContent = errors.beta.toFixed(3);
});

window.onload = function() {
    const initialCutoff = 11; // Set an initial cutoff value
    document.getElementById('cutoff').value = initialCutoff; // Set the initial value of the slider
    addCutoffLine(myChart, initialCutoff);
    const errors = calculateErrorAreas(null_data, alt_data, cutoff);
    alphaValue.textContent = errors.alpha.toFixed(3);
    betaValue.textContent = errors.beta.toFixed(3);
};
