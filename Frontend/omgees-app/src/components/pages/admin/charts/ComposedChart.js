import React from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function SalesComposedChart({ data = [] }) {
  // Format currency for tooltips
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="fw-semibold mb-2">{`Date: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="mb-1">
              <span className="fw-semibold">{entry.dataKey === 'revenue' ? 'Revenue' : 'Orders'}: </span>
              {entry.dataKey === 'revenue' ? formatCurrency(entry.value) : `${entry.value} orders`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Show message if no data
  if (!data || data.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100">
        <div className="text-center text-muted">
          <i className="bi bi-bar-chart display-4 mb-3"></i>
          <h5>No Sales Data Available</h5>
          <p>Sales data will appear here once orders are completed</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          bottom: 20,
          left: 40,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          stroke="#6c757d"
        />
        <YAxis 
          yAxisId="revenue"
          orientation="left"
          tick={{ fontSize: 12 }}
          stroke="#6c757d"
          tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
        />
        <YAxis 
          yAxisId="orders"
          orientation="right"
          tick={{ fontSize: 12 }}
          stroke="#6c757d"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="circle"
        />
        <Bar 
          yAxisId="revenue"
          dataKey="revenue" 
          fill="#0d6efd" 
          name="Revenue (₱)"
          radius={[2, 2, 0, 0]}
          opacity={0.8}
        />
        <Line 
          yAxisId="orders"
          type="monotone" 
          dataKey="orders" 
          stroke="#fd7e14" 
          strokeWidth={3}
          name="Orders"
          dot={{ fill: '#fd7e14', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: '#fd7e14' }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default SalesComposedChart;