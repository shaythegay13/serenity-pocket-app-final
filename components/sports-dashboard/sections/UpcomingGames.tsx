import React from 'react';
import { Game } from '@/lib/types/sports';
import Image from 'next/image';
import { ArrowUp, ArrowDown } from 'lucide-react';

type UpcomingGamesProps = {
  games: Game[];
};

export function UpcomingGames({ games }: UpcomingGamesProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Games & Odds</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => (
          <div key={game.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
            <div className="text-xs text-gray-500 mb-2">
              {new Date(game.startTime).toLocaleString()}
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 relative">
                  <Image src={game.homeTeam.logo} alt={game.homeTeam.name} fill className="object-contain" />
                </div>
                <span>{game.homeTeam.code}</span>
              </div>
              
              <div className="text-xs text-gray-500">vs</div>
              
              <div className="flex items-center gap-2">
                <span>{game.awayTeam.code}</span>
                <div className="w-6 h-6 relative">
                  <Image src={game.awayTeam.logo} alt={game.awayTeam.name} fill className="object-contain" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Spread:</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{game.spread}</span>
                  {game.spreadMovement === 'up' ? (
                    <ArrowUp className="h-3 w-3 text-green-500" />
                  ) : game.spreadMovement === 'down' ? (
                    <ArrowDown className="h-3 w-3 text-red-500" />
                  ) : null}
                </div>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Moneyline:</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{game.moneyline}</span>
                  {game.moneylineMovement === 'up' ? (
                    <ArrowUp className="h-3 w-3 text-green-500" />
                  ) : game.moneylineMovement === 'down' ? (
                    <ArrowDown className="h-3 w-3 text-red-500" />
                  ) : null}
                </div>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Over/Under:</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{game.overUnder}</span>
                  {game.overUnderMovement === 'up' ? (
                    <ArrowUp className="h-3 w-3 text-green-500" />
                  ) : game.overUnderMovement === 'down' ? (
                    <ArrowDown className="h-3 w-3 text-red-500" />
                  ) : null}
                </div>
              </div>
            </div>
            
            {game.favorableOdds && (
              <div className="mt-3 p-1 bg-blue-50 text-blue-800 text-xs text-center rounded">
                Favorable odds
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
