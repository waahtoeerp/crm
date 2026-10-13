const path = require("node:path");
const { execFile } = require("node:child_process");

const ROOT = path.join(__dirname, "..");

function runAnalysis(command, payload = {}) {
  return new Promise((resolve, reject) => {
    const child = execFile(
      "uv",
      ["run", path.join(ROOT, "analysis", "cli.py")],
      { cwd: ROOT, env: process.env, timeout: 60000, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) return reject(new Error(stderr || error.message));
        resolve(JSON.parse(stdout));
      },
    );
    child.stdin.end(JSON.stringify({ command, payload }));
  });
}

module.exports = { runAnalysis };
