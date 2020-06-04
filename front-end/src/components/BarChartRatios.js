// Bar and Line Composite Chart component for the front end application
// COMP90024 Assignment 2 2020
//
// Jock Harkness 758158
// Thomas Minuzzo 638958
// Cameron Dempsey 759026
// Emily Marshall 587580
// Hoang Viet Mai 813361
//
// Renders a composite chart of a subset of  LGAs, mapping ratio of tweets about covid 
// per covid case, against mean household income and % of population who have
// accessed higher education

import * as React from "react";
import {ComposedChart, ResponsiveContainer, Brush, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend} from "recharts";

export default class SimpleBarChart extends React.PureComponent{

  render () {
    const data = []
    const ratios = this.props.ratios
    for (let r in ratios){
      data.push({name: ratios[r].name, ratio: ratios[r].ratio, income: ratios[r].income, higherEd: ratios[r].higherEd})
    }

    return (
      <ResponsiveContainer width='100%' height={400}>
      <ComposedChart width={850} height={400} data={data}
            margin={{top: 20, right: 20, bottom: 20, left: 20}}>
          <CartesianGrid stroke='#f5f5f5'/>
          <XAxis dataKey="name" angle={-45} textAnchor="end"  tick={false}/>
          <YAxis yAxisId="right2" orientation="right" />
          <YAxis yAxisId="right" orientation="right" />
          <YAxis yAxisId="left" />
          <Tooltip />
          <Legend layout="vertical" verticalAlign="middle" align="left" />
          <Bar yAxisId="left" dataKey='ratio' barSize={20} fill='#413ea0' />
          <Line yAxisId="right2" type='monotone' dataKey='higherEd' stroke='#ff7300' />
          <Line yAxisId="right" type='monotone' dataKey='income' stroke='#82ca9d'/>
       </ComposedChart>
       </ResponsiveContainer>
    );
  }
}
