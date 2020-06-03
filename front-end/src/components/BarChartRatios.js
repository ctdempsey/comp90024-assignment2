import * as React from "react";
import {ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend} from "recharts";

export default class SimpleBarChart extends React.PureComponent{

  render () {
    const data = []
    const ratiosHigh = this.props.ratiosHigh
    const ratiosLow = this.props.ratiosLow
    console.log(JSON.stringify(ratiosHigh))
    for (let r in ratiosHigh){
      data.push({name: ratiosHigh[r].name, ratio: ratiosHigh[r].ratio, income: ratiosHigh[r].income, higherEd: ratiosHigh[r].higherEd})
    }
    for (let r in ratiosLow){
      data.push({name: ratiosLow[r].name, ratio: ratiosLow[r].ratio, income: ratiosLow[r].income, higherEd: ratiosLow[r].higherEd})
    }
    return (
      <ComposedChart width={850} height={400} data={data}
            margin={{top: 20, right: 20, bottom: 20, left: 20}}>
          <CartesianGrid stroke='#f5f5f5'/>
          <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0}/>
          <YAxis yAxisId="left" />
           <YAxis yAxisId="right" orientation="right" />
           <YAxis yAxisId="right2" orientation="right" />
          <Tooltip />
          <Legend layout="vertical" verticalAlign="middle" align="left" />
          <Line yAxisId="right" type='monotone' dataKey='income' stroke='#8884d8'/>
          <Line yAxisId="right2" type='monotone' dataKey='higherEd' stroke='#ff7300' />
          <Bar yAxisId="left" dataKey='ratio' barSize={20} fill='#413ea0' />
       </ComposedChart>
    );
  }
}


/*
import * as React from "react";
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend} from "recharts";

export default class SimpleBarChart extends React.PureComponent{

	render () {
    const data = []
    const ratiosHigh = this.props.ratiosHigh
    console.log(JSON.stringify(ratiosHigh))
    for (let r in ratiosHigh){
      data.push({name: ratiosHigh[r].name, ratio: ratiosHigh[r].ratio})
    }
  	return (
    	<BarChart width={750} height={300} data={data}
            margin={{top: 5, right: 75, left: 20, bottom: 5}}>
       <CartesianGrid strokeDasharray="3 3"/>
       <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0}/>
       <YAxis/>
       <Tooltip/>
       <Legend />
       <Bar dataKey="ratio" fill="#8884d8" />
      </BarChart>
    );
  }
}



*/
