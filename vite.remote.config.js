import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

// Example remote config — exposes modules for the host to consume.
// In a real setup this would live in a separate repo/package.
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'remoteFeatures',
      filename: 'remoteEntry.js',
      exposes: {
        './UserDashboard': './src/remotes/UserDashboard.jsx',
        './Notifications': './src/remotes/Notifications.jsx',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  build: {
    target: 'esnext',
    minify: true,
    outDir: 'dist-remote',
  },
  server: {
    port: 5002,
  },
});
