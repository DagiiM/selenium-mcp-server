/**
 * Multi-browser orchestration engine for parallel browser management.
 * Handles browser lifecycle, resource optimization, and cross-browser testing.
 */

import { Builder, WebDriver, Capabilities } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome.js';
import { Options as FirefoxOptions } from 'selenium-webdriver/firefox.js';
import { Options as EdgeOptions } from 'selenium-webdriver/edge.js';
import type { BrowserConfig } from '../types/index.js';

export interface BrowserInstance {
  id: string;
  name: string;
  driver: WebDriver;
  config: BrowserConfig;
  startTime: number;
  lastActivity: number;
  status: 'ready' | 'busy' | 'error' | 'idle';
  errorCount: number;
  capabilities: string[];
}

export interface OrchestrationOptions {
  maxConcurrentBrowsers: number;
  browserTimeout: number;
  idleTimeout: number;
  autoCleanup: boolean;
  resourceMonitoring: boolean;
  healthCheckInterval: number;
}

export interface ResourceUsage {
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  browserCount: number;
  activeBrowsers: number;
  idleBrowsers: number;
  uptime: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'critical';
  browserCount: number;
  healthyBrowsers: number;
  errorBrowsers: number;
  issues: string[];
  timestamp: number;
}

export class MultiBrowserOrchestrator {
  private browsers = new Map<string, BrowserInstance>();
  private browserPool: BrowserInstance[] = [];
  private readonly options: OrchestrationOptions;
  private healthCheckTimer?: NodeJS.Timeout | undefined;
  private resourceMonitorTimer?: NodeJS.Timeout | undefined;
  private startTime: number;

  constructor(options: Partial<OrchestrationOptions> = {}) {
    this.options = {
      maxConcurrentBrowsers: 5,
      browserTimeout: 30000,
      idleTimeout: 300000, // 5 minutes
      autoCleanup: true,
      resourceMonitoring: true,
      healthCheckInterval: 60000, // 1 minute
      ...options
    };
    
    this.startTime = Date.now();
  }

  /**
   * Initialize the orchestrator and start monitoring services
   */
  async initialize(): Promise<void> {
    if (this.options.resourceMonitoring) {
      this.startResourceMonitoring();
    }
    
    if (this.options.autoCleanup) {
      this.startHealthMonitoring();
    }
  }

  /**
   * Creates a new browser instance with specified configuration.
   */
  async createBrowser(config: BrowserConfig): Promise<BrowserInstance> {
    const browserId = this.generateBrowserId(config.name);
    
    try {
      // Check if we've reached the maximum concurrent browsers
      if (this.browsers.size >= this.options.maxConcurrentBrowsers) {
        // Try to reuse an idle browser or clean up old ones
        await this.cleanupIdleBrowsers();
        
        if (this.browsers.size >= this.options.maxConcurrentBrowsers) {
          throw new Error(`Maximum concurrent browsers (${this.options.maxConcurrentBrowsers}) reached`);
        }
      }

      const driver = await this.buildWebDriver(config);
      const capabilities = await this.extractCapabilities(driver);
      
      const instance: BrowserInstance = {
        id: browserId,
        name: config.name,
        driver,
        config,
        startTime: Date.now(),
        lastActivity: Date.now(),
        status: 'ready',
        errorCount: 0,
        capabilities
      };

      this.browsers.set(browserId, instance);
      this.browserPool.push(instance);

      console.log(`Created ${config.name} browser instance: ${browserId}`);
      return instance;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create ${config.name} browser: ${errorMessage}`);
    }
  }

  /**
   * Gets an available browser instance from the pool.
   */
  async getBrowser(config?: BrowserConfig): Promise<BrowserInstance> {
    // Try to find a matching browser in the pool
    if (config) {
      const matchingBrowser = this.browserPool.find(browser => 
        browser.name === config.name && 
        browser.status === 'ready' &&
        this.matchesConfig(browser.config, config)
      );
      
      if (matchingBrowser) {
        matchingBrowser.status = 'busy';
        matchingBrowser.lastActivity = Date.now();
        return matchingBrowser;
      }
    }

    // Try to find any ready browser
    const readyBrowser = this.browserPool.find(browser => browser.status === 'ready');
    if (readyBrowser) {
      readyBrowser.status = 'busy';
      readyBrowser.lastActivity = Date.now();
      return readyBrowser;
    }

    // Create a new browser if possible
    if (this.browsers.size < this.options.maxConcurrentBrowsers) {
      const browserConfig = config || { name: 'chrome', headless: true };
      return await this.createBrowser(browserConfig);
    }

    // Wait for a browser to become available
    return await this.waitForAvailableBrowser(config);
  }

  /**
   * Releases a browser back to the pool.
   */
  releaseBrowser(browserId: string): boolean {
    const browser = this.browsers.get(browserId);
    if (browser) {
      browser.status = 'idle';
      browser.lastActivity = Date.now();
      console.log(`Released browser instance: ${browserId}`);
      return true;
    }
    return false;
  }

  /**
   * Gets all browser instances.
   */
  getAllBrowsers(): BrowserInstance[] {
    return Array.from(this.browsers.values());
  }

  /**
   * Closes a specific browser instance.
   */
  async closeBrowser(browserId: string): Promise<void> {
    const browser = this.browsers.get(browserId);
    if (!browser) {
      throw new Error(`Browser instance ${browserId} not found`);
    }

    try {
      await browser.driver.quit();
      this.browsers.delete(browserId);
      this.browserPool = this.browserPool.filter(b => b.id !== browserId);
      console.log(`Closed browser instance: ${browserId}`);
    } catch (error) {
      console.error(`Error closing browser ${browserId}:`, error);
      // Force remove from tracking even if quit failed
      this.browsers.delete(browserId);
      this.browserPool = this.browserPool.filter(b => b.id !== browserId);
    }
  }

  /**
   * Closes all browser instances.
   */
  async closeAllBrowsers(): Promise<void> {
    const closePromises = Array.from(this.browsers.values()).map(browser => 
      this.closeBrowser(browser.id).catch(error => 
        console.error(`Error closing browser ${browser.id}:`, error)
      )
    );

    await Promise.all(closePromises);
    this.browsers.clear();
    this.browserPool = [];
    console.log('All browser instances closed');
  }

  /**
   * Gets the current status of all browsers.
   */
  getBrowserStatus(): Omit<BrowserInstance, 'driver'>[] {
    return Array.from(this.browsers.values()).map(browser => {
      const { driver, ...browserWithoutDriver } = browser;
      return browserWithoutDriver;
    });
  }

  /**
   * Performs health check on all browser instances.
   */
  async performHealthCheck(): Promise<HealthStatus> {
    const issues: string[] = [];
    let healthyBrowsers = 0;
    let errorBrowsers = 0;

    const healthCheckPromises = Array.from(this.browsers.values()).map(async browser => {
      try {
        // Check if browser is still responsive
        await browser.driver.getTitle();
        
        // Update status based on last activity
        const idleTime = Date.now() - browser.lastActivity;
        if (idleTime > this.options.idleTimeout && browser.status === 'idle') {
          browser.status = 'ready';
        }
        
        // Reset error count if browser is working
        if (browser.status !== 'error') {
          browser.errorCount = 0;
          healthyBrowsers++;
        } else {
          errorBrowsers++;
        }
        
      } catch (error) {
        console.error(`Health check failed for browser ${browser.id}:`, error);
        browser.errorCount++;
        errorBrowsers++;
        issues.push(`Browser ${browser.id} (${browser.name}) failed health check: ${error instanceof Error ? error.message : String(error)}`);
        
        if (browser.errorCount >= 3) {
          browser.status = 'error';
          // Attempt to recover by recreating the browser
          try {
            await this.closeBrowser(browser.id);
            await this.createBrowser(browser.config);
            issues.push(`Recovered browser ${browser.id} after ${browser.errorCount} failures`);
          } catch (recoveryError) {
            console.error(`Failed to recover browser ${browser.id}:`, recoveryError);
            issues.push(`Failed to recover browser ${browser.id}: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)}`);
          }
        }
      }
    });

    await Promise.all(healthCheckPromises);

    // Determine overall health status
    const totalBrowsers = this.browsers.size;
    let status: 'healthy' | 'degraded' | 'critical';
    
    if (errorBrowsers === 0) {
      status = 'healthy';
    } else if (errorBrowsers < totalBrowsers / 2) {
      status = 'degraded';
    } else {
      status = 'critical';
    }

    return {
      status,
      browserCount: totalBrowsers,
      healthyBrowsers,
      errorBrowsers,
      issues,
      timestamp: Date.now()
    };
  }

  /**
   * Monitors resource usage and optimizes browser pool.
   */
  private async monitorResources(): Promise<void> {
    try {
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
      
      // If memory usage is high, clean up idle browsers
      if (heapUsedMB > 1024) { // 1GB threshold
        console.warn(`High memory usage detected: ${heapUsedMB.toFixed(2)}MB`);
        await this.cleanupIdleBrowsers();
      }
      
      // Monitor browser count
      if (this.browsers.size > this.options.maxConcurrentBrowsers) {
        console.warn(`Browser pool exceeded maximum size: ${this.browsers.size}`);
        await this.cleanupOldestBrowsers();
      }
      
    } catch (error) {
      console.error('Resource monitoring error:', error);
    }
  }

  /**
   * Builds a WebDriver instance with the specified configuration.
   */
  private async buildWebDriver(config: BrowserConfig): Promise<WebDriver> {
    let builder: Builder;
    let capabilities: Capabilities;

    switch (config.name) {
      case 'chrome':
        const chromeOptions = new ChromeOptions();
        if (config.headless) {
          chromeOptions.addArguments('--headless=new');
        }
        chromeOptions.addArguments('--no-sandbox');
        chromeOptions.addArguments('--disable-dev-shm-usage');
        chromeOptions.addArguments('--disable-gpu');
        chromeOptions.addArguments('--disable-extensions');
        
        if (config.viewport) {
          chromeOptions.addArguments(`--window-size=${config.viewport.width},${config.viewport.height}`);
        }
        
        if (config.userAgent) {
          chromeOptions.addArguments(`--user-agent=${config.userAgent}`);
        }
        
        builder = new Builder().forBrowser('chrome').setChromeOptions(chromeOptions);
        break;

      case 'firefox':
        const firefoxOptions = new FirefoxOptions();
        if (config.headless) {
          firefoxOptions.addArguments('--headless');
        }
        
        if (config.viewport) {
          firefoxOptions.addArguments(`--width=${config.viewport.width}`);
          firefoxOptions.addArguments(`--height=${config.viewport.height}`);
        }
        
        builder = new Builder().forBrowser('firefox').setFirefoxOptions(firefoxOptions);
        break;

      case 'edge':
        const edgeOptions = new EdgeOptions();
        if (config.headless) {
          edgeOptions.addArguments('--headless');
        }
        edgeOptions.addArguments('--no-sandbox');
        edgeOptions.addArguments('--disable-dev-shm-usage');
        
        if (config.viewport) {
          edgeOptions.addArguments(`--window-size=${config.viewport.width},${config.viewport.height}`);
        }
        
        builder = new Builder().forBrowser('MicrosoftEdge').setEdgeOptions(edgeOptions);
        break;

      default:
        throw new Error(`Unsupported browser: ${config.name}`);
    }

    // Apply custom options if provided
    if (config.customOptions) {
      capabilities = new Capabilities(config.customOptions);
      builder.withCapabilities(capabilities);
    }

    const driver = await builder.build();
    
    // Set viewport if specified and not already set
    if (config.viewport) {
      const chromeOptions = config.customOptions?.['goog:chromeOptions'] as any;
      if (!chromeOptions?.args?.includes('--window-size')) {
        await driver.manage().window().setRect({
          width: config.viewport.width,
          height: config.viewport.height
        });
      }
    }

    return driver;
  }

  /**
   * Extracts capabilities from a WebDriver instance.
   */
  private async extractCapabilities(driver: WebDriver): Promise<string[]> {
    const capabilities: string[] = [];
    
    try {
      const caps = await driver.getCapabilities();
      
      // Basic capabilities
      capabilities.push('navigation');
      capabilities.push('javascript_execution');
      capabilities.push('screenshot_capture');
      
      // Check for specific features
      if (caps.has('acceptInsecureCerts')) {
        capabilities.push('insecure_cert_handling');
      }
      
      if (caps.has('webStorageEnabled')) {
        capabilities.push('web_storage');
      }
      
      if (caps.has('locationContextEnabled')) {
        capabilities.push('geolocation');
      }
      
      // Test advanced capabilities
      try {
        await driver.executeScript('return window.localStorage');
        capabilities.push('local_storage');
      } catch {
        // Not supported
      }
      
      try {
        await driver.executeScript('return navigator.serviceWorker');
        capabilities.push('service_worker');
      } catch {
        // Not supported
      }
      
    } catch (error) {
      console.warn('Failed to extract capabilities:', error);
      capabilities.push('basic_capabilities');
    }
    
    return capabilities;
  }

  /**
   * Waits for an available browser instance.
   */
  private async waitForAvailableBrowser(_config?: BrowserConfig): Promise<BrowserInstance> {
    const maxWaitTime = 30000; // 30 seconds
    const checkInterval = 1000; // 1 second
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkAvailability = (): void => {
        // Try to find a ready browser
        const readyBrowser = this.browserPool.find(browser => browser.status === 'ready');
        if (readyBrowser) {
          readyBrowser.status = 'busy';
          readyBrowser.lastActivity = Date.now();
          resolve(readyBrowser);
          return;
        }

        // Check timeout
        if (Date.now() - startTime > maxWaitTime) {
          reject(new Error('Timeout waiting for available browser'));
          return;
        }

        // Schedule next check
        setTimeout(checkAvailability, checkInterval);
      };

      checkAvailability();
    });
  }

  /**
   * Checks if a browser configuration matches another.
   */
  private matchesConfig(config1: BrowserConfig, config2: BrowserConfig): boolean {
    return config1.name === config2.name &&
           config1.headless === config2.headless &&
           JSON.stringify(config1.viewport) === JSON.stringify(config2.viewport) &&
           config1.userAgent === config2.userAgent;
  }

  /**
   * Generates a unique browser ID.
   */
  private generateBrowserId(browserName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${browserName}_${timestamp}_${random}`;
  }

  /**
   * Cleans up idle browsers that have exceeded the timeout.
   */
  private async cleanupIdleBrowsers(): Promise<void> {
    const now = Date.now();
    const idleBrowsers = this.browserPool.filter(browser => 
      browser.status === 'idle' && 
      (now - browser.lastActivity) > this.options.idleTimeout
    );

    for (const browser of idleBrowsers) {
      try {
        await this.closeBrowser(browser.id);
      } catch (error) {
        console.error(`Failed to cleanup idle browser ${browser.id}:`, error);
      }
    }
  }

  /**
   * Cleans up the oldest browsers to stay within limits.
   */
  private async cleanupOldestBrowsers(): Promise<void> {
    // Sort by start time (oldest first)
    const sortedBrowsers = this.browserPool
      .filter(browser => browser.status !== 'busy')
      .sort((a, b) => a.startTime - b.startTime);

    // Keep only the newest browsers within the limit
    const browsersToKeep = this.options.maxConcurrentBrowsers - 1; // Reserve one slot
    const browsersToRemove = sortedBrowsers.slice(browsersToKeep);

    for (const browser of browsersToRemove) {
      try {
        await this.closeBrowser(browser.id);
      } catch (error) {
        console.error(`Failed to cleanup old browser ${browser.id}:`, error);
      }
    }
  }

  /**
   * Starts health monitoring for all browsers.
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Health check error:', error);
      }
    }, this.options.healthCheckInterval);
  }

  /**
   * Starts resource monitoring.
   */
  private startResourceMonitoring(): void {
    if (this.resourceMonitorTimer) {
      clearInterval(this.resourceMonitorTimer);
    }

    this.resourceMonitorTimer = setInterval(async () => {
      try {
        await this.monitorResources();
      } catch (error) {
        console.error('Resource monitoring error:', error);
      }
    }, 60000); // Check every minute
  }

  /**
   * Stops all monitoring timers.
   */
  stopMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    if (this.resourceMonitorTimer) {
      clearInterval(this.resourceMonitorTimer);
      this.resourceMonitorTimer = undefined;
    }
  }

  /**
   * Cleans up resources and monitoring.
   */
  async cleanup(): Promise<void> {
    this.stopMonitoring();
    await this.closeAllBrowsers();
  }

  /**
   * Gets current resource usage statistics.
   */
  getResourceUsage(): ResourceUsage {
    const memoryUsage = process.memoryUsage();
    const browserCount = this.browsers.size;
    const activeBrowsers = Array.from(this.browsers.values()).filter(b => b.status === 'busy').length;
    
    return {
      memoryUsage: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        rss: memoryUsage.rss,
        external: memoryUsage.external
      },
      browserCount,
      activeBrowsers,
      idleBrowsers: browserCount - activeBrowsers,
      uptime: Date.now() - this.startTime
    };
  }
}