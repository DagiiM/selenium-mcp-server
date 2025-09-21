/**
 * Integration tests for the complete Selenium MCP Server workflow.
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const { MultiBrowserOrchestrator } = require('../../src/core/browser-orchestrator');
const { UIAnalysisEngine } = require('../../src/core/ui-analysis-engine');
const { AutonomousSetup } = require('../../src/core/autonomous-setup');
const baseUrl = process.env.TEST_BASE_URL || 'https://example.com';
const INVALID_URL = 'https://invalid-url-that-fails.com';
const CRASH_URL = 'https://crash-test.com';
const NETWORK_FAIL_URL = 'https://network-fail.com';

describe('Integration Tests', () => {
  let orchestrator;
  let analysisEngine;
  let setup;

  beforeEach(async () => {
    setup = new AutonomousSetup();
    orchestrator = new MultiBrowserOrchestrator();
    analysisEngine = new UIAnalysisEngine();
    
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await analysisEngine.cleanup();
    await orchestrator.cleanup();
    jest.restoreAllMocks();
  });

  describe('End-to-End Workflow', () => {
    it('should perform complete autonomous setup and analysis workflow', async () => {
      // Step 1: Autonomous setup
      const setupResult = await setup.setup({
        browsers: ['chrome'],
        autoInstall: true,
        optimizeFor: 'quality_analysis',
        headless: true
      });
      
      expect(setupResult.success).toBe(true);
      expect(setupResult.browsers.some(b => b.name === 'chrome')).toBe(true);
      
      // Step 2: Initialize orchestrator (no separate initialize method needed)
      // Step 3: Create browser instance
      const browser = await orchestrator.createBrowser({
        name: 'chrome',
        headless: true,
        windowSize: { width: 1920, height: 1080 }
      });
      
      expect(browser).toBeDefined();
      expect(browser.name).toBe('chrome');
      expect(browser.status).toBe('ready');
      
      // Step 4: Initialize analysis engine (no separate initialize method needed)
      // Step 5: Perform comprehensive analysis
      const analysisOptions = {
        url: baseUrl,
        includePerformance: true,
        includeAccessibility: true,
        includeVisual: true,
        generateScreenshots: true,
        generateReport: true
      };
      
      const analysisResult = await analysisEngine.analyze(browser.driver, analysisOptions);
      
      expect(analysisResult).toBeDefined();
      expect(analysisResult.url).toBe(baseUrl);
      expect(analysisResult.qualityScore).toBeGreaterThanOrEqual(0);
      expect(analysisResult.qualityScore).toBeLessThanOrEqual(100);
      expect(analysisResult.analysisResults).toBeDefined();
      expect(analysisResult.recommendations).toBeDefined();
      
      // Step 6: Generate report (report is generated during analysis if requested)
      expect(analysisResult.url).toBe(baseUrl);
      expect(analysisResult.qualityScore).toBeGreaterThanOrEqual(0);
      expect(analysisResult.qualityScore).toBeLessThanOrEqual(100);
      expect(analysisResult.performance).toBeDefined();
      expect(analysisResult.accessibility).toBeDefined();
      expect(analysisResult.visual).toBeDefined();
      expect(analysisResult.recommendations).toBeDefined();
      
      // Step 7: Cleanup
      await orchestrator.closeBrowser(browser.id);
      
      const finalStatus = orchestrator.getBrowserStatus();
      expect(finalStatus.length).toBe(0);
    });

    it('should handle multi-browser analysis workflow', async () => {
      // Setup multiple browsers
      const setupResult = await setup.setup({
        browsers: ['chrome', 'firefox'],
        autoInstall: true,
        optimizeFor: 'compatibility'
      });
      
      expect(setupResult.success).toBe(true);
      
      // Create multiple browser instances
      const chromeBrowser = await orchestrator.createBrowser({ name: 'chrome', headless: true });
      const firefoxBrowser = await orchestrator.createBrowser({ name: 'firefox', headless: true });
      
      expect(chromeBrowser).toBeDefined();
      expect(firefoxBrowser).toBeDefined();
      
      // Analyze with different browsers
      const chromeAnalysis = await analysisEngine.analyze(chromeBrowser.driver, {
        url: baseUrl,
        includePerformance: true,
        includeAccessibility: false,
        includeVisual: false
      });
      
      const firefoxAnalysis = await analysisEngine.analyze(firefoxBrowser.driver, {
        url: baseUrl,
        includePerformance: false,
        includeAccessibility: true,
        includeVisual: false
      });
      
      expect(chromeAnalysis).toBeDefined();
      expect(firefoxAnalysis).toBeDefined();
      
      // Compare cross-browser results
      expect(chromeAnalysis.url).toBe(firefoxAnalysis.url);
      expect(chromeAnalysis.qualityScore).toBeDefined();
      expect(firefoxAnalysis.qualityScore).toBeDefined();
      
      // Cleanup
      await orchestrator.closeBrowser(chromeBrowser.id);
      await orchestrator.closeBrowser(firefoxBrowser.id);
    });

    it('should handle error recovery in workflow', async () => {
      // Create browser that will fail
      const browser = await orchestrator.createBrowser({ name: 'chrome', headless: true });
      
      // Mock analysis failure by making driver.get fail
      jest.spyOn(browser.driver, 'get').mockRejectedValueOnce(new Error('Navigation failed'));
      
      // Attempt analysis that will fail
      await expect(analysisEngine.analyze(browser.driver, {
        url: INVALID_URL,
        includePerformance: true,
        includeAccessibility: false,
        includeVisual: false
      })).rejects.toThrow();
      
      // Recovery: restore driver.get and try with valid URL
      jest.spyOn(browser.driver, 'get').mockResolvedValue(undefined);
      
      const recoveryResult = await analysisEngine.analyze(browser.driver, {
        url: baseUrl,
        includePerformance: true,
        includeAccessibility: false,
        includeVisual: false
      });
      
      expect(recoveryResult).toBeDefined();
      expect(recoveryResult.qualityScore).toBeGreaterThanOrEqual(0);
      
      // Cleanup
      await orchestrator.closeBrowser(browser.id);
    });
  });

  describe('Resource Management Integration', () => {
    it('should manage resources across multiple analyses', async () => {
      // Create multiple browsers
      const browsers = await Promise.all([
        orchestrator.createBrowser({ name: 'chrome', headless: true }),
        orchestrator.createBrowser({ name: 'firefox', headless: true })
      ]);
      
      // Perform concurrent analyses
      const analyses = await Promise.all([
        analysisEngine.analyze(browsers[0].driver, {
          url: baseUrl,
          includePerformance: true,
          includeAccessibility: false,
          includeVisual: false
        }),
        analysisEngine.analyze(browsers[0].driver, {
          url: baseUrl,
          includePerformance: false,
          includeAccessibility: true,
          includeVisual: false
        }),
        analysisEngine.analyze(browsers[1].driver, {
          url: baseUrl,
          includePerformance: false,
          includeAccessibility: false,
          includeVisual: true
        })
      ]);
      
      expect(analyses.length).toBe(3);
      expect(analyses.every(a => a.qualityScore >= 0)).toBe(true);
      
      // Check resource usage
      const resourceUsage = orchestrator.getResourceUsage();
      expect(resourceUsage.activeBrowsers).toBe(2);
      expect(resourceUsage.totalMemoryUsage).toBeGreaterThan(0);
      
      // Cleanup
      await Promise.all(browsers.map(b => orchestrator.closeBrowser(b.id)));
    });

    it('should handle resource limits gracefully', async () => {
      // Create browsers up to a reasonable limit
      const browsers = [];
      
      for (let i = 0; i < 3; i++) {
        const browser = await orchestrator.createBrowser({ name: 'chrome', headless: true });
        browsers.push(browser);
      }
      
      expect(browsers.length).toBe(3);
      expect(orchestrator.getBrowserStatus().length).toBe(3);
      
      // Check health status
      const healthStatus = orchestrator.performHealthCheck();
      expect(healthStatus.status).toBe('healthy');
      expect(healthStatus.activeBrowsers).toBe(3);
      expect(healthStatus.memoryUsage).toBeGreaterThan(0);
      
      // Cleanup
      await Promise.all(browsers.map(b => orchestrator.closeBrowser(b.id)));
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should maintain consistency across different browsers', async () => {
      // Create browsers for cross-browser testing
      const chromeBrowser = await orchestrator.createBrowser({ name: 'chrome', headless: true });
      const firefoxBrowser = await orchestrator.createBrowser({ name: 'firefox', headless: true });
      
      // Analyze the same page with different browsers
      const analysisOptions = {
        url: baseUrl,
        includePerformance: true,
        includeAccessibility: true,
        includeVisual: true
      };
      
      const chromeAnalysis = await analysisEngine.analyze(chromeBrowser.driver, analysisOptions);
      const firefoxAnalysis = await analysisEngine.analyze(firefoxBrowser.driver, analysisOptions);
      
      // Both should have valid results
      expect(chromeAnalysis).toBeDefined();
      expect(firefoxAnalysis).toBeDefined();
      expect(chromeAnalysis.url).toBe(firefoxAnalysis.url);
      expect(chromeAnalysis.qualityScore).toBeGreaterThanOrEqual(0);
      expect(firefoxAnalysis.qualityScore).toBeGreaterThanOrEqual(0);
      
      // Cleanup
      await orchestrator.closeBrowser(chromeBrowser.id);
      await orchestrator.closeBrowser(firefoxBrowser.id);
    });
  });

  describe('Report Generation Integration', () => {
    it('should generate comprehensive analysis reports', async () => {
      const browser = await orchestrator.createBrowser({ name: 'chrome', headless: true });
      
      const analysisResult = await analysisEngine.analyze(browser.driver, {
        url: baseUrl,
        includePerformance: true,
        includeAccessibility: true,
        includeVisual: true,
        generateScreenshots: true,
        generateReport: true
      });
      
      expect(analysisResult).toBeDefined();
      expect(analysisResult.url).toBe(baseUrl);
      expect(analysisResult.qualityScore).toBeGreaterThanOrEqual(0);
      expect(analysisResult.qualityScore).toBeLessThanOrEqual(100);
      expect(analysisResult.performanceAnalysis).toBeDefined();
      expect(analysisResult.accessibilityAnalysis).toBeDefined();
      expect(analysisResult.visualAnalysis).toBeDefined();
      expect(analysisResult.recommendations).toBeDefined();
      expect(analysisResult.recommendations.length).toBeGreaterThan(0);
      
      // Cleanup
      await orchestrator.closeBrowser(browser.id);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle browser crashes gracefully', async () => {
      const browser = await orchestrator.createBrowser({ name: 'chrome', headless: true });
      
      // Mock a browser crash by making driver.get fail
      jest.spyOn(browser.driver, 'get').mockRejectedValueOnce(new Error('Browser crashed'));
      
      // Attempt analysis that should fail
      await expect(analysisEngine.analyze(browser.driver, {
        url: CRASH_URL,
        includePerformance: true,
        includeAccessibility: false,
        includeVisual: false
      })).rejects.toThrow();
      
      // Check health status after failure
      const healthStatus = orchestrator.performHealthCheck();
      expect(healthStatus.status).toBe('degraded');
      
      // Recovery: restore driver and retry
      jest.spyOn(browser.driver, 'get').mockResolvedValue(undefined);
      
      const recoveryResult = await analysisEngine.analyze(browser.driver, {
        url: baseUrl,
        includePerformance: true,
        includeAccessibility: false,
        includeVisual: false
      });
      
      expect(recoveryResult).toBeDefined();
      expect(recoveryResult.qualityScore).toBeGreaterThanOrEqual(0);
      
      // Cleanup
      await orchestrator.closeBrowser(browser.id);
    });

    it('should handle network interruptions', async () => {
      const browser = await orchestrator.createBrowser({ name: 'chrome', headless: true });
      
      // Mock network failure by making driver.get fail initially
      jest.spyOn(browser.driver, 'get')
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(undefined);
      
      // First attempt should fail
      await expect(analysisEngine.analyze(browser.driver, {
        url: NETWORK_FAIL_URL,
        includePerformance: true,
        includeAccessibility: false,
        includeVisual: false
      })).rejects.toThrow();
      
      // Second attempt should succeed (network recovered)
      const successResult = await analysisEngine.analyze(browser.driver, {
        url: baseUrl,
        includePerformance: true,
        includeAccessibility: false,
        includeVisual: false
      });
      
      expect(successResult).toBeDefined();
      expect(successResult.qualityScore).toBeGreaterThanOrEqual(0);
      
      // Cleanup
      await orchestrator.closeBrowser(browser.id);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle rapid sequential analyses efficiently', async () => {
      const browser = await orchestrator.createBrowser({ name: 'chrome', headless: true });
      
      const urls = [
        'https://example1.com',
        'https://example2.com',
        'https://example3.com',
        'https://example4.com',
        'https://example5.com'
      ];
      
      const startTime = Date.now();
      
      // Perform rapid sequential analyses
      const results = await Promise.all(
        urls.map(url => 
          analysisEngine.analyze(browser.driver, {
            url,
            includePerformance: true,
            includeAccessibility: false,
            includeVisual: false
          })
        )
      );
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      expect(results.length).toBe(5);
      expect(results.every(r => r.qualityScore >= 0)).toBe(true);
      
      // Should complete reasonably quickly (within 30 seconds for 5 analyses)
      expect(totalTime).toBeLessThan(30000);
      
      await orchestrator.closeBrowser(browser.id);
    });

    it('should maintain performance under load', async () => {
      // Create multiple browsers to simulate load
      const browsers = await Promise.all([
        orchestrator.createBrowser({ name: 'chrome', headless: true }),
        orchestrator.createBrowser({ name: 'firefox', headless: true })
      ]);
      
      // Get baseline performance
      const baselineStart = Date.now();
      const baselineAnalysis = await analysisEngine.analyze(browsers[0].driver, {
        url: baseUrl,
        includePerformance: true,
        includeAccessibility: false,
        includeVisual: false
      });
      const baselineTime = Date.now() - baselineStart;
      
      // Perform multiple concurrent analyses
      const concurrentPromises = [];
      for (let i = 0; i < 3; i++) {
        concurrentPromises.push(
          analysisEngine.analyze(browsers[i % browsers.length].driver, {
            url: `https://example${i}.com`,
            includePerformance: true,
            includeAccessibility: false,
            includeVisual: false
          })
        );
      }
      
      const loadStart = Date.now();
      const loadResults = await Promise.all(concurrentPromises);
      const loadTime = Date.now() - loadStart;
      
      expect(loadResults.length).toBe(3);
      expect(loadResults.every(r => r.qualityScore >= 0)).toBe(true);
      
      // Performance under load shouldn't degrade significantly (within 3x baseline)
      expect(loadTime).toBeLessThan(baselineTime * 3);
      
      await Promise.all(browsers.map(b => orchestrator.closeBrowser(b.id)));
    });
  });
});

// Removed stray lines from previous patch