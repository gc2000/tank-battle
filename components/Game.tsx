import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Direction, Entity, Tank, Bullet, TileType } from '../types';
import {
  CANVAS_SIZE,
  GRID_SIZE,
  TILE_SIZE,
  COLORS,
  PLAYER_SPEED,
  BULLET_SPEED,
  SHOOT_COOLDOWN,
  ENEMY_SPEED,
  DIRECTIONS,
} from '../constants';

interface GameProps {
  levelGrid: number[][];
  onGameOver: (score: number, win: boolean) => void;
}

const Game: React.FC<GameProps> = ({ levelGrid, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const scoreRef = useRef(0);
  const [currentScore, setCurrentScore] = useState(0);

  // Mutable Game State
  const gameState = useRef({
    grid: JSON.parse(JSON.stringify(levelGrid)), // Deep copy
    player: {
      id: 'player',
      x: TILE_SIZE * 9,
      y: TILE_SIZE * (GRID_SIZE - 2), // Start near bottom
      width: TILE_SIZE - 2,
      height: TILE_SIZE - 2,
      direction: Direction.UP,
      speed: PLAYER_SPEED,
      type: 'player',
      cooldown: 0,
      health: 1,
      isDestroyed: false,
      color: COLORS.PLAYER,
    } as Tank,
    enemies: [] as Tank[],
    bullets: [] as Bullet[],
    baseDestroyed: false,
    frameCount: 0,
    keysPressed: {} as Record<string, boolean>,
  });

  // Initialization
  useEffect(() => {
    // Reset state on level change
    gameState.current.grid = JSON.parse(JSON.stringify(levelGrid));
    gameState.current.player.isDestroyed = false;
    gameState.current.player.x = TILE_SIZE * ((GRID_SIZE / 2) - 4);
    gameState.current.player.y = TILE_SIZE * (GRID_SIZE - 4);
    gameState.current.bullets = [];
    gameState.current.enemies = [];
    gameState.current.baseDestroyed = false;
    gameState.current.frameCount = 0;
    
    // Initial enemy spawn
    spawnEnemy(TILE_SIZE * 2, TILE_SIZE * 2);
    spawnEnemy(TILE_SIZE * (GRID_SIZE - 3), TILE_SIZE * 2);
    spawnEnemy(TILE_SIZE * (GRID_SIZE / 2), TILE_SIZE * 2);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelGrid]);

  const spawnEnemy = (x: number, y: number) => {
    gameState.current.enemies.push({
      id: `enemy_${Date.now()}_${Math.random()}`,
      x,
      y,
      width: TILE_SIZE - 2,
      height: TILE_SIZE - 2,
      direction: Direction.DOWN,
      speed: ENEMY_SPEED,
      type: 'enemy',
      cooldown: 0,
      health: 1,
      isDestroyed: false,
      color: Math.random() > 0.5 ? COLORS.ENEMY_BASIC : COLORS.ENEMY_FAST,
    });
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    gameState.current.keysPressed[e.key] = true;
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    gameState.current.keysPressed[e.key] = false;
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // --- Game Loop Logic ---

  const checkCollision = (rect1: Entity, rect2: {x: number, y: number, width: number, height: number}) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  };

  const getGridCollision = (entity: Entity, nextX: number, nextY: number) => {
    // Check four corners of the entity against the grid
    const corners = [
      { x: nextX, y: nextY },
      { x: nextX + entity.width, y: nextY },
      { x: nextX, y: nextY + entity.height },
      { x: nextX + entity.width, y: nextY + entity.height },
    ];

    for (const corner of corners) {
      const col = Math.floor(corner.x / TILE_SIZE);
      const row = Math.floor(corner.y / TILE_SIZE);

      if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        const tile = gameState.current.grid[row][col];
        if (tile === TileType.BRICK || tile === TileType.STEEL || tile === TileType.WATER || tile === TileType.BASE) {
          return true; // Collision with wall
        }
      } else {
        return true; // Out of bounds
      }
    }
    return false;
  };

  const moveTank = (tank: Tank, targetDir?: Direction) => {
    if (tank.isDestroyed) return;

    let newX = tank.x;
    let newY = tank.y;
    let moving = false;

    // AI Direction Change
    if (tank.type === 'enemy') {
       // Randomly change direction occasionally or if stuck
       if (Math.random() < 0.02) {
         const dirs = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
         tank.direction = dirs[Math.floor(Math.random() * dirs.length)];
       }
       targetDir = tank.direction;
       moving = true;
    } else {
       // Player movement handled by props passed from keys
       if (targetDir) {
           tank.direction = targetDir;
           moving = true;
       }
    }

    if (moving && targetDir) {
      if (targetDir === Direction.UP) newY -= tank.speed;
      if (targetDir === Direction.DOWN) newY += tank.speed;
      if (targetDir === Direction.LEFT) newX -= tank.speed;
      if (targetDir === Direction.RIGHT) newX += tank.speed;

      // Wall Collision
      if (!getGridCollision(tank, newX, newY)) {
        // Tank vs Tank Collision
        let tankHit = false;
        const allTanks = [gameState.current.player, ...gameState.current.enemies];
        for (const other of allTanks) {
           if (other.id !== tank.id && !other.isDestroyed) {
              if (checkCollision({ ...tank, x: newX, y: newY }, other)) {
                  tankHit = true;
                  break;
              }
           }
        }
        
        if (!tankHit) {
            tank.x = newX;
            tank.y = newY;
        } else if (tank.type === 'enemy') {
            // Enemy simple AI: turn if hit tank
             const dirs = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
             tank.direction = dirs[Math.floor(Math.random() * dirs.length)];
        }
      } else if (tank.type === 'enemy') {
         // Enemy simple AI: turn if hit wall
         const dirs = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
         tank.direction = dirs[Math.floor(Math.random() * dirs.length)];
      }
    }
    
    // Shooting
    if (tank.cooldown > 0) tank.cooldown--;
    
    let shouldShoot = false;
    if (tank.type === 'player') {
       if (gameState.current.keysPressed[' ']) shouldShoot = true;
    } else {
       if (Math.random() < 0.02) shouldShoot = true; // Random fire
    }

    if (shouldShoot && tank.cooldown <= 0) {
        tank.cooldown = SHOOT_COOLDOWN;
        const bx = tank.x + tank.width/2 - 2;
        const by = tank.y + tank.height/2 - 2;
        gameState.current.bullets.push({
            id: `b_${Date.now()}_${Math.random()}`,
            x: bx,
            y: by,
            width: 4,
            height: 4,
            speed: BULLET_SPEED,
            direction: tank.direction,
            type: 'bullet',
            ownerId: tank.id,
            isDestroyed: false
        });
    }
  };

  const update = () => {
    const state = gameState.current;
    if (state.baseDestroyed || state.player.isDestroyed) {
        onGameOver(scoreRef.current, false);
        return; // Stop loop
    }
    
    // Check Victory (no enemies left) - Spawn endless for now or win condition?
    // Let's do endless waves for this demo, respawning enemies if count is low
    if (state.enemies.length < 3 && Math.random() < 0.01) {
       const spawns = [{x: TILE_SIZE, y: TILE_SIZE}, {x: CANVAS_SIZE - TILE_SIZE*2, y: TILE_SIZE}, {x: CANVAS_SIZE/2, y: TILE_SIZE}];
       const spawn = spawns[Math.floor(Math.random()*spawns.length)];
       spawnEnemy(spawn.x, spawn.y);
    }

    state.frameCount++;

    // 1. Process Input for Player
    let playerDir: Direction | undefined;
    if (state.keysPressed['ArrowUp'] || state.keysPressed['w']) playerDir = Direction.UP;
    else if (state.keysPressed['ArrowDown'] || state.keysPressed['s']) playerDir = Direction.DOWN;
    else if (state.keysPressed['ArrowLeft'] || state.keysPressed['a']) playerDir = Direction.LEFT;
    else if (state.keysPressed['ArrowRight'] || state.keysPressed['d']) playerDir = Direction.RIGHT;

    // 2. Move Tanks
    moveTank(state.player, playerDir);
    state.enemies.forEach(enemy => moveTank(enemy));

    // 3. Move Bullets & Check Collisions
    state.bullets.forEach(b => {
        if (b.isDestroyed) return;
        
        if (b.direction === Direction.UP) b.y -= b.speed;
        if (b.direction === Direction.DOWN) b.y += b.speed;
        if (b.direction === Direction.LEFT) b.x -= b.speed;
        if (b.direction === Direction.RIGHT) b.x += b.speed;

        // Wall Collision (Grid)
        const center = { x: b.x + b.width/2, y: b.y + b.height/2 };
        const col = Math.floor(center.x / TILE_SIZE);
        const row = Math.floor(center.y / TILE_SIZE);

        if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
            const tile = state.grid[row][col];
            if (tile === TileType.BRICK) {
                b.isDestroyed = true;
                state.grid[row][col] = TileType.EMPTY; // Destroy brick
            } else if (tile === TileType.STEEL) {
                b.isDestroyed = true; // Steel holds
            } else if (tile === TileType.BASE) {
                b.isDestroyed = true;
                state.grid[row][col] = TileType.EMPTY; // Destroy base graphic
                state.baseDestroyed = true;
            }
        } else {
            b.isDestroyed = true; // Out of bounds
        }

        // Entity Collision
        // Bullet vs Player
        if (b.ownerId !== state.player.id && !state.player.isDestroyed) {
             if (checkCollision(b, state.player)) {
                 state.player.isDestroyed = true;
                 b.isDestroyed = true;
             }
        }
        
        // Bullet vs Enemy
        if (b.ownerId === state.player.id) {
            state.enemies.forEach(e => {
                if (!e.isDestroyed && checkCollision(b, e)) {
                    e.isDestroyed = true;
                    b.isDestroyed = true;
                    scoreRef.current += 100;
                    setCurrentScore(scoreRef.current);
                }
            });
        }
        
        // Bullet vs Bullet (optional, tricky with low fps, skipping for simplicity)
    });

    // Cleanup
    state.bullets = state.bullets.filter(b => !b.isDestroyed);
    state.enemies = state.enemies.filter(e => !e.isDestroyed);

    draw();
    requestRef.current = requestAnimationFrame(update);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw Map
    const grid = gameState.current.grid;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const tile = grid[r][c];
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        if (tile === TileType.BRICK) {
          ctx.fillStyle = COLORS.BRICK;
          ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          ctx.fillStyle = COLORS.BRICK_HIGHLIGHT;
          ctx.fillRect(x + 4, y + 4, TILE_SIZE/2, TILE_SIZE/2);
        } else if (tile === TileType.STEEL) {
          ctx.fillStyle = COLORS.STEEL;
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = COLORS.STEEL_HIGHLIGHT;
          ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        } else if (tile === TileType.WATER) {
          ctx.fillStyle = COLORS.WATER;
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        } else if (tile === TileType.GRASS) {
          ctx.fillStyle = COLORS.GRASS;
          // Grass is transparent usually, or drawn on top. 
          // For simplicity, drawn here but tanks draw over it? 
          // Classic Battle City draws grass ON TOP of tanks. 
          // We will draw it later if we want that effect. 
          // For now, draw background grass.
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        } else if (tile === TileType.BASE) {
          ctx.fillStyle = COLORS.BASE;
          // Draw Eagle
          ctx.beginPath();
          ctx.moveTo(x + TILE_SIZE/2, y);
          ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE);
          ctx.lineTo(x, y + TILE_SIZE);
          ctx.fill();
        }
      }
    }

    // Draw Entities helper
    const drawTank = (tank: Tank) => {
        ctx.fillStyle = tank.color;
        ctx.fillRect(tank.x, tank.y, tank.width, tank.height);
        
        // Turret/Direction indicator
        ctx.fillStyle = '#000';
        let tx = tank.x + tank.width/2 - 2;
        let ty = tank.y + tank.height/2 - 2;
        let tw = 4, th = 4;
        
        if (tank.direction === Direction.UP) { ty -= 8; th = 10; }
        if (tank.direction === Direction.DOWN) { th = 10; }
        if (tank.direction === Direction.LEFT) { tx -= 8; tw = 10; }
        if (tank.direction === Direction.RIGHT) { tw = 10; }
        
        ctx.fillRect(tx, ty, tw, th);
        
        // Tracks
        ctx.fillStyle = '#333';
        if (tank.direction === Direction.UP || tank.direction === Direction.DOWN) {
            ctx.fillRect(tank.x, tank.y, 4, tank.height);
            ctx.fillRect(tank.x + tank.width - 4, tank.y, 4, tank.height);
        } else {
            ctx.fillRect(tank.x, tank.y, tank.width, 4);
            ctx.fillRect(tank.x, tank.y + tank.height - 4, tank.width, 4);
        }
    };

    if (!gameState.current.player.isDestroyed) {
        drawTank(gameState.current.player);
    }
    
    gameState.current.enemies.forEach(e => drawTank(e));

    ctx.fillStyle = COLORS.BULLET;
    gameState.current.bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, b.width, b.height);
    });
    
    // Draw Grass Overlay (if we want sprites to hide under it)
    // Skipping for performance/simplicity in this pass
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
        <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="border-4 border-gray-700 bg-black shadow-2xl"
        />
        <div className="absolute top-2 left-2 text-white font-bold bg-black/50 p-2">
            SCORE: {currentScore}
        </div>
    </div>
  );
};

export default Game;
