const translations = {
  en: {
    heroTitle: "Detect risk, understand why, and act with confidence.",
    heroBody:
      "Upload a crop image, enter field conditions, and get clear recommendations with confidence, limitations, and expert-advice warnings.",
  },
  hi: {
    heroTitle: "जोखिम पहचानें, कारण समझें, और भरोसे से कार्रवाई करें.",
    heroBody:
      "फसल की फोटो और खेत की जानकारी दें. ऐप भरोसे, सीमाओं और विशेषज्ञ सलाह की चेतावनी के साथ आसान सुझाव देगा.",
  },
  te: {
    heroTitle: "ప్రమాదాన్ని గుర్తించండి, కారణం అర్థం చేసుకోండి, నమ్మకంగా చర్య తీసుకోండి.",
    heroBody:
      "పంట చిత్రం మరియు పొలం వివరాలు ఇవ్వండి. యాప్ నమ్మకం, పరిమితులు, నిపుణుల హెచ్చరికతో సులభమైన సూచనలు ఇస్తుంది.",
  },
};

const diseaseKnowledge = {
  "Yellow spots": {
    title: "Likely nutrient stress or early fungal leaf spot",
    action: "Remove heavily infected leaves, improve airflow, avoid overhead irrigation, and apply balanced nutrition after soil testing.",
    reasons: ["Yellow spotting often increases with high humidity.", "Early fungal symptoms can look similar to nutrient stress.", "Balanced nitrogen and potassium reduce plant stress."],
  },
  "Brown patches": {
    title: "Moderate fungal blight risk",
    action: "Keep leaves dry, separate infected plant material, monitor spread for 48 hours, and use locally approved fungicide only with expert dosage.",
    reasons: ["Brown necrotic patches are common in blight-like infections.", "Humidity above 70% supports fungal growth.", "Rapid spread needs field-level confirmation."],
  },
  "Leaf curl": {
    title: "Possible pest vector or viral leaf curl",
    action: "Check underside of leaves for whiteflies/aphids, install yellow sticky traps, remove badly affected plants, and avoid seed saving from infected plants.",
    reasons: ["Leaf curl commonly appears with sucking pests.", "Warm conditions increase pest pressure.", "Virus-like symptoms cannot be confirmed from one image alone."],
  },
  "White powder": {
    title: "High powdery mildew risk",
    action: "Improve spacing, prune dense growth, avoid excess nitrogen, and ask an agriculture officer before chemical treatment.",
    reasons: ["White powder on leaves is a classic mildew symptom.", "Dense canopy traps moisture around leaves.", "Image-only confidence drops when lighting is unclear."],
  },
  Wilting: {
    title: "Water stress or root disease risk",
    action: "Check root zone moisture, inspect roots for rot, irrigate in the morning if dry, and isolate plants showing sudden collapse.",
    reasons: ["Wilting may come from low water, root rot, or vascular disease.", "Temperature and moisture strongly affect this diagnosis.", "Root inspection is required for confidence."],
  },
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const ranges = [
  ["#humidity", "#humidityOut", "%"],
  ["#temperature", "#temperatureOut", "°C"],
  ["#moisture", "#moistureOut", "%"],
  ["#rain", "#rainOut", " mm"],
];

ranges.forEach(([input, output, suffix]) => {
  $(input).addEventListener("input", () => {
    $(output).textContent = `${$(input).value}${suffix}`;
    updateIrrigation();
  });
});

$("#ph").addEventListener("input", () => {
  $("#phOut").textContent = (Number($("#ph").value) / 10).toFixed(1);
  updateIrrigation();
});

$("#soilType").addEventListener("change", updateIrrigation);

$("#language").addEventListener("change", (event) => {
  const dictionary = translations[event.target.value];
  Object.entries(dictionary).forEach(([key, value]) => {
    const node = document.querySelector(`[data-i18n="${key}"]`);
    if (node) node.textContent = value;
  });
});

$("#cropImage").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const image = document.createElement("img");
  image.alt = "Uploaded crop preview";
  image.src = URL.createObjectURL(file);
  $("#preview").replaceChildren(image);
});

$("#analyzeBtn").addEventListener("click", () => {
  const symptom = $("#symptom").value;
  const humidity = Number($("#humidity").value);
  const temperature = Number($("#temperature").value);
  const crop = $("#cropType").value;
  const knowledge = diseaseKnowledge[symptom];
  const climateBoost = humidity > 72 ? 10 : humidity > 60 ? 5 : 0;
  const heatBoost = temperature > 34 ? 6 : temperature > 29 ? 3 : 0;
  const confidence = Math.min(94, 68 + climateBoost + heatBoost + ($("#cropImage").files.length ? 8 : 0));
  const risk = confidence > 84 ? "High" : confidence > 74 ? "Medium" : "Low";

  $("#diagnosisBadge").textContent = `${risk} risk`;
  $("#confidence").textContent = `${confidence}%`;
  $("#diagnosisTitle").textContent = `${crop}: ${knowledge.title}`;
  $("#diagnosisText").textContent = knowledge.action;
  $("#reasonList").innerHTML = knowledge.reasons.map((reason) => `<li>${reason}</li>`).join("");
  $("#riskMetric").textContent = risk;
  $("#warningText").textContent =
    "This is preliminary advisory support. Confirm pesticide selection, dosage, disease spread, and severe losses with a local agriculture expert.";
});

$("#chatForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#chatInput");
  const text = input.value.trim();
  if (!text) return;

  appendMessage(text, "user");
  appendMessage(buildAdvisory(text), "bot");
  input.value = "";
});

$$(".quick-prompts button").forEach((button) => {
  button.addEventListener("click", () => {
    $("#chatInput").value = button.dataset.prompt;
    $("#chatForm").requestSubmit();
  });
});

$("#classifyWaste").addEventListener("click", () => {
  const item = $("#wasteInput").value.toLowerCase();
  let result = "Classify as dry waste if it is clean and recyclable. Keep contaminated material separate for safe handling.";

  if (/banana|food|leaf|crop|vegetable|wet/.test(item)) {
    result = "Wet/organic waste: compost it away from water channels. Mix dry leaves for better aeration and lower smell.";
  } else if (/plastic|bottle|paper|metal|glass|dry/.test(item)) {
    result = "Dry recyclable waste: rinse if safe, keep dry, and send to recycling collection.";
  } else if (/pesticide|chemical|battery|medical|paint/.test(item)) {
    result = "Hazardous waste: do not burn or compost. Keep sealed, label it, and hand over to authorized collection.";
  }

  $("#wasteResult").textContent = result;
});

$$(".ecoCheck").forEach((checkbox) => checkbox.addEventListener("change", updateEcoScore));

function appendMessage(text, type) {
  const node = document.createElement("div");
  node.className = `message ${type}`;
  node.textContent = text;
  $("#chatLog").appendChild(node);
  $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
}

function buildAdvisory(text) {
  const query = text.toLowerCase();

  if (/irrigat|water|rice|paddy/.test(query)) {
    return "Irrigation guidance: check soil moisture before watering. If moisture is below 45% and rain forecast is under 15 mm, irrigate lightly in the morning. For paddy, consider alternate wetting and drying where suitable. Limitation: exact water need depends on crop stage and field levelling.";
  }

  if (/curl|whitefly|aphid|tomato/.test(query)) {
    return "Leaf curl guidance: inspect the underside of leaves for whiteflies or aphids, use yellow sticky traps, remove severely affected plants, and avoid unnecessary pesticide mixing. Expert warning: viral leaf curl needs field confirmation.";
  }

  if (/waste|segregat|plastic|compost/.test(query)) {
    return "Waste guidance: separate wet, dry recyclable, and hazardous waste at source. Compost crop residue and food waste, keep plastics dry, and never burn pesticide containers or mixed waste.";
  }

  if (/soil|ph|fertil|nutrient/.test(query)) {
    return "Soil guidance: use a soil test before fertilizer decisions. Keep pH near 6.0-7.5 for many crops, add organic matter, and split fertilizer doses to reduce runoff.";
  }

  return "Recommended workflow: capture a clear image, note crop, symptoms, weather, and soil moisture, then compare AI output with local field knowledge. I can help with disease risk, irrigation, soil, pollution, or waste management.";
}

function updateIrrigation() {
  const moisture = Number($("#moisture").value);
  const rain = Number($("#rain").value);
  const ph = Number($("#ph").value) / 10;
  const soil = $("#soilType").value;
  const soilFactor = { sandy: 1.2, loam: 1, clay: 0.78, black: 0.82 }[soil];
  const waterNeed = Math.max(0, Math.round((55 - moisture) * soilFactor - rain * 0.35));

  $("#irrigationAdvice").textContent = waterNeed > 0 ? `${waterNeed} mm in 48 hours` : "Skip irrigation today";
  $("#waterMetric").textContent = waterNeed > 0 ? `${waterNeed} mm` : "0 mm";

  let soilAdvice = "Maintain organic compost";
  if (ph < 5.8) soilAdvice = "pH is low: ask expert about liming";
  if (ph > 7.8) soilAdvice = "pH is high: add organic matter";
  if (moisture < 25) soilAdvice = "Mulch to reduce moisture loss";
  $("#soilAdvice").textContent = soilAdvice;
}

function updateEcoScore() {
  const checked = $$(".ecoCheck").filter((item) => item.checked).length;
  $("#ecoMetric").textContent = `${58 + checked * 10}/100`;
}

updateIrrigation();
updateEcoScore();
