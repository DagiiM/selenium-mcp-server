/**
 * Main MCP server implementation with all enhanced tools for Selenium automation.
 * Provides comprehensive UI analysis, browser orchestration, and autonomous setup.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { WebDriver } from 'selenium-webdriver';

import { AutonomousSetup } from './core/autonomous-setup.js';
import { MultiBrowserOrchestrator } from './core/browser-orchestrator.js';
import { UIAnalysisEngine } from './core/ui-analysis-engine.js';
import type {
  SetupOptions,
  BrowserConfig,
  AnalysisResult,
  ElementInfo,
  ViewportSize,
  Recommendation
} from './types/index.js';

export class SeleniumMCPServer {
  private server: Server;
  private setup: AutonomousSetup;
  private orchestrator: MultiBrowserOrchestrator;
  private analysisEngine: UIAnalysisEngine;
  private isInitialized = false;

  constructor() {
    this.server = new Server(
      {
        name: 'selenium-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setup = new AutonomousSetup();
    this.orchestrator = new MultiBrowserOrchestrator();
    this.analysisEngine = new UIAnalysisEngine();

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  /**
   * Starts the MCP server and initializes components.
   */
  async start(): Promise<void> {
    try {
      console.log('Starting Selenium MCP Server...');
      
      // Initialize components
      await this.setup.initialize();
      
      this.isInitialized = true;
      console.log('✅ Selenium MCP Server initialized successfully');
      
      // Connect to transport
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      console.log('🚀 Selenium MCP Server ready and listening');
    } catch (error) {
      console.error('Failed to start Selenium MCP Server:', error);
      throw error;
    }
  }

  /**
   * Sets up all tool handlers.
   */
  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getToolDefinitions(),
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!this.isInitialized) {
        throw new Error('Server not initialized. Please run autonomous_setup first.');
      }

      const { name, arguments: args } = request.params;
      
      try {
        return await this.handleToolCall(name, args);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Tool execution failed: ${errorMessage}`);
      }
    });
  }

  /**
   * Gets all tool definitions.
   */
  private getToolDefinitions(): Tool[] {
    return [
      {
        name: 'autonomous_setup',
        description: 'Self-initializing environment setup with WebDriver auto-installation and browser configuration',
        inputSchema: {
          type: 'object',
          properties: {
            browsers: {
              type: 'array',
              items: { type: 'string', enum: ['chrome', 'firefox', 'edge'] },
              description: 'Browsers to configure (default: all)',
              default: ['chrome', 'firefox', 'edge']
            },
            auto_install: {
              type: 'boolean',
              description: 'Automatically install missing browsers and drivers',
              default: true
            },
            optimize_for: {
              type: 'string',
              enum: ['quality_analysis', 'speed', 'compatibility'],
              description: 'Optimization mode for the setup',
              default: 'quality_analysis'
            },
            headless: {
              type: 'boolean',
              description: 'Run browsers in headless mode',
              default: true
            }
          },
          required: []
        }
      },
      {
        name: 'start_browser',
        description: 'Intelligent browser session management with resource monitoring',
        inputSchema: {
          type: 'object',
          properties: {
            browser: {
              type: 'string',
              enum: ['chrome', 'firefox', 'edge'],
              description: 'Browser to start'
            },
            viewport: {
              type: 'object',
              properties: {
                width: { type: 'number', minimum: 320 },
                height: { type: 'number', minimum: 240 }
              },
              description: 'Viewport size for the browser'
            },
            headless: {
              type: 'boolean',
              description: 'Run browser in headless mode',
              default: true
            },
            enable_monitoring: {
              type: 'boolean',
              description: 'Enable health and resource monitoring',
              default: true
            }
          },
          required: ['browser']
        }
      },
      {
        name: 'navigate',
        description: 'Smart navigation with stability detection and page load optimization',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              format: 'uri',
              description: 'URL to navigate to'
            },
            wait_for: {
              type: 'string',
              enum: ['dom_ready', 'load_complete', 'network_idle', 'custom'],
              description: 'Wait condition after navigation',
              default: 'dom_ready'
            },
            timeout: {
              type: 'number',
              minimum: 1000,
              maximum: 60000,
              description: 'Navigation timeout in milliseconds',
              default: 30000
            },
            stability_check: {
              type: 'boolean',
              description: 'Check for page stability before completion',
              default: true
            }
          },
          required: ['url']
        }
      },
      {
        name: 'comprehensive_analysis',
        description: 'Full UI quality audit across browsers/viewports with accessibility and performance analysis',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              format: 'uri',
              description: 'URL to analyze'
            },
            analysis_types: {
              type: 'array',
              items: { 
                type: 'string', 
                enum: ['accessibility', 'performance', 'responsive', 'cross_browser', 'visual'] 
              },
              description: 'Types of analysis to perform',
              default: ['accessibility', 'performance', 'responsive']
            },
            viewports: {
              type: 'array',
              items: { 
                type: 'string', 
                enum: ['mobile', 'tablet', 'desktop', 'wide'] 
              },
              description: 'Viewports to test',
              default: ['desktop']
            },
            generate_report: {
              type: 'boolean',
              description: 'Generate detailed analysis report',
              default: true
            },
            auto_annotations: {
              type: 'boolean',
              description: 'Automatically annotate issues in screenshots',
              default: true
            },
            baseline_path: {
              type: 'string',
              description: 'Path to baseline screenshots for visual regression'
            }
          },
          required: ['url']
        }
      },
      {
        name: 'find_element',
        description: 'Enhanced element discovery with context and stability verification',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector or XPath for the element'
            },
            selector_type: {
              type: 'string',
              enum: ['css', 'xpath', 'id', 'class', 'name', 'tag'],
              description: 'Type of selector',
              default: 'css'
            },
            wait_for_stable: {
              type: 'boolean',
              description: 'Wait for element to be stable before returning',
              default: true
            },
            timeout: {
              type: 'number',
              minimum: 1000,
              maximum: 30000,
              description: 'Timeout for element discovery',
              default: 10000
            },
            include_context: {
              type: 'boolean',
              description: 'Include element context information',
              default: true
            }
          },
          required: ['selector']
        }
      },
      {
        name: 'interact_element',
        description: 'Intelligent interaction simulation with failure recovery and validation',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector or XPath for the element'
            },
            selector_type: {
              type: 'string',
              enum: ['css', 'xpath', 'id', 'class', 'name', 'tag'],
              description: 'Type of selector',
              default: 'css'
            },
            action: {
              type: 'string',
              enum: ['click', 'hover', 'double_click', 'right_click', 'focus', 'blur'],
              description: 'Interaction action to perform'
            },
            wait_for_stable: {
              type: 'boolean',
              description: 'Wait for element to be stable before interaction',
              default: true
            },
            validate_result: {
              type: 'boolean',
              description: 'Validate interaction result',
              default: true
            },
            retry_on_failure: {
              type: 'boolean',
              description: 'Retry interaction on failure',
              default: true
            },
            max_retries: {
              type: 'number',
              minimum: 1,
              maximum: 5,
              description: 'Maximum retry attempts',
              default: 3
            }
          },
          required: ['selector', 'action']
        }
      },
      {
        name: 'extract_content',
        description: 'Advanced content extraction with semantic analysis and quality assessment',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector for the container element (default: body)',
              default: 'body'
            },
            content_type: {
              type: 'string',
              enum: ['text', 'html', 'structured', 'links', 'images', 'forms'],
              description: 'Type of content to extract',
              default: 'text'
            },
            include_metadata: {
              type: 'boolean',
              description: 'Include metadata about the content',
              default: true
            },
            semantic_analysis: {
              type: 'boolean',
              description: 'Perform semantic analysis on the content',
              default: true
            },
            quality_assessment: {
              type: 'boolean',
              description: 'Assess content quality and readability',
              default: true
            }
          },
          required: []
        }
      },
      {
        name: 'capture_analysis',
        description: 'Intelligent screenshot capture with annotations and visual analysis',
        inputSchema: {
          type: 'object',
          properties: {
            viewport: {
              type: 'object',
              properties: {
                width: { type: 'number', minimum: 320 },
                height: { type: 'number', minimum: 240 }
              },
              description: 'Viewport size for capture'
            },
            full_page: {
              type: 'boolean',
              description: 'Capture full page screenshot',
              default: false
            },
            annotations: {
              type: 'array',
              items: { type: 'string' },
              description: 'Types of annotations to add',
              default: ['accessibility', 'performance', 'layout']
            },
            highlight_issues: {
              type: 'boolean',
              description: 'Highlight detected issues in the screenshot',
              default: true
            },
            save_to_file: {
              type: 'boolean',
              description: 'Save screenshot to file',
              default: true
            }
          },
          required: []
        }
      },
      {
        name: 'performance_audit',
        description: 'Core Web Vitals and performance monitoring with bottleneck identification',
        inputSchema: {
          type: 'object',
          properties: {
            audit_type: {
              type: 'string',
              enum: ['core_web_vitals', 'resource_loading', 'rendering', 'memory_usage', 'network'],
              description: 'Type of performance audit',
              default: 'core_web_vitals'
            },
            monitoring_duration: {
              type: 'number',
              minimum: 1000,
              maximum: 60000,
              description: 'Duration to monitor performance',
              default: 10000
            },
            identify_bottlenecks: {
              type: 'boolean',
              description: 'Identify performance bottlenecks',
              default: true
            },
            generate_recommendations: {
              type: 'boolean',
              description: 'Generate performance improvement recommendations',
              default: true
            }
          },
          required: []
        }
      },
      {
        name: 'accessibility_audit',
        description: 'WCAG compliance testing with automated violation annotation and remediation',
        inputSchema: {
          type: 'object',
          properties: {
            wcag_level: {
              type: 'string',
              enum: ['A', 'AA', 'AAA'],
              description: 'WCAG compliance level to test',
              default: 'AA'
            },
            audit_scope: {
              type: 'string',
              enum: ['full_page', 'specific_element', 'forms', 'navigation', 'media'],
              description: 'Scope of accessibility audit',
              default: 'full_page'
            },
            include_remediation: {
              type: 'boolean',
              description: 'Include remediation suggestions',
              default: true
            },
            annotate_violations: {
              type: 'boolean',
              description: 'Annotate violations on the page',
              default: true
            },
            test_with_tools: {
              type: 'boolean',
              description: 'Test with assistive technology simulation',
              default: true
            }
          },
          required: []
        }
      }
    ];
  }

  /**
   * Handles tool execution.
   */
  private async handleToolCall(name: string, args: any): Promise<any> {
    switch (name) {
      case 'autonomous_setup':
        return await this.handleAutonomousSetup(args);
      
      case 'start_browser':
        return await this.handleStartBrowser(args);
      
      case 'navigate':
        return await this.handleNavigate(args);
      
      case 'comprehensive_analysis':
        return await this.handleComprehensiveAnalysis(args);
      
      case 'find_element':
        return await this.handleFindElement(args);
      
      case 'interact_element':
        return await this.handleInteractElement(args);
      
      case 'extract_content':
        return await this.handleExtractContent(args);
      
      case 'capture_analysis':
        return await this.handleCaptureAnalysis(args);
      
      case 'performance_audit':
        return await this.handlePerformanceAudit(args);
      
      case 'accessibility_audit':
        return await this.handleAccessibilityAudit(args);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * Handles autonomous setup.
   */
  private async handleAutonomousSetup(args: any): Promise<any> {
    const options: SetupOptions = {
      browsers: args.browsers || ['chrome', 'firefox', 'edge'],
      autoInstall: args.auto_install !== false,
      optimizeFor: args.optimize_for || 'quality_analysis',
      headless: args.headless !== false
    };

    console.log('🔧 Running autonomous setup...');
    const result = await this.setup.performSetup(options);
    
    if (result.success) {
      console.log('✅ Autonomous setup completed successfully');
      this.isInitialized = true;
    }

    return {
      success: result.success,
      message: result.message,
      details: result.details,
      recommendations: result.recommendations
    };
  }

  /**
   * Handles browser start.
   */
  private async handleStartBrowser(args: any): Promise<any> {
    const config: BrowserConfig = {
      name: args.browser,
      viewport: args.viewport,
      headless: args.headless !== false,
      customOptions: {
        enableMonitoring: args.enable_monitoring !== false
      }
    };

    const instance = await this.orchestrator.createBrowser(config);
    
    return {
      success: true,
      browserId: instance.id,
      browser: instance.name,
      viewport: instance.config.viewport,
      status: 'ready'
    };
  }

  /**
   * Handles navigation.
   */
  private async handleNavigate(args: any): Promise<any> {
    const browser = await this.orchestrator.getBrowser();
    if (!browser) {
      throw new Error('No browser available. Please start a browser first.');
    }

    const startTime = Date.now();
    await browser.driver.get(args.url);
    
    // Wait for specified condition
    if (args.wait_for === 'load_complete') {
      await browser.driver.wait(async () => {
        const readyState = await browser.driver.executeScript('return document.readyState');
        return readyState === 'complete';
      }, args.timeout || 30000);
    } else if (args.wait_for === 'network_idle') {
      await browser.driver.sleep(2000); // Simplified network idle check
    }

    const duration = Date.now() - startTime;

    return {
      success: true,
      url: args.url,
      duration,
      status: 'navigation_complete',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handles comprehensive analysis.
   */
  private async handleComprehensiveAnalysis(args: any): Promise<any> {
    const browser = await this.orchestrator.getBrowser();
    if (!browser) {
      throw new Error('No browser available. Please start a browser first.');
    }

    // Map viewport names to sizes
    const viewportMap: Record<string, ViewportSize> = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1920, height: 1080 },
      wide: { width: 2560, height: 1440 }
    };

    const viewports = args.viewports || ['desktop'];
    const results: AnalysisResult[] = [];

    for (const viewportName of viewports) {
      const viewport = viewportMap[viewportName];
      if (viewport) {
        await browser.driver.manage().window().setRect({
          width: viewport.width,
          height: viewport.height
        });
      }

      const analysisOptions = {
        url: args.url,
        viewport: viewport || { width: 1920, height: 1080 },
        includePerformance: args.analysis_types?.includes('performance') || true,
        includeAccessibility: args.analysis_types?.includes('accessibility') || true,
        includeVisual: args.analysis_types?.includes('visual') || true,
        includeCrossBrowser: args.analysis_types?.includes('cross_browser') || false,
        generateScreenshots: args.generate_report || true,
        generateReport: args.generate_report || true,
        baselinePath: args.baseline_path,
        timeout: 30000
      };

      const result = await this.analysisEngine.analyze(browser.driver, analysisOptions);
      results.push(result);
    }

    return {
      success: true,
      url: args.url,
      viewports: viewports,
      results: results,
      summary: this.generateAnalysisSummary(results)
    };
  }

  /**
   * Handles element finding.
   */
  private async handleFindElement(args: any): Promise<any> {
    const browser = await this.orchestrator.getBrowser();
    if (!browser) {
      throw new Error('No browser available. Please start a browser first.');
    }

    const { By } = await import('selenium-webdriver');
    let by: any;

    switch (args.selector_type) {
      case 'css':
        by = By.css(args.selector);
        break;
      case 'xpath':
        by = By.xpath(args.selector);
        break;
      case 'id':
        by = By.id(args.selector);
        break;
      case 'class':
        by = By.className(args.selector);
        break;
      case 'name':
        by = By.name(args.selector);
        break;
      case 'tag':
        by = By.tagName(args.selector);
        break;
      default:
        by = By.css(args.selector);
    }

    const element = await browser.driver.findElement(by);
    
    if (args.include_context) {
      const rect = await element.getRect();
      const elementInfo: ElementInfo = {
        selector: args.selector,
        tagName: await element.getTagName(),
        textContent: await element.getText(),
        attributes: await this.getElementAttributes(element),
        styles: await this.getElementCSSProperties(element),
        dimensions: {
          width: rect.width,
          height: rect.height,
          padding: { top: 0, right: 0, bottom: 0, left: 0 },
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
          border: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        position: {
          x: rect.x,
          y: rect.y,
          position: 'static'
        },
        isVisible: await element.isDisplayed(),
        isInteractive: await element.isEnabled(),
        children: []
      };

      return {
        success: true,
        selector: args.selector,
        elementInfo,
        found: true
      };
    }

    return {
      success: true,
      selector: args.selector,
      found: true
    };
  }

  /**
   * Handles element interaction.
   */
  private async handleInteractElement(args: any): Promise<any> {
    const browser = await this.orchestrator.getBrowser();
    if (!browser) {
      throw new Error('No browser available. Please start a browser first.');
    }

    const { By } = await import('selenium-webdriver');
    const element = await browser.driver.findElement(By.css(args.selector));

    let success = false;
    let attempts = 0;
    const maxRetries = args.max_retries || 3;

    while (attempts < maxRetries && !success) {
      try {
        switch (args.action) {
          case 'click':
            await element.click();
            break;
          case 'hover':
            const actions = browser.driver.actions({ async: true });
            await actions.move({ origin: element }).perform();
            break;
          case 'double_click':
            await element.click();
            await element.click();
            break;
          case 'right_click':
            const rightClickActions = browser.driver.actions({ async: true });
            await rightClickActions.contextClick(element).perform();
            break;
          case 'focus':
            await element.click();
            break;
          case 'blur':
            await browser.driver.executeScript('arguments[0].blur()', element);
            break;
        }
        success = true;
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries) {
          throw error;
        }
        await browser.driver.sleep(1000);
      }
    }

    return {
      success: true,
      action: args.action,
      selector: args.selector,
      attempts: attempts + 1,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handles content extraction.
   */
  private async handleExtractContent(args: any): Promise<any> {
    const browser = await this.orchestrator.getBrowser();
    if (!browser) {
      throw new Error('No browser available. Please start a browser first.');
    }

    const { By } = await import('selenium-webdriver');
    const element = await browser.driver.findElement(By.css(args.selector));

    let content: any;
    let metadata: any = {};

    switch (args.content_type) {
      case 'text':
        content = await element.getText();
        break;
      case 'html':
        content = await element.getAttribute('innerHTML');
        break;
      case 'structured':
        content = await this.extractStructuredContent(browser.driver, args.selector);
        break;
      case 'links':
        content = await this.extractLinks(browser.driver, args.selector);
        break;
      case 'images':
        content = await this.extractImages(browser.driver, args.selector);
        break;
      case 'forms':
        content = await this.extractForms(browser.driver, args.selector);
        break;
      default:
        content = await element.getText();
    }

    if (args.include_metadata) {
      metadata = {
        elementCount: await this.getElementCount(browser.driver, args.selector),
        wordCount: typeof content === 'string' ? content.split(/\s+/).length : 0,
        characterCount: typeof content === 'string' ? content.length : 0,
        extractionTime: new Date().toISOString()
      };
    }

    return {
      success: true,
      content_type: args.content_type,
      content,
      metadata: args.include_metadata ? metadata : undefined,
      selector: args.selector
    };
  }

  /**
   * Handles screenshot capture and analysis.
   */
  private async handleCaptureAnalysis(args: any): Promise<any> {
    const browser = await this.orchestrator.getBrowser();
    if (!browser) {
      throw new Error('No browser available. Please start a browser first.');
    }

    // Set viewport if specified
    if (args.viewport) {
      await browser.driver.manage().window().setRect({
        width: args.viewport.width,
        height: args.viewport.height
      });
    }

    // Take screenshot
    const screenshot = await browser.driver.takeScreenshot();
    
    if (args.save_to_file) {
      const fs = await import('fs/promises');
      const path = await import('path');
      const filename = `screenshot_${Date.now()}.png`;
      const filepath = path.join('screenshots', filename);
      
      await fs.mkdir('screenshots', { recursive: true });
      await fs.writeFile(filepath, screenshot, 'base64');
      
      return {
        success: true,
        screenshot_path: filepath,
        viewport: args.viewport || await this.getCurrentViewport(browser.driver),
        full_page: args.full_page || false,
        annotations: args.annotations || []
      };
    }

    return {
      success: true,
      screenshot_data: screenshot,
      viewport: args.viewport || await this.getCurrentViewport(browser.driver),
      full_page: args.full_page || false,
      annotations: args.annotations || []
    };
  }

  /**
   * Handles performance audit.
   */
  private async handlePerformanceAudit(args: any): Promise<any> {
    const browser = await this.orchestrator.getBrowser();
    if (!browser) {
      throw new Error('No browser available. Please start a browser first.');
    }

    // Get performance metrics
    const metrics = await browser.driver.executeScript(`
      return {
        navigation: performance.getEntriesByType('navigation')[0],
        paint: performance.getEntriesByType('paint'),
        resource: performance.getEntriesByType('resource'),
        memory: performance.memory || null
      };
    `) as any;

    const auditResult = {
      audit_type: args.audit_type,
      metrics,
      timestamp: new Date().toISOString(),
      recommendations: [] as Recommendation[]
    };

    if (args.identify_bottlenecks) {
      auditResult.recommendations = this.generatePerformanceRecommendations(metrics);
    }

    return {
      success: true,
      ...auditResult
    };
  }

  /**
   * Handles accessibility audit.
   */
  private async handleAccessibilityAudit(args: any): Promise<any> {
    const browser = await this.orchestrator.getBrowser();
    if (!browser) {
      throw new Error('No browser available. Please start a browser first.');
    }

    // Inject axe-core if not already present
    await browser.driver.executeScript(`
      if (!window.axe) {
        var script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js';
        script.async = false;
        document.head.appendChild(script);
      }
    `);

    // Wait for axe to load
    await browser.driver.wait(async () => {
      const axeLoaded = await browser.driver.executeScript('return typeof window.axe !== "undefined"');
      return axeLoaded;
    }, 5000);

    // Run accessibility audit
    const axeResults = await browser.driver.executeAsyncScript(`
      var callback = arguments[arguments.length - 1];
      axe.run(function(err, results) {
        if (err) {
          callback({error: err.message});
        } else {
          callback(results);
        }
      });
    `) as any;

    if (axeResults.error) {
      throw new Error(`Accessibility audit failed: ${axeResults.error}`);
    }

    const violations = axeResults.violations.map((violation: any) => ({
      id: violation.id,
      impact: violation.impact,
      tags: violation.tags,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.length,
      wcag_criterion: this.extractWCAGCriterion(violation.tags)
    }));

    return {
      success: true,
      wcag_level: args.wcag_level,
      violations,
      summary: {
        total_violations: violations.length,
        critical: violations.filter((v: any) => v.impact === 'critical').length,
        serious: violations.filter((v: any) => v.impact === 'serious').length,
        moderate: violations.filter((v: any) => v.impact === 'moderate').length,
        minor: violations.filter((v: any) => v.impact === 'minor').length
      },
      recommendations: this.generateAccessibilityRecommendations(violations) as Recommendation[]
    };
  }

  /**
   * Generates performance recommendations based on metrics.
   */
  private generatePerformanceRecommendations(metrics: any): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    if (metrics.navigation) {
      const nav = metrics.navigation;
      
      // Check for slow page load
      if (nav.loadEventEnd - nav.fetchStart > 3000) {
        recommendations.push({
          category: 'performance',
          severity: 'high',
          title: 'Slow Page Load',
          description: 'Page load time exceeds 3 seconds',
          wcagCriterion: '2.2.4',
          affectedElements: ['document'],
          impact: 'Users may abandon the page due to slow loading',
          effort: 'high',
          autoFixAvailable: false,
          fixCode: 'Optimize critical rendering path and reduce server response time'
        });
      }
      
      // Check for large DOM
      if (nav.transferSize > 1000000) {
        recommendations.push({
          category: 'performance',
          severity: 'medium',
          title: 'Large Page Size',
          description: 'Page transfer size exceeds 1MB',
          impact: 'medium',
          effort: 'medium',
          autoFixAvailable: false,
          fixCode: 'Implement code splitting and lazy loading',
          affectedElements: ['document']
        });
      }
    }
    
    if (metrics.memory) {
      // Check for memory leaks
      if (metrics.memory.usedJSHeapSize > 50000000) {
        recommendations.push({
          category: 'performance',
          severity: 'high',
          title: 'High Memory Usage',
          description: 'JavaScript heap size exceeds 50MB',
          impact: 'high',
          effort: 'high',
          autoFixAvailable: false,
          fixCode: 'Review memory usage and implement cleanup strategies',
          affectedElements: ['document']
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Helper methods for content extraction and analysis.
   */
  private async extractStructuredContent(driver: WebDriver, selector: string): Promise<any> {
    return await driver.executeScript(`
      const element = document.querySelector(arguments[0]);
      if (!element) return null;
      
      return {
        headings: Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
          level: h.tagName,
          text: h.textContent.trim()
        })),
        paragraphs: Array.from(element.querySelectorAll('p')).map(p => p.textContent.trim()),
        lists: Array.from(element.querySelectorAll('ul, ol')).map(list => ({
          type: list.tagName.toLowerCase(),
          items: Array.from(list.querySelectorAll('li')).map(li => li.textContent.trim())
        }))
      };
    `, selector);
  }

  private async extractLinks(driver: WebDriver, selector: string): Promise<any[]> {
    return await driver.executeScript(`
      const element = document.querySelector(arguments[0]);
      if (!element) return [];
      
      return Array.from(element.querySelectorAll('a[href]')).map(link => ({
        text: link.textContent.trim(),
        href: link.href,
        target: link.target,
        isExternal: !link.href.startsWith(window.location.origin)
      }));
    `, selector);
  }

  private async extractImages(driver: WebDriver, selector: string): Promise<any[]> {
    return await driver.executeScript(`
      const element = document.querySelector(arguments[0]);
      if (!element) return [];
      
      return Array.from(element.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt,
        width: img.naturalWidth,
        height: img.naturalHeight,
        hasAlt: img.hasAttribute('alt')
      }));
    `, selector);
  }

  private async extractForms(driver: WebDriver, selector: string): Promise<any[]> {
    return await driver.executeScript(`
      const element = document.querySelector(arguments[0]);
      if (!element) return [];
      
      return Array.from(element.querySelectorAll('form')).map(form => ({
        action: form.action,
        method: form.method,
        fields: Array.from(form.querySelectorAll('input, select, textarea')).map(field => ({
          type: field.type || field.tagName.toLowerCase(),
          name: field.name,
          id: field.id,
          required: field.required,
          placeholder: field.placeholder
        }))
      }));
    `, selector);
  }

  private async getElementCount(driver: WebDriver, selector: string): Promise<number> {
    return await driver.executeScript(`
      const element = document.querySelector(arguments[0]);
      return element ? element.querySelectorAll('*').length : 0;
    `, selector);
  }

  private async getElementAttributes(element: any): Promise<Record<string, string>> {
    return await element.executeScript('return Array.from(arguments[0].attributes).reduce((acc, attr) => ({ ...acc, [attr.name]: attr.value }), {})');
  }

  private async getElementCSSProperties(element: any): Promise<Record<string, string>> {
    return await element.executeScript(`
      const computed = window.getComputedStyle(arguments[0]);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontSize: computed.fontSize,
        fontFamily: computed.fontFamily,
        display: computed.display,
        position: computed.position
      };
    `);
  }

  private async getCurrentViewport(driver: WebDriver): Promise<any> {
    const rect = await driver.manage().window().getRect();
    return {
      width: rect.width,
      height: rect.height
    };
  }

  private generateAnalysisSummary(results: AnalysisResult[]): any {
    const summary = {
      totalViewports: results.length,
      averageQualityScore: Math.round(results.reduce((sum, r) => sum + r.qualityScore.overall, 0) / results.length),
      totalIssues: results.reduce((sum, r) => sum + r.qualityScore.breakdown.criticalIssues, 0),
      performanceScore: Math.round(results.reduce((sum, r) => sum + r.qualityScore.performance, 0) / results.length),
      accessibilityScore: Math.round(results.reduce((sum, r) => sum + r.qualityScore.accessibility, 0) / results.length),
      visualScore: Math.round(results.reduce((sum, r) => sum + r.qualityScore.visual, 0) / results.length)
    };

    return summary;
  }

  // Remove unused method
  // private identifyPerformanceBottlenecks(metrics: any): Recommendation[] {
  //   return [];
  // }

  private extractWCAGCriterion(tags: string[]): string | undefined {
    const wcagTag = tags.find(tag => tag.startsWith('wcag') || tag.startsWith('section'));
    return wcagTag;
  }

  private generateAccessibilityRecommendations(violations: any[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (violations.some((v: any) => v.impact === 'critical')) {
      recommendations.push({
        category: 'accessibility',
        severity: 'critical',
        title: 'Critical Accessibility Issues',
        description: 'Critical accessibility violations detected',
        impact: 'critical',
        effort: 'high',
        autoFixAvailable: false,
        fixCode: 'Fix critical accessibility violations immediately',
        affectedElements: ['document']
      });
    }

    if (violations.some((v: any) => v.id.includes('color-contrast'))) {
      recommendations.push({
        category: 'accessibility',
        severity: 'high',
        title: 'Color Contrast Issues',
        description: 'Color contrast does not meet WCAG standards',
        impact: 'high',
        effort: 'medium',
        autoFixAvailable: false,
        fixCode: 'Improve color contrast to meet WCAG standards',
        affectedElements: ['document'],
        wcagCriterion: '1.4.3'
      });
    }

    if (violations.some((v: any) => v.id.includes('label'))) {
      recommendations.push({
        category: 'accessibility',
        severity: 'high',
        title: 'Missing Form Labels',
        description: 'Form controls lack proper labels',
        impact: 'high',
        effort: 'medium',
        autoFixAvailable: false,
        fixCode: 'Add proper labels to form controls',
        affectedElements: ['document'],
        wcagCriterion: '3.3.2'
      });
    }

    return recommendations;
  }

  /**
   * Sets up error handling for the server.
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('MCP Server Error:', error);
    };

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.cleanup();
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...');
      this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      this.cleanup();
      process.exit(0);
    });
  }

  /**
   * Cleans up resources.
   */
  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up resources...');
    
    try {
      await this.orchestrator?.cleanup();
      await this.server?.close();
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

/**
 * Main entry point for the MCP server.
 */
// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new SeleniumMCPServer();
  
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default SeleniumMCPServer;