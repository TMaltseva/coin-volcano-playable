# Coin Volcano Playable Ad

HTML5 playable ad for casino with chest selection.

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

The project will be available at: `http://localhost:3000`

## Production Build

```bash
# Build project
npm run build
```

After building, a `dist` folder will be created with ready-to-deploy files.

## Deployment

### Option 1: Static Hosting (Netlify, Vercel, GitHub Pages)

1. Build the project: `npm run build`
2. Upload the contents of the `dist` folder to hosting

**Netlify:**
- Drag and drop the `dist` folder to [netlify.com/drop](https://app.netlify.com/drop)
- Or connect a GitHub repository and specify:
  - Build command: `npm run build`
  - Publish directory: `dist`

**Vercel:**
- Install Vercel CLI: `npm i -g vercel`
- Run: `vercel`
- Or connect via web interface at [vercel.com](https://vercel.com)

**GitHub Pages:**
- Enable GitHub Pages in repository settings
- Specify source: `dist` folder

### Option 2: Regular Web Hosting

1. Build the project: `npm run build`
2. Upload all files from the `dist` folder to your hosting via FTP/SFTP
3. Make sure `index.html` is in the root directory

### Option 3: CDN (for Mintegral/Unity Ads)

1. Build the project: `npm run build`
2. Upload the contents of `dist` to CDN or S3
3. Specify the URL to `index.html` in the advertising platform settings

## Project Structure

- `index.html` - main page
- `game.js` - main game logic
- `style.css` - styles
- `assets/` - all resources (images, sprites)
- `dist/` - production build (created after `npm run build`)

## Technologies

- Pixi.js - for animation rendering
- GSAP - for animations
- Vite - project bundler

## Bundle Size

After building, check the size of the `dist` folder. According to the specification, the total size should be around 3 MB.
