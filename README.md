# Selenium MCP Server

An autonomous, self-managing Selenium-based MCP (Model Context Protocol) server that provides comprehensive UI analysis, cross-browser testing, and intelligent browser automation with zero-configuration setup.

- Self-initializing and self-healing
- Multi-browser orchestration (Chrome, Firefox, Edge)
- Performance, accessibility, responsive, and visual analysis
- Quality scoring and actionable recommendations
- Reports with logs and annotated screenshots

Table of Contents
- Overview
- Quick Start
- Analyze Your Local Site (127.0.0.1:8000)
- Available Tools (API Reference)
- Configuration
- Reports & Artifacts
- Development
- Testing
- System Requirements
- Troubleshooting
- FAQ
- License & Support

## Overview
This MCP server exposes a suite of automation and analysis tools over the MCP stdio transport. It manages WebDriver installation, launches browsers, navigates to URLs, and runs comprehensive audits (performance, accessibility, cross-browser consistency, responsive design), returning structured results and generating reports.

Key capabilities
- Autonomous setup: driver install, browser configuration, environment readiness
- Multi-browser orchestration: parallel instances with health monitoring
- Smart navigation: stability detection and dynamic content waiting
- Comprehensive analysis: performance + accessibility + responsive + visual
- Recommendations: prioritized, actionable fixes
- Reporting: HTML/JSON artifacts, screenshots, and logs

## Quick Start

Prerequisites
- Node.js 18+ LTS
- Ubuntu 20.04+ recommended (works on WSL/Ubuntu)

Install and run
```bash
# From project root
npm install
npm start
```
This builds and starts the MCP server using stdio transport. Use an MCP-capable client (e.g., an IDE integration or assistant) to call tools.

Development mode
```bash
npm run dev
```
Hot-reloads the server for local development.

## Analyze Your Local Site (127.0.0.1:8000)

Run your site
- Ensure your app is reachable at http://127.0.0.1:8000 (Django/DRF defaults to 8000).

Start the MCP server
```bash
npm start
```

Call tools from an MCP client
1) Autonomous setup
- Tool: autonomous_setup
- Example arguments:
  - browsers: ["chrome", "firefox"]
  - auto_install: true
  - optimize_for: "quality_analysis"
  - headless: true

2) One-shot comprehensive analysis
- Tool: comprehensive_analysis
- Example arguments:
  - url: "http://127.0.0.1:8000"
  - analysis_types: ["accessibility", "performance", "responsive", "cross_browser"]
  - viewports: ["mobile", "tablet", "desktop", "wide"]
  - generate_report: true
  - auto_annotations: true

3) Granular flow (optional)
- start_browser: { browser: "chrome", headless: true, viewport: { width: 1366, height: 768 }, enable_monitoring: true }
- navigate: { url: "http://127.0.0.1:8000", wait_for: "network_idle", timeout: 30000 }
- performance_audit: { url: "http://127.0.0.1:8000", generate_report: true }
- accessibility_audit: { url: "http://127.0.0.1:8000", annotate: true }
- capture_analysis: { url: "http://127.0.0.1:8000", viewport: "desktop" }

Notes
- The server communicates over stdio as an MCP server; it is not an HTTP API.
- Headless defaults to true. Set headless: false to observe browsers visually.

## Available Tools (API Reference)

The following tools are exposed by the server. Names and behavior are defined in the server implementation.

- autonomous_setup
  - Purpose: Prepare environment, install drivers, configure browsers
  - Args:
    - browsers: string[] (e.g., ["chrome", "firefox", "edge"]; default includes all)
    - auto_install: boolean (default: true)
    - optimize_for: "quality_analysis" | "speed" | "compatibility" (default: "quality_analysis")
    - headless: boolean (default: true)
  - Returns: { success, message, details, recommendations }

- start_browser
  - Purpose: Start and register a browser instance
  - Args:
    - browser: "chrome" | "firefox" | "edge" (required)
    - viewport: { width: number; height: number } (min 320x240)
    - headless: boolean (default: true)
    - enable_monitoring: boolean (default: true)
  - Returns: { success, browserId, browser, viewport, status }

- navigate
  - Purpose: Navigate to a URL with robust waiting
  - Args:
    - url: string (uri)
    - wait_for: "dom_ready" | "load_complete" | "network_idle" | "custom" (default: "dom_ready")
    - timeout: number (ms, 1000..60000)
  - Returns: { success, metrics?, status }

- comprehensive_analysis
  - Purpose: Full UI quality audit across performance, accessibility, responsive, and cross-browser checks
  - Typical Args:
    - url: string (uri)
    - analysis_types: string[] (e.g., ["accessibility", "performance", "responsive", "cross_browser"]) 
    - viewports: string[] or custom viewport sizes (e.g., ["mobile", "tablet", "desktop", "wide"]) 
    - generate_report: boolean
    - auto_annotations: boolean
  - Returns: AnalysisResult including qualityScore, recommendations, and artifacts

- find_element
  - Purpose: Enhanced element discovery with context
  - Args: { selector: string, strategy?: "css" | "xpath" | "id" | "className" | "name" | "tagName" }
  - Returns: { success, found, selector, elementInfo? }

- interact_element
  - Purpose: Interaction simulation with validation
  - Args: { selector: string, action: "click" | "hover" | ..., validate?: boolean }
  - Returns: { success, metrics }

- extract_content
  - Purpose: Extract and analyze page content
  - Args: { selector?: string, include_metadata?: boolean }
  - Returns: { success, content, analysis }

- capture_analysis
  - Purpose: Screenshot with annotations
  - Args: { url?: string, viewport?: string|{width:number;height:number}, annotations?: boolean }
  - Returns: { success, path, notes }

- performance_audit
  - Purpose: Measure Core Web Vitals and related metrics
  - Args: { url: string, generate_report?: boolean }
  - Returns: { success, performance, score }

- accessibility_audit
  - Purpose: Axe-core backed WCAG testing
  - Args: { url: string, annotate?: boolean }
  - Returns: { success, accessibility, violations }

Refer to src/server.ts for the authoritative schemas and behavior.

## Configuration

### Installation Methods

The Selenium MCP Server can be installed and configured in multiple ways depending on your editor and workflow preferences:

#### **Method 1: Direct GitHub Installation**
```bash
# Clone and install from GitHub
git clone https://github.com/DagiiM/selenium-mcp-server.git
cd selenium-mcp-server
npm install
npm start
```

#### **Method 2: NPM Package (when published)**
```bash
# Install from npm registry
npm install -g @eleso/selenium-mcp-server
selenium-mcp-server
```

#### **Method 3: NPX Direct from GitHub**
```bash
# Run directly from GitHub without local installation
npx git+https://github.com/DagiiM/selenium-mcp-server.git
```

### VSCode & MCP Configuration

For optimal development experience and to leverage the full capabilities of the Selenium MCP Server, configure your VSCode environment as follows:

#### **Option A: GitHub-based Configuration (Recommended)**
Add to your VSCode MCP settings or `.vscode/settings.json`:

```json
{
  "mcp.servers": {
    "selenium-mcp-server": {
      "command": "npx",
      "args": ["git+https://github.com/DagiiM/selenium-mcp-server.git"],
      "env": {},
      "autoStart": true
    }
  }
}
```

#### **Option B: Local Installation Configuration**
If you've cloned the repository locally:

```json
{
  "mcp.servers": {
    "selenium-mcp-server": {
      "command": "npm",
      "args": ["start"],
      "cwd": "./selenium-mcp-server",
      "env": {},
      "autoStart": true
    }
  }
}
```

#### **Option C: NPM Package Configuration**
When installed via npm:

```json
{
  "mcp.servers": {
    "selenium-mcp-server": {
      "command": "npx",
      "args": ["@eleso/selenium-mcp-server"],
      "env": {},
      "autoStart": true
    }
  }
}
```

#### **VSCode Extensions & Settings**
1.  **Required Extensions:**
    *   **MCP Extension:** Install the official MCP VSCode extension for seamless interaction
    *   **TypeScript and ESLint Extensions:** For code highlighting, linting, and type checking

2.  **Recommended VSCode Settings (settings.json):**
    ```json
    {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "eslint.validate": ["javascript", "typescript"],
        "typescript.tsdk": "node_modules/typescript/lib",
        "[typescript]": {
            "editor.defaultFormatter": "esbenp.prettier-vscode"
        },
        "[javascript]": {
            "editor.defaultFormatter": "esbenp.prettier-vscode"
        }
    }
    ```

### Trae Configuration

To integrate the Selenium MCP Server with Trae, choose one of the following configurations:

#### **Option A: GitHub Direct Installation (Recommended)**
Add to your Trae configuration file (`.trae/config.json`):

```json
{
  "mcpServers": {
    "SeleniumMCP": {
      "command": "npx",
      "args": ["git+https://github.com/DagiiM/selenium-mcp-server.git"],
      "env": {},
      "autoInstall": true,
      "autoStart": true
    }
  }
}
```

#### **Option B: Local Repository Configuration**
For local development or when you've cloned the repository:

```json
{
  "mcpServers": {
    "SeleniumMCP": {
      "command": "npm",
      "args": ["start"],
      "cwd": "./selenium-mcp-server",
      "env": {},
      "autoStart": true
    }
  }
}
```

#### **Option C: NPM Package Configuration**
When using the published npm package:

```json
{
  "mcpServers": {
    "SeleniumMCP": {
      "command": "npx",
      "args": ["@eleso/selenium-mcp-server"],
      "env": {},
      "autoInstall": true,
      "autoStart": true
    }
  }
}
```

### Advanced Configuration Options

#### **Custom Environment Variables**
```json
{
  "mcpServers": {
    "SeleniumMCP": {
      "command": "npx",
      "args": ["git+https://github.com/DagiiM/selenium-mcp-server.git"],
      "env": {
        "ANALYSIS_REPORT_DIR": "./custom-reports",
        "ANALYSIS_SCREENSHOT_DIR": "./custom-screenshots",
        "TEST_BASE_URL": "http://localhost:3000"
      },
      "autoStart": true
    }
  }
}
```

#### **Browser-Specific Configuration**
```json
{
  "mcpServers": {
    "SeleniumMCP": {
      "command": "npx",
      "args": ["git+https://github.com/DagiiM/selenium-mcp-server.git"],
      "env": {
        "DEFAULT_BROWSER": "chrome",
        "HEADLESS_MODE": "true",
        "ENABLE_MONITORING": "true"
      },
      "autoStart": true
    }
  }
}
```

### Environment variables (selected)
- TEST_BASE_URL: Centralized base URL for tests (default: https://example.com). Overrides integration tests’ target URL.
- ANALYSIS_REPORT_DIR: Output directory for analysis reports (default: ./reports/analysis)
- ANALYSIS_SCREENSHOT_DIR: Output directory for screenshots (default: ./reports/screenshots)
- Headless and browser-related options are provided via tool arguments rather than env in most cases.

TypeScript
- Strict TypeScript, ES modules, and ESM-aware Jest config.

Project scripts
```bash
npm run dev           # Start in watch mode (tsx)
npm run build         # Compile TypeScript to dist/
npm start             # Build (prestart) then run from dist/
npm run test:unit     # Unit tests
npm run test:integration  # Integration tests
npm test              # Full test suite
npm run lint          # ESLint on src/ and tests/
npm run type-check    # tsc --noEmit
npm run install:drivers # Install WebDrivers
```

## Reports & Artifacts
- Reports: ./reports/analysis
- Screenshots: ./reports/screenshots
- Logs: ./reports/logs
The server and tests ensure these directories exist; artifacts are generated when you request reports in tool calls.

## Development

Structure
```
src/
  core/
    autonomous-setup.ts
    browser-orchestrator.ts
    ui-analysis-engine.ts
  server.ts
  types/
    index.ts

tests/
  unit/
  integration/
  config/
```

Guidelines
- Minimal dependencies, first-principles architecture
- Comprehensive tests for new features
- Keep tools’ input/output stable and documented
- Ensure artifacts are reproducible and paths are centralized

## Testing

Run tests
```bash
npm test
```
Scope
- Unit tests: core logic and utilities
- Integration tests: end-to-end flows and tool behavior

Override test target URL
```bash
TEST_BASE_URL="http://127.0.0.1:8000" npm test
```

## System Requirements
- OS: Ubuntu 20.04+ (WSL/Ubuntu supported)
- Node.js: 18+
- RAM: 4GB+ for multi-browser analysis
- Browsers: Chrome/Chromium, Firefox, Edge (latest stable)

## Troubleshooting

WebDriver installation fails
```bash
npm run install:drivers
# or install with apt for chromium and firefox drivers
sudo apt-get update
sudo apt-get install chromium-chromedriver firefox-geckodriver
```

Browser crashes or runs out of memory
- Reduce parallelism; run fewer concurrent browsers
- Use headless: true for stability
- Ensure swap is configured if RAM is limited

Navigation or analysis timeouts
- Increase timeout in tool args (e.g., navigate.timeout)
- Verify the target URL is reachable from the environment
- Check network conditions and content security policies

## FAQ

Is this an HTTP server?
- No. It is an MCP server over stdio. Use an MCP-compatible client to call tools.

Can it run against localhost sites?
- Yes. Use http://127.0.0.1:8000 (or http://localhost:8000) and ensure it’s reachable from the server environment.

Where are reports stored?
- ./reports/analysis by default, alongside screenshots and logs under ./reports/.

How do I change test target URLs?
- Set TEST_BASE_URL before running tests. Tests use a single source of truth.

## License & Support

License: MIT (see LICENSE)

Support
- Email: support@ifinsta.com
- Issues: https://github.com/eleso/selenium-mcp-server/issues

Maintained by Eleso Solutions.