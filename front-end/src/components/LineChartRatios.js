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
          <XAxis dataKey="name" angle={-45} textAnchor="end" tick={false}/>
          <YAxis yAxisId="right2" orientation="right" />
          <YAxis yAxisId="right" orientation="right" />
          <YAxis yAxisId="left" />

          <Tooltip />
          <Legend layout="vertical" verticalAlign="middle" align="left" />
          <Line yAxisId="right" type='monotone' dataKey='income' stroke='#8884d8'dot={false}/>
          <Line yAxisId="left" type='monotone' dataKey='ratio' fill='#413ea0' dot={false}/>
          <Line yAxisId="right2" type='monotone' dataKey='higherEd' stroke='#ff7300' dot={false}/>

       </ComposedChart>
      </ResponsiveContainer>
    );
  }
}
