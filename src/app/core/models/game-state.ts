import { Color } from "../enums/color";
import { GameStatus } from "../enums/game-status";
import { Board } from "./board";
import { Move } from "./move";
import { Piece } from "./piece";
import { Position } from "./position";

export interface GameState {
  board: Board;
  currentPlayer: Color;
  status: GameStatus;
  moveHistory: Move[];
  capturedPieces: { white: Piece[], black: Piece[] };
  selectedPosition: Position | null;
  validMoves: Position[];
  halfMoveClock: number;
  fullMoveNumber: number;
  castlingRights: {
    white: { kingSide: boolean, queenSide: boolean },
    black: { kingSide: boolean, queenSide: boolean }
  };
  enPassantTarget: Position | null;
  promotionPending: { from: Position, to: Position } | null;
  positionHashes: string[];
}