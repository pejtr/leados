// Dev server launcher — uses absolute paths so it works from any CWD
const { spawn } = require('child_process');
const path = require('path');

// Always resolve relative to this file's location (project root)
const projectRoot = __dirname;
const tsxPath = path.join(projectRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const entryPoint = path.join(projectRoot, 'server', '_core', 'index.ts');

const env = {
  ...process.env,
  // This is the DEV launcher — force development so the server runs Vite
  // middleware (live HMR from source) instead of serving the static prod
  // build. dotenv won't override an already-set process.env value, so this
  // wins over NODE_ENV in .env.
  NODE_ENV: 'development',
  PWD: projectRoot,
};

const child = spawn(process.execPath, [tsxPath, 'watch', entryPoint], {
  stdio: 'inherit',
  env,
  cwd: projectRoot,
});

child.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

child.on('exit', (code) => process.exit(code ?? 0));
