import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import handler from './api/generate-roadmap';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'local-api-middleware',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url?.startsWith('/api/generate-roadmap')) {
              let bodyStr = '';
              req.on('data', chunk => {
                bodyStr += chunk;
              });
              req.on('end', async () => {
                try {
                  const dummyReq = {
                    method: req.method,
                    url: req.url,
                    headers: req.headers,
                    body: bodyStr ? JSON.parse(bodyStr) : {}
                  };
                  const dummyRes = {
                    statusCode: 200,
                    headers: {} as Record<string, string>,
                    setHeader(name: string, value: string) {
                      this.headers[name] = value;
                      res.setHeader(name, value);
                    },
                    status(code: number) {
                      this.statusCode = code;
                      res.statusCode = code;
                      return this;
                    },
                    json(data: any) {
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify(data));
                      return this;
                    },
                    end(data?: any) {
                      res.end(data);
                      return this;
                    }
                  };
                  await handler(dummyReq, dummyRes);
                } catch (err: any) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: err.message || 'Local API middleware error' }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // High-performance dev server optimization with conditional HMR
      hmr: process.env.DISABLE_HMR !== 'true',
      // Conditionally disable file watching when running under specialized optimization flags
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Ensure Vite dev server binds to all sub-interfaces on the mandatory port 3000
      host: '0.0.0.0',
      port: 3000,
    },
  };
});
