export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export enum TileType {
  EMPTY = 0,
  BRICK = 1,
  STEEL = 2,
  WATER = 3, // Bullets pass, tanks don't
  GRASS = 4, // Tanks pass, obscures vision (visual only in this simple version)
  BASE = 9,  // The Eagle
}

export interface Point {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  direction: Direction;
  speed: number;
  type: 'player' | 'enemy' | 'bullet';
  isDestroyed: boolean;
}

export interface Tank extends Entity {
  cooldown: number;
  health: number;
  color: string;
}

export interface Bullet extends Entity {
  ownerId: string; // To prevent shooting oneself immediately
}

export interface LevelData {
  grid: number[][]; // 26x26 grid
}

export interface GameState {
  score: number;
  lives: number;
  level: number;
  isGameOver: boolean;
  isVictory: boolean;
  isPaused: boolean;
}
