import * as React from "react";
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend} from "recharts";

/*

export default class BarChartSingle extends React.PureComponent {

	render () {
    let name = '';
    let cases = this.props.cases;
    let tweets = this.props.tweets;
    const data = {name, cases, tweets}
		console.log("BAR CHART:", cases, tweets, data)
  	return (
    	<BarChart width={600} height={300} data={data}>
       <CartesianGrid strokeDasharray="3 3"/>
       <XAxis dataKey="name"/>
       <YAxis/>
       <Tooltip/>
       <Legend />
       <Bar dataKey="cases" fill="#8884d8" />
       <Bar dataKey="tweets" fill="#82ca9d" />
      </BarChart>
    );
  }
}

const data = [
      {name: '', cases: 4000, tweets: 2000},
];
*/
//const {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend} = Recharts;

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
