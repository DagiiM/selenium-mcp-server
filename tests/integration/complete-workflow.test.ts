/**
 * Integration tests for the complete Selenium MCP Server workflow.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { MultiBrowserOrchestrator } from '../../src/core/browser-orchestrator.js';
import { UIAnalysisEngine, AnalysisOptions } from '../../src/core/ui-analysis-engine.js';
import { AutonomousSetup } from '../../src/core/autonomous-setup.js';
import { BatchAnalysisOptions } from '../../src/types/index.js';
import { testConfig } from '../config/test-config.js';

describe('Integration Tests', () => {
  let orchestrator: MultiBrowserOrchestrator;
  let analysisEngine: UIAnalysisEngine;
  let setup: AutonomousSetup;

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
      
      // Step 3: Create browser instance
      const browser = await orchestrator.createBrowser({
        name: 'chrome',
        headless: true,
        viewport: { width: 1920, height: 1080 }
      });
      
      expect(browser).toBeDefined();
      expect(browser.name).toBe('chrome');
      expect(browser.status).toBe('ready');
      
      // Step 5: Perform comprehensive analysis
      const analysisOptions: AnalysisOptions = {
        url: testConfig.testUrl,
        includePerformance: true,
        includeAccessibility: true,
        includeVisual: true,
        generateScreenshots: true,
        generateReport: true
      } as any;
      
      const analysisResult = await analysisEngine.analyze(browser.driver, analysisOptions);
      
      expect(analysisResult).toBeDefined();
      expect(analysisResult.url).toBe(testConfig.testUrl);
      expect(analysisResult.qualityScore.overall).toBeGreaterThanOrEqual(0);
      expect(analysisResult.qualityScore.overall).toBeLessThanOrEqual(100);
      expect(analysisResult.recommendations).toBeDefined();
      
      // Step 6: Generate report (report is generated during analysis if requested)
      expect(analysisResult.url).toBe(testConfig.testUrl);
      expect(analysisResult.qualityScore.overall).toBeGreaterThanOrEqual(0);
      expect(analysisResult.qualityScore.overall).toBeLessThanOrEqual(100);
      expect(analysisResult.performance).toBeDefined();
      expect(analysisResult.accessibility).toBeDefined();
      expect(analysisResult.visual).toBeDefined();
      expect(analysisResult.recommendations).toBeDefined();
      
      // Step 7: Cleanup
      await orchestrator.closeBrowser(browser.id);
      
      const finalStatus = orchestrator.getBrowserStatus();
      expect(finalStatus.length).toBe(0);
    });
  
    describe('Error Recovery', () => {
      it('should handle error recovery in workflow', async () => {
        // Create browser that will fail
        const browser = await orchestrator.createBrowser({ name: 'chrome', headless: true });
        
        // Mock analysis failure by making driver.get fail
        jest.spyOn(browser.driver, 'get').mockRejectedValueOnce(new Error('Navigation failed'));
        
        // Attempt analysis that will fail
        await expect(analysisEngine.analyze(browser.driver, {
          url: testConfig.testUrl,
          includePerformance: true,
          includeAccessibility: false,
          includeVisual: false
        } as any)).rejects.toThrow();
        
        // Recovery: restore driver.get and try with valid URL
        jest.spyOn(browser.driver, 'get').mockResolvedValue(undefined as any);
        
        const recoveryResult = await analysisEngine.analyze(browser.driver, {
          url: testConfig.testUrl,
          includePerformance: true,
          includeAccessibility: false,
          includeVisual: false
        } as any);
        
        expect(recoveryResult).toBeDefined();
        expect(recoveryResult.qualityScore.overall).toBeGreaterThanOrEqual(0);
        
        // Cleanup
        await orchestrator.closeBrowser(browser.id);
      });
    });
  
    describe('Resource Management Integration', () => {
      it('should manage resources across multiple analyses', async () => {
        // Create multiple browsers
        await Promise.all([
          orchestrator.createBrowser({ name: 'chrome', headless: true }),
          orchestrator.createBrowser({ name: 'firefox', headless: true })
        ]);
        
        // Get browsers for use (this sets them to 'busy' status)
        const browsers = await Promise.all([
          orchestrator.getBrowser({ name: 'chrome', headless: true }),
          orchestrator.getBrowser({ name: 'firefox', headless: true })
        ]);
        
        // Perform concurrent analyses
        const analyses = await Promise.all([
          analysisEngine.analyze(browsers[0].driver, {
            url: testConfig.testUrl,
            includePerformance: true,
            includeAccessibility: false,
            includeVisual: false
          } as any),
          analysisEngine.analyze(browsers[0].driver, {
            url: testConfig.testUrl,
            includePerformance: false,
            includeAccessibility: true,
            includeVisual: false
          } as any),
          analysisEngine.analyze(browsers[1].driver, {
            url: testConfig.testUrl,
            includePerformance: false,
            includeAccessibility: false,
            includeVisual: true
          } as any)
        ]);
        
        expect(analyses.length).toBe(3);
        expect(analyses.every(a => a.qualityScore.overall >= 0)).toBe(true);
        
        // Check resource usage
        const stats = orchestrator.getResourceUsage();
        expect(stats.activeBrowsers).toBe(2);
        expect(stats.memoryUsage.heapUsed).toBeGreaterThan(0);
        
        const health = await orchestrator.performHealthCheck();
        expect(health.status).toBeDefined();
        expect(health.browserCount).toBeGreaterThan(0);
        
        // Cleanup
        await Promise.all(browsers.map(b => orchestrator.closeBrowser(b.id)));
      });
    
      it('should handle resource limits gracefully', async () => {
        // Set low resource limits for testing
        (orchestrator as any).options.maxConcurrentBrowsers = 1;
        
        // Create first browser
        const browser1 = await orchestrator.createBrowser({ name: 'chrome', headless: true });
        expect(browser1).toBeDefined();
        
        // Try to create second browser (should fail due to instance limit)
        await expect(orchestrator.createBrowser({ name: 'firefox' })).rejects.toThrow('Maximum concurrent browsers (1) reached');
        
        // Release first browser
        await orchestrator.closeBrowser(browser1.id);
        
        // Now should be able to create another browser
        const browser2 = await orchestrator.createBrowser({ name: 'firefox', headless: true });
        expect(browser2).toBeDefined();
        
        await orchestrator.closeBrowser(browser2.id);
      });
    });
  
    describe('Cross-Browser Compatibility', () => {
      it('should maintain consistency across browsers', async () => {
        await setup.setup({
          browsers: ['chrome', 'firefox'],
          optimizeFor: 'quality_analysis',
          autoInstall: true
        });
        
        const url = testConfig.testUrl;
        
        // Analyze with Chrome
        const chromeBrowser = await orchestrator.createBrowser({ name: 'chrome', headless: true });
        const chromeAnalysis = await analysisEngine.analyze(chromeBrowser.driver, {
          url,
          includePerformance: true,
          includeAccessibility: true,
          includeVisual: false
        } as any);
        
        // Analyze with Firefox
        const firefoxBrowser = await orchestrator.createBrowser({ name: 'firefox', headless: true });
        const firefoxAnalysis = await analysisEngine.analyze(firefoxBrowser.driver, {
          url,
          includePerformance: true,
          includeAccessibility: true,
          includeVisual: false
        } as any);
        
        expect(chromeAnalysis.url).toBe(firefoxAnalysis.url);
        expect(chromeAnalysis.qualityScore.overall).toBeGreaterThanOrEqual(0);
        expect(firefoxAnalysis.qualityScore.overall).toBeGreaterThanOrEqual(0);
        
        await orchestrator.closeBrowser(chromeBrowser.id);
        await orchestrator.closeBrowser(firefoxBrowser.id);
      });
    });
  });
});