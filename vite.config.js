import { timingSafeEqual } from 'node:crypto';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const safeEqual = (a, b) => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};

// Basic Auth for dev/preview servers; active only if BASIC_AUTH_USER and BASIC_AUTH_PASSWORD are set.
function basicAuth(user, password) {
  const middleware = (req, res, next) => {
    const header = req.headers.authorization || '';
    if (header.startsWith('Basic ')) {
      const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
      const i = decoded.indexOf(':');
      if (i >= 0 && safeEqual(decoded.slice(0, i), user) && safeEqual(decoded.slice(i + 1), password)) {
        return next();
      }
    }
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="TT-Turnier", charset="UTF-8"');
    res.end('Authentication required');
  };
  return {
    name: 'basic-auth',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

// base: './' makes the built app work when opened directly from the file system
// (double-click index.html in dist/) as well as from a local static server.
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'BASIC_AUTH_'), ...process.env };
  const user = env.BASIC_AUTH_USER;
  const password = env.BASIC_AUTH_PASSWORD;
  return {
    base: './',
    plugins: [react(), ...(user && password ? [basicAuth(user, password)] : [])],
    server: {
      host: true,
    },
  };
});

