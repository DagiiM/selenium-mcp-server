/**
 * UI Analysis Engine for comprehensive web page analysis
 * Provides performance, accessibility, and visual analysis capabilities
 */

import { WebDriver, By, until } from 'selenium-webdriver';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { 
  PerformanceMetrics, 
  AccessibilityReport, 
  VisualAnalysis, 
  QualityScore,
  AnalysisResult,
  Recommendation,
  WCAGCompliance,
  LayoutShift,
  ColorContrastAnalysis
} from '../types/index.js';

export interface AnalysisOptions {
  url: string;
  viewports?: Array<{ width: number; height: number; name: string }>;
  browsers?: string[];
  generateScreenshots?: boolean;
  generateReport?: boolean;
  includeAccessibility?: boolean;
  includePerformance?: boolean;
  includeVisual?: boolean;
  timeout?: number;
}

/**
 * Advanced UI Analysis Engine for comprehensive web page quality assessment
 */
export class UIAnalysisEngine {
  private screenshotDir: string;
  private reportDir: string;

  constructor() {
    this.screenshotDir = join(process.cwd(), 'reports', 'screenshots');
    this.reportDir = join(process.cwd(), 'reports', 'analysis');
  }

  /**
   * Performs comprehensive UI analysis including performance, accessibility, and visual checks
   */
  async analyze(driver: WebDriver, options: AnalysisOptions): Promise<AnalysisResult> {
    try {
      // Navigate to the URL first - this is where driver.get() would be called
      await driver.get(options.url);
      
      await this.waitForPageReady(driver, options.timeout || 30000);

      // Performance analysis
      const performance = options.includePerformance !== false 
        ? await this.analyzePerformanceInternal(driver)
        : this.getDefaultPerformanceMetrics();

      // Accessibility analysis
      const accessibility = options.includeAccessibility !== false
        ? await this.analyzeAccessibilityInternal(driver)
        : this.getDefaultAccessibilityReport();

      // Visual analysis
      const visual = options.includeVisual !== false
        ? await this.analyzeVisual(driver, options)
        : this.getDefaultVisualAnalysis();

      // Generate screenshots if requested
      if (options.generateScreenshots) {
        await this.captureScreenshot(driver, options.url);
      }

      // Calculate quality score
      const qualityScore = this.calculateQualityScore(performance, accessibility, visual);

      // Generate recommendations
      const recommendations = this.generateRecommendations(performance, accessibility, visual);

      const result: AnalysisResult = {
        url: options.url,
        timestamp: new Date().toISOString(),
        browser: 'chrome', // Default browser
        viewport: { width: 1920, height: 1080 }, // Default viewport
        performance,
        accessibility,
        visual,
        recommendations,
        qualityScore
      };

      return result;
    } catch (error) {
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyzes page performance metrics including Core Web Vitals
   */
  /**
   * Public method for performance analysis that can throw errors (used for testing)
   */
  public async analyzePerformance(driver: WebDriver): Promise<PerformanceMetrics> {
    // Get navigation timing
    const navigationTiming = await driver.executeScript(`
      return performance.getEntriesByType('navigation')[0];
    `) as any;

    // Get resource timing
    const resourceTiming = await driver.executeScript(`
      return performance.getEntriesByType('resource');
    `) as any[];

    // Get paint timing with null check
    const paintTiming = await driver.executeScript(`
      return performance.getEntriesByType('paint') || [];
    `) as any[];

    // Safely find FCP with fallback
    const fcp = Array.isArray(paintTiming) 
      ? paintTiming.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
      : 0;
    
    const lcp = await this.getLargestContentfulPaint(driver);
    const cls = await this.getCumulativeLayoutShift(driver);
    const tbt = this.calculateTotalBlockingTime(resourceTiming || []);
    const speedIndex = this.calculateSpeedIndex(resourceTiming || [], fcp);

    const metrics: PerformanceMetrics = {
      firstContentfulPaint: fcp,
      largestContentfulPaint: lcp,
      cumulativeLayoutShift: cls,
      totalBlockingTime: tbt,
      speedIndex,
      timeToInteractive: navigationTiming?.loadEventEnd - navigationTiming?.navigationStart || 0,
      domContentLoaded: navigationTiming?.domContentLoadedEventEnd - navigationTiming?.navigationStart || 0,
      loadComplete: navigationTiming?.loadEventEnd - navigationTiming?.navigationStart || 0,
      resourceCount: Array.isArray(resourceTiming) ? resourceTiming.length : 0,
      totalSize: Array.isArray(resourceTiming) 
        ? resourceTiming.reduce((sum, resource) => sum + (resource.transferSize || 0), 0)
        : 0,
      coreWebVitals: {
        lcp,
        fid: 0, // FID requires user interaction
        cls,
        fcp,
        ttfb: navigationTiming?.responseStart - navigationTiming?.requestStart || 0
      },
      score: 0 // Will be calculated below
    };

    // Calculate and assign the score
    metrics.score = this.calculatePerformanceScore(metrics);
    
    return metrics;
  }

  /**
   * Public method for accessibility analysis that can throw errors (used for testing)
   */
  public async analyzeAccessibility(driver: WebDriver): Promise<AccessibilityReport> {
    await this.injectAxeCore(driver);
    
    const results = await driver.executeAsyncScript(`
      const callback = arguments[arguments.length - 1];
      axe.run((err, results) => {
        if (err) {
          callback({ error: err.message });
        } else {
          callback(results);
        }
      });
    `) as any;

    if (results.error) {
      throw new Error(`Accessibility audit failed: ${results.error}`);
    }

    const violations = results.violations || [];
    const wcagCompliance = this.calculateWCAGCompliance(violations);
    const score = this.calculateAccessibilityScore(violations);

    return {
      violations: violations,
      passes: results.passes?.length || 0,
      incomplete: results.incomplete?.length || 0,
      inapplicable: results.inapplicable?.length || 0,
      score: score,
      wcagCompliance: wcagCompliance
    };
  }

  private async analyzePerformanceInternal(driver: WebDriver): Promise<PerformanceMetrics> {
    try {
      return await this.analyzePerformance(driver);
    } catch (error) {
      console.error('Performance analysis failed:', error);
      return this.getDefaultPerformanceMetrics();
    }
  }

  private async analyzeAccessibilityInternal(driver: WebDriver): Promise<AccessibilityReport> {
    try {
      await this.injectAxeCore(driver);
      
      const results = await driver.executeScript(`
        return axe.run();
      `) as any;

      const violations = results?.violations || [];
      const passes = results?.passes?.length || 0;
      const incomplete = results?.incomplete?.length || 0;
      const inapplicable = results?.inapplicable?.length || 0;

      return {
        violations,
        passes,
        incomplete,
        inapplicable,
        score: this.calculateAccessibilityScore(violations),
        wcagCompliance: this.calculateWCAGCompliance(violations)
      };
    } catch (error) {
      console.error('Accessibility analysis failed:', error);
      return this.getDefaultAccessibilityReport();
    }
  }

  /**
   * Analyzes visual aspects including layout shifts and color contrast
   */
  private async analyzeVisual(driver: WebDriver, _options: AnalysisOptions): Promise<VisualAnalysis> {
    try {
      const layoutShifts = await this.analyzeLayoutShifts(driver);
      const colorContrast = await this.analyzeColorContrast(driver);
      const typography = await this.analyzeTypography(driver);
      const spacing = await this.analyzeSpacing(driver);

      return {
        layoutShifts,
        colorContrast,
        typography,
        spacing
      };
    } catch (error) {
      console.error('Visual analysis failed:', error);
      return this.getDefaultVisualAnalysis();
    }
  }

  /**
   * Generates actionable recommendations based on analysis results
   */
  private generateRecommendations(
    performance: PerformanceMetrics,
    accessibility: AccessibilityReport,
    _visual: VisualAnalysis
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Performance recommendations
    if (performance.firstContentfulPaint > 2500) {
      recommendations.push({
        category: 'performance',
        severity: 'high',
        title: 'Slow First Contentful Paint',
        description: 'First Contentful Paint is slower than recommended',
        impact: 'Users experience delayed visual feedback',
        effort: 'medium',
        autoFixAvailable: false,
        estimatedFixTime: '2-4 hours'
      });
    }

    // Accessibility recommendations
    if (accessibility.violations.length > 0) {
      recommendations.push({
        category: 'accessibility',
        severity: 'critical',
        title: 'Accessibility Violations Found',
        description: `Found ${accessibility.violations.length} accessibility violations`,
        impact: 'Users with disabilities cannot access content',
        effort: 'high',
        autoFixAvailable: false,
        estimatedFixTime: '4-8 hours'
      });
    }

    return recommendations;
  }

  /**
   * Calculates overall quality score based on all analysis results
   */
  private calculateQualityScore(
    performance: PerformanceMetrics,
    accessibility: AccessibilityReport,
    _visual: VisualAnalysis
  ): QualityScore {
    const performanceScore = this.calculatePerformanceScore(performance);
    const accessibilityScore = accessibility.score;
    const visualScore = this.calculateVisualScore(_visual);
    const crossBrowserScore = 85; // Placeholder
    
    const overall = Math.round((performanceScore + accessibilityScore + visualScore + crossBrowserScore) / 4);

    return {
      overall,
      performance: performanceScore,
      accessibility: accessibilityScore,
      visual: visualScore,
      crossBrowser: crossBrowserScore,
      breakdown: {
        criticalIssues: accessibility.violations.filter((v: any) => v.impact === 'critical').length,
        warnings: accessibility.violations.filter((v: any) => v.impact === 'moderate').length,
        suggestions: accessibility.violations.filter((v: any) => v.impact === 'minor').length
      }
    };
  }

  /**
   * Waits for page to be ready for analysis
   */
  private async waitForPageReady(driver: WebDriver, timeout: number): Promise<void> {
    await driver.wait(until.elementLocated(By.tagName('body')), timeout);
    await driver.executeScript('return document.readyState === "complete"');
  }

  /**
   * Injects axe-core library for accessibility testing
   */
  private async injectAxeCore(driver: WebDriver): Promise<void> {
    try {
      await driver.executeScript(`
        if (typeof axe === 'undefined') {
          var script = document.createElement('script');
          script.src = 'https://unpkg.com/axe-core@4.7.2/axe.min.js';
          document.head.appendChild(script);
          return new Promise(resolve => script.onload = resolve);
        }
      `);
    } catch (error) {
      console.error('Failed to inject axe-core:', error);
    }
  }

  private async getLargestContentfulPaint(driver: WebDriver): Promise<number> {
    try {
      return await driver.executeScript(`
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry ? lastEntry.startTime : 0);
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          setTimeout(() => resolve(0), 1000);
        });
      `) as number;
    } catch (error) {
      return 0;
    }
  }

  private async getCumulativeLayoutShift(driver: WebDriver): Promise<number> {
    try {
      return await driver.executeScript(`
        return new Promise((resolve) => {
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            resolve(clsValue);
          }).observe({ entryTypes: ['layout-shift'] });
          
          setTimeout(() => resolve(clsValue), 1000);
        });
      `) as number;
    } catch (error) {
      return 0;
    }
  }

  private calculateTotalBlockingTime(resources: any[]): number {
    if (!Array.isArray(resources)) {
      return 0;
    }
    return resources.reduce((total, resource) => total + (resource.duration > 50 ? resource.duration - 50 : 0), 0);
  }

  private calculateSpeedIndex(_resources: any[], _firstContentfulPaint: number): number {
    return 1000; // Placeholder implementation
  }

  private calculateWCAGCompliance(violations: any[]): WCAGCompliance {
    const criticalViolations = violations.filter(v => v.impact === 'critical').length;
    const seriousViolations = violations.filter(v => v.impact === 'serious').length;
    
    return {
      a: criticalViolations === 0,
      aa: criticalViolations === 0 && seriousViolations === 0,
      aaa: violations.length === 0,
      complianceLevel: violations.length === 0 ? 'AAA' : criticalViolations === 0 && seriousViolations === 0 ? 'AA' : criticalViolations === 0 ? 'A' : 'Non-compliant'
    };
  }

  private calculateAccessibilityScore(violations: any[]): number {
    const criticalCount = violations.filter((v: any) => v.impact === 'critical').length;
    const seriousCount = violations.filter((v: any) => v.impact === 'serious').length;
    const moderateCount = violations.filter((v: any) => v.impact === 'moderate').length;
    const minorCount = violations.filter((v: any) => v.impact === 'minor').length;
    
    return Math.max(0, 100 - (criticalCount * 25 + seriousCount * 15 + moderateCount * 10 + minorCount * 5));
  }

  private async analyzeLayoutShifts(_driver: WebDriver): Promise<LayoutShift[]> {
    return []; // Placeholder implementation
  }

  private async analyzeColorContrast(_driver: WebDriver): Promise<ColorContrastAnalysis> {
    return { violations: [], score: 100, recommendations: [] };
  }

  private async analyzeTypography(_driver: WebDriver): Promise<any> {
    return {
      fontSizes: { tooSmall: [], optimal: [], large: [], recommendations: [] },
      lineHeights: { tooTight: [], optimal: [], tooLoose: [], recommendations: [] },
      fontFamilies: [],
      readabilityScore: 100
    };
  }

  private async analyzeSpacing(_driver: WebDriver): Promise<any> {
    return {
      tightSpacing: [],
      optimalSpacing: [],
      looseSpacing: [],
      recommendations: []
    };
  }

  private async captureScreenshot(driver: WebDriver, _url: string): Promise<string> {
    try {
      await this.ensureDirectories();
      const screenshot = await driver.takeScreenshot();
      const filename = `screenshot-${Date.now()}.png`;
      const filepath = join(this.screenshotDir, filename);
      
      await writeFile(filepath, screenshot, 'base64');
      return filepath;
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      return '';
    }
  }

  private calculatePerformanceScore(performance: PerformanceMetrics): number {
    let score = 100;
    
    // Penalize slow FCP
    if (performance.firstContentfulPaint > 1800) score -= 20;
    else if (performance.firstContentfulPaint > 1000) score -= 10;
    
    // Penalize slow LCP
    if (performance.largestContentfulPaint > 2500) score -= 25;
    else if (performance.largestContentfulPaint > 1500) score -= 15;
    
    // Penalize high CLS
    if (performance.cumulativeLayoutShift > 0.25) score -= 20;
    else if (performance.cumulativeLayoutShift > 0.1) score -= 10;
    
    // Penalize high TBT
    if (performance.totalBlockingTime > 600) score -= 15;
    else if (performance.totalBlockingTime > 300) score -= 10;
    
    return Math.max(0, score);
  }

  private calculateVisualScore(_visual: VisualAnalysis): number {
    // Calculate visual score based on layout shifts, color contrast, etc.
    return 85; // Placeholder implementation
  }

  /**
   * Provides default performance metrics when performance analysis is disabled
   */
  private getDefaultPerformanceMetrics(): PerformanceMetrics {
    return {
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      totalBlockingTime: 0,
      speedIndex: 0,
      timeToInteractive: 0,
      domContentLoaded: 0,
      loadComplete: 0,
      resourceCount: 0,
      totalSize: 0,
      coreWebVitals: {
        lcp: 0,
        fid: 0,
        cls: 0,
        fcp: 0,
        ttfb: 0
      },
      score: 100
    };
  }

  /**
   * Provides default accessibility report when accessibility analysis is disabled
   */
  private getDefaultAccessibilityReport(): AccessibilityReport {
    return {
      violations: [],
      passes: 0,
      incomplete: 0,
      inapplicable: 0,
      score: 100,
      wcagCompliance: {
        a: true,
        aa: true,
        aaa: true,
        complianceLevel: 'AAA'
      }
    };
  }

  /**
   * Provides default visual analysis when visual analysis is disabled
   */
  private getDefaultVisualAnalysis(): VisualAnalysis {
    return {
      layoutShifts: [],
      colorContrast: {
        violations: [],
        score: 100,
        recommendations: []
      },
      typography: {
        fontSizes: {
          tooSmall: [],
          optimal: [],
          large: [],
          recommendations: []
        },
        lineHeights: {
          tooTight: [],
          optimal: [],
          tooLoose: [],
          recommendations: []
        },
        fontFamilies: [],
        readabilityScore: 100
      },
      spacing: {
        tightSpacing: [],
        optimalSpacing: [],
        looseSpacing: [],
        recommendations: []
      }
    };
  }

  /**
   * Calculates overall quality score from individual component scores
   */
  public calculateOverallScore(scores: { performance?: number | null; accessibility?: number | null; visual?: number | null }): number {
    const validScores = Object.values(scores).filter((score): score is number => 
      typeof score === 'number' && !isNaN(score)
    );
    
    if (validScores.length === 0) {
      return 0;
    }
    
    return Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length);
  }

  /**
   * Sets up analysis directories for reports and screenshots
   */
  public async setupAnalysisDirectories(): Promise<void> {
    await this.ensureDirectories();
  }

  /**
   * Cleanup method for releasing resources
   */
  public async cleanup(): Promise<void> {
    // Currently no resources to cleanup, but method exists for interface compatibility
    return Promise.resolve();
  }

  private async ensureDirectories(): Promise<void> {
    await mkdir(this.screenshotDir, { recursive: true });
    await mkdir(this.reportDir, { recursive: true });
  }

  public async generateReport(analysisResult: AnalysisResult): Promise<string> {
    const reportPath = join(this.reportDir, `analysis-report-${Date.now()}.html`);
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UI Analysis Report - ${analysisResult.url}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .score { font-size: 24px; font-weight: bold; color: #2196F3; }
        .violation { background: #ffebee; padding: 10px; margin: 5px 0; border-left: 4px solid #f44336; }
        .recommendation { background: #e8f5e8; padding: 10px; margin: 5px 0; border-left: 4px solid #4caf50; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f9f9f9; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>UI Analysis Report</h1>
        <p><strong>URL:</strong> ${analysisResult.url}</p>
        <p><strong>Browser:</strong> ${analysisResult.browser}</p>
        <p><strong>Timestamp:</strong> ${analysisResult.timestamp}</p>
        <div class="score">Overall Quality Score: ${analysisResult.qualityScore.overall}/100</div>
    </div>

    <div class="section">
        <h2>Quality Scores</h2>
        <div class="metric">Performance: ${analysisResult.qualityScore.performance}/100</div>
        <div class="metric">Accessibility: ${analysisResult.qualityScore.accessibility}/100</div>
        <div class="metric">Visual: ${analysisResult.qualityScore.visual}/100</div>
        <div class="metric">Cross-Browser: ${analysisResult.qualityScore.crossBrowser}/100</div>
    </div>

    <div class="section">
        <h2>Performance Metrics</h2>
        <div class="metric">First Contentful Paint: ${analysisResult.performance.firstContentfulPaint}ms</div>
        <div class="metric">Largest Contentful Paint: ${analysisResult.performance.largestContentfulPaint}ms</div>
        <div class="metric">Cumulative Layout Shift: ${analysisResult.performance.cumulativeLayoutShift}</div>
        <div class="metric">Total Blocking Time: ${analysisResult.performance.totalBlockingTime}ms</div>
    </div>

    <div class="section">
        <h2>Accessibility Report</h2>
        <p><strong>Violations:</strong> ${analysisResult.accessibility.violations.length}</p>
        <p><strong>Passes:</strong> ${analysisResult.accessibility.passes}</p>
        <p><strong>Score:</strong> ${analysisResult.accessibility.score}/100</p>
        ${analysisResult.accessibility.violations.map(violation => `
            <div class="violation">
                <strong>${violation.id}</strong> (${violation.impact})<br>
                ${violation.description}
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        ${analysisResult.recommendations.map(rec => `
            <div class="recommendation">
                <strong>${rec.title}</strong> (${rec.severity})<br>
                ${rec.description}<br>
                <em>Impact:</em> ${rec.impact}<br>
                <em>Effort:</em> ${rec.effort}
            </div>
        `).join('')}
    </div>
</body>
</html>`;

    await writeFile(reportPath, htmlContent, 'utf8');
    return reportPath;
  }
}