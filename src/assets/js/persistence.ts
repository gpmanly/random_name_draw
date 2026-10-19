import { Winner } from '@js/Slot';

export type PrizeType = 'minor' | 'major';

export interface RaffleState {
  version: 1;
  prizeType: PrizeType;
  names: string[];
  winners: Winner[];
  removeWinner: boolean;
  soundEnabled: boolean;
  savedAt: string;
}

const storageKey = (prizeType: PrizeType) => `random-name-picker:raffle-state:${prizeType}`;

const isWinner = (value: unknown): value is Winner => {
  if (!value || typeof value !== 'object') return false;
  const winner = value as Partial<Winner>;
  return typeof winner.name === 'string'
    && typeof winner.timestamp === 'string'
    && !Number.isNaN(new Date(winner.timestamp).getTime());
};

export const parseRaffleState = (value: unknown, fallbackPrizeType?: PrizeType): RaffleState | null => {
  if (!value || typeof value !== 'object') return null;
  const state = value as Partial<RaffleState>;
  const parsedPrizeType = state.prizeType || fallbackPrizeType;
  if (state.version !== 1 || (parsedPrizeType !== 'minor' && parsedPrizeType !== 'major')
    || !Array.isArray(state.names) || !Array.isArray(state.winners)) {
    return null;
  }
  if (!state.names.every((name) => typeof name === 'string')
    || !state.winners.every(isWinner)
    || typeof state.removeWinner !== 'boolean'
    || typeof state.soundEnabled !== 'boolean'
    || typeof state.savedAt !== 'string') {
    return null;
  }
  return {
    version: 1,
    prizeType: parsedPrizeType,
    names: state.names,
    winners: state.winners,
    removeWinner: state.removeWinner,
    soundEnabled: state.soundEnabled,
    savedAt: state.savedAt
  };
};

export const loadRaffleState = (prizeType: PrizeType): RaffleState | null => {
  try {
    const stored = window.localStorage.getItem(storageKey(prizeType));
    return stored ? parseRaffleState(JSON.parse(stored)) : null;
  } catch (error) {
    console.warn('Unable to load saved raffle state.', error);
    return null;
  }
};

export const saveRaffleState = (
  prizeType: PrizeType,
  state: Omit<RaffleState, 'version' | 'prizeType' | 'savedAt'>
): boolean => {
  try {
    window.localStorage.setItem(storageKey(prizeType), JSON.stringify({
      ...state,
      version: 1,
      prizeType,
      savedAt: new Date().toISOString()
    }));
    return true;
  } catch (error) {
    console.warn('Unable to save raffle state.', error);
    return false;
  }
};

export const clearRaffleState = (prizeType: PrizeType): void => {
  try {
    window.localStorage.removeItem(storageKey(prizeType));
  } catch (error) {
    console.warn('Unable to clear saved raffle state.', error);
  }
};
