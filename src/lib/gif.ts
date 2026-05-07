import { GIFEncoder, applyPalette, quantize } from 'gifenc';
import { boardThemes, type BoardThemeId, type PieceThemeId } from './themes';
import type { ParsedFrame } from './chess';

type ExportOptions = {
  boardTheme: BoardThemeId;
  pieceTheme: PieceThemeId;
  orientation: 'white' | 'black';
  frameDelay: number;
  holdDelay: number;
  boardSize: number;
  showCoordinates: boolean;
  includeMoveLabels: boolean;
};

export async function exportFramesToGif(
  frames: ParsedFrame[],
  options: ExportOptions,
): Promise<Blob> {
  const { boardSize, boardTheme, pieceTheme, orientation, showCoordinates, includeMoveLabels } =
    options;

  const footerHeight = includeMoveLabels ? 76 : 0;
  const canvas = document.createElement('canvas');
  canvas.width = boardSize;
  canvas.height = boardSize + footerHeight;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas rendering is unavailable in this browser.');
  }

  const boardTexturePath = boardThemes.find((theme) => theme.id === boardTheme)?.assetPath;

  if (!boardTexturePath) {
    throw new Error('Unknown board theme.');
  }

  const boardTexture = await loadImage(boardTexturePath);
  const pieceCache = await preloadPieceImages(pieceTheme);
  const encoder = GIFEncoder();

  for (const [index, frame] of frames.entries()) {
    drawFrame(context, canvas.width, canvas.height, frame, {
      boardTexture,
      pieceCache,
      boardSize,
      orientation,
      showCoordinates,
      includeMoveLabels,
    });

    const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const palette = quantize(rgba, 256);
    const indexed = applyPalette(rgba, palette);
    const delay = index === frames.length - 1 ? options.holdDelay : options.frameDelay;

    encoder.writeFrame(indexed, canvas.width, canvas.height, {
      palette,
      delay,
      repeat: 0,
    });
  }

  encoder.finish();

  const bytes = new Uint8Array(encoder.bytesView());
  return new Blob([bytes], {
    type: 'image/gif',
  });
}

async function preloadPieceImages(pieceTheme: PieceThemeId) {
  const entries = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'];
  const loaded = await Promise.all(
    entries.map(async (entry) => [
      entry,
      await loadImage(`/lichess/piece/${pieceTheme}/${entry}.svg`),
    ] as const),
  );

  return Object.fromEntries(loaded);
}

function drawFrame(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: ParsedFrame,
  options: {
    boardTexture: HTMLImageElement;
    pieceCache: Record<string, HTMLImageElement>;
    boardSize: number;
    orientation: 'white' | 'black';
    showCoordinates: boolean;
    includeMoveLabels: boolean;
  },
) {
  const { boardTexture, pieceCache, boardSize, orientation, showCoordinates, includeMoveLabels } =
    options;
  const footerHeight = includeMoveLabels ? height - boardSize : 0;
  const squareSize = boardSize / 8;
  const ranks = orientation === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const files = orientation === 'white' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

  context.clearRect(0, 0, width, height);
  context.fillStyle = '#f7f2e7';
  context.fillRect(0, 0, width, height);
  context.drawImage(boardTexture, 0, 0, boardSize, boardSize);

  context.textBaseline = 'middle';

  ranks.forEach((rank, rowIndex) => {
    files.forEach((file, columnIndex) => {
      const square = `${file}${rank}`;
      const piece = frame.pieces[square];
      const x = columnIndex * squareSize;
      const y = rowIndex * squareSize;
      const pieceKey = piece ? `${piece.color}${piece.type.toUpperCase()}` : null;

      if (showCoordinates) {
        if (rowIndex === 7) {
          context.fillStyle = columnIndex % 2 === 0 ? 'rgba(79, 55, 27, 0.9)' : 'rgba(246, 234, 219, 0.95)';
          context.font = `600 ${Math.max(14, squareSize * 0.16)}px ui-sans-serif, system-ui, sans-serif`;
          context.fillText(file, x + squareSize - squareSize * 0.18, y + squareSize - squareSize * 0.18);
        }

        if (columnIndex === 0) {
          context.fillStyle = rowIndex % 2 === 0 ? 'rgba(79, 55, 27, 0.9)' : 'rgba(246, 234, 219, 0.95)';
          context.font = `600 ${Math.max(14, squareSize * 0.16)}px ui-sans-serif, system-ui, sans-serif`;
          context.fillText(String(rank), x + squareSize * 0.14, y + squareSize * 0.18);
        }
      }

      if (pieceKey) {
        const pieceImage = pieceCache[pieceKey];
        const inset = squareSize * 0.04;
        context.drawImage(pieceImage, x + inset, y + inset, squareSize - inset * 2, squareSize - inset * 2);
      }
    });
  });

  if (includeMoveLabels && footerHeight > 0) {
    context.fillStyle = '#111111';
    context.fillRect(0, boardSize, boardSize, footerHeight);
    context.fillStyle = '#f9f6ef';
    context.font = `700 ${Math.max(22, boardSize * 0.038)}px Georgia, serif`;
    context.fillText(frame.label, 24, boardSize + footerHeight * 0.4);
    context.font = `500 ${Math.max(12, boardSize * 0.022)}px ui-monospace, SFMono-Regular, monospace`;
    context.fillStyle = '#cbbfae';
    context.fillText(frame.fen, 24, boardSize + footerHeight * 0.74);
  }
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load asset: ${source}`));
    image.src = source;
  });
}
