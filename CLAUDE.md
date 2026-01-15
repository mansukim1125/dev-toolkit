# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dev Toolkit is a static web application hosting developer utility tools. It's deployed to Firebase Hosting and uses vanilla JavaScript with no build step.

## Git Branch Strategy

- `main` - Production branch
- `develop` - Staging branch (awaiting production deployment)
- `feature/*` - Feature development branches
- `fix/*` - Bug fix branches

## Workflow

1. Create branch from `develop` (`feature/*` or `fix/*`)
2. Commit per logical work unit
3. Update CLAUDE.md if architecture changes
4. Create PR to `develop`

## Development

**Local Development:**
```bash
# Serve locally with any static file server
npx serve .
# Or use Python
python -m http.server 8000
```

**Deploy:**
```bash
firebase deploy
```

Deployment happens automatically via GitHub Actions:
- PRs get preview deployments
- Merges to `main` deploy to production

## Architecture

### Tool System

Each tool lives in `tools/{tool-id}/` with this structure:
```
tools/{tool-id}/
├── index.html    # HTML template wrapped in <template id="{tool-id}">
└── src/main.js   # Tool logic as a class with static methods
```

**To add a new tool:**
1. Create folder under `tools/` with `index.html` and `src/main.js`
2. Register the tool in `src/main.js` by adding to the `tools` array:
   ```javascript
   const tools = [
     { id: 'base64', name: 'Base64' },
     // Add new tool here
   ];
   ```

**Tool template pattern:**
- Use `<template id="{tool-id}">` as root element
- Reference scripts as `<script src="./src/main.js"></script>`
- Expose functionality via a class with static methods (e.g., `Base64Tool.encode()`)
- Use element IDs for DOM access (IDs are scoped to the loaded template)

### Current Tools
- `base64` - Base64 encode/decode
- `json-prettier` - JSON formatting
- `env-converter` - Environment variable conversion
- `json-xml-compare` - JSON/XML comparison
- `jwt` - JWT decoding

### Key Files
- `src/main.js` - App entry point, navigation, and template loading system
- `src/styles.css` - Shared styles and responsive utilities
- `index.html` - Main HTML shell
