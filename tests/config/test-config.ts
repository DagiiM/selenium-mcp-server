/**
 * Test configuration and setup for the Selenium MCP Server testing suite.
 */

import { jest } from '@jest/globals';

// Helper factories to avoid "never" typing on mockResolvedValue/ReturnValue
const asyncVoid = () => jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
const asyncString = (val: string) => jest.fn<() => Promise<string>>().mockResolvedValue(val);
const asyncBool = (val: boolean) => jest.fn<() => Promise<boolean>>().mockResolvedValue(val);
const asyncObject = <T extends object>(val: T) => jest.fn<() => Promise<T>>().mockResolvedValue(val);
const returnValue = <T>(val: T) => jest.fn<() => T>().mockReturnValue(val);

// Mock Selenium WebDriver
jest.mock('selenium-webdriver', () => ({
  Builder: jest.fn<() => any>().mockImplementation(() => ({
    forBrowser: returnValue<any>(undefined as unknown as any),
    setChromeOptions: returnValue<any>(undefined as unknown as any),
    setFirefoxOptions: returnValue<any>(undefined as unknown as any),
    setEdgeOptions: returnValue<any>(undefined as unknown as any),
    build: jest.fn<() => Promise<any>>() .mockResolvedValue({
      get: asyncVoid(),
      quit: asyncVoid(),
      takeScreenshot: asyncString('base64screenshot'),
      executeScript: asyncObject<Record<string, unknown>>({}),
      findElement: jest.fn<() => Promise<any>>().mockResolvedValue({
        click: asyncVoid(),
        getText: asyncString('test text'),
        getTagName: asyncString('div'),
        isDisplayed: asyncBool(true),
        isEnabled: asyncBool(true),
        getAttribute: asyncString('test value'),
        getRect: asyncObject<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 100, height: 100 })
      }),
      wait: asyncVoid(),
      sleep: asyncVoid(),
      getCapabilities: jest.fn<() => Promise<Map<string, string>>>().mockResolvedValue(new Map<string, string>([
        ['browserName', 'chrome'],
        ['browserVersion', '120.0.0.0']
      ])),
      manage: returnValue<any>({
        window: returnValue<any>({
          setRect: asyncVoid(),
          getRect: asyncObject<{ width: number; height: number }>({ width: 1920, height: 1080 })
        })
      }),
      actions: returnValue<any>({
        move: returnValue<any>({ perform: asyncVoid() }),
        contextClick: returnValue<any>({ perform: asyncVoid() })
      })
    })
  })),
  By: {
    css: jest.fn((selector: string) => ({ css: selector })),
    xpath: jest.fn((selector: string) => ({ xpath: selector })),
    id: jest.fn((selector: string) => ({ id: selector })),
    className: jest.fn((selector: string) => ({ className: selector })),
    name: jest.fn((selector: string) => ({ name: selector })),
    tagName: jest.fn((selector: string) => ({ tagName: selector }))
  }
}));

// Mock MCP SDK
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn<() => any>().mockImplementation(() => ({
    setRequestHandler: jest.fn(),
    connect: asyncVoid(),
    close: asyncVoid(),
    onerror: null
  }))
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn<() => any>().mockImplementation(() => ({}))
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn<() => Promise<string>>().mockResolvedValue('mock file content'),
  writeFile: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  mkdir: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  access: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  stat: jest.fn<() => Promise<{ isDirectory: () => boolean }>>().mockResolvedValue({ isDirectory: () => true }),
  readdir: jest.fn<() => Promise<string[]>>().mockResolvedValue([])
}));

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn((cmd: string, callback: (error: Error | null, stdout: string, stderr: string) => void) => {
    // Ensure callback is invoked with typical signature
    callback(null, 'mock output', '');
  }),
  spawn: jest.fn<() => any>().mockImplementation(() => ({
    on: jest.fn(),
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() }
  }))
}));

// Global test configuration
export const testConfig = {
  timeout: 30000,
  // Use a single source of truth for the base URL, configurable via env
  testUrl: process.env.TEST_BASE_URL || 'https://example.com',
  testSelectors: {
    heading: 'h1',
    button: 'button',
    form: 'form'
  },
  testBrowsers: ['chrome', 'firefox', 'edge'],
  testViewports: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 }
  }
};

// Test data generators
export const generateMockAnalysisResult = () => ({
  url: testConfig.testUrl,
  timestamp: new Date().toISOString(),
  browser: 'chrome 120.0.0.0',
  viewport: testConfig.testViewports.desktop,
  performance: {
    firstContentfulPaint: 1200,
    largestContentfulPaint: 2500,
    cumulativeLayoutShift: 0.05,
    totalBlockingTime: 150,
    speedIndex: 1800,
    timeToInteractive: 3000,
    domContentLoaded: 2000,
    loadComplete: 3500,
    resourceCount: 25,
    totalSize: 1024000,
    coreWebVitals: {
      lcp: 2500,
      fid: 0,
      cls: 0.05,
      fcp: 1200,
      ttfb: 300
    }
  },
  accessibility: {
    violations: [],
    passes: 45,
    incomplete: 2,
    inapplicable: 12,
    score: 95,
    wcagCompliance: {
      a: true,
      aa: true,
      aaa: false,
      complianceLevel: 'AA'
    }
  },
  visual: {
    layoutShifts: [],
    colorContrast: {
      violations: [],
      score: 98,
      recommendations: []
    },
    typography: {
      fontSizes: { tooSmall: [], optimal: [], large: [], recommendations: [] },
      lineHeights: { tooTight: [], optimal: [], tooLoose: [], recommendations: [] },
      fontFamilies: [],
      readabilityScore: 95
    },
    spacing: {
      tightSpacing: [],
      optimalSpacing: [],
      looseSpacing: [],
      recommendations: []
    }
  },
  recommendations: [
    {
      category: 'performance',
      severity: 'medium',
      title: 'Optimize LCP',
      description: 'LCP is 2.5s, target is <2.5s',
      impact: 'Improved user experience',
      effort: 'medium',
      autoFixAvailable: false,
      testingSteps: ['Optimize images', 'Preload critical resources'],
      resources: ['https://web.dev/lcp'],
      estimatedFixTime: '2-4 hours'
    }
  ],
  qualityScore: {
    overall: 88,
    performance: 85,
    accessibility: 95,
    visual: 98,
    crossBrowser: 0,
    breakdown: {
      criticalIssues: 0,
      warnings: 1,
      suggestions: 2
    }
  }
});

export const generateMockElementInfo = () => ({
  tagName: 'div',
  text: 'Test element content',
  isDisplayed: true,
  isEnabled: true,
  attributes: {
    id: 'test-element',
    class: 'test-class'
  },
  dimensions: {
    x: 100,
    y: 200,
    width: 300,
    height: 150
  },
  cssProperties: {
    color: 'rgb(0, 0, 0)',
    backgroundColor: 'rgb(255, 255, 255)',
    fontSize: '16px',
    fontFamily: 'Arial, sans-serif',
    display: 'block',
    position: 'static'
  }
});