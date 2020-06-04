// Homepage component for the front end application
// COMP90024 Assignment 2 2020
//
// Jock Harkness 758158
// Thomas Minuzzo 638958
// Cameron Dempsey 759026
// Emily Marshall 587580
// Hoang Viet Mai 813361

import React, { Component } from 'react'
import { Map, TileLayer, GeoJSON, FeatureGroup } from "react-leaflet"
import ReactDOM from 'react-dom'
import aus_lgas from '../assets/lga_shapes.json'
import lga_data from '../assets/lga_data.json'
import bbox from '@turf/bbox'
import LegendControl from '../components/LegendControl'
import InfoPanel from '../components/InfoPanel'
import BarChartSingle from '../components/BarChartSingle'
import BarChartRatios from '../components/BarChartRatios'
import LineChartRatios from '../components/LineChartRatios'
import L from "leaflet";

// API query strings
const tweet_query = `http://172.26.130.183:5555/api/view/tweet_view/LGAcount?group=true`
const hashtag_query = `http://172.26.130.183:5555/api/view/tweet_view/hashtags?group=true`
const cases_query = `https://services1.arcgis.com/vHnIGBHHqDR6y0CR/arcgis/rest/services/Australian_Cases_by_LGA/FeatureServer/0/query?where=1%3D1&outFields=LGA_CODE19,Cases&returnGeometry=false&outSR=4326&f=json`

// Hashtags used in the twitter search query to identify covid-related tweets
const searchHashtags = ["covid", "covid19", "covid-19", "coronavirus", "lockdown", "pandemic"]


// Returns the colour for a LGA region on the map
function getColor(d, max) {
  d = d*1.00/max*1000.00
  return d > 1000 ? '#800026' :
         d > 500  ? '#BD0026' :
         d > 200  ? '#E31A1C' :
         d > 100  ? '#FC4E2A' :
         d > 50   ? '#FD8D3C' :
         d > 20   ? '#FEB24C' :
         d > 10   ? '#FED976' :
                    '#FFEDA0';
}


// Class to render the Homepage View
export default class InteractiveMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lat: 51.505,
      lng: -0.09,
      zoom: 12,
      bounds: undefined, // determined the zoom bounds for the map
      features: aus_lgas, // list of LGA feature geometries
      maxCases: undefined, // maximum number of cases per LGA
      lgaCode: undefined, // LGA code for current LGA clicked on
      lga_data: lga_data, // LGA information
      maxTweets: undefined, // masimum number of tweets per LGA
      ratiosHigh: [], // 25 LGAs with highest ratio of tweets per case
      ratiosLow: [], // 25 LGAs with lowest ratio of tweets per case
      ratios: [], // Sorted list of tweets per case for all LGAs
      view: 0, // colour view option for map, 0 = # cases, 1 = # tweets, 2 = ratio of tweets per case
      page: "map", // page view
      topHashtags: [] // List of 25 most frequent hashtags present in covid-19 related tweets
    }
    // bind functions to instance
    this.handleOptionChange = this.handleOptionChange.bind(this);
    this.onEachLGA = this.onEachLGA.bind(this)
    this.handleClickFeature = this.handleClickFeature.bind(this)
    this.getCasesLGA = this.getCasesLGA.bind(this)
    this.getTweetsLGA = this.getTweetsLGA.bind(this)
    this.getTopHashtags = this.getTopHashtags.bind(this)
    this.fetchJson = this.fetchJson.bind(this)
    this.getJSONstyle = this.getJSONstyle.bind(this)
    this.getLegend = this.getLegend.bind(this)
    this.highlightFeature = this.highlightFeature.bind(this)
  }

  async componentDidMount() {
    // load in remote data
    let hashtags = await this.getTopHashtags();
    let features = await this.getCasesLGA();
    let tweets = await this.getTweetsLGA();
    let data = lga_data
    // initialise max counters for each data variable
    let maxTweets = 0;
    let maxCases = 0;
    let maxRatio = 0;
    // initialise empty list of tweet per case ratios
    let ratios = [];
    // loop through LGA features with case numbers in returned data
    for (let f in features){
      let cases = features[f].attributes.Cases
      let lga = features[f].attributes.LGA_CODE19
      // keep track of maximum cases
      if (cases > maxCases){
        maxCases = cases
      }
      // initialise new fields in LGA feature
      data[lga]['tweet_case_ratio'] = 0
      data[lga]['tweet_count'] = 0
      // assign appropriate # cases to LGA feature
      if (cases == null){
        data[lga]['cases'] = 0
      } else {
        data[lga]['cases'] = cases
      }
    }
    // loop through all LGA/tweet count pairs in returned data
    for (let t in tweets){
      let count = tweets[t].value
      let lga = tweets[t].key
      // keep track of maximum tweet count
      if (count > maxTweets){
        maxTweets = count
      }
      // store tweet count in LGA feature
      data[lga]['tweet_count'] = count
      let cases = data[lga]['cases']
      // calculate ratio of tweets per case for this LGA
      // - if cases = 0 AND count = 0, set ratio to 0
      // - if only one of cases = 0 OR count = 0, set the variable equal to 1,
      //   this will avoid loss of information for interesting LGAs with many
      //   tweets but no cases, and vice versa
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
      // keep track of max ratio value
      if (ratio > maxRatio){
        maxRatio = ratio
      }
      // assign ratio to the LGA feature
      data[lga]['tweet_case_ratio'] = ratio
      let name = data[lga]['lga_name18']
      let higherEd = data[lga]['%_of_pop_with_post_school_education']
      let income = data[lga]['mean_income']
      // add ratio to the ratios object
      ratios.push({lga, name, ratio, higherEd, income})
    }
    // store new information in state
    this.setState({
          lga_data: data,
          maxCases,
          maxTweets,
          maxRatio,
    })
    // sort ratios in descending order
    ratios.sort(function(a, b) {
      return b.ratio - a.ratio;
    });
    // get the 25 LGAs with highest ratios, and 25 with lowest ratios
    let ratiosHigh = ratios.slice(0, 24);
    let ratiosLow = ratios.slice(ratios.length-25, ratios.length-1)
    // store in state
    this.setState({ratiosHigh, ratiosLow, ratios})
    // sort hashtags in descending order of count
    hashtags.sort(function(a, b) {
      return b.value - a.value;
    });
    // get 25 hashtags with highest count and store to state
    let topHashtags = hashtags.slice(0,24);
    this.setState({topHashtags})
  }

  // send a generic API request
  async fetchJson(url) {
    let response = await fetch(url);
    if (response.ok) {
      return response.json();
    } else {
      throw new Error('Data fetch failed');;
    }
  }
  // fetch cases per LGA
  async getCasesLGA() {
    try {
      let data = await this.fetchJson(cases_query);
      return data.features;
    } catch(err){
      console.log(err)
    }
  }
  // fetch tweets per LGA
  async getTweetsLGA() {
    try {
      let data = await this.fetchJson(tweet_query,{
        mode: 'no-cors',
        method: 'post',
        url: `http://localhost:5555`
      });
      return data;
    } catch(err){
      console.log(err)
    }
  }
  // fetch hashtag counts
  async getTopHashtags() {
    try {
      let data = await this.fetchJson(hashtag_query,{
        mode: 'no-cors',
        method: 'post',
        url: `http://localhost:5555`
      });
      return data;
    } catch(err){
      console.log(err)
    }
  }

  // build legend for map
  getLegend(maxCases){
    let max = parseFloat(maxCases)
    let grades = [0, 100, 50, 20, 10, 5, 2, 1];
    let labels = [];
    let from;
    let to;
    let color;
    let interval;
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

  // get the style for geoJSON feature
  getJSONstyle(cases, maxCases) {
    return getColor(parseFloat(cases), parseFloat(maxCases))
  }

  // function called on each geojson feature before it's added to the map
  onEachLGA(feature: Object, layer: Object) {
    let view = this.state.view
    let max
    let attribute
    let lga = feature.properties.LGA_CODE19
    let cases = this.state.lga_data[lga].cases
    let tweets = this.state.lga_data[lga].tweet_count
    let ratio = this.state.lga_data[lga].tweet_case_ratio
    // check the 'view' value in state to decide which variable to paint a feature by
    if (view == 0){
      max = this.state.maxCases
      attribute = cases
    }
    if (view == 1){
      max = this.state.maxTweets
      attribute = tweets
    }
    if (view == 2){
      max = this.state.maxRatio
      attribute = ratio
    }
    // get the correct colour and set layer style
    layer.setStyle({
      fillColor: this.getJSONstyle(attribute, max),
      color: 'white',
      weight: 1,
      fillOpacity: 0.5,
    })
    // create tooltip for this feature with appropriate LGA data
    const popupContent = `<Popup>${feature.properties.LGA_NAME19}</br><b>No. Cases: </b>${cases}</br><b>No. Tweets: </b>${tweets}</br><b>Total Population: </b>${lga_data[lga]['population']}</br><b>Area: </b>${lga_data[lga]['area']}</br></Popup>`
    // bind tooltip to this feature
    layer.bindTooltip(popupContent, { direction: 'center', sticky: 'true', offset: [-75, -25]})
    // define events for this feature
    layer.on({
      click: () => this.handleClickFeature(feature),
      mouseover: this.highlightFeature,
      mouseout: this.resetHighlight,
    });
  }
  // highlight bold outline on hover start
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
  // remove bold outline on hover end
  resetHighlight(e) {
    var layer = e.target;
    layer.setStyle({
      color: 'white',
      weight: 1,
      fillOpacity: 0.5,
    });
  }
  // zoom to feature on click
  handleClickFeature = (feature) => {
    const bboxArray = bbox(feature);
    const corner1 = [bboxArray[1], bboxArray[0]];
    const corner2 = [bboxArray[3], bboxArray[2]];
    this.setState({bounds: [corner1, corner2], lgaCode: feature.properties.LGA_CODE19})
  }
  // switch view on click event
	handleOptionChange = e => {
		const view = e.target.value;
		this.setState({
			view,
		});
	}
  // zoom to entire geojson layer bounds on loading of geojson layer
  onFeatureGroupAdd = () => {
    let bounds = this.refs.geojson.leafletElement.getBounds()
    bounds.getSouthWest().wrap();
    bounds.getNorthEast().wrap();
    this.setState({bounds: bounds})
    this.refs.map.leafletElement.fitBounds(bounds);
  }

  // render page
  render() {
    // define variables
    const legendCases = this.getLegend(this.state.maxCases);
    const legendTweets = this.getLegend(this.state.maxTweets);
    const legendRatios = this.getLegend(this.state.maxRatio);
    const hashtags = this.state.topHashtags;
    const position = [this.state.lat, this.state.lng]
    // render button navigation between three views
    // load three views depending on chosen button
    //    1. map
    //    2. statistical analysis
    //    3. top hashtags list
    return (
      <div className="container-fluid" id="pageContainer">
        <div className="row align-items-center" id="page-header">
          <div class="col-12 text-center">
          <button type="button" class="btn btn-light" aria-pressed={(this.state.page == "map")} onClick={() => this.setState({page: "map"})}>Map View</button>
          &nbsp;&nbsp;
          <button type="button" class="btn btn-light" aria-pressed={(this.state.page == "chart")} onClick={() => this.setState({page: "chart"})}>Statistical Analysis</button>
          &nbsp;&nbsp;
          <button type="button" class="btn btn-light" aria-pressed={(this.state.page == "hashtags")} onClick={() => this.setState({page: "hashtags"})}>Top Hashtags</button>
          </div>
      </div>

      {(this.state.page == "map") ?
      <div id="mapContainer">
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
              # Covid-19 Cases
            </label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="radio" name="exampleRadios" id="exampleRadios2" value={1} checked={this.state.view == 1} onClick={this.handleOptionChange} />
            <label class="form-check-label" for="exampleRadios2">
              # Covid-19 Tweets
            </label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="radio" name="exampleRadios" id="exampleRadios2" value={2} checked={this.state.view == 2} onClick={this.handleOptionChange} />
            <label class="form-check-label" for="exampleRadios2">
              # Tweets per Case
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
           : (this.state.view == 1) ?
           <LegendControl position="bottomright">
             {legendTweets}
           </LegendControl>
         : <LegendControl position="bottomright">
           {legendRatios}
         </LegendControl>}
        </Map>
        </div>
      : null}
      </div>
      : (this.state.page == "chart") ?
      <div id="chartContainer">
        <h6></h6>
        <h4 style={{textAlign: "center"}}>Statistical Analysis</h4>
        <h6 style={{textAlign: "center", color: "navy"}}>Summary of all LGAs</h6>
        <LineChartRatios ratios={this.state.ratios} />
        <p style={{fontSize: '0.875rem', textAlign: "center", color: "#404040;"}}>
        This graph maps the ratio of tweets about covid-19, against the mean
        income of households and the percentage of the population that have
        recieved post-high school education, for each Local Government Area
         (LGA) in Australia. Tweets are considered to be relating to covid-19 if
         they contain any of the following hashtags: <b>#covid, #covid19,
         #covid-19, #coronavirus, #lockdown, #pandemic</b>
         </p>
        <h6 style={{textAlign: "center", color: "navy"}}>25 LGAs with the highest ratio of tweets per covid-19 case</h6>
        <BarChartRatios ratios={this.state.ratiosHigh} />
        <p style={{fontSize: '0.875rem', textAlign: "center", color: "#404040;"}}>
        This graph shows the top 25 LGAs with the highest ratio of tweets about covid-19, against the mean
        income of households and the percentage of the population that have
        recieved post-high school education.
         </p>
        <h6 style={{textAlign: "center", color: "navy"}}>25 LGAs with the lowest ratio of tweets per covid-19 case</h6>
        <BarChartRatios ratios={this.state.ratiosLow} />
        <p style={{fontSize: '0.875rem', textAlign: "center", color: "#404040;"}}>
        This graph shows the 25 LGAs with the lowest ratio of tweets about covid-19, against the mean
        income of households and the percentage of the population that have
        recieved post-high school education.
         </p>
      </div>
      :
      <div>
      { (hashtags.length > 1) ?
        <div className="container-fluid" id="hashtagContainer">
        <div className="row">
          <div class="col-sm">
            <h6></h6>
            <h4 style={{textAlign: "center"}}>Top Hashtags</h4>
            <h6 style={{textAlign: "center"}}>A list of the 25 most common hashtags present within covid-related tweets</h6>
            <p><small><em>*hashtags included in the Twitter API search query are highlighted in red</em></small></p>
          </div>
        </div>
        <div className="row">
        <div class="col-sm" id="hashtag-table">
        <table id="hashtag-table">
            <thead>
            <tr>
              <td><b>Hashtag</b></td>
              <td><b>Count</b></td>
            </tr>
            </thead>
            <tbody>
          {hashtags.map(hashtag => <tr>
            <td style={{color: `${(searchHashtags.includes(hashtag.key)) ? "red" : "black"}`}}>#{hashtag.key}</td>
            <td>{hashtag.value}</td>
          </tr>)}
          </tbody>
        </table>
        </div>
      </div>
      </div>
      : null}
      </div>
    }
    </div>
    )
  }
}
