import { useEffect, useMemo, useState } from 'react';
import './App.css';
import {
  boardThemes,
  pieceThemes,
  type BoardThemeId,
  type InputMode,
  type PieceThemeId,
} from './lib/themes';
import {
  buildFramesFromInput,
  renderFrameSummary,
  type ParsedFrame,
} from './lib/chess';
import { exportFramesToGif } from './lib/gif';

const defaultPgn = `[Event "Opera Game"]
[Site "Paris"]
[Date "1858.??.??"]
[Round "?"]
[White "Paul Morphy"]
[Black "Duke Karl / Count Isouard"]
[Result "1-0"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5
6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5
11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6
15. Bxd7+ Nxd7 16. Qb8+! Nxb8 17. Rd8# 1-0`;

function App() {
  const [inputMode, setInputMode] = useState<InputMode>('pgn');
  const [inputValue, setInputValue] = useState(defaultPgn);
  const [boardTheme, setBoardTheme] = useState<BoardThemeId>('brown');
  const [pieceTheme, setPieceTheme] = useState<PieceThemeId>('merida');
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [frameDelay, setFrameDelay] = useState(650);
  const [holdDelay, setHoldDelay] = useState(1400);
  const [boardSize, setBoardSize] = useState(640);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [includeMoveLabels, setIncludeMoveLabels] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('chess-gif-maker.gif');

  const parsed = useMemo(
    () => buildFramesFromInput(inputMode, inputValue),
    [inputMode, inputValue],
  );

  const previewFrame = parsed.frames.at(-1) ?? null;

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleExport = async () => {
    if (!parsed.frames.length || parsed.error) {
      return;
    }

    setIsExporting(true);

    try {
      const blob = await exportFramesToGif(parsed.frames, {
        boardTheme,
        pieceTheme,
        orientation,
        frameDelay,
        holdDelay,
        boardSize,
        showCoordinates,
        includeMoveLabels,
      });

      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }

      const nextUrl = URL.createObjectURL(blob);
      const nextName =
        inputMode === 'pgn' ? 'lichess-pgn-export.gif' : 'lichess-fen-export.gif';

      setDownloadUrl(nextUrl);
      setDownloadName(nextName);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="shell">
      <header className="topbar">
        <h1>Chess GIF Maker</h1>
        <p>Paste PGN or FEN, preview the board, export a GIF.</p>
      </header>

      <section className="workspace">
        <div className="panel controls">
          <div className="section-header">
            <h2>Input</h2>
            <div className="toggle-row">
              <button
                className={inputMode === 'pgn' ? 'chip active' : 'chip'}
                onClick={() => setInputMode('pgn')}
                type="button"
              >
                PGN
              </button>
              <button
                className={inputMode === 'fen' ? 'chip active' : 'chip'}
                onClick={() => setInputMode('fen')}
                type="button"
              >
                FEN
              </button>
            </div>
          </div>

          <label className="field">
            <span>Paste {inputMode.toUpperCase()}</span>
            <textarea
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              spellCheck={false}
              rows={14}
            />
          </label>

          <div className="section-header">
            <h2>Style</h2>
          </div>

          <div className="grid two-up">
            <label className="field">
              <span>Board theme</span>
              <select
                value={boardTheme}
                onChange={(event) => setBoardTheme(event.target.value as BoardThemeId)}
              >
                {boardThemes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Piece theme</span>
              <select
                value={pieceTheme}
                onChange={(event) => setPieceTheme(event.target.value as PieceThemeId)}
              >
                {pieceThemes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Orientation</span>
              <select
                value={orientation}
                onChange={(event) => setOrientation(event.target.value as 'white' | 'black')}
              >
                <option value="white">White at bottom</option>
                <option value="black">Black at bottom</option>
              </select>
            </label>

            <label className="field">
              <span>Board size</span>
              <select
                value={boardSize}
                onChange={(event) => setBoardSize(Number(event.target.value))}
              >
                <option value={480}>480px</option>
                <option value={640}>640px</option>
                <option value={800}>800px</option>
              </select>
            </label>
          </div>

          <div className="grid two-up">
            <label className="field">
              <span>Frame delay</span>
              <input
                min={150}
                max={2400}
                step={50}
                type="range"
                value={frameDelay}
                onChange={(event) => setFrameDelay(Number(event.target.value))}
              />
              <small>{frameDelay} ms between moves</small>
            </label>

            <label className="field">
              <span>Final hold</span>
              <input
                min={300}
                max={4000}
                step={100}
                type="range"
                value={holdDelay}
                onChange={(event) => setHoldDelay(Number(event.target.value))}
              />
              <small>{holdDelay} ms on the last frame</small>
            </label>
          </div>

          <div className="check-grid">
            <label className="checkbox">
              <input
                checked={showCoordinates}
                onChange={(event) => setShowCoordinates(event.target.checked)}
                type="checkbox"
              />
              <span>Show coordinates</span>
            </label>

            <label className="checkbox">
              <input
                checked={includeMoveLabels}
                onChange={(event) => setIncludeMoveLabels(event.target.checked)}
                type="checkbox"
              />
              <span>Show move labels in GIF</span>
            </label>
          </div>

          <div className="actions">
            <button
              className="primary"
              disabled={!parsed.frames.length || Boolean(parsed.error) || isExporting}
              onClick={handleExport}
              type="button"
            >
              {isExporting ? 'Rendering GIF...' : 'Export GIF'}
            </button>

            {downloadUrl ? (
              <a className="secondary" download={downloadName} href={downloadUrl}>
                Download latest GIF
              </a>
            ) : null}
          </div>

          <div className={parsed.error ? 'status error' : 'status'}>
            {parsed.error ? (
              <p>{parsed.error}</p>
            ) : (
              <p>
                Parsed {parsed.frames.length} frame{parsed.frames.length === 1 ? '' : 's'} from{' '}
                {inputMode.toUpperCase()}.
              </p>
            )}
          </div>
        </div>

        <div className="panel preview-panel">
          <div className="section-header">
            <h2>Preview</h2>
            <span className="summary-pill">{renderFrameSummary(parsed.frames)}</span>
          </div>

          {previewFrame ? (
            <>
              <BoardPreview
                boardTheme={boardTheme}
                frame={previewFrame}
                orientation={orientation}
                pieceTheme={pieceTheme}
                showCoordinates={showCoordinates}
              />
              <div className="preview-copy">
                <p>{previewFrame.label}</p>
                <code>{previewFrame.fen}</code>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Paste a valid PGN or FEN to render a preview.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function BoardPreview({
  boardTheme,
  frame,
  orientation,
  pieceTheme,
  showCoordinates,
}: {
  boardTheme: BoardThemeId;
  frame: ParsedFrame;
  orientation: 'white' | 'black';
  pieceTheme: PieceThemeId;
  showCoordinates: boolean;
}) {
  const ranks = orientation === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const files = orientation === 'white' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

  return (
    <div className="preview-wrap">
      <div
        className="board"
        style={{ backgroundImage: `url(${boardThemes.find((theme) => theme.id === boardTheme)?.assetPath})` }}
      >
        {ranks.flatMap((rank, rowIndex) =>
          files.map((file, columnIndex) => {
            const square = `${file}${rank}`;
            const isDark = (rowIndex + columnIndex) % 2 === 1;
            const piece = frame.pieces[square];

            return (
              <div
                className={isDark ? 'square dark' : 'square light'}
                key={square}
              >
                {showCoordinates && rowIndex === 7 ? (
                  <span className={isDark ? 'coord file dark' : 'coord file'}>{file}</span>
                ) : null}
                {showCoordinates && columnIndex === 0 ? (
                  <span className={isDark ? 'coord rank dark' : 'coord rank'}>{rank}</span>
                ) : null}
                {piece ? (
                  <img
                    alt={`${piece.color}${piece.type}`}
                    className="piece"
                    draggable={false}
                    src={`/lichess/piece/${pieceTheme}/${piece.color}${piece.type.toUpperCase()}.svg`}
                  />
                ) : null}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

export default App;
