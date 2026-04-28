// basemap
const basemapStreet = 'https://basemap.mapid.io/styles/street-2d-building/style.json?key=69a8edeffdb1d3dbc8b3022c';
const basemapSatellite = 'https://basemap.mapid.io/styles/satellite/style.json?key=69a8edeffdb1d3dbc8b3022c';




// map street
const mapStreet = new maplibregl.Map({
  container: 'mapStreet',
  style: basemapStreet,
  center: [99.278558, 1.577493],
  zoom: 9
});

// map satellite
const mapSatellite = new maplibregl.Map({
  container: 'mapSatellite',
  style: basemapSatellite,
  center: [99.278558, 1.577493],
  zoom: 9
});




// status
let mapAktif = mapStreet;
let adminNyala = true;
let LULCNyala = false;
let deforestasiNyala = false;





// warna LULC (cukup sekali, jangan duplikat)
const lulcColors = {
  "Badan Air / Perairan": "#1a5bab",
  "Vegetasi Pohon / Hutan": "#358221",
  "Vegetasi Tergenang": "#87d19e",
  "Lahan Pertanian / Tanaman Budidaya": "#ffdb5c",
  "Kawasan Terbangun / Permukiman": "#ed022a",
  "Lahan Terbuka / Tanah Kosong": "#ede9e4",
  "Padang rumput / lahan semak belukar alami": "#efcfa8"
};




// tampilkan admin
function tampilkanSemuaLayer(mapObj) {
  fetch('https://geoserver.mapid.io/layers_new/get_layer?api_key=cb4aba8850e24953898b24cf1355ff7d&layer_id=69eb5e9cd35f269374ec6582&project_id=69b68edd374e78f582e7a107')
    .then(res => res.json())
    .then(data => {
      let geojsonData = data.data || data.geojson || data;

      if (!mapObj.getSource('admin-layer')) {
        mapObj.addSource('admin-layer', { type: 'geojson', data: geojsonData });

        mapObj.addLayer({
          id: 'admin-fill',
          type: 'fill',
          source: 'admin-layer',
          paint: { 'fill-color': '#747876', 'fill-opacity': 0.2 }
        });

        mapObj.addLayer({
          id: 'admin-outline',
          type: 'line',
          source: 'admin-layer',
          paint: { 'line-color': '#032b0c', 'line-width': 2 }
        });
      }
    });
}

// load admin di kedua map
mapStreet.on('load', () => tampilkanSemuaLayer(mapStreet));
mapSatellite.on('load', () => tampilkanSemuaLayer(mapSatellite));

// switch basemap
function updateStyleToStreet() {
  document.getElementById('mapStreet').classList.remove('hidden');
  document.getElementById('mapSatellite').classList.add('hidden');
  mapAktif = mapStreet;
}

function updateStyleToSatellite() {
  document.getElementById('mapSatellite').classList.remove('hidden');
  document.getElementById('mapStreet').classList.add('hidden');
  mapAktif = mapSatellite;
}

// toggle admin
function toggleAdminLayer() {
  let vis = adminNyala ? 'none' : 'visible';
  mapStreet.setLayoutProperty('admin-fill', 'visibility', vis);
  mapStreet.setLayoutProperty('admin-outline', 'visibility', vis);
  mapSatellite.setLayoutProperty('admin-fill', 'visibility', vis);
  mapSatellite.setLayoutProperty('admin-outline', 'visibility', vis);
  adminNyala = !adminNyala;
}

// ikon hide/unhide batas admin
function toggleButtonIcon(btnId, aktif) {
  const btn = document.getElementById(btnId);
  const iconSpan = btn.querySelector('.icon');
  if (aktif) {
    iconSpan.textContent = '👁️‍🗨️'; // aktif
  } else {
    iconSpan.textContent = '🚫'; // non-aktif
  }

// update ikon tombol admin
  toggleButtonIcon('btn-admin', adminNyala);
}

// ganti warna polygon admin
let adminColor = '#747876';
function gantiWarnaAdmin(color) {
  adminColor = color;
  if (mapStreet.getLayer('admin-fill')) {
    mapStreet.setPaintProperty('admin-fill', 'fill-color', adminColor);
  }
  if (mapSatellite.getLayer('admin-fill')) {
    mapSatellite.setPaintProperty('admin-fill', 'fill-color', adminColor);
  }
}




// LULC
function loadLULC(mapObj, tahun) {
  fetch('DataLULC2018-2025.json')
    .then(res => res.json())
    .then(data => {
      if (mapObj.getSource('lulc')) {
        mapObj.removeLayer('lulc-layer');
        mapObj.removeSource('lulc');
      }

      mapObj.addSource('lulc', { type: 'geojson', data: data });

      mapObj.addLayer({
        id: 'lulc-layer',
        type: 'fill',
        source: 'lulc',
        filter: ['==', ['get', 'tahun'], parseInt(tahun)],
        paint: {
          'fill-color': [
            'match',
            ['get', 'info'],
            'Badan Air / Perairan', lulcColors['Badan Air / Perairan'],
            'Vegetasi Pohon / Hutan', lulcColors['Vegetasi Pohon / Hutan'],
            'Vegetasi Tergenang', lulcColors['Vegetasi Tergenang'],
            'Lahan Pertanian / Tanaman Budidaya', lulcColors['Lahan Pertanian / Tanaman Budidaya'],
            'Kawasan Terbangun / Permukiman', lulcColors['Kawasan Terbangun / Permukiman'],
            'Lahan Terbuka / Tanah Kosong', lulcColors['Lahan Terbuka / Tanah Kosong'],
            'Padang rumput / lahan semak belukar alami', lulcColors['Padang rumput / lahan semak belukar alami'],
            '#cccccc'
          ],
          'fill-opacity': 0.6
        }
      });

      updateLegendLULC(data, tahun);
    });
}

// update legend + luas
function updateLegendLULC(data, tahun) {
  document.getElementById('legend-title').innerText = "Informasi Klasifikasi LULC";
  const legendDiv = document.getElementById('legend-content');
  legendDiv.innerHTML = '';

  const features = data.features.filter(f => f.properties.tahun === parseInt(tahun));
  const luasPerClass = {};

  features.forEach(f => {
    const cls = f.properties.info;
    const luas = parseFloat(f.properties.luas) || 0;
    if (!luasPerClass[cls]) luasPerClass[cls] = 0;
    luasPerClass[cls] += luas;
  });

  for (const [cls, warna] of Object.entries(lulcColors)) {
    const luas = luasPerClass[cls] ? luasPerClass[cls].toFixed(2) : 0;
    legendDiv.innerHTML += `
      <div>
        <span style="background:${warna};width:15px;height:15px;display:inline-block;margin-right:5px;"></span>
        ${cls} - ${luas} ha
      </div>
    `;
  }
}

// toogle LULC
function toggleLULCLayer() {
  const tahun = document.getElementById('filter-tahun').value;
  if (!LULCNyala) {
    loadLULC(mapStreet, tahun);
    loadLULC(mapSatellite, tahun);
    LULCNyala = true;
  } else {
    if (mapStreet.getLayer('lulc-layer')) mapStreet.removeLayer('lulc-layer');
    if (mapStreet.getSource('lulc')) mapStreet.removeSource('lulc');
    if (mapSatellite.getLayer('lulc-layer')) mapSatellite.removeLayer('lulc-layer');
    if (mapSatellite.getSource('lulc')) mapSatellite.removeSource('lulc');
    LULCNyala = false;
  }
// update ikon tombol LULC
  toggleButtonIcon('btn-lulc', LULCNyala);
}

// filter tahun LULC
function gantiTahunLULC() {
  if (!LULCNyala) return;
  const tahun = document.getElementById('filter-tahun').value;
  loadLULC(mapStreet, tahun);
  loadLULC(mapSatellite, tahun);
}

// ikon hide/unhide LULC
function toggleButtonIcon(btnId, aktif) {
  const btn = document.getElementById(btnId);
  const iconSpan = btn.querySelector('.icon');
  if (aktif) {
    iconSpan.textContent = '👁️‍🗨️'; // aktif
  } else {
    iconSpan.textContent = '🚫'; // non-aktif
  }
}

// animasi timeline LULC
let timelineInterval;
function playTimelineLULC() {
  const tahunList = [2018,2019,2020,2021,2022,2023,2024];
  let idx = 0;
  clearInterval(timelineInterval);
  timelineInterval = setInterval(() => {
    const tahun = tahunList[idx];
    document.getElementById('filter-tahun').value = tahun;
    gantiTahunLULC(); // fungsi lama kamu
    idx++;
    if (idx >= tahunList.length) clearInterval(timelineInterval);
  }, 2000); // ganti tiap 2 detik
}




// Deforestasi 2018 - 2024
function loadDeforestasi(mapObj, tahun) {
  fetch('def_18-24.geojson')
    .then(res => res.json())
    .then(data => {
      if (mapObj.getSource('deforestasi')) {
        mapObj.removeLayer('deforestasi-layer');
        mapObj.removeSource('deforestasi');
      }

      mapObj.addSource('deforestasi', { type: 'geojson', data: data });

      mapObj.addLayer({
        id: 'deforestasi-layer',
        type: 'fill',
        source: 'deforestasi',
        filter: ['==', ['get', 'tahun'], tahun],   // cocokkan string langsung
        paint: {
          'fill-color': [
            'match',
            ['get', 'ket'],
            'deforestation', '#f11509',
            '#cccccc'
          ],
          'fill-opacity': 0.6
        }
      });

      updateLegendDeforestasi(data, tahun);
    });
}


// update legend + luas
function updateLegendDeforestasi(data, tahun) {
  document.getElementById('legend-title').innerText = "Informasi Klasifikasi Deforestasi";
  const legendDiv = document.getElementById('legend-content');
  legendDiv.innerHTML = '';

  const features = data.features.filter(f => f.properties.tahun === tahun); // string match
  let totalLuas = 0;

  features.forEach(f => {
    totalLuas += parseFloat(f.properties.luas) || 0;
  });

  legendDiv.innerHTML = `
    <div class="flex items-center mb-1">
      <span style="background:#d73027;width:15px;height:15px;display:inline-block;margin-right:5px;"></span>
      Deforestasi - ${totalLuas.toFixed(2)} ha
    </div>
  `;
}


// toggle Deforestasi
function toggleDeforestasiLayer() {
  const tahun = document.getElementById('filter-tahun-def').value;

  if (!deforestasiNyala) {
    loadDeforestasi(mapStreet, tahun);
    loadDeforestasi(mapSatellite, tahun);
    deforestasiNyala = true;
  } else {
    if (mapStreet.getLayer('deforestasi-layer')) mapStreet.removeLayer('deforestasi-layer');
    if (mapStreet.getSource('deforestasi')) mapStreet.removeSource('deforestasi');

    if (mapSatellite.getLayer('deforestasi-layer')) mapSatellite.removeLayer('deforestasi-layer');
    if (mapSatellite.getSource('deforestasi')) mapSatellite.removeSource('deforestasi');

    deforestasiNyala = false;
    document.getElementById('legend-content').innerHTML = ''; // kosongkan legend
  }
// update ikon tombol deforestasi
  toggleButtonIcon('btn-def', deforestasiNyala);
}


// ganti tahun Deforestasi
function gantiTahunDeforestasi() {
  if (!deforestasiNyala) return;
  const tahun = document.getElementById('filter-tahun-def').value;
  loadDeforestasi(mapStreet, tahun);
  loadDeforestasi(mapSatellite, tahun);
}

// ikon hide/unhide LULC
function toggleButtonIcon(btnId, aktif) {
  const btn = document.getElementById(btnId);
  const iconSpan = btn.querySelector('.icon');
  if (aktif) {
    iconSpan.textContent = '👁️‍🗨️'; // aktif
  } else {
    iconSpan.textContent = '🚫'; // non-aktif
  }
}

// animasi timeline deforestasi
let timelineDefInterval;
function playTimelineDeforestasi() {
  const tahunList = ["2018-2019","2020-2021","2022-2023","2024"];
  let idx = 0;
  clearInterval(timelineDefInterval);
  timelineDefInterval = setInterval(() => {
    const tahun = tahunList[idx];
    document.getElementById('filter-tahun-def').value = tahun;
    gantiTahunDeforestasi(); // fungsi lama kamu
    idx++;
    if (idx >= tahunList.length) clearInterval(timelineDefInterval);
  }, 2000);
}




// heatmap deforestasi
function loadDeforestasiHeatmap(mapObj) {
  fetch('def_18-24.geojson')
    .then(res => res.json())
    .then(data => {
      if (mapObj.getSource('deforestasi-heat')) {
        mapObj.removeLayer('deforestasi-heat');
        mapObj.removeSource('deforestasi-heat');
      }

      mapObj.addSource('deforestasi-heat', { type: 'geojson', data: data });

      mapObj.addLayer({
        id: 'deforestasi-heat',
        type: 'heatmap',
        source: 'deforestasi-heat',
        // filter sesuai tahun dropdown
        filter: ['==', ['get', 'tahun'], document.getElementById('filter-tahun-heat').value],
        paint: {
          // intensitas heatmap berdasarkan luas
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'luas'],
            0, 0,
            1000, 1
          ],
          'heatmap-intensity': 1,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0,0,255,0)',
            0.2, 'blue',
            0.4, 'lime',
            0.6, 'yellow',
            0.8, 'orange',
            1, 'red'
          ],
          'heatmap-radius': 20,
          'heatmap-opacity': 0.7
        }
      });

      // panggil legend heatmap
      updateLegendDeforestasiHeatmap(data, document.getElementById('filter-tahun-heat').value);
    });
}

// legend heatmap deforestasi
function updateLegendDeforestasiHeatmap(data, tahun) {
  document.getElementById('legend-title').innerText = "Informasi Heatmap Deforestasi";
  const legendDiv = document.getElementById('legend-content');
  legendDiv.innerHTML = '';

  // filter data sesuai tahun
  const features = data.features.filter(f => f.properties.tahun === tahun);
  let totalLuas = 0;

  features.forEach(f => {
    totalLuas += Number(f.properties.luas) || 0;
  });

  legendDiv.innerHTML = `
    <div>
      <span style="background:red;width:15px;height:15px;display:inline-block;margin-right:5px;"></span>
      Total Deforestasi (${tahun}) - ${totalLuas.toFixed(2)} ha
    </div>
  `;
}

// toggle heatmap deforestasi
let deforestasiHeatNyala = false;

function toggleDeforestasiHeatmap() {
  if (!deforestasiHeatNyala) {
    loadDeforestasiHeatmap(mapStreet);
    loadDeforestasiHeatmap(mapSatellite);
    deforestasiHeatNyala = true;
    toggleButtonIcon('btn-def-heat', true);
  } else {
    if (mapStreet.getLayer('deforestasi-heat')) mapStreet.removeLayer('deforestasi-heat');
    if (mapStreet.getSource('deforestasi-heat')) mapStreet.removeSource('deforestasi-heat');

    if (mapSatellite.getLayer('deforestasi-heat')) mapSatellite.removeLayer('deforestasi-heat');
    if (mapSatellite.getSource('deforestasi-heat')) mapSatellite.removeSource('deforestasi-heat');

    deforestasiHeatNyala = false;
    toggleButtonIcon('btn-def-heat', false);
    document.getElementById('legend-content').innerHTML = ''; // kosongkan legend
  }
}


// ikon hide/unhide heatmap deforestasi
function toggleButtonIcon(btnId, aktif) {
  const btn = document.getElementById(btnId);
  const iconSpan = btn.querySelector('.icon');
  if (aktif) {
    iconSpan.textContent = '👁️‍🗨️'; // aktif
  } else {
    iconSpan.textContent = '🚫'; // non-aktif
  }
}