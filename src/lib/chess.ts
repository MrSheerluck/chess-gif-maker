import { Chess } from 'chess.js';
import type { InputMode } from './themes';

type SquarePiece = {
  color: 'w' | 'b';
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
};

export type ParsedFrame = {
  fen: string;
  label: string;
  pieces: Record<string, SquarePiece>;
};

export function buildFramesFromInput(
  mode: InputMode,
  rawValue: string,
): { error: string | null; frames: ParsedFrame[] } {
  try {
    if (!rawValue.trim()) {
      return { error: 'Add a PGN or one or more FEN positions to begin.', frames: [] };
    }

    if (mode === 'fen') {
      return { error: null, frames: buildFenFrames(rawValue) };
    }

    return { error: null, frames: buildPgnFrames(rawValue) };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Could not parse the chess input.',
      frames: [],
    };
  }
}

export function renderFrameSummary(frames: ParsedFrame[]): string {
  if (!frames.length) {
    return 'No frames yet';
  }

  if (frames.length === 1) {
    return '1 frame';
  }

  return `${frames.length} frames`;
}

function buildFenFrames(rawValue: string): ParsedFrame[] {
  const lines = rawValue
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    throw new Error('FEN mode expects at least one non-empty line.');
  }

  return lines.map((line, index) => {
    const chess = new Chess(line);
    return createFrame(chess.fen(), `Frame ${index + 1}`);
  });
}

function buildPgnFrames(rawValue: string): ParsedFrame[] {
  const analysis = new Chess();
  analysis.loadPgn(rawValue);

  const moveHistory = analysis.history();
  const replay = new Chess();
  const frames: ParsedFrame[] = [createFrame(replay.fen(), 'Start position')];

  moveHistory.forEach((san, index) => {
    replay.move(san);
    const moveNumber = Math.floor(index / 2) + 1;
    const prefix = index % 2 === 0 ? `${moveNumber}.` : `${moveNumber}...`;
    frames.push(createFrame(replay.fen(), `${prefix} ${san}`));
  });

  return frames;
}

function createFrame(fen: string, label: string): ParsedFrame {
  const chess = new Chess(fen);
  const pieces: Record<string, SquarePiece> = {};

  chess.board().forEach((row) => {
    row.forEach((square) => {
      if (!square) {
        return;
      }

      pieces[square.square] = {
        color: square.color,
        type: square.type,
      };
    });
  });

  return { fen, label, pieces };
}
