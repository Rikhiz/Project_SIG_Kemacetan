import './style.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Vector as VectorSource } from 'ol/source.js';
import VectorLayer from 'ol/layer/Vector';
import GeoJSON from 'ol/format/GeoJSON.js';
import { Icon, Style } from 'ol/style.js';
import Overlay from 'ol/Overlay.js';

// Initialize the popup container
const container = document.getElementById('popup');
const content_element = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');

const overlay = new Overlay({
  element: container,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});

const macet = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'data/macet.json' // Make sure the path is correct
  }),
  style: new Style({
    image: new Icon({
      anchor: [0.5, 46],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      src: 'icon/i_macet.png', // Ensure the icon path is correct
      width: 32,
      height: 32
    })
  }),
  zIndex: 2 // Make sure macet layer is above the pku layer
});

// Create vector layers for polygons and points
const pku = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'data/polygonpku.json'
  }),
  zIndex: 1 // Set z-index lower to ensure polygons stay below points
});

// Create the map
const map = new Map({
  target: 'map',
  overlays: [overlay],
  layers: [
    new TileLayer({
      source: new OSM() // OpenStreetMap as the base layer
    }),
    macet, pku // Add the vector layer to the map
  ],
  view: new View({
    center: [0, 0],
    zoom: 3,
  })
});

// Add overlay to the map
map.addOverlay(overlay);

// JS for click popup
map.on('singleclick', function (evt) {
  const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
    return feature;
  });

  // Check if a feature was clicked and if it's a point feature
  if (!feature) {
    return; // No feature clicked, do nothing
  }

  const geometry = feature.getGeometry();
  const type = geometry.getType();

  // Check if it's a Point feature in the macet layer
  if (type === 'Point') {
    const coordinate = evt.coordinate;
    var content = '<h3>Nama Tempat : ' + feature.get('Nama Tempat') +
      '</h3>' + '<p>Alamat : ' + feature.get('Alamat') + '</p>';

    const imagePath = feature.get('gmbr');
    if (imagePath) {
      content += '<img src="' + imagePath + '" alt="Image" width="200" />';
    }

    content_element.innerHTML = content;
    overlay.setPosition(coordinate);
  }
  // Check if it's a Polygon feature in the pku layer
  else if (type === 'Polygon') {
    // Optionally, handle polygon click (you can display information or style changes)
    console.log('Polygon clicked');
  }
});

// Close popup handler
closer.onclick = function () {
  overlay.setPosition(undefined);  // Close the overlay
  closer.blur();  // Remove focus from the closer button
  return false;   // Prevent default action
};
