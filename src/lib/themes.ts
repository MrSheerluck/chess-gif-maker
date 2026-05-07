export type InputMode = 'pgn' | 'fen';
export type BoardThemeId = 'blue' | 'brown' | 'green' | 'ic' | 'purple';
export type PieceThemeId = 'cburnett' | 'merida' | 'pirouetti' | 'pixel';

export const boardThemes = [
  { id: 'brown', label: 'Brown', assetPath: '/lichess/board/brown.png' },
  { id: 'green', label: 'Green', assetPath: '/lichess/board/green.png' },
  { id: 'blue', label: 'Blue', assetPath: '/lichess/board/blue.png' },
  { id: 'purple', label: 'Purple', assetPath: '/lichess/board/purple.png' },
  { id: 'ic', label: 'IC', assetPath: '/lichess/board/ic.png' },
] satisfies Array<{ id: BoardThemeId; label: string; assetPath: string }>;

export const pieceThemes = [
  { id: 'merida', label: 'Merida' },
  { id: 'cburnett', label: 'Cburnett' },
  { id: 'pirouetti', label: 'Pirouetti' },
  { id: 'pixel', label: 'Pixel' },
] satisfies Array<{ id: PieceThemeId; label: string }>;

export const inputExamples: Record<InputMode, string> = {
  pgn: 'PGN mode reads the full move list and turns each position into a GIF frame.',
  fen: 'FEN mode validates each non-empty line and treats each line as one frame.',
};
