// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyA6P23T6k-Ta6qF07TmPLgNUDbo-EImU",
    databaseURL: "https://fire-and-smoke-91fa9-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

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

const darkTileLayer = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function initMaps() {
    const coords = [state.location[0], state.location[1]];

    // Initialize Helmet Map
    helmetMap = L.map('helmet-map', {
        zoomControl: false,
        attributionControl: false
    }).setView(coords, 14);

    L.tileLayer(darkTileLayer, {
        attribution: attribution,
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(helmetMap);

    // Custom Blue Circle for Helmet
    const helmetIcon = L.divIcon({
        className: 'custom-map-marker',
        html: '<div style="background-color: #00f2fe; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #00f2fe;"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });

    helmetMarker = L.marker(coords, { icon: helmetIcon }).addTo(helmetMap);

    // Initialize Fire Map
    fireMap = L.map('fire-map', {
        zoomControl: false,
        attributionControl: false
    }).setView(coords, 14);

    L.tileLayer(darkTileLayer, {
        attribution: attribution,
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(fireMap);

    // Custom Red Circle for Fire
    const fireIcon = L.divIcon({
        className: 'custom-map-marker',
        html: '<div style="background-color: #ff4d4d; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #ff4d4d;"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });

    fireMarker = L.marker(coords, { icon: fireIcon }).addTo(fireMap);
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
    state.flame = isFirebaseOverriding ? state.flame : Math.floor(Math.random() * 100);
    state.smoke = isFirebaseOverriding ? state.smoke : Math.random() * 10;

    // Simulate accident every now and then
    state.accident = Math.random() > 0.9;

    // Slight location drift
    state.location[0] += (Math.random() - 0.5) * 0.001;
    state.location[1] += (Math.random() - 0.5) * 0.001;

    const coords = [state.location[0], state.location[1]];
    helmetMarker.setLatLng(coords);
    fireMarker.setLatLng(coords);

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

let isFirebaseOverriding = false;

window.onload = () => {
    initMaps();
    setInterval(simulate, 3000);
    setInterval(updateClock, 1000);
    updateClock();
    updateUI();

    // Firebase Listener
    const fireRef = firebase.database().ref("fire");
    fireRef.on("value", (snapshot) => {
        const data = snapshot.val();
        isFirebaseOverriding = true;

        const statusEl = document.getElementById("status-indicator");

        if (data == 1) {
            state.flame = 100;
            state.smoke = 15.0;
            if (statusEl) statusEl.innerHTML = "🔥 FIRE DETECTED!";

            // 📍 LOCATION JUGAAD (Live Geolocation)
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    state.location = [lat, lon];

                    // Sync Maps & Markers
                    const coords = [lat, lon];
                    helmetMarker.setLatLng(coords);
                    fireMarker.setLatLng(coords);
                    helmetMap.setView(coords, 15);
                    fireMap.setView(coords, 15);

                    fireMarker.bindPopup("🔥 Fire detected here").openPopup();
                });
            }
            alert("🔥 FIRE DETECTED!");
        } else {
            state.flame = 5;
            state.smoke = 0.05;
            if (statusEl) statusEl.innerHTML = "✅ SAFE";
        }
        updateUI();
    });
};
