import { PieceType } from "../enums/piece-type";
import { Piece } from "./piece";
import { Position } from "./position";

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece;
  isEnPassant?: boolean;
  isCastling?: boolean;
  isPromotion?: boolean;
  promotionPiece?: PieceType;
  timestamp: Date;
  notation: string;
}