# CRM project

Testing PostgreSQL with Neon and testing new workflow with MCP.

## Setup

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