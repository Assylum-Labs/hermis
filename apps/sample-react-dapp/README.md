# Solana Headless SDK - React Sample dApp

This is a sample React dApp demonstrating the usage of the Solana Headless SDK. It provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Getting Started

1. Install dependencies from the root of the monorepo:
   ```bash
   cd ../..
   pnpm install
   ```

2. Start the development server:
   ```bash
   cd apps/sample-react-dapp
   pnpm dev
   ```

## Deployment

This dApp can be deployed to both GitHub Pages and Vercel with different configurations:

### GitHub Pages Deployment

The GitHub Pages deployment uses Webpack to bundle the application with a specific base path:

```bash
# Build for GitHub Pages
pnpm run build:pages
```

This will:
- Use the `/hermis/` base path
- Bundle using Webpack configuration optimized for GitHub Pages
- Handle workspace dependencies correctly

### Vercel Deployment

The Vercel deployment uses Vite for faster builds and better development experience:

```bash
# Build for Vercel
pnpm run build:vercel
```

**Vercel Configuration:**
- A `vercel.json` file is configured to handle the monorepo structure
- Uses `corepack` to ensure the correct pnpm version
- Installs dependencies from the root and builds the specific app
- Configured for SPA routing with fallback to `index.html`

**To deploy to Vercel:**
1. Connect your GitHub repository to Vercel
2. Set the root directory to `apps/sample-react-dapp`
3. Vercel will automatically use the `vercel.json` configuration

**Troubleshooting:**
- If you encounter pnpm lockfile issues, the `vercel.json` is configured to handle this by using `corepack` and the correct pnpm version
- The build process installs dependencies from the monorepo root and then builds the specific app
- Environment variables and routing are pre-configured for SPA deployment
- **Buffer polyfill**: The app includes a manual Buffer polyfill in `src/main.tsx` to ensure compatibility with Solana libraries in the browser environment

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
