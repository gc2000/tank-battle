export const TILE_SIZE = 24; // Pixels per grid cell
export const GRID_SIZE = 26; // 26x26 tiles
export const CANVAS_SIZE = TILE_SIZE * GRID_SIZE; // 624px

export const PLAYER_SPEED = 2;
export const ENEMY_SPEED = 1.5;
export const BULLET_SPEED = 6;
export const SHOOT_COOLDOWN = 30; // Frames

export const COLORS = {
  PLAYER: '#fbbf24', // Amber 400
  ENEMY_BASIC: '#ef4444', // Red 500
  ENEMY_FAST: '#3b82f6', // Blue 500
  BULLET: '#ffffff',
  BRICK: '#92400e', // Amber 800
  BRICK_HIGHLIGHT: '#b45309',
  STEEL: '#9ca3af', // Gray 400
  STEEL_HIGHLIGHT: '#d1d5db',
  WATER: '#2563eb', // Blue 600
  GRASS: '#166534', // Green 700
  BASE: '#8b5cf6', // Violet 500
  BACKGROUND: '#000000',
};

export const DIRECTIONS = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  w: 'UP',
  s: 'DOWN',
  a: 'LEFT',
  d: 'RIGHT',
} as const;
