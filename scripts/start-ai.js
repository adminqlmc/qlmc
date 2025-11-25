// Starts the Python AI assistant (FastAPI) alongside Next.js during `npm run dev`.
// Windows-friendly: uses powershell to run uvicorn in the py-chatbot folder.

const { spawn, spawnSync } = require('child_process');
const path = require('path');

const cwd = process.cwd();
const aiCwd = path.join(cwd, 'py-chatbot');

// Allow override of host/port via env or fall back
const host = process.env.AI_HOST || '127.0.0.1';
const port = process.env.AI_PORT || '8001';

// Optional: let user define Python executable (e.g., conda env). Fallback to .venv or `python`.
const fs = require('fs');
const defaultVenvPy = path.join(aiCwd, '.venv', 'Scripts', 'python.exe');
const py = process.env.PYTHON_EXEC || (fs.existsSync(defaultVenvPy) ? defaultVenvPy : 'python');

// Compose command: python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
const args = ['-m', 'uvicorn', 'app.main:app', '--host', host, '--port', port];

// Set UTF-8 encoding for Windows to avoid Unicode errors
const env = { ...process.env, PYTHONIOENCODING: 'utf-8' };

// Preflight: check python is callable and has required modules
const preflightCode = 'import sys; import importlib.util; mods=["uvicorn","fastapi","transformers","faiss","torch"]; missing=[m for m in mods if importlib.util.find_spec(m) is None]; print("MISSING:", ",".join(missing)); sys.exit(1 if missing else 0)';
const preflight = spawnSync(py, ['-c', preflightCode], { cwd: aiCwd, stdio: 'pipe' });
if (preflight.status !== 0) {
  const out = Buffer.concat([preflight.stdout || Buffer.alloc(0), preflight.stderr || Buffer.alloc(0)]).toString();
  console.error('[ai] Python environment missing required packages.');
  console.error(out.trim());
  console.error('[ai] Fix by either:');
  console.error('  1) Set PYTHON_EXEC to your conda/venv python (has torch, fastapi, uvicorn, faiss, sentence-transformers).');
  console.error('     Example (PowerShell):');
  console.error('       $env:PYTHON_EXEC = "C://Miniconda3//envs//qlmc-chatbot//python.exe"');
  console.error('       npm run dev');
  console.error('  2) Or install deps in current python:');
  console.error('       pip install -r py-chatbot/requirements.txt');
  console.error('       pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121');
  process.exit(1);
}

console.log(`[ai] starting uvicorn at http://${host}:${port} (cwd: ${aiCwd})`);

const child = spawn(py, args, {
  cwd: aiCwd,
  stdio: 'inherit',
  shell: true, // to make it work on Windows with PATH-resolved python
  env: {
    ...env, // Use env variable with PYTHONIOENCODING
    // You can set defaults here; users can override via their shell
    PY_CHATBOT_URL: `http://${host}:${port}`,
    // Example: autosave every 5 minutes
    AUTOSAVE_SECONDS: process.env.AUTOSAVE_SECONDS || '300',
    // Optional: bootstrap knowledge on startup when index empty
    BOOTSTRAP_KNOWLEDGE: process.env.BOOTSTRAP_KNOWLEDGE || '0',
    // Prebuilt directory (committed to Git) used to copy index on cold start
    PREBUILT_INDEX_DIR: process.env.PREBUILT_INDEX_DIR || `${aiCwd}\\prebuilt`,
  },
});

child.on('exit', (code) => {
  console.log(`[ai] uvicorn exited with code ${code}`);
});
