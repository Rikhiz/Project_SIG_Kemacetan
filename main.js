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

const pekanbaruCoordinates = fromLonLat([101.4498, 0.5071]); // Pekanbaru coordinates
// Initialize overlay for popup
var extent = transformExtent([10, 53, 20, 57], "EPSG:4326", "EPSG:3857");
const overlay = new Overlay({
  element: document.getElementById('popup'),
  autoPan: { animation: { duration: 250 } },
});


// Vector layer for polygons
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
      color: 'rgba(53, 113, 161, 0.5)', // Cyan stroke for contrast
      width: 2,
    }),
      }),

  zIndex: 2
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
      src: 'icon/i_macet.png', // Ensure the icon path is correct
      scale: 0.08, 
    }),
  }),
  zIndex: 3, // Ensure it renders above the pku layer
});

// Function to restrict map view to Pekanbaru polygon area
pku.getSource().on('change', function () {
  if (pku.getSource().getState() === 'ready') {
    const extent = pku.getSource().getExtent(); // Get the bounding box of the pku polygon
    map.getView().fit(extent, { duration: 1000 }); // Fit map view to the polygon extent
    map.getView().setMinZoom(12); // Set minimum zoom level
    map.getView().setMaxZoom(18); // Optional: Set maximum zoom level
    map.getView().setExtent(extent); // Restrict map view to this extent
  }
});

var extent = transformExtent([10, 53, 20, 57], "EPSG:4326", "EPSG:3857");

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

// Map initialization
const map = new Map({
  target: 'map',
  layers: [
    osmLayer,  // Add the OSM base layer here
    pku, // Polygon layer
    macet, // Traffic points layer
  ],
  view: new View({
    center: pekanbaruCoordinates,
    zoom: 12, // Adjust zoom level as needed
  }),
});


var polygon = fromExtent(map.getView().getProjection().getExtent());
polygon.appendLinearRing(fromExtent(extent).getLinearRing(0));
const feature = pku.getSource().getFeatures();

var solid = new VectorLayer({
  source: new VectorSource({
    feature: [feature]
  }),
  style: new Style({
    fill: new Fill({
      color: "rgba(0, 255, 255, 0.25)"
    })
  }), zIndex:4
});
map.addLayer(solid);





map.addOverlay(overlay);

// Add popup for feature click
map.on('singleclick', function (evt) {
  // Retrieve feature and layer at the clicked pixel
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
      <h3>${clickedFeature.get('Nama Tempat') || 'Unknown Place'}</h3>
      <p>${clickedFeature.get('Alamat') || 'No Address Available'}</p>
    `;
    const imagePath = clickedFeature.get('gmbr'); // Get the image path from the feature's properties
    if (imagePath) {
      content += `<img src="${imagePath}" alt="Image" width="200" />`; // Ensure the image path is correct
    }
    document.getElementById('popup-content').innerHTML = content;
    overlay.setPosition(coordinate);
  } else {
    // Hide the popup if the clicked feature isn't part of the macet layer
    overlay.setPosition(undefined);
  }
});

// Close popup on click
document.getElementById('popup-closer').onclick = function () {
  overlay.setPosition(undefined);
  return false;
};

