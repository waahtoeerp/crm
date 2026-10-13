# CRM project

Testing PostgreSQL with Neon and testing new workflow with MCP.

# backlog

1. use uv? how to run it manually
2. make a marmade graph of the AI setup,
how similar MCP is deployed to another project
3. A project can have many design files, so many materials. Not urgent: check the project page and the selection model when this comes up.
4. Show how the cost model improves over time: estimate versus actual per week or month, so we can see whether the model is getting better.
5. Decide how the Python model connects to the web server. Options:
   - Keep the current bridge (a Python process per request). Least work.
   - Run the Python model as a small web service (FastAPI or Flask) next to the server. No start-up delay, one more process.
   - Move the whole server to Python and serve the same pages from it. One language; largest change.



# Setup

### Prerequisites
- Node.js v18+ and npm
- Neon account (https://neon.tech/)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Neon CLI globally:**
   ```bash
   npm i -g neon@latest
   ```

3. **Authenticate with Neon:**
   ```bash
   neon login
   ```

4. **Link to the Neon project:**
   ```bash
   neon link --project-id divine-meadow-36360048 --branch production -y
   ```
   This will create `.env.local` with your database credentials.

5. **Verify setup:**
   ```bash
   neon status
   ```

### Environment

The `.env.local` file is auto-generated when you run `neon link`. It contains:
- `DATABASE_URL` — Pooled connection for applications
- `DATABASE_URL_UNPOOLED` — Unpooled connection for migrations
- `NEON_BRANCH` — Current Neon branch

**Never commit `.env.local` to git** (it's in `.gitignore`).

Get started with Neon. Using Neon org org-odd-art-22763557 and project divine-meadow-36360048.

# How to start and share CRM

Here's how to share it through a temporary public link:

## In the project folder, start the CRM:

```bash
npm start
In a second terminal window, start the tunnel:

cloudflared tunnel --url http://localhost:3000

# Copy the https://....trycloudflare.com address it prints and send it to the customer.

```

# How npm start works

```bash
ONCE:  npm install
       package.json ........ list of libraries the project needs
       package-lock.json ... exact versions (so everyone gets the same ones)
       node_modules/ ....... the downloaded libraries (the result)

EVERY TIME:  npm start
       package.json "start" script runs:
         node --env-file=.env.local src/server.js
            1. loads .env.local  -> DATABASE_URL etc. into the environment
            2. server.js uses express + pg from node_modules
            3. connects to Neon with DATABASE_URL
            4. reads config/*.json (theme, texts, pages)
            5. listens on http://localhost:3000
```
```bash

browser -> /projects         server sends projects.html (empty shell)
browser -> /api/config       server sends theme + texts + pages from config/
browser -> /api/projects     server queries Neon, sends rows as JSON
app.js  -> builds the page from config + rows
```
- npm install only needs to run again when package.json changes or after a fresh clone.
- node_modules/ is generated, so it should never be committed. Your .gitignore doesn't list it yet, which we should fix.
- .env.local holds the secrets and is gitignored, so each machine needs its own copy from neon link.
