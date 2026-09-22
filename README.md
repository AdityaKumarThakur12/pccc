# My AI PC Agent

A private, local-first AI assistant for Windows that runs entirely on your PC using [Ollama](https://ollama.com). No cloud API keys required — all AI processing happens locally.

## Features

- **Local AI Chat** — Powered by Ollama, no OpenAI/Google/Anthropic API key needed
- **Agent Loop** — The AI plans, calls tools, reads results, and continues reasoning until the task is done
- **Real PC Control** — Open apps, run terminal commands, read/write files, take screenshots
- **Filesystem Tools** — List, read, write, create, rename, copy, move, delete, and search files
- **Terminal Execution** — Run npm, git, node, and any CLI command with stdout/stderr/exit code
- **Git Integration** — Status, diff, log, branch, checkout, add, commit, push (with confirmation)
- **Project Detection** — Auto-detects React, Vite, Next.js, NestJS, Node.js, Java/Spring Boot, Python, and more
- **Code Search** — Search recursively through projects, respecting .gitignore and skipping node_modules
- **Security** — Configurable allowed directories, blocked system paths, confirmation for dangerous commands
- **Command Palette** — Ctrl+Shift+P for quick access to all actions
- **Activity Timeline** — Track all tool executions with expandable details
- **Task Management** — Multi-step tasks with pause/cancel/continue
- **Dark Premium UI** — Professional developer-tool aesthetic with glass panels and smooth animations

## Prerequisites

### 1. Install Node.js

Download and install Node.js v18+ from [nodejs.org](https://nodejs.org).

### 2. Install Ollama

1. Download Ollama from [ollama.com](https://ollama.com)
2. Run the installer
3. Verify installation by opening a terminal and running:
   ```bash
   ollama --version
   ```

### 3. Pull an AI Model

Open a terminal and pull a model:

```bash
# Recommended general-purpose model
ollama pull llama3.1

# Or a smaller/faster model
ollama pull llama3.2

# Or a coding-focused model
ollama pull codellama
```

### 4. Start Ollama with CORS enabled

**Important for browser/preview mode:** Ollama blocks cross-origin requests by default. You must start it with the `OLLAMA_ORIGINS` environment variable set to `*`:

**Windows Command Prompt (CMD):**
```cmd
set OLLAMA_ORIGINS=* && ollama serve
```

**Windows PowerShell:**
```powershell
$env:OLLAMA_ORIGINS="*"; ollama serve
```

**Linux / macOS:**
```bash
OLLAMA_ORIGINS=* ollama serve
```

The server runs at `http://localhost:11434` by default.

> **Note:** If running as a packaged Electron desktop app, CORS is not an issue (requests go through IPC). The `OLLAMA_ORIGINS` setting is only needed when running in a browser or dev preview.

## Installation

```bash
# Clone or download this project
cd my-ai-pc-agent

# Install dependencies
npm install
```

## Development Mode

```bash
npm run dev
```

This starts both the Vite dev server (port 5173) and the Electron app simultaneously.

## Building the Windows Executable

```bash
npm run build:electron
```

The installer will be created in the `release/` folder as an `.exe` file.

## Usage

### First Run

On first launch, you'll see a welcome wizard:

1. **Step 1** — Verify Ollama is running (click "Check Ollama")
2. **Step 2** — Choose your AI model (llama3.1 recommended)
3. **Step 3** — Select allowed workspace directories
4. **Step 4** — Start chatting

### Chat Commands

Type natural language commands:

- `Open VS Code` — Opens Visual Studio Code
- `Open Chrome` — Opens Google Chrome
- `Show me files in C:\Users\me\Projects` — Lists directory contents
- `Run npm install` — Executes npm install in the current project
- `Run npm run build` — Builds the current project
- `Check why my build is failing` — The agent will inspect, run the build, analyze errors, and suggest fixes
- `Find PatientEntity` — Searches code for "PatientEntity"
- `Run git status` — Shows git status
- `Take a screenshot` — Captures the screen
- `Read this file and explain it` — Reads and explains a file
- `Create a new React component called Header` — Creates a new component file

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Focus chat input |
| `Ctrl + Shift + P` | Open command palette |
| `Ctrl + N` | New conversation |
| `Esc` | Cancel current task |

### Command Palette

Press `Ctrl + Shift + P` to open the command palette with quick access to:
- New Chat
- Open Project
- Take Screenshot
- Run Command
- Search Files
- Check Ollama
- Change AI Model
- Settings

### Settings

#### AI Settings
- **Provider**: Ollama (local)
- **Ollama URL**: `http://localhost:11434` (configurable)
- **Model**: Select from available models
- **Temperature**: 0.0 (precise) to 1.0 (creative)
- **System Prompt**: Customize the AI's behavior

#### Security Settings
- Require confirmation for dangerous commands (rm, format, shutdown, git push)
- Require confirmation before deleting files
- Require confirmation before modifying files
- Require confirmation before git push
- Advanced access (allow system directory access — use with caution)

#### Workspace Settings
- **Allowed Directories**: Folders the AI can access
- System directories (C:\Windows, Program Files) are always blocked by default

## Vision-Capable Models (Screenshots)

For screenshot understanding, use a vision-capable Ollama model:

```bash
# Pull a vision model
ollama pull llava

# Or
ollama pull llama3.2-vision
```

Then select the vision model in Settings. When you ask the AI to take a screenshot, it will be able to analyze the image content.

If a non-vision model is selected, screenshots will still be captured and displayed, but the AI will note that it cannot analyze the image.

## Architecture

```
my-ai-pc-agent/
├── electron/                  # Electron main process
│   ├── main.ts                 # App entry point, window creation
│   ├── preload.ts              # Secure IPC bridge to renderer
│   └── services/               # Backend services
│       ├── filesystem.ts       # Real file operations
│       ├── terminal.ts         # Command execution
│       ├── application.ts      # App launching
│       ├── git.ts              # Git + project detection
│       ├── screenshot.ts       # Screen capture
│       └── ollama.ts            # Ollama connection checks
├── src/                        # React renderer
│   ├── components/             # UI components
│   ├── stores/                 # Zustand state management
│   ├── services/
│   │   ├── ai/                  # AI provider abstraction
│   │   ├── agent/              # Agent loop
│   │   └── tools/              # Tool registry + implementations
│   ├── types/                  # TypeScript definitions
│   └── App.tsx                 # Main app
├── package.json
└── README.md
```

### Key Design Decisions

- **AI Provider Abstraction**: `AIProvider` interface with `OllamaProvider` implementation. New providers can be added without changing the agent loop.
- **Tool Registry**: Centralized registry where all tools register themselves. The agent loop queries available tools and passes definitions to the AI.
- **Agent Loop**: Multi-iteration loop where the AI decides which tools to call, executes them, reads results, and continues until the task is complete or max iterations reached.
- **IPC Security**: No Node.js APIs exposed to the renderer. All operations go through whitelisted IPC channels via a preload script.
- **Local-First Privacy**: All AI processing goes through local Ollama. No files, code, or terminal output are sent to external APIs.

## Troubleshooting

### Ollama Not Connected

1. Check Ollama is running: `ollama serve`
2. **For browser/preview mode:** Start Ollama with CORS enabled:
   - CMD: `set OLLAMA_ORIGINS=* && ollama serve`
   - PowerShell: `$env:OLLAMA_ORIGINS="*"; ollama serve`
3. Verify the URL in Settings matches `http://localhost:11434`
4. Click "Check" or "Retry Connection" in Settings
5. The app re-checks every 30 seconds automatically

### No Models Available

1. Pull a model: `ollama pull llama3.1`
2. List models: `ollama list`
3. Restart the app or click "Check" in Settings

### Tool Execution Failed

- Check the allowed directories in Settings > Workspace
- System directories are blocked by default
- Check the Activity panel for detailed error information

### Build Errors

```bash
# Check TypeScript
npm run typecheck

# Check Electron TypeScript
npm run typecheck:electron

# Full build
npm run build
```

## License

Private project. All AI processing is local via Ollama.
