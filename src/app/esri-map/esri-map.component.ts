import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { loadModules } from 'esri-loader';
import esri = __esri; // Esri TypeScript Types

@Component({
  selector: 'app-esri-map',
  templateUrl: './esri-map.component.html',
  styleUrls: ['./esri-map.component.css']
})
export class EsriMapComponent implements OnInit {

  @Output() mapLoadedEvent = new EventEmitter<boolean>();

  // The <div> where we will place the map
  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

  /**
   * _zoom sets map zoom
   * _center sets map center
   * _basemap sets type of map
   * _loaded provides map loaded status
   */
  private _zoom = 16;
  private _center: Array<number> = [0.1278, 51.5074];
  private _basemap = 'streets';
  private _loaded = false;
  private _mapView = null;
  private _featureLayer = null;

  get mapLoaded(): boolean {
    return this._loaded;
  }

  @Input()
  set zoom(zoom: number) {
    this._zoom = zoom;
  }

  get zoom(): number {
    return this._zoom;
  }

  @Input()
  set center(center: Array<number>) {
    this._center = center;
  }

  get center(): Array<number> {
    return this._center;
  }

  @Input()
  set basemap(basemap: string) {
    this._basemap = basemap;
  }

  get basemap(): string {
    return this._basemap;
  }

  constructor() { }

  async initializeMap() {
    try {

      // Load the modules for the ArcGIS API for JavaScript
      const [EsriMap, EsriMapView, FeatureLayer] = await loadModules([
        'esri/Map',
        'esri/views/MapView',
        'esri/layers/FeatureLayer'
      ]);

      // Configure the Map
      const mapProperties: esri.MapProperties = {
        basemap: this._basemap
      };

      const map: esri.Map = new EsriMap(mapProperties);

      // Initialize the MapView
      const mapViewProperties: esri.MapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this._center,
        zoom: this._zoom,
        map: map
      };

      return (new EsriMapView(mapViewProperties))

    } catch (error) {
      console.log('EsriLoader: ', error);
    }

  }

  async getData() {
    const [FeatureLayer] = await loadModules(['esri/layers/FeatureLayer']);

    let layer = new FeatureLayer({
      url: "http://sampleserver5.arcgisonline.com/arcgis/rest/services/LocalGovernment/Events/MapServer/0",
      outFields: ["*"],
    });

    return layer.queryFeatures();
  }

  async addLayer() {
    const [FeatureLayer] = await loadModules(['esri/layers/FeatureLayer']);

    this.getData().then((result) => {

      const fieldList = [
        {
          name: "objectid",
          alias: "objectid",
          type: "oid"
        },
        {
          name: "eventid",
          alias: "Id do Evento",
          type: "integer"
        },
        {
          name: "description",
          alias: "Descrição",
          type: "string"
        },
        {
          name: "eventdate",
          alias: "Data do Evento",
          type: "date"
        },
        {
          name: "recommendattending",
          alias: "Recomendado",
          type: "integer"
        },
        {
          name: "event_type",
          alias: "Tipo de Evento",
          type: "integer"
        }
      ]
      const renderer = {
        type: "simple",                    // autocasts as new SimpleRenderer()
        symbol: {
          type: "picture-marker",  // autocasts as new PictureMarkerSymbol()
          url: "https://static.arcgis.com/images/Symbols/Shapes/BlackStarLargeB.png",
          width: "64px",
          height: "64px"
        }
      };
      var popupTemplate = {                     // autocasts as new PopupTemplate()
        title: "Informações de Evento: {description}",
        content: [{
          type: "fields",
          fieldInfos: [
            {
              fieldName: "eventid",
              alias: "Id do Evento",
              visible: true
            },
            {
              fieldName: "description",
              alias: "Descrição",
              visible: true
            },
            {
              fieldName: "eventdate",
              label: "Data do Evento",
              visible: true
            },
            {
              fieldName: "recommendattending",
              label: "Recomendado",
              visible: true
            },
            {
              fieldName: "event_type",
              label: "Tipo de Evento",
              visible: true
            }
          ]
        }]
      };
      var graphics = result.features.map(function (place) {
        return {
          attributes: {
            objectid: place.attributes.objectid,
            description: place.attributes.description,
            eventdate: place.attributes.eventdate,
            recommendattending: place.attributes.recommendattending,
            eventid: place.attributes.eventid,
            event_type: place.attributes.event_type,
          },
          geometry: {
            type: "point",
            longitude: place.geometry.longitude,
            latitude: place.geometry.latitude
          }
        }

      });
      this._featureLayer = new FeatureLayer({
        objectIdField: "objectid",
        source: graphics,
        renderer: renderer,
        fields: fieldList,
        popupTemplate: popupTemplate,
      });

      this._mapView.map.layers.add(this._featureLayer, 0);
    });
  }

  ngOnInit() {
    this.initializeMap().then((mapview) => {
      this._mapView = mapview;

      this.addLayer();

      this._mapView.on("click", (evt) => {
        console.log([evt.mapPoint.longitude, evt.mapPoint.latitude]);
      });
    });
  }

}