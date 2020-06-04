// LGA Detail component for the front end application
// COMP90024 Assignment 2 2020
//
// Jock Harkness 758158
// Thomas Minuzzo 638958
// Cameron Dempsey 759026
// Emily Marshall 587580
// Hoang Viet Mai 813361
//
// Renders information panel for each LGA on the map

import * as React from "react";
import BarChartSingle from "./BarChartSingle"

export default class InfoPanel extends React.PureComponent {
	render() {
		const { lgaData, lgaCode } = this.props;
		return (
      <div class="info legend leaflet-control">
      <div className="container container-fluid">
        {(lgaCode == undefined) ? <div className="row" id="info-header">
          <h6><em> <b>  Click on a map region to view details...  </b> </em></h6>
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
                <td id="tableCol1"><b># Tweets per Case:</b></td>
                <td id="tableCol2">{lgaData[lgaCode]['tweet_case_ratio']}</td>
              </tr>
              <tr>
                <td id="tableCol1"><b>Population:</b></td>
                <td id="tableCol2">{lgaData[lgaCode]['population']}</td>
              </tr>
              <tr>
                <td id="tableCol1"><b>Mean Income:</b></td>
                <td id="tableCol2">{lgaData[lgaCode]['mean_income']}</td>
              </tr>
              <tr>
                <td id="tableCol1"><b>% Pop Higher Ed:</b></td>
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
