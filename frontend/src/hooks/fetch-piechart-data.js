import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from 'recharts';

const data1 = [
  { label: 'Group A', value: 400 },
  { label: 'Group B', value: 300 },
  { label: 'Group C', value: 300 },
  { label: 'Group D', value: 200 },
];

const data2 = [
  { label: 'A1', value: 100 },
  { label: 'A2', value: 300 },
  { label: 'B1', value: 100 },
  { label: 'B2', value: 80 },
  { label: 'B3', value: 40 },
  { label: 'B4', value: 30 },
  { label: 'B5', value: 50 },
  { label: 'C1', value: 100 },
  { label: 'C2', value: 200 },
  { label: 'D1', value: 150 },
  { label: 'D2', value: 50 },
];

//const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A', '#FF6633', '#33CC33', '#FFCCCC', '#FF6666', '#6666FF'];
const COLORS = ['#5A89A0', '#7BAF9D', '#D8BC74', '#D89072', '#A47C9D', '#C97B6A', '#6A956A', '#E0C9C9', '#D19A9A', '#9A9ACD'];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
  const RADIAN = Math.PI / 180;
  const radius = 25 + innerRadius + (outerRadius - innerRadius);
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const PieStats = ({ clusterName }) => {
  const [itemData, setItemData] = useState(null);

  useEffect(() => {
    // Handle any updates related to clusterName
  }, [clusterName]);

  const handleClick = (data) => {
    setItemData(data);
  };

  return (
    <div style={{ textAlign: 'center' }}>
    <ResponsiveContainer width={400} height={300}>
    <PieChart width={400} height={300}>
      <Pie
        data={data1}
        cx={200}
        cy={150}
        innerRadius={0}
        outerRadius={50}
        fill="#8884d8"
        paddingAngle={0}
        dataKey="value"
        nameKey="label"
        labelLine={false}
        label={renderCustomizedLabel}
      >
        {data1.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>

      <Pie
        data={data2}
        cx={200}
        cy={150}
        innerRadius={60}
        outerRadius={70}
        fill="#82ca9d"
        paddingAngle={0}
        dataKey="value"
        nameKey="label"
      >
        {data2.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>

      <Pie
        data={data2}
        cx={200}
        cy={150}
        innerRadius={80}
        outerRadius={90}
        fill="#ffc658"
        paddingAngle={0}
        dataKey="value"
        nameKey="label"
      >
        {data2.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>

      <Pie
        data={data2}
        cx={200}
        cy={150}
        innerRadius={100}
        outerRadius={110}
        fill="#ff8042"
        paddingAngle={0}
        dataKey="value"
        nameKey="label"
      >
        {data2.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>

      <Pie
        data={data2}
        cx={200}
        cy={150}
        innerRadius={120}
        outerRadius={130}
        fill="#aa336a"
        paddingAngle={0}
        dataKey="value"
        nameKey="label"
      >
        {data2.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
    </ResponsiveContainer>
    <div style={{ marginTop: '10px'}}>Account Utilization</div>
    </div>
  );
};

export default PieStats;
