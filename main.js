// --- Simulation Data & Logic ---

const state = {
    alc: 0.02,
    gas: 12,
    temp: 28,
    aqi: 45,
    flame: 10,
    smoke: 0.05,
    location: [23.8103, 90.4125], // Default coords
    ignCut: false,
    accident: false
};
           
// Thresholds
const LIMITS = {
    ALC: 0.08,
    GAS: 100,
    TEMP: 45,
    AQI: 150,
    FLAME: 70,
    SMOKE: 5.0
};

// --- Initialization ---

let helmetMap, fireMap, helmetMarker, fireMarker;

function initMaps() {
    helmetMap = L.map('helmet-map').setView(state.location, 15);
    fireMap = L.map('fire-map').setView(state.location, 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(helmetMap);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(fireMap);

    helmetMarker = L.marker(state.location).addTo(helmetMap).bindPopup("Helmet Position");
    fireMarker = L.marker(state.location).addTo(fireMap).bindPopup("Fire Alarm Site");
}

function updateUI() {
    // 1. Smart Helmet
    document.getElementById('alc-value').innerText = `${state.alc.toFixed(2)}%`;
    const alcAlert = document.getElementById('alc-alert');
    const accidentAlert = document.getElementById('accident-alert');
    const ignStatus = document.getElementById('ign-status');

    if (state.alc > LIMITS.ALC) {
        alcAlert.innerHTML = `<i class="fas fa-beer"></i> ALCOHOL DETECTED! IGNITION DISENGAGED.`;
        alcAlert.className = 'alert critical';
        ignStatus.innerText = 'Ignition: CUT OFF';
        ignStatus.className = 'ign-status ign-cut';
    } else {
        alcAlert.className = 'alert';
        ignStatus.innerText = 'Ignition: ACTIVE';
        ignStatus.className = 'ign-status ign-on';
    }

    if (state.accident) {
        accidentAlert.innerHTML = `<i class="fas fa-car-crash"></i> ACCIDENT DETECTED! SOS SENT TO NHAI ACCIDENT SUPPORT HELPLINE.`;
        accidentAlert.className = 'alert critical';
        document.getElementById('gyro-status').innerText = 'Impact!';
    } else {
        accidentAlert.className = 'alert';
        document.getElementById('gyro-status').innerText = 'Stable';
    }

    // 2. Mining
    document.getElementById('gas-value').innerText = `${state.gas} ppm`;
    document.getElementById('temp-value').innerText = `${state.temp}°C`;
    document.getElementById('aqi-value').innerText = state.aqi;

    const miningAlert = document.getElementById('mining-alert');
    if (state.gas > LIMITS.GAS) {
        miningAlert.innerHTML = `<i class="fas fa-biohazard"></i> HIGH METHANE LEVELS! SOS SENT TO MINE RESCUE TEAM!`;
        miningAlert.className = 'alert critical';
    } else if (state.temp > LIMITS.TEMP) {
        miningAlert.innerHTML = `<i class="fas fa-thermometer-high"></i> EXTREME HEAT! SOS SENT TO MINE RESCUE TEAM!`;
        miningAlert.className = 'alert critical';
    } else if (state.aqi > LIMITS.AQI) {
        miningAlert.innerHTML = `<i class="fas fa-mask"></i> POOR AIR QUALITY! SOS SENT TO MINE RESCUE TEAM!`;
        miningAlert.className = 'alert warning';
    } else {
        miningAlert.className = 'alert';
    }

    // 3. Fire
    document.getElementById('flame-value').innerText = state.flame > 50 ? 'HIGH' : 'Low';
    document.getElementById('smoke-value').innerText = `${state.smoke.toFixed(2)} mg/m³`;

    const fireAlert = document.getElementById('fire-alert');
    if (state.flame > LIMITS.FLAME || state.smoke > LIMITS.SMOKE) {
        fireAlert.innerHTML = `<i class="fas fa-fire-extinguisher"></i> FIRE/SMOKE DETECTED! SOS SENT TO FIRE DEPARTMENT.`;
        fireAlert.className = 'alert critical';
    } else {
        fireAlert.className = 'alert';
    }
}

function sendSOS(source) {
    alert(`🚨 SOS ALERT: Emergency signal sent from ${source}!\nLocation: ${state.location.join(', ')}`);
}

// --- Simulation Loop ---

function simulate() {
    // Random variations
    state.alc = Math.random() * 0.1;
    state.gas = Math.floor(Math.random() * 150);
    state.temp = 20 + Math.floor(Math.random() * 40);
    state.aqi = Math.floor(Math.random() * 200);
    state.flame = Math.floor(Math.random() * 100);
    state.smoke = Math.random() * 10;

    // Simulate accident every now and then
    state.accident = Math.random() > 0.9;

    // Slight location drift
    state.location[0] += (Math.random() - 0.5) * 0.001;
    state.location[1] += (Math.random() - 0.5) * 0.001;

    helmetMarker.setLatLng(state.location);
    fireMarker.setLatLng(state.location);

    updateUI();
}

window.onload = () => {
    initMaps();
    setInterval(simulate, 3000);
    updateUI();
};
