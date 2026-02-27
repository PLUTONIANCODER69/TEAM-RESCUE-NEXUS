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
    accident: false,
    sosHistory: [],
    activeAlerts: {
        accident: false,
        gas: false,
        temp: false,
        fire: false
    }
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

// Dark mode styles for Google Maps
const darkStyles = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
];

function initMaps() {
    const coords = { lat: state.location[0], lng: state.location[1] };

    const mapOptions = {
        center: coords,
        zoom: 14,
        styles: darkStyles,
        disableDefaultUI: true,
        backgroundColor: '#0b0e14'
    };

    helmetMap = new google.maps.Map(document.getElementById('helmet-map'), mapOptions);
    fireMap = new google.maps.Map(document.getElementById('fire-map'), mapOptions);

    helmetMarker = new google.maps.Marker({
        position: coords,
        map: helmetMap,
        title: "Helmet Position",
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#00f2fe',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#fff',
            scale: 8
        }
    });

    fireMarker = new google.maps.Marker({
        position: coords,
        map: fireMap,
        title: "Fire Alarm Site",
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#ff4d4d',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#fff',
            scale: 8
        }
    });
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const dateString = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    document.getElementById('clock-time').textContent = timeString;
    document.getElementById('clock-date').textContent = dateString;
}

function recordSOS(type, message) {
    const now = new Date();
    const entry = {
        type: type,
        message: message,
        time: now.toLocaleTimeString(),
        date: now.toLocaleDateString(),
        coords: [...state.location]
    };

    // Add to state
    state.sosHistory.unshift(entry);

    // Keep only last 20 entries
    if (state.sosHistory.length > 20) state.sosHistory.pop();

    updateHistoryUI();
}

function updateHistoryUI() {
    const list = document.getElementById('sos-history-list');
    if (state.sosHistory.length === 0) {
        list.innerHTML = '<div class="no-history">No SOS signals sent yet.</div>';
        return;
    }

    list.innerHTML = state.sosHistory.map(item => `
        <div class="history-item">
            <div class="history-time">${item.date} | ${item.time}</div>
            <div class="history-info"><strong>${item.type}:</strong> ${item.message}</div>
            <div class="history-coords">📍 ${item.coords[0].toFixed(4)}, ${item.coords[1].toFixed(4)}</div>
        </div>
    `).join('');
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

        if (!state.activeAlerts.accident) {
            recordSOS('Smart Helmet', 'ACCIDENT DETECTED! SOS sent to NHAI Helpline.');
            state.activeAlerts.accident = true;
        }
    } else {
        accidentAlert.className = 'alert';
        document.getElementById('gyro-status').innerText = 'Stable';
        state.activeAlerts.accident = false;
    }

    // 2. Mining
    document.getElementById('gas-value').innerText = `${state.gas} ppm`;
    document.getElementById('temp-value').innerText = `${state.temp}°C`;
    document.getElementById('aqi-value').innerText = state.aqi;

    const miningAlert = document.getElementById('mining-alert');
    if (state.gas > LIMITS.GAS) {
        miningAlert.innerHTML = `<i class="fas fa-biohazard"></i> HIGH METHANE LEVELS! SOS SENT TO MINE RESCUE TEAM!`;
        miningAlert.className = 'alert critical';
        if (!state.activeAlerts.gas) {
            recordSOS('Mining Safety', 'HIGH METHANE DETECTED! SOS sent to Rescue Team.');
            state.activeAlerts.gas = true;
        }
    } else {
        state.activeAlerts.gas = false;
        if (state.temp > LIMITS.TEMP) {
            miningAlert.innerHTML = `<i class="fas fa-thermometer-high"></i> EXTREME HEAT! SOS SENT TO MINE RESCUE TEAM!`;
            miningAlert.className = 'alert critical';
            if (!state.activeAlerts.temp) {
                recordSOS('Mining Safety', 'EXTREME HEAT DETECTED! SOS sent to Rescue Team.');
                state.activeAlerts.temp = true;
            }
        } else {
            state.activeAlerts.temp = false;
            if (state.aqi > LIMITS.AQI) {
                miningAlert.innerHTML = `<i class="fas fa-mask"></i> POOR AIR QUALITY! SOS SENT TO MINE RESCUE TEAM!`;
                miningAlert.className = 'alert warning';
            } else {
                miningAlert.className = 'alert';
            }
        }
    }

    // 3. Fire
    document.getElementById('flame-value').innerText = state.flame > 50 ? 'HIGH' : 'Low';
    document.getElementById('smoke-value').innerText = `${state.smoke.toFixed(2)} mg/m³`;

    const fireAlert = document.getElementById('fire-alert');
    if (state.flame > LIMITS.FLAME || state.smoke > LIMITS.SMOKE) {
        fireAlert.innerHTML = `<i class="fas fa-fire-extinguisher"></i> FIRE/SMOKE DETECTED! SOS SENT TO FIRE DEPARTMENT.`;
        fireAlert.className = 'alert critical';
        if (!state.activeAlerts.fire) {
            recordSOS('Fire/Smoke Alarm', 'FIRE/SMOKE DETECTED! SOS sent to Fire Department.');
            state.activeAlerts.fire = true;
        }
    } else {
        fireAlert.className = 'alert';
        state.activeAlerts.fire = false;
    }
}

function sendSOS(source) {
    const msg = `Emergency signal sent from ${source}!`;
    alert(`🚨 SOS ALERT: ${msg}\nLocation: ${state.location.join(', ')}`);
    recordSOS(source, msg);
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

    const coords = { lat: state.location[0], lng: state.location[1] };
    helmetMarker.setPosition(coords);
    fireMarker.setPosition(coords);

    helmetMap.panTo(coords);
    fireMap.panTo(coords);

    updateUI();
}

// --- Modal & History Listeners ---
const modal = document.getElementById('history-modal');
const btn = document.getElementById('recent-sos-btn');
const span = document.getElementsByClassName('close-modal')[0];

btn.onclick = () => {
    updateHistoryUI();
    modal.style.display = 'block';
};

span.onclick = () => {
    modal.style.display = 'none';
};

window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};

window.onload = () => {
    initMaps();
    setInterval(simulate, 3000);
    setInterval(updateClock, 1000);
    updateClock();
    updateUI();
};
