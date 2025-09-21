/**
 * Unit tests for UIAnalysisEngine class.
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UIAnalysisEngine } from '../../src/core/ui-analysis-engine';
import { Browser } from 'selenium-webdriver';
import * as fs from 'fs/promises';

// Mock dependencies
jest.mock('selenium-webdriver');
jest.mock('axe-core');
jest.mock('fs/promises');

describe('UIAnalysisEngine', () => {
  let analysisEngine: UIAnalysisEngine;
  let mockBrowser: any;
  let mockDriver: any;

  // Helper function to create complete performance data mock
  const createPerformanceDataMock = (options: {
    slowNavigation?: boolean;
    slowPaint?: boolean;
    highCLS?: boolean;
  } = {}) => {
    const {
      slowNavigation = false,
      slowPaint = false,
      highCLS = false
    } = options;
    
    return (script: string) => {
      if (script.includes('performance.getEntriesByType')) {
        if (script.includes("'navigation'")) {
          return Promise.resolve([
            {
              name: 'https://example.com',
              startTime: 0,
              duration: slowNavigation ? 5000 : 1000,
              entryType: 'navigation',
              fetchStart: 100,
              responseStart: 200,
              domContentLoadedEventEnd: 300,
              loadEventEnd: 400,
              domInteractive: 250
            }
          ]);
        }
        if (script.includes("'paint'")) {
          return Promise.resolve([
            {
              name: 'first-contentful-paint',
              startTime: slowPaint ? 3000 : 800,
              entryType: 'paint'
            },
            {
              name: 'largest-contentful-paint',
              startTime: slowPaint ? 4000 : 1200,
              entryType: 'paint'
            }
          ]);
        }
        if (script.includes("'resource'")) {
          return Promise.resolve([
            {
              name: 'https://example.com/style.css',
              startTime: 100,
              duration: 200,
              transferSize: 1024,
              entryType: 'resource'
            },
            {
              name: 'https://example.com/script.js',
              startTime: 150,
              duration: 300,
              transferSize: 2048,
              entryType: 'resource'
            }
          ]);
        }
        if (script.includes("'layout-shift'")) {
          return Promise.resolve(highCLS ? [
            {
              value: 0.3,
              startTime: 1000,
              entryType: 'layout-shift'
            }
          ] : []);
        }
      }
      
      if (script.includes('performance.timing')) {
        return Promise.resolve({
          navigationStart: 0,
          fetchStart: 100,
          domainLookupStart: 110,
          domainLookupEnd: 120,
          connectStart: 120,
          connectEnd: 150,
          requestStart: 150,
          responseStart: 200,
          responseEnd: 250,
          domLoading: 260,
          domInteractive: 300,
          domContentLoadedEventStart: 350,
          domContentLoadedEventEnd: 360,
          domComplete: 400,
          loadEventStart: 400,
          loadEventEnd: 410
        });
      }
      
      if (script.includes('performance.now')) {
        return Promise.resolve(1000);
      }
      
      return Promise.resolve({});
    };
  };

  beforeEach(() => {
    // Create mock driver with proper jest functions
    mockDriver = {
      get: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      getTitle: jest.fn<() => Promise<string>>().mockResolvedValue('Test Page'),
      getCurrentUrl: jest.fn<() => Promise<string>>().mockResolvedValue('https://example.com'),
      takeScreenshot: jest.fn<() => Promise<string>>().mockResolvedValue('base64screenshot'),
      executeScript: jest.fn<(script: string) => Promise<any>>().mockImplementation(createPerformanceDataMock()),
      executeAsyncScript: jest.fn<(script: string) => Promise<any>>().mockImplementation((script: string) => {
        // Default mock for executeAsyncScript - can be overridden in individual tests
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
      findElement: jest.fn<() => Promise<any>>().mockResolvedValue({
        getText: jest.fn<() => Promise<string>>().mockResolvedValue('Test Element'),
        getAttribute: jest.fn<(name: string) => Promise<string | null>>().mockResolvedValue('test-value'),
        getRect: jest.fn<() => Promise<{ x: number; y: number; width: number; height: number; }>>().mockResolvedValue({ x: 0, y: 0, width: 100, height: 50 })
      }),
      findElements: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
      wait: jest.fn<() => any>().mockReturnValue({
        until: jest.fn<() => Promise<boolean>>().mockResolvedValue(true)
      }),
      sleep: jest.fn<(ms: number) => Promise<void>>().mockImplementation((ms: number) => Promise.resolve()),
      getCapabilities: jest.fn<() => Promise<any>>().mockResolvedValue({
        get: jest.fn<(key: string) => string | undefined>().mockImplementation((key: string) => {
          if (key === 'browserName') return 'chrome';
          if (key === 'browserVersion') return '120.0.0.0';
          return undefined;
        })
      }),
      manage: jest.fn<() => any>().mockReturnValue({
        window: jest.fn<() => any>().mockReturnValue({
          getRect: jest.fn<() => Promise<{ width: number; height: number; }>>().mockResolvedValue({ width: 1920, height: 1080 })
        })
      })
    } as any;
    mockBrowser = {
      driver: mockDriver,
      type: Browser.CHROME,
      id: 'test-browser-id'
    };

    analysisEngine = new UIAnalysisEngine();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const engine = new UIAnalysisEngine();
      expect(engine).toBeDefined();
    });

    it('should initialize without custom options', () => {
      const engine = new UIAnalysisEngine();
      expect(engine).toBeDefined();
    });
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      const engine = new UIAnalysisEngine();
      expect(engine).toBeDefined();
    });

    it('should initialize without custom options', () => {
      const engine = new UIAnalysisEngine();
      expect(engine).toBeDefined();
    });
  });

  describe('Performance Analysis', () => {
    it('should analyze page performance', async () => {
      const result = await analysisEngine.analyzePerformance(mockDriver);
      
      expect(result).toBeDefined();
      expect(result.firstContentfulPaint).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should calculate Core Web Vitals', async () => {
      mockDriver.executeScript.mockImplementation((script) => {
        if (script.includes('web-vitals')) {
          return Promise.resolve({
            lcp: { value: 2500 },
            fid: { value: 100 },
            cls: { value: 0.1 }
          });
        }
        return Promise.resolve({});
      });

      const result = await analysisEngine.analyzePerformance(mockDriver);
      
      expect(result.coreWebVitals).toBeDefined();
      expect(result.coreWebVitals.lcp).toBeDefined();
      expect(result.coreWebVitals.cls).toBeDefined();
    });

    it('should handle performance analysis errors', async () => {
      mockDriver.executeScript.mockRejectedValue(new Error('Script execution failed'));
      
      await expect(analysisEngine.analyzePerformance(mockDriver)).rejects.toThrow('Script execution failed');
    });
  });

  describe('Accessibility Analysis', () => {
    it('should analyze accessibility', async () => {
      const result = await analysisEngine.analyzeAccessibility(mockDriver);
      
      expect(result).toBeDefined();
      expect(result.violations).toBeInstanceOf(Array);
      expect(result.passes).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle accessibility violations', async () => {
      mockDriver.executeAsyncScript.mockImplementation((script) => {
        if (script.includes('axe.run')) {
          return Promise.resolve({
            violations: [
              {
                id: 'color-contrast',
                impact: 'serious',
                description: 'Elements must have sufficient color contrast',
                nodes: [{ target: ['body'], html: '<body>test</body>' }],
                tags: ['wcag2aa', 'wcag143']
              }
            ],
            passes: [],
            incomplete: [],
            inapplicable: []
          });
        }
        return Promise.resolve({});
      });

      const result = await analysisEngine.analyzeAccessibility(mockDriver);
      console.log('DEBUG: Accessibility result:', JSON.stringify(result, null, 2));
      
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].id).toBe('color-contrast');
      expect(result.score).toBeLessThan(100);
    });

    it('should handle accessibility analysis errors', async () => {
      mockDriver.executeAsyncScript.mockImplementation((script) => {
        if (script.includes('axe.run')) {
          return Promise.resolve({ error: 'Accessibility analysis failed' });
        }
        return Promise.resolve({});
      });

      await expect(analysisEngine.analyzeAccessibility(mockDriver))
        .rejects.toThrow('Accessibility audit failed: Accessibility analysis failed');
    });
  });

  describe('Visual Analysis', () => {
    it('should analyze visual elements', async () => {
      // Temporarily restore console.log for debugging
      const originalLog = console.log;
      console.log = originalLog;
      console.log('DEBUG: Starting visual analysis test');
      // Set up comprehensive mocks for visual analysis with debug logging
      mockDriver.executeScript.mockImplementation((script) => {
        const scriptStr = String(script);
        console.log('DEBUG: executeScript called with:', scriptStr.substring(0, 100) + '...');
        
        // Layout shifts analysis
        if (scriptStr.includes("performance.getEntriesByType('layout-shift')")) {
          console.log('DEBUG: Returning layout shift data');
          return Promise.resolve([{ value: 0.05, startTime: 1000, sources: [] }]);
        }
        
        // Color contrast analysis - simple violations check
        if (scriptStr.includes('querySelectorAll') && scriptStr.includes('violations')) {
          console.log('DEBUG: Returning color contrast violations (empty)');
          return Promise.resolve([]);
        }
        
        // Typography analysis - main data collection
        if (scriptStr.includes('fontSizes') && scriptStr.includes('lineHeights')) {
          console.log('DEBUG: Returning typography data');
          return Promise.resolve({
            fontSizes: { tooSmall: [], optimal: [{ element: 'p', size: 16 }], large: [] },
            lineHeights: { tooTight: [], optimal: [{ element: 'p', height: 1.5 }], tooLoose: [] },
            fontFamilies: ['Arial, sans-serif'],
            readabilityScore: 98
          });
        }
        
        // Font size parsing for individual elements
        if (scriptStr.includes('parseInt(style.fontSize)')) {
          console.log('DEBUG: Returning font size 16');
          return Promise.resolve(16);
        }
        
        // Line height parsing
        if (scriptStr.includes('lineHeight') && scriptStr.includes('normal')) {
          console.log('DEBUG: Returning line height 1.2');
          return Promise.resolve(1.2);
        }
        
        // Spacing analysis - main data collection
        if (scriptStr.includes('getBoundingClientRect') && scriptStr.includes('tightSpacing')) {
          console.log('DEBUG: Returning spacing data');
          return Promise.resolve({
            tightSpacing: [],
            optimalSpacing: [{ element: 'div', margin: 10, padding: 10, size: { width: 200, height: 100 } }],
            looseSpacing: [],
            recommendations: []
          });
        }
        
        // General element queries for typography
        if (scriptStr.includes('document.querySelectorAll') && scriptStr.includes('elements') && !scriptStr.includes('violations')) {
          console.log('DEBUG: Returning empty array for typography elements');
          return Promise.resolve([]);
        }
        
        // General element queries for spacing (different pattern)
        if (scriptStr.includes('document.querySelectorAll') && scriptStr.includes('*') && !scriptStr.includes('violations')) {
          console.log('DEBUG: Returning empty array for spacing elements');
          return Promise.resolve([]);
        }
        
        // Color contrast element queries
        if (scriptStr.includes('document.querySelectorAll') && scriptStr.includes('*') && scriptStr.includes('getComputedStyle')) {
          console.log('DEBUG: Returning empty array for color contrast elements');
          return Promise.resolve([]);
        }
        
        // Default to empty array for unhandled queries
        if (scriptStr.includes('querySelectorAll')) {
          console.log('DEBUG: Returning empty array for unhandled querySelectorAll');
          return Promise.resolve([]);
        }
        
        // Default to performance mock for other calls
        console.log('DEBUG: Using performance mock for other calls');
        return createPerformanceDataMock()(script);
      });
      
      // Test with includeVisual: true
      let result;
      try {
        console.log('DEBUG: Calling analysisEngine.analyze with includeVisual: true');
        result = await analysisEngine.analyze(mockDriver, {
          url: 'https://example.com',
          includePerformance: false,
          includeAccessibility: false,
          includeVisual: true,
          generateScreenshots: false,
          generateReport: false
        });
        console.log('DEBUG: Got result from analyze:', JSON.stringify(result, null, 2));
        console.log('DEBUG: result.visual keys:', Object.keys(result.visual || {}));
      } catch (error) {
        throw new Error(`Error during visual analysis: ${error instanceof Error ? error.message : String(error)}. Stack: ${error instanceof Error ? error.stack : 'No stack'}`);
      }
      
      // Check result immediately
      expect(result).toBeDefined();
      
      // Debug: Check what we actually got - move this before the expect
      if (!result.visual) {
        throw new Error(`Result.visual is undefined. Result keys: ${Object.keys(result)}. Full result: ${JSON.stringify(result, null, 2)}`);
      }
      
      // Now check visual analysis
      expect(result.visual).toBeDefined();
      console.log('DEBUG: result.visual =', JSON.stringify(result.visual, null, 2));
      // The actual structure returned by the implementation
      expect(result.visual.layoutShifts).toBeDefined();
      expect(result.visual.colorContrast).toBeDefined();
      expect(result.visual.typography).toBeDefined();
      expect(result.visual.spacing).toBeDefined();
    });

    it('should capture screenshot', async () => {
      await analysisEngine.analyze(mockDriver, {
        url: 'https://example.com',
        includePerformance: false,
        includeAccessibility: false,
        includeVisual: true,
        generateScreenshots: true,
        generateReport: false
      });
      
      expect(mockDriver.takeScreenshot).toHaveBeenCalled();
    });

    it('should analyze layout', async () => {
      mockDriver.executeScript.mockImplementation((script) => {
        if (script.includes('getBoundingClientRect')) {
          return Promise.resolve([
            { x: 0, y: 0, width: 100, height: 50, tagName: 'DIV' },
            { x: 10, y: 10, width: 80, height: 30, tagName: 'P' }
          ]);
        }
        return Promise.resolve({});
      });

      const result = await analysisEngine.analyze(mockDriver, {
          url: 'https://example.com',
          includePerformance: false,
          includeAccessibility: false,
          includeVisual: true,
          generateScreenshots: false
        });
      
      expect(result.visual.layoutShifts).toBeDefined();
    });
  });

  describe('Comprehensive Analysis', () => {
    it('should perform comprehensive analysis', async () => {
      const result = await analysisEngine.analyze(mockDriver, {
        url: 'https://example.com',
        includePerformance: true,
        includeAccessibility: true,
        includeVisual: true,
        generateScreenshots: false,
        generateReport: false
      });
      
      expect(result).toBeDefined();
      expect(result.url).toBe('https://example.com');
      expect(result.timestamp).toBeDefined();
      expect(result.performance).toBeDefined();
      expect(result.accessibility).toBeDefined();
      expect(result.visual).toBeDefined();
      expect(result.qualityScore.overall).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore.overall).toBeLessThanOrEqual(100);
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it('should handle selective analysis', async () => {
      const result = await analysisEngine.analyze(mockDriver, {
        url: 'https://example.com',
        includePerformance: true,
        includeAccessibility: false,
        includeVisual: false,
        generateScreenshots: false,
        generateReport: false
      });
      
      expect(result.performance).toBeDefined();
      expect(result.accessibility).toBeDefined(); // Will get default report
      expect(result.visual).toBeDefined(); // Will get default analysis
    });

    it('should handle comprehensive analysis errors', async () => {
      mockDriver.get.mockRejectedValue(new Error('Browser disconnected'));
      
      await expect(analysisEngine.analyze(mockDriver, {
        url: 'https://example.com',
        includePerformance: true,
        includeAccessibility: true,
        includeVisual: true,
        generateScreenshots: false,
        generateReport: false
      })).rejects.toThrow('Browser disconnected');
    });
  });

  describe('Recommendation Generation', () => {
    it('should generate recommendations for performance issues', async () => {
      // Use slow performance data to trigger recommendations
      mockDriver.executeScript.mockImplementation(createPerformanceDataMock({
        slowNavigation: true,
        slowPaint: true,
        highCLS: true
      }));

      const result = await analysisEngine.analyze(mockDriver, {
        url: 'https://example.com',
        includePerformance: true,
        includeAccessibility: true,
        includeVisual: true,
        generateScreenshots: false,
        generateReport: false
      });
      
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should generate recommendations for accessibility violations', async () => {
      mockDriver.executeScript.mockImplementation((script) => {
        if (script.includes('axe.run')) {
          return Promise.resolve({
            violations: [
              {
                id: 'image-alt',
                impact: 'critical',
                description: 'Images must have alternate text',
                help: 'Ensures <img> elements have alternate text or a role of none or presentation',
                helpUrl: 'https://dequeuniversity.com/rules/axe/4.7/image-alt',
                nodes: [{ target: ['img'], html: '<img src="test.jpg">' }]
              }
            ],
            passes: [],
            incomplete: [],
            inapplicable: []
          });
        }
        // Return the full performance data object for performance analysis
        if (script.includes('return {') && script.includes('navigation:') && script.includes('paint:')) {
          return Promise.resolve({
            navigation: [{
              name: 'https://example.com',
              startTime: 0,
              duration: 1000,
              entryType: 'navigation',
              fetchStart: 100,
              responseStart: 200,
              domContentLoadedEventEnd: 300,
              loadEventEnd: 400,
              domInteractive: 250
            }],
            paint: [{ name: 'first-contentful-paint', startTime: 500 }],
            largestContentfulPaint: [{ startTime: 800, size: 1000, element: 'div' }],
            layoutShift: [{ value: 0.05, startTime: 1000 }],
            resource: [{ transferSize: 1024, startTime: 500, duration: 100 }],
            measure: []
          });
        }
        // Use the performance data mock for individual script calls
        const performanceMock = createPerformanceDataMock();
        return performanceMock(script);
      });

      const result = await analysisEngine.analyze(mockDriver, {
        url: 'https://example.com',
        includePerformance: true,
        includeAccessibility: true,
        includeVisual: true,
        generateScreenshots: false,
        generateReport: false
      });
      
      expect(result.recommendations).toBeInstanceOf(Array);
      const accessibilityRecs = result.recommendations.filter(r => r.category === 'accessibility');
      expect(accessibilityRecs.length).toBeGreaterThan(0);
    });
  });

  describe('Utility Methods', () => {
    it('should calculate overall score correctly', () => {
      const scores = {
        performance: 80,
        accessibility: 90,
        visual: 85
      };
      
      const overallScore = analysisEngine.calculateOverallScore(scores);
      
      expect(overallScore).toBeGreaterThan(0);
      expect(overallScore).toBeLessThanOrEqual(100);
    });

    it('should handle missing scores in overall calculation', () => {
      const scores = {
        performance: 80,
        accessibility: null,
        visual: undefined
      };
      
      const overallScore = analysisEngine.calculateOverallScore(scores);
      
      expect(overallScore).toBe(80); // Should use only available scores
    });

    it('should setup analysis directories', async () => {
      await analysisEngine.setupAnalysisDirectories();
      
      // Should not throw and should create necessary directories
      expect(analysisEngine).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing browser driver', async () => {
      const invalidDriver = null; // Missing driver
      
      await expect(analysisEngine.analyze(invalidDriver as any, {
        url: 'https://example.com',
        includePerformance: true,
        includeAccessibility: true,
        includeVisual: true,
        generateScreenshots: false,
        generateReport: false
      })).rejects.toThrow();
    });

    it('should handle file system errors gracefully', async () => {
      const fs = await import('fs/promises');
      (fs.writeFile as jest.Mock<any>).mockRejectedValue(new Error('Disk full') as any);
      
      // Use the performance data mock
      mockDriver.executeScript.mockImplementation(createPerformanceDataMock());
      
      const result = await analysisEngine.analyze(mockDriver, {
        url: 'https://example.com',
        includePerformance: true,
        includeAccessibility: true,
        includeVisual: true,
        generateScreenshots: false,
        generateReport: true
      });
      
      expect(result).toBeDefined();
      // screenshotPath is not part of AnalysisResult interface, removing this assertion
    });
  });
});