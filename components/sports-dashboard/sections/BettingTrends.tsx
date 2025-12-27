import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';

type BettingTrendsProps = {
  publicPercentage: number;
  sharpPercentage: number;
  moneyDistribution: {
    name: string;
    value: number;
    color: string;
  }[];
  historicalAccuracy: number;
};

export function BettingTrends({ 
  publicPercentage, 
  sharpPercentage,
  moneyDistribution,
  historicalAccuracy
}: BettingTrendsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Betting Trends</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Public vs Sharp */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Public vs Sharp Action</h4>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Public ({publicPercentage}%)</span>
                <span>Sharp ({sharpPercentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${publicPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Money Distribution */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Money Distribution</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={moneyDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {moneyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value}%`, 
                    props.payload.name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Historical Accuracy */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-800">Historical Accuracy</span>
          <span className="text-lg font-bold text-blue-800">
            {historicalAccuracy}%
          </span>
        </div>
        <div className="text-xs text-blue-600 mt-1">
          When similar trends occurred in the past
        </div>
      </div>
    </div>
  );
}
