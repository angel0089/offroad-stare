async function fetchAltitude(lat, lon) {
  try {
    const response = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
    const data = await response.json();
    const alt = data.results[0].elevation;
    document.getElementById("liveAltitude").textContent = `⛰️ ${alt} m`;
  } catch (err) {
    console.error("❌ Altitude fetch failed", err);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM fully loaded. App initializing...");

  const gpsBtn = document.getElementById("gpsBtn");
  const loadBtn = document.getElementById("loadBtn");
  const startTrackBtn = document.getElementById("startTrackBtn");
  const stopTrackBtn = document.getElementById("stopTrackBtn");
  const downloadTrackBtn = document.getElementById("downloadTrackBtn");
  const gpxInput = document.getElementById("gpxInput");
  const trackList = document.getElementById("trackList");

  let recordedPoints = [];
  let allTracks = [];
  let watchID = null;
  let userMarker = null;
let riderName = prompt("Enter your rider name:").trim().slice(0, 12) || "Rider";

  function getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  function refreshTrackList() {
    trackList.innerHTML = "";
    allTracks.forEach((track, i) => {
      const item = document.createElement("div");
      item.className = "track-list-item";

      const nameSpan = document.createElement("span");
      nameSpan.className = "track-list-name";
      nameSpan.textContent = track.name;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "track-delete";
      deleteBtn.textContent = "❌";
      deleteBtn.addEventListener("click", e => {
        e.stopPropagation();
        allTracks.splice(i, 1);
        refreshTrackList();
      });

      item.appendChild(nameSpan);
      item.appendChild(deleteBtn);

      item.addEventListener("click", () => {
        const polyline = L.polyline(track.points.map(p => [p.lat, p.lon]), {
          color: track.color || getRandomColor()
        }).addTo(map);
        map.fitBounds(polyline.getBounds());
      });

      trackList.appendChild(item);
    });
  }

  const map = L.map("map").setView([50.5208, -116.0981], 13);

  const baseLayers = {
    "OpenStreetMap": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }),
    "Topo Map": L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenTopoMap"
    }),
    "Satellite": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics"
  })
  };

  baseLayers["OpenStreetMap"].addTo(map);
  L.control.layers(baseLayers).addTo(map);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  gpsBtn.onclick = () => {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
    fetchAltitude(latitude, longitude);
      map.setView([latitude, longitude], 16);
      if (!userMarker) {
        userMarker = L.circleMarker([latitude, longitude], {
          radius: 6,
          color: "#003f87",
          fillColor: "#003f87",
          fillOpacity: 0.95
        }).addTo(map);
      } else {
        userMarker.setLatLng([latitude, longitude]);
      }
    });
  };

  startTrackBtn.onclick = () => {
    recordedPoints = [];
    watchID = navigator.geolocation.watchPosition(pos => {
      const { latitude, longitude } = pos.coords;
    fetchAltitude(latitude, longitude);
      if (recordedPoints.length === 0) map.setView([latitude, longitude], 15);
      recordedPoints.push({
        lat: latitude,
        lon: longitude,
        time: Date.now()
      });
      L.circleMarker([latitude, longitude], {
        radius: 4,
        color: "red"
      }).addTo(map);
    }, err => console.error("GPS error", err), { enableHighAccuracy: true });
  };

  stopTrackBtn.onclick = () => {
    if (watchID !== null) {
      navigator.geolocation.clearWatch(watchID);
      watchID = null;
    }
    if (recordedPoints.length === 0) return alert("No track recorded.");
    const name = prompt("Name this track:", "Track " + (allTracks.length + 1));
    if (!name) return;
    allTracks.push({
      name,
      points: recordedPoints,
      color: getRandomColor()
    });
    refreshTrackList();
  };

  loadBtn.onclick = () => gpxInput.click();

  gpxInput.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");
    const trkpts = xml.querySelectorAll("trkpt");
    const points = Array.from(trkpts).map(pt => ({
      lat: parseFloat(pt.getAttribute("lat")),
      lon: parseFloat(pt.getAttribute("lon"))
    }));
    const polyline = L.polyline(points.map(p => [p.lat, p.lon]), { color: getRandomColor() }).addTo(map);
    map.fitBounds(polyline.getBounds());
  };
});


window.addEventListener("DOMContentLoaded", () => {
  const chatInput = document.getElementById("chatInput");
  const chatSend = document.getElementById("chatSend");
  const chatMessages = document.getElementById("chatMessages");

  function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    const msg = document.createElement("div");
    msg.textContent = message;
    chatMessages.appendChild(msg);
    chatInput.value = "";
  }

  if (chatInput && chatSend && chatMessages) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMessage();
    });

    chatSend.addEventListener("click", sendMessage);
  }
});

const chatBox = document.getElementById("chatBox");
const chatToggleBtn = document.getElementById("chatToggleBtn");

chatToggleBtn.addEventListener("click", () => {
  chatBox.classList.toggle("collapsed");
});