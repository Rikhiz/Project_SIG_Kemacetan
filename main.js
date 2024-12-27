import './style.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import { Vector as VectorSource } from 'ol/source.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { fromLonLat, transformExtent } from "ol/proj";
import { fromExtent } from "ol/geom/Polygon";
import { Icon, Style , Fill, Stroke} from 'ol/style.js';
import Overlay from 'ol/Overlay.js';
import { getVectorContext } from "ol/render";

const pekanbaruCoordinates = fromLonLat([101.4498, 0.5071]); 

var extent = transformExtent([10, 53, 20, 57], "EPSG:4326", "EPSG:3857");
const overlay = new Overlay({
  element: document.getElementById('popup'),
  autoPan: { animation: { duration: 250 } },
});

var osmLayer = new TileLayer({
  source: new OSM()
});

osmLayer.on("postrender", function (event) {
  var vectorContext = getVectorContext(event);
  vectorContext.setStyle(
    new Style({
      fill: new Fill({
        color: "rgba(0, 0, 0, 0.25)"
      })
    })
  );
  var polygon = fromExtent(map.getView().getProjection().getExtent());
  polygon.appendLinearRing(fromExtent(extent).getLinearRing(0));
  vectorContext.drawGeometry(polygon);
});

const macet = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'data/macet.json', 
  }),
  style: new Style({
    image: new Icon({
      anchor: [0.5, 46],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      src: 'icon/i_macet.png',
      scale: 0.08, 
    }),
  }),
  zIndex: 3,
});

const pku = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'data/polygonpku.json',
  }),
  style: new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.48)', // Semi-transparent white fill
    }),
    stroke: new Stroke({
      color: 'rgba(0, 136, 248, 0.5)', // Cyan stroke for contrast
      width: 2,
    }),
  }),
  zIndex: 2,
});

const map = new Map({
  target: 'map',
  layers: [
    osmLayer,  // Add the OSM base layer here
    pku, 
    macet,
    
  ],
  view: new View({
    center: pekanbaruCoordinates,
    zoom: 12, // Adjust zoom level as needed
    maxZoom: 18, // Allow zooming in closer
    minZoom: 12, // Restrict zooming out beyond level 12
  }),
});


map.addOverlay(overlay);

// Add popup for feature click
map.on('singleclick', function (evt) {
  let clickedFeature = null;
  let clickedLayer = null;

  map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
    clickedFeature = feature;
    clickedLayer = layer;
    return true; // Stop iteration once a feature is found
  });

  if (clickedFeature && clickedLayer === macet) {
    const coordinate = evt.coordinate;
    let content = `
      <div class="popup-content">
        <h3>${clickedFeature.get('Nama Tempat') || 'Unknown Place'}</h3>
        <p><strong>Alamat:</strong> ${clickedFeature.get('Alamat') || 'No Address Available'}</p>
        <p><strong>Waktu Macet:</strong> ${clickedFeature.get('waktuMacet') || 'Tidak Tersedia'}</p>
      `;

    const imagePath = clickedFeature.get('gmbr'); // Get the image path from the feature's properties
    if (imagePath) {
      content += `<img src="${imagePath}" alt="Image" />`;
    }

    content += `</div>`; // Closing the popup content container
    document.getElementById('popup-content').innerHTML = content;
    overlay.setPosition(coordinate);
  } else {
    overlay.setPosition(undefined); // Hide the popup
  }
});
function filterMacetByTime() {
  const pagiChecked = document.getElementById('macet-pagi').checked;
  const siangChecked = document.getElementById('macet-siang').checked;
  const soreChecked = document.getElementById('macet-sore').checked;
  const malamChecked = document.getElementById('macet-malam').checked;

  const allUnchecked = !pagiChecked && !siangChecked && !soreChecked && !malamChecked;
  const trafficListContainer = document.getElementById('traffic-list');
  const trafficItems = document.getElementById('traffic-items');
  trafficItems.innerHTML = ''; // Bersihkan daftar sebelumnya

  let hasMatchingFeatures = false; // Flag untuk fitur yang sesuai

  const features = macet.getSource().getFeatures();
  features.forEach((feature) => {
    const waktuMacet = feature.get('waktuMacet');
    const namaTempat = feature.get('Nama Tempat') || 'Unknown Place';
    const alamat = feature.get('Alamat') || 'No Address Available';
    const gmbr = feature.get('gmbr') || '';

    if (
      !allUnchecked &&
      (pagiChecked && waktuMacet === 'pagi') ||
      (siangChecked && waktuMacet === 'siang') ||
      (soreChecked && waktuMacet === 'sore') ||
      (malamChecked && waktuMacet === 'malam')
    ) {
      hasMatchingFeatures = true; // Ada fitur yang sesuai
      feature.setStyle(null); // Tampilkan fitur di peta

      // Tambahkan item ke daftar
      const listItem = document.createElement('li');
      listItem.innerHTML = `
        <p><strong>${namaTempat}</strong><br>${alamat}<br><small>Waktu: ${waktuMacet}</small></p>
        ${gmbr ? `<img src="${gmbr}" alt="${namaTempat}" />` : ''}
      `;

      // Tambahkan event listener untuk menampilkan popup saat item ditekan
      listItem.addEventListener('click', () => {
        const coordinate = feature.getGeometry().getCoordinates();
        let content = `
          <div class="popup-content">
            <h3>${namaTempat}</h3>
            <p><strong>Alamat:</strong> ${alamat}</p>
            <p><strong>Waktu Macet:</strong> ${waktuMacet}</p>
        `;
        if (gmbr) {
          content += `<img src="${gmbr}" alt="${namaTempat}" />`;
        }
        content += `</div>`;
        document.getElementById('popup-content').innerHTML = content;
        overlay.setPosition(coordinate); // Set posisi popup
      });

      trafficItems.appendChild(listItem);
    } else {
      feature.setStyle(new Style()); // Sembunyikan fitur
    }
  });

  // Tampilkan atau sembunyikan daftar berdasarkan hasil filter
  if (hasMatchingFeatures) {
    trafficListContainer.style.display = 'block'; // Tampilkan daftar
  } else {
    trafficListContainer.style.display = 'bl'; // Sembunyikan daftar
  }
}




// Event listener for checkbox changes to filter traffic data
document.getElementById('macet-pagi').addEventListener('change', filterMacetByTime);
document.getElementById('macet-siang').addEventListener('change', filterMacetByTime);
document.getElementById('macet-sore').addEventListener('change', filterMacetByTime);
document.getElementById('macet-malam').addEventListener('change', filterMacetByTime);

// Initialize map with filter applied on page load
document.addEventListener('DOMContentLoaded', function () {
  filterMacetByTime(); // Apply initial filter
});
// Close popup on click
document.getElementById('popup-closer').onclick = function () {
  overlay.setPosition(undefined);
  return false;
};
// Fungsi untuk mengontrol visibilitas layer
document.getElementById('toggle-pku').addEventListener('change', function (event) {
  pku.setVisible(event.target.checked); // Tampilkan atau sembunyikan layer pku
});

document.getElementById('toggle-macet').addEventListener('change', function (event) {
  macet.setVisible(event.target.checked); // Tampilkan atau sembunyikan layer macet
});


