/**
 * Unit tests for the MultiBrowserOrchestrator class.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { MultiBrowserOrchestrator, BrowserInstance, OrchestrationOptions } from '../../src/core/browser-orchestrator.js';

describe('MultiBrowserOrchestrator', () => {
  let orchestrator: MultiBrowserOrchestrator;

  beforeEach(() => {
    orchestrator = new MultiBrowserOrchestrator();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await orchestrator.cleanup();
    jest.restoreAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await orchestrator.initialize();
      
      // Since initialize doesn't return anything, just check it doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('createBrowser', () => {
    it('should create a browser instance successfully', async () => {
      await orchestrator.initialize();
      
      const instance = await orchestrator.createBrowser({
        name: 'chrome',
        headless: true,
        viewport: { width: 1920, height: 1080 }
      });
      
      expect(instance).toBeDefined();
      expect(instance.id).toBeDefined();
      expect(instance.driver).toBeDefined();
      expect(instance.name).toBe('chrome');
      expect(instance.status).toBe('ready');
    });

    it('should handle browser creation limits', async () => {
      await orchestrator.initialize();
      
      // Set low limit for testing
      orchestrator['options']['maxConcurrentBrowsers'] = 1;
      
      await orchestrator.createBrowser({ name: 'chrome', headless: true });
      
      await expect(orchestrator.createBrowser({ name: 'firefox', headless: true })).rejects.toThrow('Maximum concurrent browsers');
    });

    it('should validate browser types', async () => {
      await orchestrator.initialize();
      
      await expect(orchestrator.createBrowser({ name: 'invalid-browser' as any, headless: true })).rejects.toThrow('Unsupported browser');
    });
  });

  describe('getBrowser', () => {
    it('should retrieve existing browser instance', async () => {
      await orchestrator.initialize();
      
      const instance = await orchestrator.createBrowser({ name: 'chrome', headless: true });
      const retrieved = await orchestrator.getBrowser({ name: 'chrome', headless: true });
      
      expect(retrieved).toBeDefined();
      expect(retrieved.name).toBe('chrome');
    });
  });

  describe('releaseBrowser', () => {
    it('should release browser instance successfully', async () => {
      await orchestrator.initialize();
      
      const instance = await orchestrator.createBrowser({ name: 'chrome', headless: true });
      const result = orchestrator.releaseBrowser(instance.id);
      
      expect(result).toBe(true);
    });

    it('should handle release of non-existent instance', async () => {
      await orchestrator.initialize();
      
      const result = orchestrator.releaseBrowser('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('closeBrowser', () => {
    it('should close browser instance properly', async () => {
      await orchestrator.initialize();
      
      const instance = await orchestrator.createBrowser({ name: 'chrome', headless: true });
      await orchestrator.closeBrowser(instance.id);
      
      // Check that browser is no longer in the list
      const browsers = orchestrator.getAllBrowsers();
      expect(browsers.find(b => b.id === instance.id)).toBeUndefined();
    });

    it('should handle browser close errors', async () => {
      await orchestrator.initialize();
      
      await expect(orchestrator.closeBrowser('non-existent-id')).rejects.toThrow('Browser instance');
    });
  });

  describe('getAllBrowsers', () => {
    it('should return all browser instances', async () => {
      await orchestrator.initialize();
      
      const instance1 = await orchestrator.createBrowser({ name: 'chrome', headless: true });
      const instance2 = await orchestrator.createBrowser({ name: 'firefox', headless: true });
      
      const all = orchestrator.getAllBrowsers();
      
      expect(all.length).toBe(2);
      expect(all.map(i => i.id)).toContain(instance1.id);
      expect(all.map(i => i.id)).toContain(instance2.id);
    });

    it('should return empty array when no instances', () => {
      const all = orchestrator.getAllBrowsers();
      expect(all).toEqual([]);
    });
  });

  describe('getBrowserStatus', () => {
    it('should return browser status', async () => {
      await orchestrator.initialize();
      
      await orchestrator.createBrowser({ name: 'chrome', headless: true });
      await orchestrator.createBrowser({ name: 'firefox', headless: true });
      
      const status = orchestrator.getBrowserStatus();
      
      expect(status).toBeDefined();
      expect(status.length).toBe(2);
    });
  });





  describe('Resource Management', () => {
    it('should track resource usage', () => {
      const usage = orchestrator.getResourceUsage();
      
      expect(usage).toBeDefined();
      expect(usage.browserCount).toBeGreaterThanOrEqual(0);
      expect(usage.memoryUsage).toBeDefined();
    });

    it('should cleanup all browsers', async () => {
      await orchestrator.initialize();
      
      await orchestrator.createBrowser({ name: 'chrome', headless: true });
      await orchestrator.createBrowser({ name: 'firefox', headless: true });
      
      await orchestrator.closeAllBrowsers();
      
      const browsers = orchestrator.getAllBrowsers();
      expect(browsers.length).toBe(0);
    });
  });

  describe('Health Monitoring', () => {
    it('should perform health check', async () => {
      await orchestrator.initialize();
      
      await orchestrator.createBrowser({ name: 'chrome', headless: true });
      
      // Health check should not throw
      await expect(orchestrator.performHealthCheck()).resolves.not.toThrow();
    });

    it('should stop monitoring', () => {
      orchestrator.stopMonitoring();
      
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent browser creation', async () => {
      await orchestrator.initialize();
      
      const promises = [
        orchestrator.createBrowser({ name: 'chrome', headless: true }),
        orchestrator.createBrowser({ name: 'firefox', headless: true })
      ];
      
      const results = await Promise.all(promises);
      
      expect(results.length).toBe(2);
      expect(orchestrator.getAllBrowsers().length).toBe(2);
    });

    it('should handle concurrent releases', async () => {
      await orchestrator.initialize();
      
      const instance1 = await orchestrator.createBrowser({ name: 'chrome', headless: true });
      const instance2 = await orchestrator.createBrowser({ name: 'firefox', headless: true });
      
      const results = [
        orchestrator.releaseBrowser(instance1.id),
        orchestrator.releaseBrowser(instance2.id)
      ];
      
      expect(results).toEqual([true, true]);
    });
  });
});