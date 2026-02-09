import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

// Host application config — consumes remote federated modules
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host_app',
      // Remote apps to consume. Update URLs to point at your deployed remotes.
      remotes: {
        remoteFeatures: 'http://localhost:5002/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  build: {
    target: 'esnext',
    minify: true,
    cssCodeSplit: false,
  },
  server: {
    port: 5173,
  },
});
