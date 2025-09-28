import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Team, Player, Game, Tournament } from '../core/types';

interface AppState {
  teams: Team[];
  players: Player[];
  games: Game[];
  tournaments: Tournament[];
  loading: boolean;
  error: string | null;
}

type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TEAMS'; payload: Team[] }
  | { type: 'SET_PLAYERS'; payload: Player[] }
  | { type: 'SET_GAMES'; payload: Game[] }
  | { type: 'SET_TOURNAMENTS'; payload: Tournament[] }
  | { type: 'ADD_TEAM'; payload: Team }
  | { type: 'UPDATE_TEAM'; payload: { id: string; updates: Partial<Team> } }
  | { type: 'DELETE_TEAM'; payload: string }
  | { type: 'ADD_PLAYER'; payload: Player }
  | { type: 'UPDATE_PLAYER'; payload: { id: string; updates: Partial<Player> } }
  | { type: 'DELETE_PLAYER'; payload: string }
  | { type: 'ADD_GAME'; payload: Game }
  | { type: 'UPDATE_GAME'; payload: { id: string; updates: Partial<Game> } }
  | { type: 'DELETE_GAME'; payload: string };

const initialState: AppState = {
  teams: [],
  players: [],
  games: [],
  tournaments: [],
  loading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_TEAMS':
      return { ...state, teams: action.payload };
    case 'SET_PLAYERS':
      return { ...state, players: action.payload };
    case 'SET_GAMES':
      return { ...state, games: action.payload };
    case 'SET_TOURNAMENTS':
      return { ...state, tournaments: action.payload };
    case 'ADD_TEAM':
      return { ...state, teams: [...state.teams, action.payload] };
    case 'UPDATE_TEAM':
      return {
        ...state,
        teams: state.teams.map(team =>
          team.id === action.payload.id
            ? { ...team, ...action.payload.updates }
            : team
        ),
      };
    case 'DELETE_TEAM':
      return {
        ...state,
        teams: state.teams.filter(team => team.id !== action.payload),
      };
    case 'ADD_PLAYER':
      return { ...state, players: [...state.players, action.payload] };
    case 'UPDATE_PLAYER':
      return {
        ...state,
        players: state.players.map(player =>
          player.id === action.payload.id
            ? { ...player, ...action.payload.updates }
            : player
        ),
      };
    case 'DELETE_PLAYER':
      return {
        ...state,
        players: state.players.filter(player => player.id !== action.payload),
      };
    case 'ADD_GAME':
      return { ...state, games: [...state.games, action.payload] };
    case 'UPDATE_GAME':
      return {
        ...state,
        games: state.games.map(game =>
          game.id === action.payload.id
            ? { ...game, ...action.payload.updates }
            : game
        ),
      };
    case 'DELETE_GAME':
      return {
        ...state,
        games: state.games.filter(game => game.id !== action.payload),
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
