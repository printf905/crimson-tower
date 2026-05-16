import { useState } from 'react';
import { GameState } from './types/game';
import TitleScreen from './screens/TitleScreen';
import MapScreen from './screens/MapScreen';
import CombatScreen from './screens/CombatScreen';
import RewardScreen from './screens/RewardScreen';
import RestScreen from './screens/RestScreen';
import ShopScreen from './screens/ShopScreen';
import GameOverScreen from './screens/GameOverScreen';
import VictoryScreen from './screens/VictoryScreen';
import ActTransitionScreen from './screens/ActTransitionScreen';
import EventScreen from './screens/EventScreen';

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  if (!gameState || gameState.phase === 'title') {
    return <TitleScreen onStart={setGameState} />;
  }

  const props = { gameState, onStateChange: setGameState };

  switch (gameState.phase) {
    case 'map':            return <MapScreen {...props} />;
    case 'combat':         return <CombatScreen {...props} />;
    case 'card_reward':    return <RewardScreen {...props} />;
    case 'rest':           return <RestScreen {...props} />;
    case 'shop':           return <ShopScreen {...props} />;
    case 'event':          return <EventScreen {...props} />;
    case 'game_over':      return <GameOverScreen {...props} />;
    case 'act_transition': return <ActTransitionScreen {...props} />;
    case 'victory':        return <VictoryScreen {...props} />;
    default:               return <TitleScreen onStart={setGameState} />;
  }
}
