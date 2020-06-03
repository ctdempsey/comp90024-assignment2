import * as React from "react";
import BarChartSingle from "./BarChartSingle"
//import { Progress } from 'reactstrap';


const getArrow = (slope) => {
	if (slope >= 0){
		return 	<span style={{ color: "#60ACFC"}}>&#8679;</span>;
	}
	if (slope <= 0){
		return 	<span style={{ color: "#60ACFC"}}>&#8681;</span>;
	}
}

export default class InfoPanel extends React.PureComponent {
	render() {
		const { lgaData, lgaCode } = this.props;
    //const properties =
    //console.log("INFO PANEL", lgaData, lgaCode)
		return (
      <div class="info legend leaflet-control">
      <div className="container container-fluid">
        {(lgaCode == undefined) ? <div className="row" id="info-header">
          <h6> Click on a map region to view details... </h6>
        </div>
        :
        <div className="row" id="info-header">
          <h6> <b>{lgaData[lgaCode]['lga_name18']}</b>,<t/> {lgaData[lgaCode]['state_abr']}</h6>
        </div>
        }
        {(lgaCode != undefined) ?
        <div>
        <div className="row" id="info-text">
        <table>
            <tbody>
              <tr>
                <td id="tableCol1"><b># of Tweets:</b></td>
                <td id="tableCol2">{lgaData[lgaCode]['tweet_count']}</td>
              </tr>
              <tr>
                <td id="tableCol1"><b># of Cases:</b></td>
                <td id="tableCol2">{lgaData[lgaCode]['cases']}</td>
              </tr>
              <tr>
                <td id="tableCol1"><b>Population:</b></td>
                <td id="tableCol2">{lgaData[lgaCode]['population']}</td>
              </tr>
              <tr>
                <td id="tableCol1"><b>Mean Income:</b></td>
                <td id="tableCol2">{lgaData[lgaCode]['tweet_count']}</td>
              </tr>
              <tr>
                <td id="tableCol1"><b>% Pop Higher Edu:</b></td>
                <td id="tableCol2">{lgaData[lgaCode]['%_of_pop_with_post_school_education']}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="row" id="info-graph">
        <div id="chart">
          <BarChartSingle key={[lgaCode]} cases={lgaData[lgaCode]['cases']} tweets={lgaData[lgaCode]['tweet_count']} />
        </div>
        </div>
        </div>
        : null}
        </div>
      </div>

		);
	}
}
