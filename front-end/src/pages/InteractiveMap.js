import React, { Component } from 'react'
import { Map, TileLayer, GeoJSON, FeatureGroup } from "react-leaflet"
import ReactDOM from 'react-dom'
import aus_lgas from '../assets/LGAS_2019.json'
import aus_postcodes from '../assets/aus-postcodes.json'
import lga_data from '../assets/lga_data.json'
import bbox from '@turf/bbox'
import LegendControl from '../components/LegendControl2'
import InfoPanel from '../components/InfoPanel'
import BarChartSingle from '../components/BarChartSingle'
import BarChartRatios from '../components/BarChartRatios'
import LineChartRatios from '../components/LineChartRatios'



//import Legend from '../components/Legend'
import L from "leaflet";

const tweet_query = `http://172.26.130.183:5555/api/view/tweet_view/LGAcount?group=true`
//const tweet_query = `https://testapi.io/api/emilylm/tweets`
//const tweet_query = `http://localhost:5555/api/view/tweet_view/LGAcount?group=true`


function getColor(d, max) {
  d = d*1.00/max*1000.00
  //console.log("COLOR", d, max)
  //console.log("color", d)
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
      maxCases: undefined,
      showInfo: false,
      lgaCode: undefined,
      lga_data: lga_data,
      maxTweets: undefined,
      ratiosHigh: [],
      ratiosLow: [],
      ratios: [],
      view: 0,
      page: "map"
    }
    this.handleOptionChange = this.handleOptionChange.bind(this);
    this.onEachLGA = this.onEachLGA.bind(this)
    this.handleClickFeature = this.handleClickFeature.bind(this)
    this.getCasesLGA = this.getCasesLGA.bind(this)
    this.getTweetsLGA = this.getTweetsLGA.bind(this)
    this.fetchJson = this.fetchJson.bind(this)
    this.getJSONstyle = this.getJSONstyle.bind(this)
    this.getLegend = this.getLegend.bind(this)
    this.highlightFeature = this.highlightFeature.bind(this)
    this.updateInfo = this.updateInfo.bind(this)
    //this.infoShow = this.infoShow.bind(this)
  }

  async componentDidMount() {
    let features = await this.getCasesLGA();
    let tweets = await this.getTweetsLGA();
    //console.log("FEAT:", JSON.stringify(aus_lgas))
    //console.log("FEAT2:", JSON.stringify(features))
    let data = lga_data
    let maxTweets = 0;
    let maxCases = 0;
    let maxRatio = 0;
    let ratios = [];
    for (let f in features){
      let cases = features[f].attributes.Cases
      let lga = features[f].attributes.LGA_CODE19
      if (cases > maxCases){
        maxCases = cases
      }
      data[lga]['tweet_case_ratio'] = 0
      data[lga]['tweet_count'] = 0
      if (cases == null){
        data[lga]['cases'] = 0
      } else {
        data[lga]['cases'] = cases
      }
    }

    for (let t in tweets){
      let count = tweets[t].value
      let lga = tweets[t].key
      if (count > maxTweets){
        maxTweets = count
      }
      data[lga]['tweet_count'] = count
      let cases = data[lga]['cases']

      let ratio;
      if (count == 0){
        if (cases == 0){
          ratio = 0
        } else {
          ratio = 1/cases
        }
      } else {
        if (cases == 0){
          ratio = count/1
        } else {
          ratio = (count/cases).toFixed(3)
        }
      }

      if (ratio > maxRatio){
        maxRatio = ratio
      }
      data[lga]['tweet_case_ratio'] = ratio
      let name = data[lga]['lga_name18']
      let higherEd = data[lga]['%_of_pop_with_post_school_education']
      let income = data[lga]['mean_income']
      ratios.push({lga, name, ratio, higherEd, income})
    }
    this.setState({
          lga_data: data,
          maxCases,
          maxTweets,
          maxRatio
    })
    ratios.sort(function(a, b) {
      return b.ratio - a.ratio;
    });
    let ratiosHigh = ratios.slice(0, 24);
    let ratiosLow = ratios.slice(ratios.length-25, ratios.length-1)
    //console.log("RATIOS", ratiosHigh, ratiosLow)
    this.setState({ratiosHigh, ratiosLow, ratios})
  }

  async fetchJson(url) {
    let response = await fetch(url);
    if (response.ok) {
      return response.json();
    } else {
      throw new Error('Data fetch failed');;
    }
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

  async getTweetsLGA() {
    //const query = `https://testapi.io/api/emilylm/tweets`;
    try {
      let data = await this.fetchJson(tweet_query,{
    mode: 'no-cors',
    method: 'post',
    //url: `http://172.26.130.183:5555`,
    url: `http://localhost:5555`
  });
      return data;
    } catch(err){
      console.log(err)
    }
  }




  getLegend(maxCases){
    let max = parseFloat(maxCases)
    let grades = [0, 100, 50, 20, 10, 5, 2, 1];
    let labels = [];
    let from;
    let to;
    let color;
    let interval;
    //let maxCases = this.max;
    for (let i = 0; i < grades.length-1; i++) {
      grades[i+1] = Math.round(max/grades[i+1])
      from = grades[i];
      to = grades[i+1];
      color = getColor(from + 1, max)
      interval = {from, to}
      labels.push({color, interval})
    }
    return(
    <div class="info legend leaflet-control">
    {labels.map(label => <span><i style={{ background: label.color}}></i> {label.interval.from}&ndash;{label.interval.to}<br/></span>)}
    </div>
    )
  }


  getJSONstyle(cases, maxCases) {
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

  updateInfo(){

  }


  onEachLGA(feature: Object, layer: Object) {
    let view = this.state.view
    let max
    let attribute
    let lga = feature.properties.LGA_CODE19
    let cases = this.state.lga_data[lga].cases
    let tweets = this.state.lga_data[lga].tweet_count
    if (view == 0){
      max = this.state.maxCases
      attribute = cases
    }
    if (view == 1){
      max = this.state.maxTweets
      attribute = tweets
    }
    /*
    if (view == 0){
      max = this.state.maxRatio
      attribute = this.state.ratios[lga].ratio
    }
    */
    //console.log("FEATURE", feature.properties.cases)
    layer.setStyle({
      fillColor: this.getJSONstyle(attribute, max),
      color: 'white',
      weight: 1,
      fillOpacity: 0.5,
    })
    const popupContent = `<Popup>${feature.properties.LGA_NAME19}</br><b>No. Cases: </b>${cases}</br><b>No. Tweets: </b>${tweets}</br><b>Total Population: </b>${lga_data[lga]['population']}</br><b>Area: </b>${lga_data[lga]['area']}</br></Popup>`
    /*const popupContent = ReactDOMServer.renderToString(
      <CustomPopup feature={feature} />
    );*/


    layer.bindTooltip(popupContent, { direction: 'center', sticky: 'true', offset: [-75, -25]})
    //layer.bindTooltip(popupContent, { direction: 'left', sticky: 'true', offset: [-75, -25]})

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
        });    //console.log("EEEE", e.target.feature.properties.LGA_CODE19)
  }
/*
mouseover: () => (this.highlightFeature, this.infoShow(feature)),
  infoShow = (feature) => {
    this.setState({info: feature.properties.LGA_NAME19})
  }*/
  resetHighlight(e) {
    var layer = e.target;
    layer.setStyle({
      color: 'white',
      weight: 1,
      fillOpacity: 0.5,
      //fillColor: '#fff2af',
    });
  }

	handleOptionChange = e => {
		const view = e.target.value;
		this.setState({
			view,
		});
	}

  handleClickFeature = (feature) => {
    const bboxArray = bbox(feature);
    const corner1 = [bboxArray[1], bboxArray[0]];
    const corner2 = [bboxArray[3], bboxArray[2]];
    this.setState({bounds: [corner1, corner2], lgaCode: feature.properties.LGA_CODE19})


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
    const legendCases = this.getLegend(this.state.maxCases);
    const legendTweets = this.getLegend(this.state.maxTweets);
    const position = [this.state.lat, this.state.lng]
    return (
      <div className="container-fluid" id="pageContainer">
        <div className="row align-items-center" id="page-header">
          <div class="col-12 text-center">
          <button type="button" class="btn btn-light" aria-pressed={(this.state.page == "map")} onClick={() => this.setState({page: "map"})}>Map View</button>
          &nbsp;&nbsp;
          <button type="button" class="btn btn-light" aria-pressed={(this.state.page == "chart")} onClick={() => this.setState({page: "chart"})}>Summary Charts</button>
          </div>
      </div>



      <div id="mapContainer">
      {(this.state.page == "map") ?
      <div>
      {('cases' in this.state.lga_data["10050"]) ?
        <div>
        <Map bounds={this.state.bounds} zoomSnap={0.1} ref="map" center={position} zoom={this.state.zoom}>
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZW1pbHlsbSIsImEiOiJja2FtZjh3dzMwNTNrMnhsdWdoaG5sODBoIn0.jdy_EUBZ666XR05JpU7M0g"
          id="mapbox/light-v9"
        />
          <FeatureGroup ref="features" onAdd={this.onFeatureGroupAdd}>
          <GeoJSON
            key={this.state.view}
            data={this.state.features}
            ref="geojson"
            onEachFeature={this.onEachLGA}
          />
          </ FeatureGroup>
          <LegendControl position="topright">
          <div class="info legend leaflet-control">
          <h6><b>Colour map by:</b></h6>
          <div class="form-check">
            <input class="form-check-input" type="radio" name="exampleRadios" id="exampleRadios1" value={0} checked={this.state.view == 0} onClick={this.handleOptionChange} />
            <label class="form-check-label" for="exampleRadios1">
              # of Covid-19 Cases
            </label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="radio" name="exampleRadios" id="exampleRadios2" value={1} checked={this.state.view == 1} onClick={this.handleOptionChange} />
            <label class="form-check-label" for="exampleRadios2">
              # of Covid-19 Tweets
            </label>
          </div>
          </div>
          </LegendControl>
          <LegendControl position="bottomleft">
            <InfoPanel key={[this.state.lga_data, this.state.lgaCode]} lgaData={this.state.lga_data} lgaCode={this.state.lgaCode}/>
          </LegendControl>
          {(this.state.view == 0) ?
          <LegendControl position="bottomright">
            {legendCases}
          </LegendControl>
           :
           <LegendControl position="bottomright">
             {legendTweets}
           </LegendControl>}
        </Map>
        </div>
      : null}
      </div>
      :
      <div>
        <h6 style={{textAlign: "center"}}>10 LGAs with the highest ratio of tweets per covid-19 case</h6>
        <BarChartRatios ratios={this.state.ratiosHigh} />
        <h6 style={{textAlign: "center"}}>10 LGAs with the lowest ratio of tweets per covid-19 case</h6>
        <BarChartRatios ratios={this.state.ratiosLow} />
        <h6 style={{textAlign: "center"}}>Summary of all LGAs</h6>
        <LineChartRatios ratios={this.state.ratios} />
      </div>
      }
      </div>
    </div>
    )
  }
}
