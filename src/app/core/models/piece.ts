import { Color } from "../enums/color";
import { PieceType } from "../enums/piece-type";
import { Position } from "./position";

export interface Piece {
  type: PieceType;
  color: Color;
  position: Position;
  hasMoved: boolean;
  id: string;
}