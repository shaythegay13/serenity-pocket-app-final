import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

type SparklineProps = {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
};

export function Sparkline({ 
  data = [], 
  color = '#3b82f6', 
  height = 30, 
  width = 100 
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }));
  
  return (
    <div style={{ width: `${width}px`, height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            dot={false} 
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
