/**
 * Test setup and configuration for Selenium MCP Server tests.
 */

import path from 'path';
import fs from 'fs/promises';

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
if (process.env.NODE_ENV === 'test' && !process.env.DEBUG_TESTS) {
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
 * Enhanced error handling for unhandled promise rejections.
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

/**
 * Mock WebDriver for testing without actual browser instances.
 */
jest.mock('selenium-webdriver', () => ({
  Builder: jest.fn().mockImplementation(() => ({
    forBrowser: jest.fn().mockReturnThis(),
    build: jest.fn().mockResolvedValue({
      get: jest.fn().mockResolvedValue(undefined),
      getTitle: jest.fn().mockResolvedValue('Test Page'),
      getCurrentUrl: jest.fn().mockResolvedValue('https://example.com'),
      quit: jest.fn().mockResolvedValue(undefined),
      takeScreenshot: jest.fn().mockResolvedValue('base64screenshot'),
      executeScript: jest.fn().mockResolvedValue({}),
      findElement: jest.fn().mockResolvedValue({
        click: jest.fn().mockResolvedValue(undefined),
        getText: jest.fn().mockResolvedValue('Test Element'),
        getAttribute: jest.fn().mockResolvedValue('test-value')
      }),
      findElements: jest.fn().mockResolvedValue([]),
      wait: jest.fn().mockReturnValue({
        until: jest.fn().mockResolvedValue(true)
      })
    })
  })),
  Browser: {
    CHROME: 'chrome',
    FIREFOX: 'firefox',
    EDGE: 'edge'
  },
  By: {
    id: jest.fn((id) => ({ id })),
    className: jest.fn((className) => ({ className })),
    css: jest.fn((css) => ({ css })),
    xpath: jest.fn((xpath) => ({ xpath }))
  },
  until: {
    titleIs: jest.fn(),
    elementLocated: jest.fn(),
    elementIsVisible: jest.fn()
  }
}));

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