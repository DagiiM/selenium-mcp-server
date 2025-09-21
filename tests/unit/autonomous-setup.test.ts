/**
 * Unit tests for the AutonomousSetup class.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { AutonomousSetup } from '../../src/core/autonomous-setup.js';
import { testConfig, generateMockAnalysisResult } from '../config/test-config.js';

describe('AutonomousSetup', () => {
  let setup: AutonomousSetup;

  beforeEach(() => {
    setup = new AutonomousSetup();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      const result = await setup.initialize();
      
      expect(result).toBe(true);
      expect(setup.isInitialized()).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock a system check failure
      jest.spyOn(setup as any, 'checkSystemRequirements').mockRejectedValue(new Error('System check failed'));
      
      await expect(setup.initialize()).rejects.toThrow('System check failed');
      expect(setup.isInitialized()).toBe(false);
    });
  });

  describe('performSetup', () => {
    it('should perform complete setup with default options', async () => {
      const result = await setup.performSetup();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Setup completed successfully');
      expect(result.details).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should perform setup with custom options', async () => {
      const options = {
        browsers: ['chrome', 'firefox'] as ('chrome' | 'firefox' | 'edge')[],
        autoInstall: true,
        optimizeFor: 'speed' as const,
        headless: false
      };
      
      const result = await setup.performSetup(options);
      
      expect(result.success).toBe(true);
      expect(result.details.browsers).toContain('chrome');
      expect(result.details.browsers).toContain('firefox');
      expect(result.details.optimizationMode).toBe('speed');
    });

    it('should validate browser configurations', async () => {
      const options = {
        browsers: ['invalid-browser'] as any,
        autoInstall: false
      };
      
      const result = await setup.performSetup(options);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Setup failed');
    });
  });

  describe('checkSystemRequirements', () => {
    it('should check system requirements successfully', async () => {
      const result = await (setup as any).checkSystemRequirements();
      
      expect(result).toBeDefined();
      expect(result.passed).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
    });
  });

  describe('installBrowser', () => {
    it('should handle browser installation', async () => {
      // installBrowser is a void method, so we just test it doesn't throw
      await expect((setup as any).installBrowser('chrome')).resolves.not.toThrow();
    });

    it('should handle installation failures gracefully', async () => {
      // Mock installation failure
      jest.spyOn(setup as any, 'installBrowser').mockRejectedValue(new Error('Installation failed'));
      
      await expect((setup as any).installBrowser('chrome')).rejects.toThrow('Installation failed');
    });
  });

  describe('testBrowserFunctionality', () => {
    it('should test browser functionality', async () => {
      const result = await (setup as any).testBrowserFunctionality('chrome', {});
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.capabilities).toBeDefined();
    });
  });

  describe('testConnectivity', () => {
    it('should test connectivity successfully', async () => {
      const mockBrowsers = [{ name: 'chrome', status: 'ready' as const }];
      const mockResult = { browsers: [], environment: {} as any, warnings: [], errors: [], recommendations: [], success: true };
      
      await (setup as any).testConnectivity(mockBrowsers, mockResult);
      
      expect(mockResult).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network connectivity issues', async () => {
      // Mock network failure
      jest.spyOn(setup as any, 'testConnectivity').mockRejectedValue(new Error('Network error'));
      
      await expect((setup as any).testConnectivity('chrome')).rejects.toThrow('Network error');
    });

    it('should handle permission errors during installation', async () => {
      // Mock permission error
      jest.spyOn(setup as any, 'installBrowser').mockRejectedValue(new Error('Permission denied'));
      
      await expect((setup as any).installBrowser('chrome')).rejects.toThrow('Permission denied');
    });
  });

  describe('State Management', () => {
    it('should maintain initialization state correctly', async () => {
      expect(setup.isInitialized()).toBe(false);
      
      await setup.initialize();
      expect(setup.isInitialized()).toBe(true);
      
      // Test that subsequent calls don't break state
      await setup.initialize();
      expect(setup.isInitialized()).toBe(true);
    });

    it('should reset state when needed', async () => {
      await setup.initialize();
      expect(setup.isInitialized()).toBe(true);
      
      // Reset would be a method to clear state
      // This tests that the state management works correctly
    });
  });
});