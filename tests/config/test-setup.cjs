/**
 * Test setup and configuration for Selenium MCP Server tests.
 */

const path = require('path');
const fs = require('fs/promises');

// Centralized base URL for tests (can be overridden by environment)
process.env.TEST_BASE_URL = process.env.TEST_BASE_URL || 'https://example.com';

/**
 * Global test setup that runs before all tests.
 */
beforeAll(async () => {
  // Create test directories if they don't exist
  const testDirs = [
    'tests/fixtures',
    'tests/temp',
    'reports/screenshots',
    'reports/logs',
    'reports/analysis'
  ];

  for (const dir of testDirs) {
    try {
      await fs.mkdir(path.join(process.cwd(), dir), { recursive: true });
    } catch (error) {
      // Directory might already exist, which is fine
    }
  }

  // Set longer timeout for integration tests
  jest.setTimeout(30000);
});

/**
 * Global test teardown that runs after all tests.
 */
afterAll(async () => {
  // Clean up temporary test files
  try {
    const tempDir = path.join(process.cwd(), 'tests/temp');
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    // Cleanup errors are not critical
  }
});

/**
 * Mock console methods to reduce noise in test output.
 */
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {}
  };
}

/**
 * Mock performance timing APIs for consistent testing.
 */
global.performance = {
  ...global.performance,
  now: () => Date.now(),
  mark: () => {},
  measure: () => {},
  getEntriesByType: () => [],
  getEntriesByName: () => []
};

/**
 * Mock WebDriver implementation
 */
global.webdriver = {
  Builder: jest.fn().mockImplementation(() => ({
    forBrowser: jest.fn().mockReturnThis(),
    setChromeOptions: jest.fn().mockReturnThis(),
    setFirefoxOptions: jest.fn().mockReturnThis(),
    setEdgeOptions: jest.fn().mockReturnThis(),
    build: jest.fn().mockResolvedValue({
      get: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      takeScreenshot: jest.fn().mockResolvedValue('base64screenshot'),
      executeScript: jest.fn().mockResolvedValue({}),
      findElement: jest.fn().mockResolvedValue({
        click: jest.fn().mockResolvedValue(undefined),
        getText: jest.fn().mockResolvedValue('test text'),
        getTagName: jest.fn().mockResolvedValue('div'),
        isDisplayed: jest.fn().mockResolvedValue(true),
        isEnabled: jest.fn().mockResolvedValue(true),
        getAttribute: jest.fn().mockResolvedValue('test value'),
        getRect: jest.fn().mockResolvedValue({ x: 0, y: 0, width: 100, height: 100 })
      }),
      wait: jest.fn().mockResolvedValue(undefined),
      sleep: jest.fn().mockResolvedValue(undefined),
      getCapabilities: jest.fn().mockResolvedValue(new Map([
        ['browserName', 'chrome'],
        ['browserVersion', '120.0.0.0']
      ])),
      manage: jest.fn().mockReturnValue({
        window: jest.fn().mockReturnValue({
          setRect: jest.fn().mockResolvedValue(undefined),
          getRect: jest.fn().mockResolvedValue({ width: 1920, height: 1080 })
        })
      }),
      actions: jest.fn().mockReturnValue({
        move: jest.fn().mockReturnValue({ perform: jest.fn().mockResolvedValue(undefined) }),
        contextClick: jest.fn().mockReturnValue({ perform: jest.fn().mockResolvedValue(undefined) })
      })
    })
  })),
};

/**
 * Enhanced error handling for unhandled promise rejections.
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

/**
 * Mock WebDriver for testing without actual browser instances.
 */
jest.mock('selenium-webdriver', () => {
  const mockDriver = {
    get: jest.fn().mockResolvedValue(undefined),
    getTitle: jest.fn().mockResolvedValue('Test Page'),
    getCurrentUrl: jest.fn().mockResolvedValue('https://example.com'),
    quit: jest.fn().mockResolvedValue(undefined),
    takeScreenshot: jest.fn().mockResolvedValue('base64screenshot'),
    executeScript: jest.fn().mockImplementation((script) => {
       if (script.includes('performance.getEntriesByType')) {
         return Promise.resolve({
           navigation: [{
             fetchStart: 1000,
             responseStart: 1100,
             domContentLoadedEventEnd: 1500,
             loadEventEnd: 2000,
             domInteractive: 1400
           }],
           paint: [{
             name: 'first-contentful-paint',
             startTime: 1200
           }],
           'largest-contentful-paint': [{
             startTime: 1800
           }],
           'layout-shift': [{
             value: 0.05
           }],
           resource: [{
             transferSize: 1000
           }],
           measure: []
         });
       }
       if (script.includes('document.readyState')) {
         return Promise.resolve('complete');
       }
      if (script.includes('axe.run')) {
        return Promise.resolve({
          violations: [],
          passes: [],
          incomplete: [],
          inapplicable: []
        });
      }
      if (script.includes('layout-shift-elements')) {
        return Promise.resolve([]);
      }
      if (script.includes('color-contrast-analysis')) {
        return Promise.resolve({
          contrastIssues: [],
          colorBlindIssues: []
        });
      }
      if (script.includes('typography-analysis')) {
        return Promise.resolve({
          fontSizeIssues: [],
          lineHeightIssues: [],
          fontLoadingIssues: []
        });
      }
      if (script.includes('spacing-analysis')) {
        return Promise.resolve({
          spacingIssues: [],
          touchTargetIssues: []
        });
      }
      return Promise.resolve({});
    }),
    executeAsyncScript: jest.fn().mockImplementation((script) => {
      if (script.includes('axe.run')) {
        return Promise.resolve({
          violations: [],
          passes: [],
          incomplete: [],
          inapplicable: []
        });
      }
      return Promise.resolve({});
    }),
    findElement: jest.fn().mockResolvedValue({
      click: jest.fn().mockResolvedValue(undefined),
      getText: jest.fn().mockResolvedValue('Test Element'),
      getAttribute: jest.fn().mockResolvedValue('test-value')
    }),
    findElements: jest.fn().mockResolvedValue([]),
    wait: jest.fn().mockReturnValue({
      until: jest.fn().mockResolvedValue(true)
    }),
    sleep: jest.fn().mockResolvedValue(undefined),
    manage: jest.fn().mockReturnValue({
      window: jest.fn().mockReturnValue({
        setRect: jest.fn().mockResolvedValue(undefined),
        getRect: jest.fn().mockResolvedValue({ width: 1920, height: 1080 })
      }),
      logs: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue([])
      })
    }),
    getCapabilities: jest.fn().mockResolvedValue({
      has: jest.fn().mockReturnValue(true),
      get: jest.fn().mockReturnValue('mocked-value')
    })
  };

  return {
    Builder: jest.fn().mockImplementation(() => ({
      forBrowser: jest.fn().mockReturnThis(),
      setChromeOptions: jest.fn().mockReturnThis(),
      setFirefoxOptions: jest.fn().mockReturnThis(),
      setEdgeOptions: jest.fn().mockReturnThis(),
      withCapabilities: jest.fn().mockReturnThis(),
      build: jest.fn().mockResolvedValue(mockDriver)
    })),
    Browser: {
      CHROME: 'chrome',
      FIREFOX: 'firefox',
      EDGE: 'edge'
    },
    By: {
      id: jest.fn((id) => ({ using: 'id', value: id })),
      className: jest.fn((className) => ({ using: 'class name', value: className })),
      css: jest.fn((css) => ({ using: 'css selector', value: css })),
      xpath: jest.fn((xpath) => ({ using: 'xpath', value: xpath })),
      tagName: jest.fn((tagName) => ({ using: 'tag name', value: tagName })),
      linkText: jest.fn((text) => ({ using: 'link text', value: text })),
      partialLinkText: jest.fn((text) => ({ using: 'partial link text', value: text })),
      name: jest.fn((name) => ({ using: 'name', value: name }))
    },
    until: {
      titleIs: jest.fn(),
      elementLocated: jest.fn(),
      elementIsVisible: jest.fn()
    },
    Capabilities: jest.fn().mockImplementation((caps) => caps),
    ChromeOptions: jest.fn().mockImplementation(() => ({
      addArguments: jest.fn().mockReturnThis()
    })),
    FirefoxOptions: jest.fn().mockImplementation(() => ({
      addArguments: jest.fn().mockReturnThis()
    })),
    EdgeOptions: jest.fn().mockImplementation(() => ({
      addArguments: jest.fn().mockReturnThis()
    }))
  };
});

/**
 * Mock axe-core for accessibility testing.
 */
jest.mock('axe-core', () => ({
  source: '/* mocked axe-core source */',
  run: jest.fn().mockResolvedValue({
    violations: [],
    passes: [],
    incomplete: [],
    inapplicable: []
  })
}));

/**
 * Mock child_process for system command testing.
 */
jest.mock('child_process', () => ({
  exec: jest.fn((command, callback) => {
    // Mock successful command execution
    callback(null, 'mocked output', '');
  }),
  execSync: jest.fn(() => 'mocked sync output'),
  spawn: jest.fn(() => ({
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
    on: jest.fn()
  }))
}));

/**
 * Mock fs/promises for file system operations.
 */
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('mocked file content'),
  mkdir: jest.fn().mockResolvedValue(undefined),
  access: jest.fn().mockResolvedValue(undefined),
  rm: jest.fn().mockResolvedValue(undefined),
  readdir: jest.fn().mockResolvedValue([]),
  stat: jest.fn().mockResolvedValue({ isDirectory: () => true })
}));