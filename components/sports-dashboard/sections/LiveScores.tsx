import React from 'react';
import type { Game } from '@/lib/types/sports';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type LiveScoresProps = {
  games?: Game[];
  activeGameId?: string;
  onGameClick: (gameId: string) => void;
};

export function LiveScores({ games = [], activeGameId, onGameClick }: LiveScoresProps) {
  return (
    <div className="w-full bg-gray-50 border-b border-gray-200 py-2">
      <div className="overflow-x-auto pb-2">
        <div className="flex space-x-4">
          {games.map((game) => (
            <div 
              key={game.id} 
              className={cn(
                "min-w-[200px] bg-gray-50 rounded-lg p-3 border",
                game.status === 'live' ? "border-green-500 animate-pulse" : "border-gray-200"
              )}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 relative">
                    <Image 
                      src={game.homeTeam.logo} 
                      alt={game.homeTeam.name} 
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="text-sm">{game.homeTeam.code}</span>
                </div>
                
                <div className="text-center">
                  {game.status === 'live' && (
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-xs text-gray-500">{game.clock}</span>
                    </div>
                  )}
                  <div className="font-bold text-lg">
                    {game.homeScore ?? '-'} - {game.awayScore ?? '-'}
                  </div>
                  {game.status === 'live' && (
                    <div className="text-xs text-gray-500">
                      {typeof game.homeScore === 'number' && typeof game.awayScore === 'number' ? (
                        `${Math.abs(game.homeScore - game.awayScore)} pt diff`
                      ) : null}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm">{game.awayTeam.code}</span>
                  <div className="w-6 h-6 relative">
                    <Image 
                      src={game.awayTeam.logo} 
                      alt={game.awayTeam.name} 
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
