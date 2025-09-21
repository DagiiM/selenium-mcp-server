/**
 * Core types for the Selenium MCP server.
 * Defines all interfaces and type definitions used throughout the system.
 */

export interface BrowserConfig {
  name: 'chrome' | 'firefox' | 'edge';
  version?: string;
  headless?: boolean;
  viewport?: ViewportSize;
  userAgent?: string;
  customOptions?: Record<string, unknown>;
}

export interface ViewportSize {
  width: number;
  height: number;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  isLandscape?: boolean;
}

export interface AnalysisResult {
  url: string;
  timestamp: string;
  browser: string;
  viewport: ViewportSize;
  performance: PerformanceMetrics;
  accessibility: AccessibilityReport;
  visual: VisualAnalysis;
  crossBrowser?: CrossBrowserAnalysis;
  recommendations: Recommendation[];
  qualityScore: QualityScore;
}

export interface PerformanceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  speedIndex: number;
  timeToInteractive: number;
  domContentLoaded: number;
  loadComplete: number;
  resourceCount: number;
  totalSize: number;
  coreWebVitals: CoreWebVitals;
  score: number;
}

export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

export interface AccessibilityReport {
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  score: number;
  wcagCompliance: WCAGCompliance;
}

export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: AccessibilityNode[];
  wcagCriterion?: string;
}

export interface AccessibilityNode {
  html: string;
  target: string[];
  failureSummary?: string;
}

export interface WCAGCompliance {
  a: boolean;
  aa: boolean;
  aaa: boolean;
  complianceLevel: 'A' | 'AA' | 'AAA' | 'Non-compliant';
}

export interface VisualAnalysis {
  layoutShifts: LayoutShift[];
  colorContrast: ColorContrastAnalysis;
  typography: TypographyAnalysis;
  spacing: SpacingAnalysis;
  visualRegression?: VisualRegressionResult;
}

export interface LayoutShift {
  element: string;
  shiftScore: number;
  timing: number;
  impact: 'low' | 'medium' | 'high';
}

export interface ColorContrastAnalysis {
  violations: ColorContrastViolation[];
  score: number;
  recommendations: string[];
}

export interface ColorContrastViolation {
  element: string;
  foreground: string;
  background: string;
  contrastRatio: number;
  requiredRatio: number;
  severity: 'minor' | 'major' | 'critical';
}

export interface TypographyAnalysis {
  fontSizes: FontSizeAnalysis;
  lineHeights: LineHeightAnalysis;
  fontFamilies: string[];
  readabilityScore: number;
}

export interface FontSizeAnalysis {
  tooSmall: string[];
  optimal: string[];
  large: string[];
  recommendations: string[];
}

export interface LineHeightAnalysis {
  tooTight: string[];
  optimal: string[];
  tooLoose: string[];
  recommendations: string[];
}

export interface SpacingAnalysis {
  tightSpacing: string[];
  optimalSpacing: string[];
  looseSpacing: string[];
  recommendations: string[];
}

export interface VisualRegressionResult {
  diffPercentage: number;
  pixelDiffCount: number;
  thresholdExceeded: boolean;
  baselineImage?: string;
  currentImage?: string;
  diffImage?: string;
}

export interface CrossBrowserAnalysis {
  browsers: string[];
  consistencyScore: number;
  visualDifferences: CrossBrowserDifference[];
  featureCompatibility: FeatureCompatibility[];
}

export interface CrossBrowserDifference {
  element: string;
  browsers: string[];
  differenceType: 'layout' | 'styling' | 'functionality';
  severity: 'minor' | 'moderate' | 'major';
  description: string;
}

export interface FeatureCompatibility {
  feature: string;
  browsers: Record<string, 'supported' | 'partial' | 'unsupported'>;
  polyfillAvailable: boolean;
  recommendation?: string;
}

export interface Recommendation {
  category: 'performance' | 'accessibility' | 'visual' | 'cross-browser' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  autoFixAvailable: boolean;
  fixCode?: string;
  testingSteps?: string[];
  resources?: string[];
  affectedElements?: string[];
  estimatedFixTime?: string;
  wcagCriterion?: string;
}

export interface QualityScore {
  overall: number;
  performance: number;
  accessibility: number;
  visual: number;
  crossBrowser: number;
  breakdown: {
    criticalIssues: number;
    warnings: number;
    suggestions: number;
  };
}

export interface SetupOptions {
  browsers: ('chrome' | 'firefox' | 'edge')[];
  autoInstall: boolean;
  optimizeFor: 'quality_analysis' | 'speed' | 'compatibility';
  headless?: boolean;
  viewport?: ViewportSize;
  timeout?: number;
  retries?: number;
}

export interface SetupResult {
  success: boolean;
  browsers: BrowserSetupResult[];
  environment: EnvironmentInfo;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

export interface BrowserSetupResult {
  name: string;
  version: string;
  driverVersion: string;
  status: 'ready' | 'error' | 'warning';
  message: string;
  path?: string;
  capabilities: string[];
}

export interface EnvironmentInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  memory: number;
  cpuCores: number;
  gpuAvailable: boolean;
  supportedBrowsers: string[];
}

export interface ElementInfo {
  selector: string;
  tagName: string;
  textContent?: string;
  attributes: Record<string, string>;
  styles: Record<string, string>;
  dimensions: ElementDimensions;
  position: ElementPosition;
  isVisible: boolean;
  isInteractive: boolean;
  children: ElementInfo[];
}

export interface ElementDimensions {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
  margin: { top: number; right: number; bottom: number; left: number };
  border: { top: number; right: number; bottom: number; left: number };
}

export interface ElementPosition {
  x: number;
  y: number;
  zIndex?: number;
  position: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
}

export interface BatchAnalysisOptions {
  urls: string[];
  analysisDepth: 'basic' | 'comprehensive' | 'deep';
  parallelBrowsers: number;
  autoCleanup: boolean;
  viewports?: ViewportSize[];
  browsers?: ('chrome' | 'firefox' | 'edge')[];
  includeVisualRegression?: boolean;
  generateReport?: boolean;
}

export interface BatchAnalysisResult {
  totalUrls: number;
  completed: number;
  failed: number;
  results: AnalysisResult[];
  summary: BatchSummary;
  errors: string[];
  duration: number;
}

export interface BatchSummary {
  averageQualityScore: number;
  criticalIssues: number;
  warnings: number;
  recommendations: number;
  performanceIssues: number;
  accessibilityViolations: number;
  crossBrowserIssues: number;
}