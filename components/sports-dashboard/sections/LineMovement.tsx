import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type LineMovementProps = {
  data: {
    timestamp: string;
    openingLine: number;
    currentLine: number;
    movement: 'up' | 'down';
    percentBets: number;
  }[];
};

export function LineMovement({ data }: LineMovementProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Line Movement</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="timestamp" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'Opening Line') return [value, 'Opening'];
                if (name === 'Current Line') return [value, 'Current'];
                if (name === '% of Bets') return [`${value}%`, 'Bet %'];
                return [value, name];
              }}
              labelFormatter={(label) => new Date(label).toLocaleString()}
            />
            <Legend />
            
            {/* Opening Line */}
            <Line 
              type="monotone" 
              dataKey="openingLine" 
              name="Opening Line" 
              stroke="#8884d8" 
              strokeWidth={2} 
              dot={false} 
            />
            
            {/* Current Line */}
            <Line 
              type="monotone" 
              dataKey="currentLine" 
              name="Current Line" 
              stroke="#82ca9d" 
              strokeWidth={2} 
              dot={{ r: 4 }}
            />
            
            {/* Bet Percentage */}
            <Line 
              type="monotone" 
              dataKey="percentBets" 
              name="% of Bets" 
              stroke="#ffc658" 
              strokeWidth={1} 
              dot={false}
              yAxisId="right"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex justify-between text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span>Opening Line</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Current Line</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>% of Bets</span>
        </div>
      </div>
    </div>
  );
}
