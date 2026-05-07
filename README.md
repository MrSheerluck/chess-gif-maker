# Chess GIF Maker

A free chess GIF maker built with React, TypeScript, and Cloudflare Workers with Assets.

It accepts:

- `PGN` game notation and exports one frame per move
- `FEN` positions, including multiple FEN lines for multi-frame animations
- Lichess board and piece themes bundled locally in `public/lichess`

## Features

- Client-side GIF rendering with `gifenc`
- Chess validation and move replay with `chess.js`
- Piece themes: `Merida`, `Cburnett`, `Pirouetti`, `Pixel`
- Board themes: `Brown`, `Green`, `Blue`, `Purple`, `IC`
- Cloudflare-ready static deployment with a small Worker shell

## Local development

```bash
pnpm install
pnpm dev
```

## Production build

```bash
pnpm build
pnpm lint
```

## Deploy to Cloudflare

1. Sign in once:

```bash
pnpm wrangler login
```

2. Deploy:

```bash
pnpm deploy
```

3. Optional custom domain:

- Open the Cloudflare dashboard
- Go to `Workers & Pages`
- Open the `chess-gif-maker` Worker
- Attach your domain or route

## Notes on hosting cost

The app exports GIFs in the browser, so Cloudflare mostly serves static assets. That keeps the free-tier footprint small.

## Asset attribution

This project bundles board and piece assets from the Lichess `lila` repository under their upstream terms:

- Boards from `public/images/board`
- Pieces from `public/piece`

Upstream source:

- [lichess-org/lila](https://github.com/lichess-org/lila)
