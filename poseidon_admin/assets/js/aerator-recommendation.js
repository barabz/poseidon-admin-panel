(async function () {
  const firebaseConfig = window.__FIREBASE_CONFIG__;
  if (!firebaseConfig) return;
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // --- DOM Elements ---
  const pondSelect = document.getElementById("pondSelect");
  const pondSpecies = document.getElementById("pondSpecies");
  const pondArea = document.getElementById("pondArea");
  const pondVolume = document.getElementById("pondVolume");
  
  const recType = document.getElementById("recType");
  const recHP = document.getElementById("recHP");
  const recNotes = document.getElementById("recNotes");
  const btnShopee = document.getElementById("btnShopee");
  const btnLazada = document.getElementById("btnLazada");

  const aiPhRange = document.getElementById("ai-ph-range");
  const aiTempRange = document.getElementById("ai-temp-range");
  const aiDoMin = document.getElementById("ai-do-min");
  const aiWxMode = document.getElementById("ai-wx-mode");
  const aiWxInterval = document.getElementById("ai-wx-interval");
  const aiWxReasoning = document.getElementById("ai-wx-reasoning");
  
  const volatilityGauge = document.getElementById("volatilityGauge");
  const volatilityStatusText = document.getElementById("volatilityStatusText");

  let ponds = [];
  let currentPondId = "";
  let aiModel = null;
  let historyChart = null; 

  // --- 1. EQUIPMENT CATALOG ---
  const equipmentCatalog = [
    {
      id: 0,
      name: "Paddlewheel Aerator",
      calcHP: (area) => Math.ceil(area / 200),
      notes: "Highly efficient for surface agitation. Recommended for Tilapia and shallow ponds to maximize gas exchange.",
    },
    {
      id: 1,
      name: "Diffused Air System",
      calcHP: (area) => Math.ceil(area / 140),
      notes: "Catfish and deep ponds require vertical circulation. Diffusers prevent toxic stratification at the bottom.",
    },
    {
      id: 2,
      name: "Hybrid Aeration System",
      calcHP: (area) => Math.ceil(area / 170),
      notes: "Balances surface mixing and subsurface oxygen diffusion for complex or high-density setups.",
    }
  ];

  // --- 2. TENSORFLOW AI (Equipment Matching) ---
  async function initAI() {
    aiModel = tf.sequential();
    aiModel.add(tf.layers.dense({ units: 8, activation: 'relu', inputShape: [2] }));
    aiModel.add(tf.layers.dense({ units: 3, activation: 'softmax' })); 
    aiModel.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy'] });

    const trainingInputs = tf.tensor2d([
      [0.2, 0.0], [0.8, 0.0], 
      [0.3, 1.0], [0.9, 1.0], 
      [0.5, 0.5], [1.0, 0.5]  
    ]);
    const trainingOutputs = tf.tensor2d([
      [1, 0, 0], [1, 0, 0], 
      [0, 1, 0], [0, 1, 0], 
      [0, 0, 1], [0, 0, 1]  
    ]);
    await aiModel.fit(trainingInputs, trainingOutputs, { epochs: 50 });
  }

  function predictEquipment(volume, species) {
    const normalizedVolume = Math.min(volume / 5000, 1.0); 
    let speciesCode = 0.5; 
    if (species.toLowerCase() === "tilapia") speciesCode = 0.0;
    if (species.toLowerCase() === "catfish") speciesCode = 1.0;

    const inputTensor = tf.tensor2d([[normalizedVolume, speciesCode]]);
    const prediction = aiModel.predict(inputTensor);
    const classId = prediction.argMax(1).dataSync()[0]; 
    return equipmentCatalog[classId];
  }

  // --- 3. STATISTICAL AI & CHART.JS ---
  async function analyzeAndRender(pond) {
    
    // 1. Basic Info
    pondSpecies.textContent = pond.fishSpecies;
    const area = pond.pondLength * pond.pondWidth;
    const volume = area * pond.pondDepth;
    pondArea.textContent = area.toFixed(1) + " m²";
    pondVolume.textContent = volume.toFixed(1) + " m³";

    // Equipment Prediction
    const rec = predictEquipment(volume, pond.fishSpecies);
    const requiredHP = rec.calcHP(area);
    recType.textContent = rec.name;
    recHP.textContent = requiredHP + " HP Base";
    recNotes.textContent = rec.notes;

    const searchQuery = encodeURIComponent(rec.name + " Aquaculture");
    btnShopee.href = `https://shopee.ph/search?keyword=${searchQuery}`;
    btnLazada.href = `https://www.lazada.com.ph/catalog/?q=${searchQuery}`;

    // 2. Fetch History & Define ABSOLUTE Thresholds
    try {
      const snap = await db.collection("fishponds").doc(pond.id).collection("readings")
        .orderBy("recordedAt", "desc")
        .limit(20) 
        .get();

      let phValues = [];
      let tempValues = [];
      let labels = [];

      const docs = snap.docs.reverse(); 
      docs.forEach((doc, index) => {
        const data = doc.data();
        phValues.push(data.ph || 7);
        tempValues.push(data.temp || 28);
        labels.push(`T-${docs.length - index}`); 
      });

      // Define Absolute Species Limits (The Goalposts)
      let idealPhMin = 6.5, idealPhMax = 8.5;
      let idealTempMin = 26.0, idealTempMax = 30.0;
      let minDo = 3.5;

      if (pond.fishSpecies.toLowerCase() === 'catfish') {
        idealPhMax = 8.0;
        idealTempMin = 25.0;
        idealTempMax = 32.0;
        minDo = 4.0;
      }

      // Update UI Threshold Texts
      aiPhRange.textContent = `${idealPhMin.toFixed(1)} - ${idealPhMax.toFixed(1)}`;
      aiTempRange.textContent = `${idealTempMin.toFixed(1)}°C - ${idealTempMax.toFixed(1)}°C`;
      aiDoMin.textContent = `${minDo.toFixed(1)} mg/L`;

      // Calculate Volatility (Variance)
      const getAverage = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      const getVariance = (arr, avg) => arr.length ? getAverage(arr.map(v => Math.pow(v - avg, 2))) : 0;

      const avgPh = getAverage(phValues);
      const varPh = getVariance(phValues, avgPh);
      const avgTemp = getAverage(tempValues);
      const varTemp = getVariance(tempValues, avgTemp);

      // Check if latest readings are actually out of bounds!
      const latestPh = phValues[phValues.length - 1] || 7;
      const latestTemp = tempValues[tempValues.length - 1] || 28;
      
      const isOutOfBounds = (latestPh < idealPhMin || latestPh > idealPhMax || latestTemp < idealTempMin || latestTemp > idealTempMax);
      const isHighlyVolatile = varPh > 0.5 || varTemp > 3.0;

      // Status Visuals
      const chaosScore = Math.min(((varPh / 1.0) * 50) + ((varTemp / 5.0) * 50), 100);
      volatilityGauge.style.width = `${Math.max(chaosScore, 5)}%`; 

      if (isOutOfBounds) {
        // OVERRIDE: Even if variance is flat, if it's too hot/cold, it's critical.
        volatilityGauge.className = "h-full rounded-full bg-red-500 animate-pulse w-full";
        volatilityStatusText.textContent = "CRITICAL - Water limits breached!";
        volatilityStatusText.className = "text-xs font-bold mt-2 text-red-600";
        
        aiWxMode.textContent = "Immediate Flushing";
        aiWxInterval.textContent = "Override Triggered";
        aiWxReasoning.innerHTML = `<strong>CRITICAL ALERT:</strong> Current parameters (pH: ${latestPh}, Temp: ${latestTemp}°C) have broken past the safe species thresholds. System demands immediate water exchange and maximum aeration until parameters return within the visual guide lines.`;
      
      } else if (isHighlyVolatile) {
        volatilityGauge.className = "h-full rounded-full transition-all duration-500 bg-yellow-500";
        volatilityStatusText.textContent = "MODERATE - Fluctuations detected";
        volatilityStatusText.className = "text-xs font-bold mt-2 text-yellow-600";
        
        aiWxMode.textContent = "Sensor-Based Priority";
        aiWxInterval.textContent = "Suspend Timers";
        aiWxReasoning.innerHTML = `<strong>Analysis:</strong> Parameters are within limits, but high volatility detected (pH Var: ${varPh.toFixed(2)}). System recommends suspending static timers and relying strictly on sensor thresholds to prevent sudden spikes.`;
      
      } else {
        volatilityGauge.className = "h-full rounded-full transition-all duration-500 bg-green-500";
        volatilityStatusText.textContent = "STABLE - Parameters optimal";
        volatilityStatusText.className = "text-xs font-bold mt-2 text-green-600";
        
        aiWxMode.textContent = "Time Interval Config";
        let suggestedHours = volume > 5000 ? 48 : (volume < 500 ? 12 : 24); 
        aiWxInterval.textContent = `Cycle every ${suggestedHours} hrs`;
        aiWxReasoning.innerHTML = `<strong>Analysis:</strong> Environment is stable and within target species goalposts. Conserving pump lifespan by running static ${suggestedHours}h flush cycles based on ${volume.toFixed(0)}m³ pond volume.`;
      }

      // --- RENDER CHART WITH THRESHOLD LINES ---
      if (historyChart) historyChart.destroy();
      const ctx = document.getElementById('aiChart').getContext('2d');
      
      historyChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels.length ? labels : ['No Data'],
          datasets: [
            // 1. The Actual Data Trends
            {
              label: 'pH Trend',
              data: phValues.length ? phValues : [7],
              borderColor: '#0284c7', 
              backgroundColor: '#0284c7',
              borderWidth: 2,
              tension: 0.4,
              yAxisID: 'y'
            },
            {
              label: 'Temp (°C)',
              data: tempValues.length ? tempValues : [28],
              borderColor: '#ea580c', 
              backgroundColor: '#ea580c',
              borderWidth: 2,
              borderDash: [5, 5],
              tension: 0.4,
              yAxisID: 'y1'
            },
            // 2. The AI Threshold "Goalposts" (Hidden from Legend, Visual only)
            {
              label: 'Limit', // Name triggers our legend filter below
              data: Array(labels.length).fill(idealPhMax),
              borderColor: 'rgba(2, 132, 199, 0.3)', // Faint blue dash
              borderWidth: 2,
              borderDash: [4, 4],
              pointRadius: 0,
              yAxisID: 'y'
            },
            {
              label: 'Limit',
              data: Array(labels.length).fill(idealPhMin),
              borderColor: 'rgba(2, 132, 199, 0.3)',
              borderWidth: 2,
              borderDash: [4, 4],
              pointRadius: 0,
              yAxisID: 'y'
            },
            {
              label: 'Limit',
              data: Array(labels.length).fill(idealTempMax),
              borderColor: 'rgba(234, 88, 12, 0.3)', // Faint orange dash
              borderWidth: 2,
              borderDash: [4, 4],
              pointRadius: 0,
              yAxisID: 'y1'
            },
            {
              label: 'Limit',
              data: Array(labels.length).fill(idealTempMin),
              borderColor: 'rgba(234, 88, 12, 0.3)',
              borderWidth: 2,
              borderDash: [4, 4],
              pointRadius: 0,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            // Hide the threshold lines from the interactive legend
            legend: { 
              labels: { 
                color: '#4b5563',
                filter: function(item, chart) {
                  return !item.text.includes('Limit'); 
                }
              } 
            },
            tooltip: {
              filter: function(tooltipItem) {
                return tooltipItem.dataset.label !== 'Limit';
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(0, 0, 0, 0.05)' },
              ticks: { color: '#6b7280' }
            },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              // Force the chart to show a bit above and below the limits
              suggestedMax: idealPhMax + 1,
              suggestedMin: idealPhMin - 1,
              grid: { color: 'rgba(0, 0, 0, 0.05)' },
              ticks: { color: '#0284c7' },
              title: { display: true, text: 'pH Level', color: '#0284c7' }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              suggestedMax: idealTempMax + 2,
              suggestedMin: idealTempMin - 2,
              grid: { drawOnChartArea: false },
              ticks: { color: '#ea580c' },
              title: { display: true, text: 'Temperature', color: '#ea580c' }
            }
          }
        }
      });

    } catch (e) {
      console.error("Pattern Analysis Error:", e);
      aiWxReasoning.textContent = "Error analyzing data from Firestore: " + e.message;
    }
  }

  // --- 4. INITIALIZATION ---
  await initAI(); 

  db.collection("fishponds")
    .orderBy("createdAt", "desc")
    .onSnapshot((snap) => {
      ponds = [];
      pondSelect.innerHTML = "";
      snap.forEach(doc => ponds.push({ id: doc.id, ...doc.data() }));

      if (!ponds.length) {
        pondSelect.innerHTML = "<option>No ponds available</option>";
        return;
      }

      ponds.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.name;
        pondSelect.appendChild(opt);
      });

      if (!currentPondId) {
        currentPondId = ponds[0].id;
        pondSelect.value = currentPondId;
        analyzeAndRender(ponds[0]); 
      }
    });

  pondSelect.addEventListener("change", () => {
    currentPondId = pondSelect.value;
    const pond = ponds.find(p => p.id === currentPondId);
    if (pond) analyzeAndRender(pond); 
  });

})();