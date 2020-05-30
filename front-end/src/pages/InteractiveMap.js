import React, { Component } from 'react'
import { Map, TileLayer, GeoJSON, FeatureGroup } from "react-leaflet"
import aus_lgas from '../assets/LGAS_2019.json'
import aus_postcodes from '../assets/aus-postcodes.json'
import bbox from '@turf/bbox'
//import Legend from '../components/Legend'
/*
const geoJSONStyle = {
  color: 'white',
  weight: 1,
  fillOpacity: 0.5,
  fillColor: '#fff2af'
}
*/

function getColor(d, max) {
  d = d*1.00/max*1000.00
  console.log("COLOR", d, max)
  console.log("color", d)
  return d > 1000 ? '#800026' :
         d > 500  ? '#BD0026' :
         d > 200  ? '#E31A1C' :
         d > 100  ? '#FC4E2A' :
         d > 50   ? '#FD8D3C' :
         d > 20   ? '#FEB24C' :
         d > 10   ? '#FED976' :
                    '#FFEDA0';
}


export default class InteractiveMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lat: 51.505,
      lng: -0.09,
      zoom: 12,
      bounds: undefined,
      features: aus_lgas,
      maxCases: 0
    }
    this.onEachLGA = this.onEachLGA.bind(this)
    this.handleClickFeature = this.handleClickFeature.bind(this)
    this.getCasesLGA = this.getCasesLGA.bind(this)
    this.fetchJson = this.fetchJson.bind(this)
    this.getJSONstyle = this.getJSONstyle.bind(this)
    //this.style = this.style.bind(this)
    //this.geoJSONStyle = this.geoJSONStyle.bind(this)
  }



/*
  getColor(d) {
          // now uses palette from google material design: https://material.io/guidelines/style/color.html#color-color-palette
          var material_design_color_idx = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"]
          var palette = new Array(material_design_color_idx.length)
          var i
          for (i = 0; i < material_design_color_idx.length; i++) {
              palette[i] = material_design_colors[this.state.polygonFillColor][material_design_color_idx[i]]
          }
          for (i = 1; i <= palette.length; i++) {
              // values of the property are between -10,0 and 10.0
              if (d < -10.0 + i * (10.0 - (-10.0)) / palette.length) {
                  return palette[i - 1]
              }
          }
      };

  style(feature) {
          return {
              // the fillColor is adapted from a property which can be changed by the user (segment)
              fillColor: this.getColor(feature.properties.scores[this.state.segment]),
              weight: 0.3,
              //stroke-width: to have a constant width on the screen need to adapt with scale
              opacity: 1,
              color: material_design_colors[this.state.polygonFillColor]["400"],
              dashArray: '3',
              fillOpacity: 0.5
          };
      };
*/

  async componentDidMount() {
    let features = await this.getCasesLGA();
    console.log("FEAT:", JSON.stringify(aus_lgas))
    console.log("FEAT2:", JSON.stringify(features))
    let data = aus_lgas;
    let maxCases = 0;
    for (let feat in data.features) {
      let lga = data.features[feat].properties.LGA_CODE19
      for (let f in features){
        //console.log("F:", f, features[f])
        if (features[f].attributes.LGA_CODE19 == lga){
          let cases = features[f].attributes.Cases
          if (cases > maxCases){
            maxCases = cases
          }
          if (cases == null){
            data.features[feat].properties['cases'] = 0
          } else {
            data.features[feat].properties['cases'] = features[f].attributes.Cases
          }
        }
      }
    }
    console.log("MAX CASES: ", maxCases)
    this.setState({
          features: data,
          maxCases: maxCases
    })
  }

  async fetchJson(url) {
    let response = await fetch(url);
    if (response.ok) {
      return response.json();
    } else {
      throw new Error('Data fetch failed');;
    }
  }


  getJSONstyle(cases, maxCases) {
    console.log("CASES: ", cases)
    console.log("MAX CASES: ", maxCases)

    return getColor(parseFloat(cases), parseFloat(maxCases))
  }

  async getCasesLGA() {
    const query = `https://services1.arcgis.com/vHnIGBHHqDR6y0CR/arcgis/rest/services/Australian_Cases_by_LGA/FeatureServer/0/query?where=1%3D1&outFields=LGA_CODE19,Cases&returnGeometry=false&outSR=4326&f=json`;
    try {
      let data = await this.fetchJson(query);
      return data.features;
    } catch(err){
      console.log(err)
    }
  }



/*
  geoJSONStyle = () => {
    return {
      color: 'white',
      weight: 0.5,
      fillOpacity: 0.5,
      fillColor: '#fff2af',
    }
  }
*/

/*
  onEachPCFeature(feature: Object, layer: Object) {
    const popupContent = ` <Popup><pre>Postcode: <br />${feature.properties.POA_CODE16}</pre></Popup>`
    layer.bindTooltip(popupContent)
  }

  */
  onEachLGA(feature: Object, layer: Object) {
    console.log("FEATURE", feature.properties.cases)
    layer.setStyle({
      fillColor: this.getJSONstyle(feature.properties.cases, this.state.maxCases),
      color: 'white',
      weight: 1,
      fillOpacity: 0.5,
    })
    const popupContent = ` <Popup>${feature.properties.LGA_NAME19}</br><b>No. Cases: </b>${feature.properties.cases}</Popup>`
    layer.bindTooltip(popupContent, { direction: 'center', sticky: 'true', offset: [-75, -25]})
    layer.on({
      click: () => this.handleClickFeature(feature),
      mouseover: this.highlightFeature,
      mouseout: this.resetHighlight,
    });
  }

  highlightFeature(e) {
    var layer = e.target;
    layer.bringToFront()
    layer.setStyle({
        weight: 3,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
        });
  }
  resetHighlight(e) {
    var layer = e.target;
    layer.setStyle({
      color: 'white',
      weight: 1,
      fillOpacity: 0.5,
      //fillColor: '#fff2af',
    });
  }

  handleClickFeature = (feature) => {
    const bboxArray = bbox(feature);
    const corner1 = [bboxArray[1], bboxArray[0]];
    const corner2 = [bboxArray[3], bboxArray[2]];
    this.setState({bounds: [corner1, corner2]})

    //this.refs.map.leafletElement.fitBounds(this.refs.geojson.leafletElement.getBounds())
  }

  onFeatureGroupAdd = () => {
    let bounds = this.refs.geojson.leafletElement.getBounds()
    bounds.getSouthWest().wrap();
    bounds.getNorthEast().wrap();
    this.setState({bounds: bounds})
    this.refs.map.leafletElement.fitBounds(bounds);
  }

  render() {
    const position = [this.state.lat, this.state.lng]
    return (
      <div>
      {JSON.stringify(this.state.features.features[0].properties)}
      {(('features' in this.state.features) && ('cases' in this.state.features.features[0].properties)) ?
        <div>
        <Map bounds={this.state.bounds} zoomSnap={0.1} ref="map" center={position} zoom={this.state.zoom}>
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZW1pbHlsbSIsImEiOiJja2FtZjh3dzMwNTNrMnhsdWdoaG5sODBoIn0.jdy_EUBZ666XR05JpU7M0g"
          id="mapbox/light-v9"
        />
          <FeatureGroup ref="features" onAdd={this.onFeatureGroupAdd}>
          <GeoJSON
            data={this.state.features}
            ref="geojson"
            style={this.getJSONstyle}
            onEachFeature={this.onEachLGA}
          />
          </ FeatureGroup>

        </Map>
        </div>
      : null}
      </div>
    )
  }
}

/*
<GeoJSON
  data={aus_postcodes}
  style={this.geoJSONStyle}
  onEachFeature={this.onEachPCFeature}
/>


<Legend max={this.state.maxCases}/>

*/
