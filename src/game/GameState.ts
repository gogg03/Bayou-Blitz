import type { WorldState } from '../../shared/types';
import type { TileType } from '../../shared/constants';

export class GameState {
  worldState: WorldState | null = null;
  tiles: TileType[][] | null = null;
  localPlayerId: string | null = null;
  roomId: string | null = null;

  updateFromServer(worldState: WorldState, tiles: TileType[][]): void {
    this.worldState = worldState;
    if (tiles) {
      this.tiles = tiles;
    }
  }

  setPlayer(playerId: string, roomId: string): void {
    this.localPlayerId = playerId;
    this.roomId = roomId;
  }
}
