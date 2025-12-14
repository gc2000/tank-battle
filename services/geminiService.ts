import { GoogleGenAI, Type } from "@google/genai";
import { GRID_SIZE } from "../constants";
import { TileType } from "../types";

export const generateLevel = async (prompt: string): Promise<number[][]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `
    You are a level designer for a grid-based tank battle game (like Battle City).
    The grid is ${GRID_SIZE}x${GRID_SIZE}.
    
    Tile Types:
    0 = Empty (Passable)
    1 = Brick Wall (Destructible, blocks movement/bullets)
    2 = Steel Wall (Indestructible, blocks movement/bullets)
    3 = Water (Blocks movement, allows bullets)
    4 = Grass (Visual cover)
    9 = Base (The Eagle - MUST exist exactly once, usually at bottom center)

    Generate a 2D array representing the level layout based on the user's description.
    Ensure the base (9) is protected by some walls.
    Ensure there are open paths for tanks to move.
    Do not fill the entire map; leave plenty of 0s.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a level layout: ${prompt}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            layout: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.INTEGER,
                },
              },
            },
          },
        },
      },
    });

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("No response from AI");

    const parsed = JSON.parse(jsonStr);
    
    // Validate grid size, resize if necessary to avoid crashes
    let grid: number[][] = parsed.layout;
    
    // Ensure grid is correct dimensions
    if (grid.length !== GRID_SIZE || grid[0].length !== GRID_SIZE) {
       // Simple fallback or padding logic could go here, but for now we trust the model mostly
       // or simply crop/pad.
       const newGrid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
       for(let y=0; y<Math.min(grid.length, GRID_SIZE); y++) {
         for(let x=0; x<Math.min(grid[y].length, GRID_SIZE); x++) {
           newGrid[y][x] = grid[y][x];
         }
       }
       grid = newGrid;
    }

    return grid;
  } catch (error) {
    console.error("Failed to generate level:", error);
    // Return a default simple level on error
    return createDefaultLevel();
  }
};

const createDefaultLevel = (): number[][] => {
  const grid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(TileType.EMPTY));
  
  // Simple border
  for(let i=0; i<GRID_SIZE; i++) {
    grid[0][i] = TileType.STEEL;
    grid[GRID_SIZE-1][i] = TileType.STEEL;
    grid[i][0] = TileType.STEEL;
    grid[i][GRID_SIZE-1] = TileType.STEEL;
  }

  // Base
  const mid = Math.floor(GRID_SIZE / 2);
  grid[GRID_SIZE-2][mid] = TileType.BASE;
  grid[GRID_SIZE-2][mid-1] = TileType.BRICK;
  grid[GRID_SIZE-2][mid+1] = TileType.BRICK;
  grid[GRID_SIZE-3][mid] = TileType.BRICK;
  grid[GRID_SIZE-3][mid-1] = TileType.BRICK;
  grid[GRID_SIZE-3][mid+1] = TileType.BRICK;

  return grid;
};