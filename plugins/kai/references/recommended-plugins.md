# Recommended Claude Code Plugins

> These plugins extend Claude Code with capabilities that are useful when building internal tools. They're not required — but when you hit the problems they solve, they save significant time.

---

## 1. code-review-graph

**What it does:** Visual code review that maps relationships between files and functions. Instead of reading code file-by-file, you get a graph view showing which files call which functions, where data flows, and how different parts of your app connect. It also identifies circular dependencies, unused exports, and high-coupling hotspots.

**When it's relevant:**
- Your tool has grown beyond 5-6 files and you're losing track of where things live
- You want to understand the full impact of changing a function (what else calls it?)
- You're onboarding someone new and need to explain the codebase structure
- Claude Code keeps editing the wrong file because it doesn't know where logic lives

**How to install:**
```bash
claude mcp add code-review-graph
```

Or add it to your project's `.claude/settings.json`:
```json
{
  "mcpServers": {
    "code-review-graph": {
      "command": "npx",
      "args": ["-y", "code-review-graph-mcp"]
    }
  }
}
```

---

## 2. agent-browser

**What it does:** Browser automation for testing your tool's UI. It can open your app in a real browser, click buttons, fill forms, take screenshots, and verify that the user journey works end-to-end — without you manually clicking through everything.

**When it's relevant:**
- You've made changes to the frontend and want to verify nothing is visually broken before sharing with users
- You want to test that a multi-step flow (login → create record → verify it appears) works correctly
- You're debugging a UI issue and need screenshots of what different pages look like
- You want to verify Google Auth login actually works in production (not just locally)

**How to install:**
```bash
npm install -g agent-browser
claude mcp add agent-browser
```

Or add it to your project's `.claude/settings.json`:
```json
{
  "mcpServers": {
    "agent-browser": {
      "command": "agent-browser",
      "args": ["mcp"]
    }
  }
}
```

**Basic usage Claude Code will use:**
```bash
agent-browser open http://localhost:3000
agent-browser snapshot -i          # Get element refs for interaction
agent-browser click @e1            # Click a button
agent-browser fill @e2 "test@mosaicwellness.in"  # Fill a form field
agent-browser screenshot output.png  # Take a screenshot
agent-browser close
```
