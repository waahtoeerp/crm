# Pipeline guide: making the CSC Roihu pipeline robust

Read this before changing the pipeline. It explains the patterns taken from the CRM project and the rules to follow.

The goal: the pipeline runs the same way every time, can be run by hand, and fails loudly. Claude helps by inspecting, explaining, and proposing changes. Claude does not decide on its own what runs.

## 1. Principles

- **Deterministic first.** Every run is driven by code and config files. AI is for inspecting, explaining, and proposing changes. It never runs jobs silently.
- **One entry point.** A single command runs every stage, similar to `npm start` in the CRM project. Example: `uv run pipeline.py run --stage align --config configs/run.yaml`.
- **Fail loudly.** A non-zero exit code, a missing output, or an unexpected Slurm state stops the run and says why.
- **Everything is recorded.** Each run writes a manifest: config, git commit, module versions, job IDs, job states, and outputs.
- **Re-runnable.** A stage is skipped when its success marker exists and its outputs still validate. `--force` reruns it.

## 2. What to take from the CRM project

| CRM project | Pipeline equivalent |
|---|---|
| `config/*.json` (theme, texts, pages) | `configs/*.yaml`: paths, account, resources, stage list. No paths hardcoded in code. |
| `package.json` `start` script | `uv run` entry point with named stages |
| `.env.local` (secrets, gitignored) | `.env` with account and project IDs, gitignored, never printed |
| `package-lock.json` | `uv.lock`: pinned Python dependencies |
| README setup steps | A "run manually" section a person can follow without AI |
| Input validation in the save route | Config and input checks before any job is submitted |

## 3. Why jobs fail silently, and how to prevent it

Common causes:
- Long inline shell strings with quoting or escaping problems. Variables expand wrongly.
- Shell scripts without `set -euo pipefail`, so a failing command does not stop the script.
- `sbatch` succeeds when the job is queued, even if the job later fails. Submission success is not job success.
- Missing module loads or wrong paths only show up in the job log.
- Partial output is treated as complete.

Rules:
1. Never build commands as one big string. Use a list and `subprocess.run([...], check=True)`.
2. Every job script is a template file under `templates/`, filled in from config. It starts with `#!/bin/bash` and `set -euo pipefail`.
3. Submit with `sbatch --parsable` to capture the job ID, and store it in the manifest.
4. Chain stages with `--dependency=afterok:<jobid>`, so a failed stage stops the downstream stages.
5. After a job finishes, run `sacct -j <jobid> --format=JobID,State,ExitCode,Elapsed`. Treat anything other than `COMPLETED` with exit code `0:0` as a failure.
6. Validate outputs before writing a `_SUCCESS` marker: the file exists, is not empty, and has the expected row count or checksum.
7. On every failure, print the path to the job log.

## 4. Roihu specifics (verify against current CSC documentation)

- **Project account:** `#SBATCH --account=<project_id>`. Get the ID from CSC. Do not guess it.
- **Partition, time limit, memory, GPU options:** check the current CSC Roihu documentation.
- **Storage:** keep inputs and outputs on the project's scratch area, not in the home directory. Check the current quota rules.
- **Modules:** load software with the system module command and pin versions in templates. Do not assume a module is loaded inside the job.
- **Login node vs compute node:** do not run heavy work on the login node. The pipeline runner submits jobs.
- **Automation policy:** check CSC rules on automated tools and connections to the cluster before setting up an MCP server.

## 5. Suggested layout

```
pipeline/
  pipeline.py         entry point: run, status, stage commands
  configs/run.yaml    paths, account, resources, stage list
  templates/          sbatch templates (*.sh.j2)
  stages/             one Python module per stage: inputs, command, validation
  runs/<run_id>/      manifest.json, logs, markers
  docs/               this guide and CSC notes
  pyproject.toml      uv project; uv.lock
```

Manual run: `uv sync`, then `uv run pipeline.py status`, then `uv run pipeline.py run --stage <name>`.

## 6. MCP: let Claude inspect and operate the pipeline safely

The MCP server should call the same functions a human uses from the command line. Claude then never has to invent commands.

Read-only tools (build these first):
- `list_runs(limit)`: recent runs and their status
- `get_run(run_id)`: the run's manifest
- `job_status(job_id)`: the parsed `sacct` result
- `tail_log(job_id, lines)`: the last lines of a job log
- `explain_failure(run_id)`: collects the failing stage, its exit code, and the log tail. Claude does the explaining.

Write tools (ask the user first, and require an explicit confirmation argument):
- `submit_stage(run_id, stage)`
- `cancel_job(job_id)`

Minimal server, using the Python `mcp` package:

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("roihu-pipeline")

@mcp.tool()
def list_runs(limit: int = 10) -> list[dict]:
    """List the most recent pipeline runs with their status."""
    ...

if __name__ == "__main__":
    mcp.run()
```

Register it in `.mcp.json` in the pipeline project:

```json
{
  "mcpServers": {
    "roihu-pipeline": { "command": "uv", "args": ["run", "mcp_server.py"] }
  }
}
```

**Where the server runs:** the Slurm commands must work where the server runs. Either run it on the login node and connect over SSH (`"command": "ssh", "args": ["roihu", "uv", "run", "/path/to/mcp_server.py"]`), or put a small API on the cluster. Pick one after checking CSC rules. Use SSH key login. Never store passwords in files.

**Rules for MCP tools:**
- Each tool calls the pipeline's own functions. Never pass free text from Claude to `subprocess`.
- Validate every argument: the stage must be in the config's stage list, and job IDs must be numeric.
- Record every write action in the run manifest.

## 7. RAG: searchable knowledge

Use RAG for questions like "has this error happened before?" or "what does the CSC documentation say about X?" Do not use it to decide what to run.

What to index:
- Run manifests and failed job logs. These are the most useful.
- Pipeline code, templates, and configs.
- The CSC Roihu documentation pages you rely on. Copy them locally and keep the source URL and the date.
- Notes on past decisions.

Start simple: SQLite with FTS5 full-text search. It's built into Python's `sqlite3`, so it needs no extra server. Add embeddings later only if keyword search isn't enough. Each indexed chunk keeps its source path so answers can cite it.

Expose it as an MCP tool: `search_knowledge(query, limit)`, returning chunks with their sources.

Rule: answers based on RAG must cite their sources. If nothing relevant is found, say so.

## 8. Build order

1. Write `pipeline.py` with a `status` command and one stage that runs locally on a small input. No Slurm yet.
2. Add sbatch template rendering and submission for that stage. Check the result with `sacct`.
3. Add manifests, success markers, and output validation.
4. Chain the stages with dependencies.
5. Add the read-only MCP tools.
6. Index logs and manifests with FTS5, and expose the search tool.
7. Only then add the write tools.

## 9. Instructions for the Claude working on this project

- Read this file and `docs/` before changing code.
- Do not submit jobs, cancel jobs, or delete files without explicit confirmation from the user.
- Do not put commands in inline strings. Use templates and list-form `subprocess` calls.
- When a job fails, read the log and the `sacct` output before proposing a fix. Quote the relevant lines.
- Do not guess Roihu account IDs, partitions, module names, or paths. Ask, or mark them TODO.
- Keep the pipeline runnable by hand. Every new feature needs a command-line way to run it.

## 10. Questions to answer before starting

- Which stages does the current pipeline have, and what software does each one use?
- Which account/project and storage area are assigned?
- How long do jobs run, and how many run at once?
- Where do failures show up today: the job log, or silent empty output?
