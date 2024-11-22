import './style.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Vector as VectorSource } from 'ol/source.js';
import VectorLayer from 'ol/layer/Vector';
import GeoJSON from 'ol/format/GeoJSON.js';
import { fromLonLat } from 'ol/proj.js';
import { Icon, Style } from 'ol/style.js';
import Overlay from 'ol/Overlay.js';

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
//End.
const pku = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'data/polygonpku.json'
  })
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
  })
});


// Create the map
const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM() // OpenStreetMap as the base layer
    }),
    macet,pku // Add the vector layer to the map
  ],
  view: new View({
    center: [0, 0],
    zoom: 2
  })});
  
map.addOverlay(overlay); //untuk menambah overlay
// JS for click popup
map.on('singleclick', function (evt) {
  const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
    return feature;
  });
  if (!feature) {
    return;
  }
  const coordinate = evt.coordinate;
  const content = '<h3>Nama Tempat : ' + feature.get('Nama Tempat') +
    '</h3>' + '<p>Alamat : ' + feature.get(
      'Alamat') + '</p>';
  content_element.innerHTML = content;
  overlay.setPosition(coordinate);
});

//Click handler to hide popup
closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};