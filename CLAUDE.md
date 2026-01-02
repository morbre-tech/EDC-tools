# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EDC Tools is an AI-powered PowerShell script generator for enterprise environments. It has a static HTML/CSS/JS frontend with Vercel serverless functions for OpenAI API integration.

**Language**: Danish (UI and comments)

## Architecture

```
Frontend (Static)          Backend (Serverless)
┌─────────────────┐       ┌─────────────────┐
│  index.html     │──────▶│  api/generate.js│
│  styles.css     │       │  (OpenAI GPT-4) │
│  (Vanilla JS)   │       └─────────────────┘
└─────────────────┘
```

- **Frontend**: Pure HTML/CSS with inline JavaScript, Microsoft Fluent Design-inspired UI
- **Backend**: Vercel serverless function at `/api/generate` calling OpenAI API
- **Styling**: CSS custom properties in `:root`, BEM-like class naming

## Development Commands

```bash
# Local development with Vercel
npm run dev          # Starts Vercel dev server

# Simple static preview (no API)
open index.html      # Or any browser
```

## Deployment

Two deployment paths:

1. **Vercel** (for API functionality): Push to GitHub, Vercel auto-deploys
2. **Docker/Podman** (static only): Uses `./deploy.sh` → GitHub → Gitea mirror → Podman

```bash
# Deploy to GitHub (triggers both pipelines)
./deploy.sh
```

## Environment Variables

For Vercel deployment, set:
- `OPENAI_API_KEY` - Required for script generation

## Key Files

| File | Purpose |
|------|---------|
| `api/generate.js` | OpenAI serverless function - generates PowerShell scripts |
| `vercel.json` | Vercel routing and build configuration |
| `index.html` | Main application with embedded JavaScript |
| `styles.css` | All styles, CSS variables at top |

## Prompt Optimization (from AGENTS.md)

When receiving unclear prompts, first write an improved version:
```
🔄 Forbedret prompt:
_[optimized version with added context, output format, and clear requirements]_
```

If the prompt is already clear, write: "✓ Prompten er fin - opgaven løses direkte"

## Code Conventions

- PowerShell scripts follow Microsoft approved verbs (Get-, Set-, New-, etc.)
- Danish error messages and UI text
- CSS uses `--variable` naming with semantic names
- JavaScript is inline in index.html (no build step)
