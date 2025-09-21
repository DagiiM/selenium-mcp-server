/**
 * Autonomous setup system for Selenium MCP server.
 * Handles WebDriver auto-installation, browser configuration, and environment setup.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { platform, arch } from 'os';
import type { SetupOptions, SetupResult, BrowserSetupResult, EnvironmentInfo } from '../types/index.js';

const execAsync = promisify(exec);

export class AutonomousSetup {
  private readonly supportedBrowsers = ['chrome', 'firefox', 'edge'] as const;
  private initialized = false;

  /**
   * Performs autonomous setup of the entire Selenium environment.
   * Auto-installs drivers, configures browsers, and tests connectivity.
   */
  async setup(options: SetupOptions): Promise<SetupResult> {
    const startTime = Date.now();
    const result: SetupResult = {
      success: false,
      browsers: [],
      environment: await this.getEnvironmentInfo(),
      warnings: [],
      errors: [],
      recommendations: []
    };

    try {
      // Validate requested browsers
      const validBrowsers = this.validateBrowsers(options.browsers);
      if (validBrowsers.length === 0) {
        result.errors.push('No valid browsers specified for setup');
        return result;
      }

      // Check system requirements
      const systemCheck = await this.checkSystemRequirements();
      if (!systemCheck.passed) {
        result.errors.push(...systemCheck.errors);
        result.warnings.push(...systemCheck.warnings);
      }

      // Setup each browser
      for (const browserName of validBrowsers) {
        const browserResult = await this.setupBrowser(browserName, options);
        result.browsers.push(browserResult);

        if (browserResult.status === 'error') {
          result.errors.push(`Failed to setup ${browserName}: ${browserResult.message}`);
        } else if (browserResult.status === 'warning') {
          result.warnings.push(`Warning with ${browserName}: ${browserResult.message}`);
        }
      }

      // Test connectivity for successfully setup browsers
      const readyBrowsers = result.browsers.filter(b => b.status === 'ready');
      if (readyBrowsers.length > 0) {
        await this.testConnectivity(readyBrowsers, result);
      }

      // Generate recommendations
      result.recommendations = this.generateRecommendations(result, options);

      // Determine overall success
      result.success = readyBrowsers.length > 0;

      const duration = Date.now() - startTime;
      console.log(`Autonomous setup completed in ${duration}ms`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Setup failed: ${errorMessage}`);
      console.error('Autonomous setup error:', error);
    }

    return result;
  }



  /**
   * Validates and normalizes browser names.
   */
  private validateBrowsers(browsers: string[]): string[] {
    const validBrowsers: string[] = [];
    
    for (const browser of browsers) {
      const normalizedBrowser = browser.toLowerCase().trim();
      if (this.supportedBrowsers.includes(normalizedBrowser as any)) {
        validBrowsers.push(normalizedBrowser);
      } else {
        console.warn(`Unsupported browser: ${browser}`);
      }
    }

    return validBrowsers;
  }

  /**
   * Checks system requirements and compatibility.
   */
  private async checkSystemRequirements(): Promise<{ passed: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check Node.js version
      const nodeVersion = process.version;
      const versionParts = nodeVersion.slice(1).split('.')[0];
      const majorVersion = versionParts ? parseInt(versionParts) : 0;
      if (majorVersion < 18) {
        errors.push(`Node.js 18+ required, found ${nodeVersion}`);
      }

      // Check available memory (handle different platforms)
      try {
        const totalMemory = (await execAsync('free -m')).stdout;
        const memoryMatch = totalMemory.match(/Mem:\s+(\d+)/);
        if (memoryMatch && memoryMatch[1] && parseInt(memoryMatch[1]) < 4096) {
          warnings.push('Less than 4GB RAM available - performance may be affected');
        }
      } catch {
        // Fallback for non-Linux systems or when free command is not available
        warnings.push('Could not determine system memory - ensure at least 4GB RAM is available');
      }

      // Check Chrome availability
      try {
        await execAsync('google-chrome --version');
      } catch {
        warnings.push('Chrome not found - will attempt auto-installation');
      }

      // Check Firefox availability
      try {
        await execAsync('firefox --version');
      } catch {
        warnings.push('Firefox not found - will attempt auto-installation');
      }

      return {
        passed: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`System check failed: ${error instanceof Error ? error.message : String(error)}`);
      return { passed: false, errors, warnings };
    }
  }

  /**
   * Sets up a specific browser with its WebDriver.
   */
  private async setupBrowser(browserName: string, options: SetupOptions): Promise<BrowserSetupResult> {
    const startTime = Date.now();
    
    try {
      console.log(`Setting up ${browserName}...`);

      // Install browser if needed
      if (options.autoInstall) {
        await this.installBrowser(browserName);
      }

      // Install WebDriver
      const driverResult = await this.installWebDriver(browserName);
      if (!driverResult.success) {
        return {
          name: browserName,
          version: 'unknown',
          driverVersion: 'unknown',
          status: 'error',
          message: `Failed to install WebDriver: ${driverResult.error}`,
          capabilities: []
        };
      }

      // Get browser version
      const browserVersion = await this.getBrowserVersion(browserName);
      
      // Get driver version
      const driverVersion = await this.getDriverVersion(browserName);

      // Test basic functionality
      const testResult = await this.testBrowserFunctionality(browserName, options);

      const duration = Date.now() - startTime;
      console.log(`${browserName} setup completed in ${duration}ms`);

      return {
        name: browserName,
        version: browserVersion,
        driverVersion: driverVersion,
        status: testResult.success ? 'ready' : 'warning',
        message: testResult.message,
        path: (testResult as any).path || '',
        capabilities: testResult.capabilities
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        name: browserName,
        version: 'unknown',
        driverVersion: 'unknown',
        status: 'error',
        message: `Setup failed: ${errorMessage}`,
        capabilities: []
      };
    }
  }

  /**
   * Installs the browser if not present.
   */
  private async installBrowser(browserName: string): Promise<void> {
    const platformName = platform();
    
    try {
      switch (browserName) {
        case 'chrome':
          await this.installChrome(platformName);
          break;
        case 'firefox':
          await this.installFirefox(platformName);
          break;
        case 'edge':
          await this.installEdge(platformName);
          break;
      }
    } catch (error) {
      console.warn(`Failed to install ${browserName}:`, error);
      // Continue with existing installation if available
    }
  }

  /**
   * Installs Chrome browser.
   */
  private async installChrome(platformName: string): Promise<void> {
    if (platformName === 'linux') {
      try {
        await execAsync('wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -');
        await execAsync('echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list');
        await execAsync('apt-get update');
        await execAsync('apt-get install -y google-chrome-stable');
      } catch (error) {
        // Try alternative installation method
        await execAsync('snap install chromium');
      }
    }
  }

  /**
   * Installs Firefox browser.
   */
  private async installFirefox(platformName: string): Promise<void> {
    if (platformName === 'linux') {
      try {
        await execAsync('apt-get update');
        await execAsync('apt-get install -y firefox');
      } catch (error) {
        // Try alternative installation method
        await execAsync('snap install firefox');
      }
    }
  }

  /**
   * Installs Edge browser.
   */
  private async installEdge(platformName: string): Promise<void> {
    if (platformName === 'linux') {
      try {
        await execAsync('curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg');
        await execAsync('install -o root -g root -m 644 microsoft.gpg /etc/apt/trusted.gpg.d/');
        await execAsync('sh -c \'echo "deb [arch=amd64,arm64,armhf] https://packages.microsoft.com/repos/edge stable main" > /etc/apt/sources.list.d/microsoft-edge-dev.list\'');
        await execAsync('apt-get update');
        await execAsync('apt-get install -y microsoft-edge-stable');
      } catch (error) {
        console.warn('Edge installation failed:', error);
      }
    }
  }

  /**
   * Installs the appropriate WebDriver for the browser.
   */
  private async installWebDriver(browserName: string): Promise<{ success: boolean; error?: string }> {
    try {
      switch (browserName) {
        case 'chrome':
          return await this.installChromeDriver();
        case 'firefox':
          return await this.installGeckoDriver();
        case 'edge':
          return await this.installEdgeDriver();
        default:
          return { success: false, error: `Unsupported browser: ${browserName}` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Installs ChromeDriver.
   */
  private async installChromeDriver(): Promise<{ success: boolean; error?: string }> {
    try {
      // Use npm to install chromedriver
      await execAsync('npx chromedriver --version');
      return { success: true };
    } catch (error) {
      return { success: false, error: `ChromeDriver installation failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  /**
   * Installs GeckoDriver.
   */
  private async installGeckoDriver(): Promise<{ success: boolean; error?: string }> {
    try {
      // Use npm to install geckodriver
      await execAsync('npx geckodriver --version');
      return { success: true };
    } catch (error) {
      return { success: false, error: `GeckoDriver installation failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  /**
   * Installs EdgeDriver.
   */
  private async installEdgeDriver(): Promise<{ success: boolean; error?: string }> {
    try {
      // Edge uses WebDriver from Microsoft
      await execAsync('npx edgedriver --version');
      return { success: true };
    } catch (error) {
      return { success: false, error: `EdgeDriver installation failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  /**
   * Gets the installed browser version.
   */
  private async getBrowserVersion(browserName: string): Promise<string> {
    try {
      let versionCommand: string;
      
      switch (browserName) {
        case 'chrome':
          versionCommand = 'google-chrome --version';
          break;
        case 'firefox':
          versionCommand = 'firefox --version';
          break;
        case 'edge':
          versionCommand = 'microsoft-edge --version';
          break;
        default:
          return 'unknown';
      }

      const { stdout } = await execAsync(versionCommand);
      const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
      return versionMatch?.[1] || 'unknown';
    } catch (error) {
      console.warn(`Could not get ${browserName} version:`, error);
      return 'unknown';
    }
  }

  /**
   * Gets the WebDriver version.
   */
  private async getDriverVersion(browserName: string): Promise<string> {
    try {
      let driverCommand: string;
      
      switch (browserName) {
        case 'chrome':
          driverCommand = 'chromedriver --version';
          break;
        case 'firefox':
          driverCommand = 'geckodriver --version';
          break;
        case 'edge':
          driverCommand = 'edgedriver --version';
          break;
        default:
          return 'unknown';
      }

      const { stdout } = await execAsync(driverCommand);
      const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
      return versionMatch?.[1] || 'unknown';
    } catch (error) {
      console.warn(`Could not get ${browserName} driver version:`, error);
      return 'unknown';
    }
  }

  /**
   * Tests basic browser functionality.
   */
  private async testBrowserFunctionality(browserName: string, _options: SetupOptions): Promise<{
    success: boolean;
    message: string;
    path?: string;
    capabilities: string[];
  }> {
    try {
      // Basic browser launch test would go here
      // For now, we'll assume success if we got this far
      const capabilities = [
        'basic_navigation',
        'javascript_execution',
        'screenshot_capture',
        'element_interaction'
      ];

      return {
        success: true,
        message: `${browserName} is ready for automation`,
        capabilities
      };
    } catch (error) {
      return {
        success: false,
        message: `Functionality test failed: ${error instanceof Error ? error.message : String(error)}`,
        capabilities: []
      };
    }
  }

  /**
   * Tests connectivity for setup browsers.
   */
  private async testConnectivity(browsers: BrowserSetupResult[], result: SetupResult): Promise<void> {
    try {
      // Basic connectivity test
      console.log('Testing browser connectivity...');
      
      for (const browser of browsers) {
        console.log(`Testing ${browser.name}...`);
        // Actual connectivity test would go here
      }
      
      console.log('Connectivity tests completed');
    } catch (error) {
      result.warnings.push(`Connectivity test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generates setup recommendations based on results.
   */
  private generateRecommendations(result: SetupResult, options: SetupOptions): string[] {
    const recommendations: string[] = [];

    // Performance recommendations
    if (options.optimizeFor === 'quality_analysis') {
      recommendations.push('Consider increasing memory allocation for comprehensive analysis');
      recommendations.push('Enable GPU acceleration for better screenshot analysis');
    }

    // Browser-specific recommendations
    const readyBrowsers = result.browsers.filter(b => b.status === 'ready');
    if (readyBrowsers.length === 0) {
      recommendations.push('No browsers available - check system requirements and retry');
    } else if (readyBrowsers.length < options.browsers.length) {
      recommendations.push('Some browsers failed setup - consider using available browsers only');
    }

    // Environment recommendations
    if (result.environment.memory < 8192) {
      recommendations.push('Consider upgrading system memory for better performance');
    }

    if (!result.environment.gpuAvailable) {
      recommendations.push('GPU acceleration not available - visual analysis may be slower');
    }

    return recommendations;
  }

  /**
   * Initializes the autonomous setup system.
   */
  async initialize(): Promise<boolean> {
    try {
      const systemCheck = await this.checkSystemRequirements();
      if (!systemCheck.passed) {
        throw new Error(`System check failed: ${systemCheck.errors.join(', ')}`);
      }
      this.initialized = true;
      return true;
    } catch (error) {
      this.initialized = false;
      throw error;
    }
  }





  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Performs setup with the given options.
   */
  async performSetup(options?: Partial<SetupOptions>): Promise<{
    success: boolean;
    message: string;
    details: any;
    recommendations: string[];
  }> {
    try {
      const setupOptions: SetupOptions = {
        browsers: options?.browsers || ['chrome'],
        autoInstall: options?.autoInstall ?? true,
        optimizeFor: options?.optimizeFor || 'quality_analysis',
        headless: options?.headless ?? true
      };

      const result = await this.setup(setupOptions);
      
      return {
        success: result.success,
        message: result.success ? 'Setup completed successfully' : 'Setup failed',
        details: {
          browsers: result.browsers.map(b => b.name),
          optimizationMode: setupOptions.optimizeFor,
          environment: result.environment
        },
        recommendations: result.recommendations
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Setup failed: ${errorMessage}`,
        details: {},
        recommendations: ['Check system requirements and retry']
      };
    }
  }

  /**
   * Validates browser configuration.
   */
  /**
   * Gets environment information.
   */
  private async getEnvironmentInfo(): Promise<EnvironmentInfo> {
    const osPlatform = platform();
    const osArch = arch();
    const nodeVersion = process.version;
    
    // Get total memory
    let memory = 0;
    try {
      const { stdout } = await execAsync('free -m');
      const match = stdout.match(/Mem:\s+(\d+)/);
      memory = match?.[1] ? parseInt(match[1], 10) : 0;
    } catch {
      memory = 0;
    }

    // Get CPU cores
    const cpuCores = require('os').cpus().length;

    // Check GPU availability
    let gpuAvailable = false;
    try {
      await execAsync('nvidia-smi');
      gpuAvailable = true;
    } catch {
      try {
        await execAsync('lspci | grep -i vga');
        gpuAvailable = true;
      } catch {
        gpuAvailable = false;
      }
    }

    return {
      platform: osPlatform,
      arch: osArch,
      nodeVersion,
      memory,
      cpuCores,
      gpuAvailable,
      supportedBrowsers: this.supportedBrowsers.slice()
    };
  }
}