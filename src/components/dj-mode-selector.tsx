import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DJMode } from '../lib/types';
import { getAllDJModes } from '../lib/dj-modes';

interface DJModeSelectorProps {
  selectedMode: DJMode | null;
  onModeSelect: (mode: DJMode) => void;
  onStartDJ: (modeId: string) => void;
  isActive: boolean;
}

export function DJModeSelector({ selectedMode, onModeSelect, onStartDJ, isActive }: DJModeSelectorProps) {
  const modes = getAllDJModes();
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          Choose Your DJ Mode
        </h2>
        <p className="text-gray-400">Select a party vibe and let AI curate the perfect playlist</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modes.map((mode) => (
          <Card
            key={mode.id}
            className={`cursor-pointer transition-all duration-300 border-2 hover:scale-105 ${
              selectedMode?.id === mode.id
                ? 'border-purple-500 bg-purple-500/10'
                : hoveredMode === mode.id
                ? 'border-purple-400/50 bg-purple-400/5'
                : 'border-gray-700 hover:border-purple-400/30'
            }`}
            onMouseEnter={() => setHoveredMode(mode.id)}
            onMouseLeave={() => setHoveredMode(null)}
            onClick={() => onModeSelect(mode)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{mode.icon}</span>
                <Badge variant={mode.energy === 'high' ? 'default' : 'secondary'}>
                  {mode.energy} energy
                </Badge>
              </div>
              <CardTitle className="text-lg">{mode.name}</CardTitle>
              <CardDescription className="text-sm text-gray-400">
                {mode.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    {mode.language}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {mode.mood}
                  </Badge>
                </div>
                
                <div className="text-xs text-gray-500">
                  <strong>Genres:</strong> {mode.genres.slice(0, 3).join(', ')}
                  {mode.genres.length > 3 && ' +more'}
                </div>

                {selectedMode?.id === mode.id && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartDJ(mode.id);
                    }}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    disabled={isActive}
                  >
                    {isActive ? 'DJ Active' : 'Start DJ Mode'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedMode && !isActive && (
        <div className="text-center">
          <Button
            onClick={() => onStartDJ(selectedMode.id)}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8"
          >
            🎧 Start {selectedMode.name}
          </Button>
        </div>
      )}
    </div>
  );
}