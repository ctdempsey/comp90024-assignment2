// Line Chart component for the front end application
// COMP90024 Assignment 2 2020
//
// Jock Harkness 758158
// Thomas Minuzzo 638958
// Cameron Dempsey 759026
// Emily Marshall 587580
// Hoang Viet Mai 813361
//
// Bar chart for each LGA mapping # covid cases and # covid related tweets

import * as React from "react";
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend} from "recharts";

export default class SimpleBarChart extends React.PureComponent{

	render () {
		let name = '';
		let cases = this.props.cases;
		let tweets = this.props.tweets;
		const data = [{name, cases, tweets}]
  	return (
    	<BarChart width={300} height={125} data={data} layout="vertical"
            margin={{top: 5, right: 75, left: 20, bottom: 5}}>
       <CartesianGrid strokeDasharray="3 3"/>
       <XAxis type="number"/>
       <YAxis type="category" dataKey="name"/>
       <Legend />
       <Bar dataKey="cases" fill="#8884d8" />
       <Bar dataKey="tweets" fill="#82ca9d" />
      </BarChart>
    );
  }
}
