import React from 'react';
import { CloudRain, Wind, Thermometer, Sun, Cloud } from 'lucide-react';

type WeatherImpactsProps = {
  temperature: number;
  condition: 'rain' | 'sunny' | 'cloudy';
  windSpeed: number;
  windDirection: string;
  impactRating: 'low' | 'medium' | 'high';
  historicalOver: number;
  historicalUnder: number;
};

export function WeatherImpacts({
  temperature,
  condition,
  windSpeed,
  windDirection,
  impactRating,
  historicalOver,
  historicalUnder
}: WeatherImpactsProps) {
  const conditionIcons = {
    rain: <CloudRain className="h-5 w-5" />,
    sunny: <Sun className="h-5 w-5" />,
    cloudy: <Cloud className="h-5 w-5" />
  };
  
  const impactColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Weather Impacts</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Current Conditions */}
        <div className="col-span-2 sm:col-span-1">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Conditions</h4>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              {conditionIcons[condition]}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Thermometer className="h-4 w-4 text-gray-500" />
                <span>{temperature}°F</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Wind className="h-4 w-4 text-gray-500" />
                <span>{windSpeed} mph {windDirection}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Impact Rating */}
        <div className="col-span-2 sm:col-span-1">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Expected Impact</h4>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${impactColors[impactRating]}`}>
              {impactRating.toUpperCase()}
            </span>
            <span className="text-sm text-gray-600">
              {impactRating === 'high' ? 'Significant effect expected' : 
               impactRating === 'medium' ? 'Moderate effect possible' : 'Minimal effect'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Historical Performance */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Historical Performance</h4>
        <div className="flex justify-between text-sm">
          <div className="text-center">
            <div className="font-medium text-green-600">Over {historicalOver}%</div>
            <div className="text-gray-500">of games</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-red-600">Under {historicalUnder}%</div>
            <div className="text-gray-500">of games</div>
          </div>
        </div>
      </div>
    </div>
  );
}
