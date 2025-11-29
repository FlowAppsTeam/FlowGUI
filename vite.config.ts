import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './', // ✅ MOVED: Set base to './' for relative paths
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react({
          jsxRuntime: 'automatic' // Use the automatic JSX runtime (React 17+)
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      css: {
        postcss: {
          plugins: [
            require('tailwindcss'),
            require('autoprefixer'),
          ],
        },
      },
      build: {
        outDir: 'dist',
        rollupOptions: {
          input: path.resolve(__dirname, 'index.html'), // Explicitly define the entry point
          output: {
            manualChunks: {},
          },
          // Make sure React and ReactDOM are NOT externalized
          external: [],
        },
        // Make sure to inline the CSS
        cssCodeSplit: false,
      },
    };
});