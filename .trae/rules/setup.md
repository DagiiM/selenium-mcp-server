# Selenium MCP Server - Comprehensive Setup Guide

## Table of Contents
1. [System Prerequisites](#system-prerequisites)
2. [Quick Start Installation](#quick-start-installation)
3. [Detailed Setup Process](#detailed-setup-process)
4. [Project Structure](#project-structure)
5. [Core Implementation](#core-implementation)
6. [Configuration Management](#configuration-management)
7. [Testing & Validation](#testing--validation)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Advanced Configuration](#advanced-configuration)

## System Prerequisites

### Minimum Requirements
- **Operating System**: Ubuntu 20.04 LTS or newer (WSL2 supported for Windows)
- **Node.js**: Version 18.0.0 or higher (LTS recommended)
- **RAM**: 4GB minimum, 8GB recommended for multi-browser testing
- **Storage**: 2GB free space for browsers and drivers
- **Network**: Stable internet connection for initial setup

### Pre-Installation Checklist
```bash
# Check Ubuntu version
lsb_release -a

# Check Node.js version
node --version

# Check npm version
npm --version

# Check available memory
free -h

# Check disk space
df -h
```

## Quick Start Installation

### One-Command Setup (Recommended)
```bash
# Clone and setup in one command
curl -sSL https://raw.githubusercontent.com/your-org/selenium-mcp/main/setup.sh | bash
```

### Manual Quick Start
```bash
# 1. Create project directory
mkdir selenium-mcp-server && cd selenium-mcp-server

# 2. Initialize npm project
npm init -y

# 3. Install core dependencies
npm install selenium-webdriver @modelcontextprotocol/sdk axios sharp

# 4. Install development dependencies
npm install --save-dev @types/node typescript eslint prettier jest

# 5. Run autonomous setup
npm run setup:autonomous
```

## Detailed Setup Process

### Step 1: Environment Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential build tools
sudo apt install -y curl wget git build-essential

# Install required system libraries
sudo apt install -y \
    libgconf-2-4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libgbm1 \
    libnss3 \
    libxss1 \
    libasound2 \
    fonts-liberation \
    libappindicator3-1 \
    xdg-utils

# Install Node.js via NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 2: Project Initialization

```bash
# Create project structure
mkdir -p selenium-mcp-server/{src,tests,config,drivers,logs,reports}
cd selenium-mcp-server

# Initialize package.json with proper configuration
cat > package.json << 'EOF'
{
  "name": "selenium-mcp-server",
  "version": "1.0.0",
  "description": "Autonomous Selenium MCP Server for UI Analysis",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "setup:autonomous": "node scripts/autonomous-setup.js",
    "start": "node dist/index.js",
    "dev": "nodemon src/index.js",
    "build": "tsc",
    "test": "jest",
    "test:integration": "jest --testPathPattern=integration",
    "lint": "eslint src/**/*.js",
    "format": "prettier --write src/**/*.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF
```

### Step 3: Dependencies Installation

```bash
# Core dependencies
npm install \
  selenium-webdriver@^4.15.0 \
  @modelcontextprotocol/sdk@latest \
  chromedriver@latest \
  geckodriver@latest \
  edgedriver@latest \
  axios@^1.6.0 \
  sharp@^0.33.0 \
  axe-core@^4.8.0 \
  lighthouse@^11.0.0 \
  puppeteer-core@^21.0.0

# Development dependencies
npm install --save-dev \
  @types/node@^20.0.0 \
  @types/selenium-webdriver@^4.1.0 \
  typescript@^5.0.0 \
  nodemon@^3.0.0 \
  jest@^29.0.0 \
  eslint@^8.0.0 \
  prettier@^3.0.0 \
  winston@^3.11.0
```

### Step 4: Browser Installation

```bash
# Install Google Chrome
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt update
sudo apt install -y google-chrome-stable

# Install Firefox
sudo apt install -y firefox

# Install Microsoft Edge (optional)
curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
sudo install -o root -g root -m 644 microsoft.gpg /etc/apt/trusted.gpg.d/
sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/microsoft.gpg] https://packages.microsoft.com/repos/edge stable main" > /etc/apt/sources.list.d/microsoft-edge-dev.list'
sudo apt update
sudo apt install -y microsoft-edge-stable

# Verify installations
google-chrome --version
firefox --version
microsoft-edge --version 2>/dev/null || echo "Edge not installed"
```

## Project Structure

```
selenium-mcp-server/
├── src/
│   ├── index.js                 # Main MCP server entry point
│   ├── server.js                 # MCP server implementation
│   ├── tools/
│   │   ├── autonomous-setup.js  # Self-initializing setup tool
│   │   ├── browser-manager.js   # Browser lifecycle management
│   │   ├── navigation.js        # Smart navigation tool
│   │   ├── analysis.js          # Comprehensive analysis tool
│   │   ├── element-finder.js    # Enhanced element discovery
│   │   ├── interaction.js       # Intelligent interaction
│   │   ├── content-extractor.js # Advanced content extraction
│   │   ├── screenshot.js        # Capture and analysis tool
│   │   ├── performance.js       # Performance audit tool
│   │   └── accessibility.js     # Accessibility audit tool
│   ├── core/
│   │   ├── driver-manager.js    # WebDriver management
│   │   ├── browser-factory.js   # Multi-browser factory
│   │   ├── resource-monitor.js  # Resource optimization
│   │   └── self-healing.js      # Auto-recovery system
│   ├── analysis/
│   │   ├── quality-scorer.js    # Quality scoring algorithms
│   │   ├── recommendation.js    # Recommendation engine
│   │   ├── visual-analysis.js   # Visual regression detection
│   │   └── report-generator.js  # Report generation
│   └── utils/
│       ├── logger.js            # Logging utilities
│       ├── config.js            # Configuration management
│       ├── validators.js        # Input validation
│       └── helpers.js           # Helper functions
├── config/
│   ├── default.json            # Default configuration
│   ├── development.json        # Development settings
│   └── production.json         # Production settings
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── e2e/                    # End-to-end tests
├── scripts/
│   ├── autonomous-setup.js    # Autonomous setup script
│   ├── health-check.js        # System health check
│   └── cleanup.js              # Resource cleanup
├── drivers/                   # WebDriver storage
├── logs/                       # Application logs
├── reports/                    # Analysis reports
├── .env.example               # Environment variables template
├── .eslintrc.json            # ESLint configuration
├── .prettierrc               # Prettier configuration
├── jest.config.js            # Jest configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Project documentation
```

## Core Implementation

### Main Server Implementation (src/index.js)

```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { AutonomousSetup } from './tools/autonomous-setup.js';
import { BrowserManager } from './tools/browser-manager.js';
import { ComprehensiveAnalysis } from './tools/analysis.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('MCP-Server');

class SeleniumMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'selenium-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.browserManager = new BrowserManager();
    this.setupTools();
  }

  setupTools() {
    // Autonomous Setup Tool
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        switch (name) {
          case 'autonomous_setup':
            return await AutonomousSetup.initialize(args);
          
          case 'start_browser':
            return await this.browserManager.startBrowser(args);
          
          case 'comprehensive_analysis':
            return await ComprehensiveAnalysis.analyze(args);
          
          // Add other tools here
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error(`Tool execution failed: ${error.message}`);
        throw error;
      }
    });

    // List available tools
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'autonomous_setup',
            description: 'Self-initializing environment setup',
            inputSchema: {
              type: 'object',
              properties: {
                browsers: { type: 'array', items: { type: 'string' } },
                auto_install: { type: 'boolean' },
                optimize_for: { type: 'string' }
              }
            }
          },
          // Define other tools
        ]
      };
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Selenium MCP Server started successfully');
  }
}

// Start the server
const server = new SeleniumMCPServer();
server.start().catch(console.error);
```

### Autonomous Setup Implementation (src/tools/autonomous-setup.js)

```javascript
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const execAsync = promisify(exec);

export class AutonomousSetup {
  static async initialize(options = {}) {
    const config = {
      browsers: options.browsers || ['chrome', 'firefox'],
      auto_install: options.auto_install !== false,
      optimize_for: options.optimize_for || 'quality_analysis',
      ...options
    };

    const results = {
      environment: await this.checkEnvironment(),
      browsers: {},
      drivers: {},
      validation: {}
    };

    // Install browsers if needed
    if (config.auto_install) {
      for (const browser of config.browsers) {
        results.browsers[browser] = await this.installBrowser(browser);
        results.drivers[browser] = await this.installDriver(browser);
      }
    }

    // Validate setup
    results.validation = await this.validateSetup(config.browsers);
    
    // Apply optimizations
    await this.applyOptimizations(config.optimize_for);

    return {
      success: Object.values(results.validation).every(v => v.ready),
      results,
      recommendations: this.generateRecommendations(results)
    };
  }

  static async checkEnvironment() {
    const checks = {};
    
    // Check Node.js version
    const { stdout: nodeVersion } = await execAsync('node --version');
    checks.nodejs = {
      version: nodeVersion.trim(),
      valid: parseFloat(nodeVersion.slice(1)) >= 18
    };

    // Check system resources
    const { stdout: memInfo } = await execAsync('free -b');
    const totalMem = parseInt(memInfo.split('\n')[1].split(/\s+/)[1]);
    checks.memory = {
      total: Math.round(totalMem / (1024 * 1024 * 1024)) + 'GB',
      sufficient: totalMem >= 4 * 1024 * 1024 * 1024
    };

    // Check required system packages
    const packages = ['curl', 'wget', 'git'];
    for (const pkg of packages) {
      try {
        await execAsync(`which ${pkg}`);
        checks[pkg] = true;
      } catch {
        checks[pkg] = false;
      }
    }

    return checks;
  }

  static async installBrowser(browserName) {
    try {
      switch (browserName) {
        case 'chrome':
          // Check if already installed
          try {
            await execAsync('google-chrome --version');
            return { installed: true, version: 'existing' };
          } catch {
            // Install Chrome
            await execAsync(`
              wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
              sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
              sudo apt update
              sudo apt install -y google-chrome-stable
            `);
            return { installed: true, version: 'latest' };
          }

        case 'firefox':
          try {
            await execAsync('firefox --version');
            return { installed: true, version: 'existing' };
          } catch {
            await execAsync('sudo apt install -y firefox');
            return { installed: true, version: 'latest' };
          }

        case 'edge':
          try {
            await execAsync('microsoft-edge --version');
            return { installed: true, version: 'existing' };
          } catch {
            // Edge installation commands
            return { installed: false, reason: 'Manual installation required' };
          }

        default:
          return { installed: false, reason: 'Unknown browser' };
      }
    } catch (error) {
      return { installed: false, error: error.message };
    }
  }

  static async installDriver(browserName) {
    const driversDir = path.join(process.cwd(), 'drivers');
    await fs.mkdir(driversDir, { recursive: true });

    try {
      switch (browserName) {
        case 'chrome':
          // Get Chrome version
          const { stdout: chromeVersion } = await execAsync('google-chrome --version');
          const version = chromeVersion.match(/\d+\.\d+\.\d+/)[0];
          const majorVersion = version.split('.')[0];

          // Download matching ChromeDriver
          const driverUrl = `https://chromedriver.storage.googleapis.com/LATEST_RELEASE_${majorVersion}`;
          const { data: driverVersion } = await axios.get(driverUrl);
          
          const downloadUrl = `https://chromedriver.storage.googleapis.com/${driverVersion}/chromedriver_linux64.zip`;
          const driverPath = path.join(driversDir, 'chromedriver.zip');
          
          // Download and extract
          await execAsync(`
            cd ${driversDir}
            wget -O chromedriver.zip ${downloadUrl}
            unzip -o chromedriver.zip
            chmod +x chromedriver
            rm chromedriver.zip
          `);

          return { installed: true, version: driverVersion, path: path.join(driversDir, 'chromedriver') };

        case 'firefox':
          // Get latest GeckoDriver
          const { data: releases } = await axios.get('https://api.github.com/repos/mozilla/geckodriver/releases/latest');
          const asset = releases.assets.find(a => a.name.includes('linux64.tar.gz'));
          
          await execAsync(`
            cd ${driversDir}
            wget -O geckodriver.tar.gz ${asset.browser_download_url}
            tar -xzf geckodriver.tar.gz
            chmod +x geckodriver
            rm geckodriver.tar.gz
          `);

          return { installed: true, version: releases.tag_name, path: path.join(driversDir, 'geckodriver') };

        default:
          return { installed: false, reason: 'Driver not supported' };
      }
    } catch (error) {
      return { installed: false, error: error.message };
    }
  }

  static async validateSetup(browsers) {
    const validation = {};

    for (const browser of browsers) {
      validation[browser] = {
        browser: false,
        driver: false,
        connectivity: false,
        ready: false
      };

      try {
        // Check browser
        switch (browser) {
          case 'chrome':
            await execAsync('google-chrome --version');
            validation[browser].browser = true;
            break;
          case 'firefox':
            await execAsync('firefox --version');
            validation[browser].browser = true;
            break;
        }

        // Check driver
        const driverPath = path.join(process.cwd(), 'drivers', browser === 'chrome' ? 'chromedriver' : 'geckodriver');
        await fs.access(driverPath);
        validation[browser].driver = true;

        // Test connectivity
        const { Builder } = await import('selenium-webdriver');
        const driver = await new Builder().forBrowser(browser).build();
        await driver.get('https://www.google.com');
        await driver.quit();
        validation[browser].connectivity = true;
        validation[browser].ready = true;
      } catch (error) {
        validation[browser].error = error.message;
      }
    }

    return validation;
  }

  static async applyOptimizations(optimizeFor) {
    const optimizations = {
      quality_analysis: {
        'webdriver.chrome.args': ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
        'webdriver.firefox.profile': { 'dom.webdriver.enabled': false }
      },
      speed: {
        'webdriver.chrome.args': ['--headless', '--disable-images', '--disable-javascript'],
        'webdriver.firefox.profile': { 'permissions.default.image': 2 }
      },
      compatibility: {
        'webdriver.chrome.args': ['--disable-blink-features=AutomationControlled'],
        'webdriver.firefox.profile': { 'general.useragent.override': 'Mozilla/5.0' }
      }
    };

    const config = optimizations[optimizeFor] || optimizations.quality_analysis;
    
    // Save optimization config
    await fs.writeFile(
      path.join(process.cwd(), 'config', 'browser-optimizations.json'),
      JSON.stringify(config, null, 2)
    );

    return config;
  }

  static generateRecommendations(results) {
    const recommendations = [];

    // Check memory
    if (!results.environment.memory.sufficient) {
      recommendations.push({
        type: 'warning',
        message: 'System has less than 4GB RAM. Consider closing other applications during testing.',
        priority: 'medium'
      });
    }

    // Check browser installations
    for (const [browser, status] of Object.entries(results.browsers)) {
      if (!status.installed) {
        recommendations.push({
          type: 'error',
          message: `Failed to install ${browser}: ${status.error || status.reason}`,
          priority: 'high',
          action: `Manual installation required for ${browser}`
        });
      }
    }

    // Check driver installations
    for (const [browser, status] of Object.entries(results.drivers)) {
      if (!status.installed) {
        recommendations.push({
          type: 'error',
          message: `Failed to install ${browser} driver: ${status.error || status.reason}`,
          priority: 'high',
          action: `Download driver manually from official repository`
        });
      }
    }

    return recommendations;
  }
}
```

## Testing & Validation

### Unit Tests
```bash
# Run all unit tests
npm test

# Run specific test suite
npm test -- --testPathPattern=unit

# Run with coverage
npm test -- --coverage
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration

# Test specific browser integration
npm run test:integration -- --browser=chrome
```

### End-to-End Tests
```bash
# Run full e2e test suite
npm run test:e2e

# Test with specific configuration
npm run test:e2e -- --config=development.json
```

### Health Check
```bash
# System health validation
node scripts/health-check.js

# Browser connectivity test
node scripts/health-check.js --test-browsers
```

## Production Deployment

### Environment Setup
```bash
# Set production environment
export NODE_ENV=production

# Use production configuration
cp config/production.json config/active.json

# Install production dependencies only
npm ci --only=production
```

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    firefox \
    xvfb

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S selenium && \
    adduser -S selenium -u 1001

USER selenium

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Systemd Service
```ini
[Unit]
Description=Selenium MCP Server
After=network.target

[Service]
Type=simple
User=selenium
WorkingDirectory=/opt/selenium-mcp-server
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## Troubleshooting Guide

### Common Issues

**1. Browser Installation Fails**
```bash
# Check system dependencies
sudo apt update
sudo apt install -y libgconf-2-4 libatk1.0-0 libgtk-3-0

# Manual browser installation
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo apt update
sudo apt install google-chrome-stable
```

**2. Driver Version Mismatch**
```bash
# Auto-update drivers
node scripts/update-drivers.js

# Manual driver download
# Visit https://chromedriver.chromium.org/ for Chrome
# Visit https://github.com/mozilla/geckodriver/releases for Firefox
```

**3. Memory Issues**
```bash
# Check available memory
free -h

# Reduce parallel browser instances
# Edit config/production.json: browsers.parallel_limit = 1

# Use headless mode
# Set optimize_for: 'speed' in autonomous_setup
```

**4. Permission Errors**
```bash
# Fix driver permissions
chmod +x drivers/chromedriver
chmod +x drivers/geckodriver

# Create required directories
mkdir -p logs reports drivers
```

### Log Analysis
```bash
# View recent logs
tail -f logs/selenium-mcp.log

# Search for errors
grep -i error logs/selenium-mcp.log

# Check browser-specific logs
grep -i chrome logs/selenium-mcp.log
```

## Advanced Configuration

### Custom Browser Profiles
```javascript
// config/custom-profiles.json
{
  "chrome_profile": {
    "prefs": {
      "profile.default_content_setting_values.images": 2,
      "profile.managed_default_content_settings.stylesheets": 2
    }
  },
  "firefox_profile": {
    "prefs": {
      "permissions.default.image": 2,
      "javascript.enabled": false
    }
  }
}
```

### Proxy Configuration
```javascript
// config/proxy.json
{
  "proxy": {
    "type": "manual",
    "http": "http://proxy.example.com:8080",
    "https": "https://proxy.example.com:8080",
    "bypass": ["localhost", "127.0.0.1"]
  }
}
```

### Performance Tuning
```javascript
// config/performance.json
{
  "performance": {
    "max_concurrent_analyses": 3,
    "page_load_timeout": 45000,
    "element_wait_timeout": 15000,
    "memory_limit_mb": 2048,
    "cpu_limit_percent": 80
  }
}
```

### Security Configuration
```javascript
// config/security.json
{
  "security": {
    "enable_sandbox": true,
    "disable_dev_shm": true,
    "disable_gpu": true,
    "user_agent_rotation": true,
    "ssl_verify": true
  }
}
```

## Monitoring and Maintenance

### Health Monitoring
```bash
# Setup cron job for health checks
crontab -e
# Add: */30 * * * * /usr/bin/node /opt/selenium-mcp-server/scripts/health-check.js

# Monitor resource usage
htop
iotop
```

### Log Rotation
```bash
# Configure logrotate
sudo tee /etc/logrotate.d/selenium-mcp << EOF
/opt/selenium-mcp-server/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 selenium selenium
}
EOF
```

### Performance Monitoring
```bash
# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/health

# Browser performance metrics
grep "performance" logs/selenium-mcp.log | tail -20
```

This completes the comprehensive setup guide for the Selenium MCP Server, providing all necessary information for installation, configuration, deployment, and maintenance of the autonomous UI analysis system.

## Configuration Management

### Default Configuration (config/default.json)

```json
{
  "server": {
    "port": 3000,
    "host": "localhost",
    "timeout": 30000
  },
  "browsers": {
    "default": "chrome",
    "available": ["chrome", "firefox", "edge"],
    "parallel_limit": 2
  },
  "selenium": {
    "implicit_wait": 10000,
    "page_load_timeout": 30000,
    "script_timeout": 30000
  },
  "analysis": {
    "viewport_sizes": {
      "mobile": { "width": 375, "height": 667 },
      "tablet": { "width": 768, "height": 1024 },
      "desktop": { "width": 1920, "height": 1080 },
      "wide": { "width": 2560, "height": 1440 }
    },
    "performance_thresholds": {
      "fcp": 1800,
      "lcp": 2500,
      "cls": 0.1,
      "fid": 100
    },
    "accessibility_level": "AA"
  },
  "logging": {
    "level": "info",
    "file": "logs/selenium-mcp.log",
    "max_size": "10m",
    "max_files": 5
  },
  "reports": {
    "output_dir": "reports",
    "format": ["json", "html"],
    "include_screenshots": true,
    "include_videos": false
  }
}
      "mobile": { "width": 375, "height": 667 },
      "tablet": { "width": 768, "height": 1024 },
      "desktop": { "width": 1920, "height": 1080 },
      "wide": { "width": 2560, "height": 1440 }
    },
    "performance_thresholds": {
      "fcp": 1800,
      "lcp": 2500,
      "cls": 0.1,
      "fid": 100
    },
    "accessibility_level": "AA"
  },
  "logging": {
    "level": "info",
    "file": "logs/selenium-mcp.log",
    "max_size": "10m",
    "max_files": 5
  },
  "reports": {
    "output_dir": "reports",
    "format": ["json", "html"],
    "include_screenshots": true,
    "include_videos": false
  }
}
```

### Environment Variables (.env)

```bash
# Server Configuration
NODE_ENV=development
MCP_SERVER_PORT=3000
MCP_SERVER_HOST=localhost

# Browser Configuration
DEFAULT_BROWSER=chrome
HEADLESS_MODE=false
BROWSER_TIMEOUT=30000

# Driver Paths (optional, auto-detected if not set)
CHROME_DRIVER_PATH=./drivers/chromedriver
GECKO_DRIVER_PATH=./drivers/geckodriver
EDGE_DRIVER_PATH=./drivers/msedgedriver

# Analysis Configuration
ENABLE_ACCESSIBILITY_AUDIT=true
ENABLE_PERFORMANCE_AUDIT=true
ENABLE_VISUAL_REGRESSION=true

# Resource Limits
MAX_BROWSER_INSTANCES=2
MAX_MEMORY_MB=2048
MAX_CPU_PERCENT=80

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_FILE_PATH=./logs/selenium-mcp.log

# External Services (optional)
LIGHTHOUSE_API_KEY=
AXE_CORE_VERSION=4.8.0
```

## Testing & Validation

### Unit Test Example (tests/unit/autonomous-setup.test.js)

```javascript
import { AutonomousSetup } from '../../src/tools/autonomous-setup.js';
import { jest } from '@jest/globals';

describe('AutonomousSetup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should check environment successfully', async () => {
    const result = await AutonomousSetup.checkEnvironment();
    
    expect(result).toHaveProperty('nodejs');
    expect(result).toHaveProperty('memory');
    expect(result.nodejs.valid).toBe(true);
  });

  test('should validate browser installation', async () => {
    const validation = await AutonomousSetup.validateSetup(['chrome']);
    
    expect(validation).toHaveProperty('chrome');
    expect(validation.chrome).toHaveProperty('browser');
    expect(validation.chrome).toHaveProperty('driver');
  });

  test('should generate appropriate recommendations', () => {
    const mockResults = {
      environment: { memory: { sufficient: false } },
      browsers: { chrome: { installed: false, error: 'Test error' } },
      drivers: {}
    };

    const recommendations = AutonomousSetup.generateRecommendations(mockResults);
    
    expect(recommendations).toHaveLength(2);
    expect(recommendations[0].type).toBe('warning');
    expect(recommendations[1].type).toBe('error');
  });
});
```

### Integration Test Example (tests/integration/browser-lifecycle.test.js)

```javascript
import { BrowserManager } from '../../src/tools/browser-manager.js';
import { ComprehensiveAnalysis } from '../../src/tools/analysis.js';

describe('Browser Lifecycle Integration', () => {
  let browserManager;
  let driver;

  beforeAll(async () => {
    browserManager = new BrowserManager();
  });

  afterEach(async () => {
    if (driver) {
      await driver.quit();
      driver = null;
    }
  });

  test('should start browser and perform analysis', async () => {
    // Start browser
    const result = await browserManager.startBrowser({
      browser: 'chrome',
      headless: true
    });
    
    expect(result.success).toBe(true);
    driver = result.driver;

    // Navigate to test page
    await driver.get('https://example.com');

    // Perform analysis
    const analysis = await ComprehensiveAnalysis.analyze({
      driver,
      analysis_types: ['accessibility', 'performance']
    });

    expect(analysis).toHaveProperty('quality_score');
    expect(analysis.quality_score).toBeGreaterThanOrEqual(0);
    expect(analysis.quality_score).toBeLessThanOrEqual(100);
  });
});
```

### Health Check Script (scripts/health-check.js)

```javascript
#!/usr/bin/env node

import { AutonomousSetup } from '../src/tools/autonomous-setup.js';
import chalk from 'chalk';

async function healthCheck() {
  console.log(chalk.blue('🔍 Running System Health Check...\n'));

  // Check environment
  console.log(chalk.yellow('Checking environment...'));
  const env = await AutonomousSetup.checkEnvironment();
  
  for (const [key, value] of Object.entries(env)) {
    const status = value.valid || value === true ? '✅' : '❌';
    console.log(`  ${status} ${key}: ${JSON.stringify(value)}`);
  }

  // Validate setup
  console.log(chalk.yellow('\nValidating browser setup...'));
  const validation = await AutonomousSetup.validateSetup(['chrome', 'firefox']);
  
  for (const [browser, status] of Object.entries(validation)) {
    console.log(`\n  ${browser}:`);
    console.log(`    Browser: ${status.browser ? '✅' : '❌'}`);
    console.log(`    Driver: ${status.driver ? '✅' : '❌'}`);
    console.log(`    Connectivity: ${status.connectivity ? '✅' : '❌'}`);
    if (status.error) {
      console.log(chalk.red(`    Error: ${status.error}`));
    }
  }

  // Overall status
  const allValid = Object.values(validation).every(v => v.ready);
  if (allValid) {
    console.log(chalk.green('\n✅ System is healthy and ready!'));
  } else {
    console.log(chalk.red('\n❌ System needs attention. Run autonomous setup:'));
    console.log(chalk.cyan('  npm run setup:autonomous'));
  }
}

healthCheck().catch(console.error);
```

## Production Deployment

### Docker Configuration (Dockerfile)

```dockerfile
FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Install Firefox
RUN apt-get update && apt-get install -y firefox-esr && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Run autonomous setup
RUN npm run setup:autonomous

# Create non-root user
RUN groupadd -r selenium && useradd -r -g selenium -G audio,video selenium \
    && mkdir -p /home/selenium/Downloads \
    && chown -R selenium:selenium /home/selenium \
    && chown -R selenium:selenium /app

USER selenium

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose Configuration (docker-compose.yml)

```yaml
version: '3.8'

services:
  selenium-mcp:
    build: .
    container_name: selenium-mcp-server
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - HEADLESS_MODE=true
      - MAX_BROWSER_INSTANCES=3
    volumes:
      - ./reports:/app/reports
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test