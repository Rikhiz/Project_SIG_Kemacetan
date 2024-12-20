import './style.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import { Vector as VectorSource } from 'ol/source.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { fromLonLat } from 'ol/proj';
import { Icon, Style, Fill, Stroke } from 'ol/style.js';
import Overlay from 'ol/Overlay.js';

// Pekanbaru coordinates
const pekanbaruCoordinates = fromLonLat([101.4498, 0.5071]); // Pekanbaru coordinates

// Initialize overlay for popup
const overlay = new Overlay({
  element: document.getElementById('popup'),
  autoPan: { animation: { duration: 250 } },
});

// Vector layer for polygons (Pekanbaru area)
const pku = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'data/polygonpku.json',
  }),
  style: new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.7)', // Semi-transparent white fill
    }),
    stroke: new Stroke({
      color: 'rgba(53, 113, 161, 0.90)', // Cyan stroke for contrast
      width: 2,
    }),
  }),
  zIndex: 2,
});

// Layer for traffic (macet)
const macet = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'data/macet.json', // GeoJSON data for traffic locations
  }),
  style: new Style({
    image: new Icon({
      anchor: [0.5, 46],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      src: 'icon/i_macet.png', // Ensure the icon path is correct
      scale: 0.10, 
    }),
  }),
  zIndex: 3, // Ensure it renders above the pku layer
});

// Map initialization
const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }), // OSM base layer
    pku, // Pekanbaru polygon layer
    macet, // Traffic points layer
  ],
  view: new View({
    center: pekanbaruCoordinates,
    zoom: 12,
  }),
});

// Add overlay for popups
map.addOverlay(overlay);

// Add popup for feature click
map.on('singleclick', function (evt) {
  let clickedFeature = null;
  map.forEachFeatureAtPixel(evt.pixel, (feature) => {
    clickedFeature = feature;
    return true; // Stop iteration once a feature is found
  });

  if (clickedFeature) {
    const coordinate = evt.coordinate;
    const content = `
      <h3>${clickedFeature.get('Nama Tempat') || 'Unknown Place'}</h3>
      <p>${clickedFeature.get('Alamat') || 'No Address Available'}</p>
      <img src="${clickedFeature.get('gmbr') || ''}" alt="Image" width="200" />
    `;
    document.getElementById('popup-content').innerHTML = content;
    overlay.setPosition(coordinate);
  } else {
    overlay.setPosition(undefined); // Hide popup if no feature is clicked
  }
});
const closer = document.getElementById('popup-closer');

closer.onclick = function () {
  overlay.setPosition(undefined); // Sembunyikan popup
  closer.blur(); // Hilangkan fokus dari tombol close
  return false; // Mencegah aksi default (navigasi)
};


function filterMacetByTime() {
  const pagiChecked = document.getElementById('macet-pagi').checked;
  const siangChecked = document.getElementById('macet-siang').checked;
  const soreChecked = document.getElementById('macet-sore').checked;
  const malamChecked = document.getElementById('macet-malam').checked;

  const allUnchecked = !pagiChecked && !siangChecked && !soreChecked && !malamChecked; // Semua checkbox tidak aktif
  const allChecked = pagiChecked && siangChecked && soreChecked && malamChecked; // Semua checkbox aktif

  const features = macet.getSource().getFeatures(); // Mendapatkan semua fitur

  // Iterasi fitur dan atur visibilitas berdasarkan filter
  features.forEach((feature) => {
    const waktuMacet = feature.get('waktuMacet'); // Ambil waktu macet dari properti fitur

    if (
      allUnchecked || // Jika semua checkbox tidak aktif, tampilkan semua
      allChecked || // Jika semua checkbox aktif, tampilkan semua
      (pagiChecked && waktuMacet === 'pagi') ||
      (siangChecked && waktuMacet === 'siang') ||
      (soreChecked && waktuMacet === 'sore') ||
      (malamChecked && waktuMacet === 'malam')
    ) {
      // Tampilkan fitur
      feature.setStyle(null); // Gunakan gaya bawaan layer
    } else {
      // Sembunyikan fitur
      feature.setStyle(new Style());
    }
  });
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
