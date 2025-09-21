# Selenium MCP Server Examples

This directory contains comprehensive examples demonstrating the capabilities of the Selenium MCP Server.

## Basic Usage Examples

### 1. Autonomous Setup and Analysis

```javascript
// examples/basic-setup-analysis.js
import { McpClient } from '@modelcontextprotocol/sdk/client/index.js';

const client = new McpClient();

async function basicAnalysis() {
  try {
    // Connect to the MCP server
    await client.connect('http://localhost:3000');
    
    // Autonomous setup - server installs drivers and configures browsers
    console.log('🤖 Setting up autonomous environment...');
    const setupResult = await client.call('autonomous_setup', {
      browsers: ['chrome', 'firefox'],
      auto_install: true,
      optimize_for: 'quality_analysis'
    });
    
    console.log('✅ Setup complete:', setupResult.message);
    
    // Perform comprehensive analysis
    const analysis = await client.call('comprehensive_analysis', {
      url: 'https://example.com',
      analysis_types: ['accessibility', 'performance', 'responsive'],
      viewports: ['mobile', 'tablet', 'desktop'],
      generate_report: true
    });
    
    console.log(`📊 Quality Score: ${analysis.overallScore}/100`);
    console.log(`🔍 Issues Found: ${analysis.recommendations.length}`);
    
    // Display top recommendations
    analysis.recommendations.slice(0, 3).forEach((rec, i) => {
      console.log(`${i + 1}. ${rec.title} (${rec.severity})`);
      console.log(`   ${rec.description}`);
    });
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  } finally {
    await client.disconnect();
  }
}

basicAnalysis();
```

### 2. Cross-Browser Testing

```javascript
// examples/cross-browser-testing.js
async function crossBrowserTest() {
  const browsers = ['chrome', 'firefox', 'edge'];
  const url = 'https://your-website.com';
  
  console.log('🌐 Starting cross-browser analysis...');
  
  for (const browser of browsers) {
    console.log(`\n🔍 Testing with ${browser}...`);
    
    try {
      // Start browser instance
      const browserInstance = await client.call('start_browser', {
        browser_type: browser,
        options: {
          headless: true,
          window_size: '1920,1080'
        }
      });
      
      // Navigate to URL
      await client.call('navigate', {
        browser_id: browserInstance.id,
        url: url
      });
      
      // Capture screenshot with analysis
      const screenshot = await client.call('capture_analysis', {
        browser_id: browserInstance.id,
        url: url,
        viewport: 'desktop',
        annotations: true
      });
      
      console.log(`✅ ${browser} analysis complete`);
      console.log(`   📸 Screenshot: ${screenshot.screenshotPath}`);
      console.log(`   📊 Visual Issues: ${screenshot.visualIssues.length}`);
      
      // Close browser
      await client.call('close_browser', { browser_id: browserInstance.id });
      
    } catch (error) {
      console.error(`❌ ${browser} test failed:`, error.message);
    }
  }
  
  console.log('\n🎉 Cross-browser testing complete!');
}
```

### 3. Accessibility Audit

```javascript
// examples/accessibility-audit.js
async function accessibilityAudit(url) {
  console.log(`♿ Starting accessibility audit for ${url}...`);
  
  try {
    // Perform comprehensive accessibility analysis
    const analysis = await client.call('comprehensive_analysis', {
      url: url,
      analysis_types: ['accessibility'],
      viewports: ['desktop', 'mobile'],
      accessibility_options: {
        wcag_level: 'AA',
        include_experimental: true
      }
    });
    
    // Filter accessibility-specific recommendations
    const accessibilityIssues = analysis.recommendations.filter(
      rec => rec.category === 'accessibility'
    );
    
    console.log(`\n📊 Accessibility Results:`);
    console.log(`   Score: ${analysis.accessibilityScore}/100`);
    console.log(`   Issues: ${accessibilityIssues.length}`);
    
    // Group by severity
    const bySeverity = accessibilityIssues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`   By Severity:`);
    Object.entries(bySeverity).forEach(([severity, count]) => {
      console.log(`     ${severity}: ${count}`);
    });
    
    // Show critical issues
    const criticalIssues = accessibilityIssues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      console.log(`\n🚨 Critical Issues:`);
      criticalIssues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.title}`);
        console.log(`   ${issue.description}`);
        if (issue.auto_fix_available) {
          console.log(`   🔧 Auto-fix: ${issue.fix_code}`);
        }
      });
    }
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Accessibility audit failed:', error.message);
    throw error;
  }
}
```

## Advanced Examples

### 4. Batch Analysis

```javascript
// examples/batch-analysis.js
async function batchAnalysis(urls) {
  console.log(`🔄 Starting batch analysis for ${urls.length} URLs...`);
  
  const results = [];
  const batchSize = 2; // Process 2 URLs concurrently
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    console.log(`\n📊 Processing batch ${Math.floor(i/batchSize) + 1}...`);
    
    const batchPromises = batch.map(async (url) => {
      try {
        const analysis = await client.call('comprehensive_analysis', {
          url: url,
          analysis_types: ['performance', 'accessibility'],
          generate_report: true,
          auto_cleanup: true
        });
        
        return {
          url,
          score: analysis.overallScore,
          issues: analysis.recommendations.length,
          status: 'success'
        };
      } catch (error) {
        return {
          url,
          score: 0,
          issues: 0,
          status: 'failed',
          error: error.message
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Progress indicator
    console.log(`   ✅ Completed ${results.length}/${urls.length}`);
  }
  
  // Summary
  console.log('\n📈 Batch Analysis Summary:');
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  
  console.log(`   Total URLs: ${urls.length}`);
  console.log(`   Successful: ${successful.length}`);
  console.log(`   Failed: ${failed.length}`);
  
  if (successful.length > 0) {
    const avgScore = successful.reduce((sum, r) => sum + r.score, 0) / successful.length;
    console.log(`   Average Score: ${avgScore.toFixed(1)}/100`);
    
    // Top performers
    const topSites = successful
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
      
    console.log(`   Top Performers:`);
    topSites.forEach((site, i) => {
      console.log(`     ${i + 1}. ${site.url} (${site.score}/100)`);
    });
  }
  
  return results;
}
```

### 5. Performance Monitoring

```javascript
// examples/performance-monitoring.js
async function performanceMonitoring(url, duration = 60000, interval = 5000) {
  console.log(`⏱️ Starting performance monitoring for ${url}...`);
  console.log(`   Duration: ${duration/1000}s, Interval: ${interval/1000}s`);
  
  const metrics = [];
  const startTime = Date.now();
  
  while (Date.now() - startTime < duration) {
    try {
      const audit = await client.call('performance_audit', {
        url: url,
        metrics: ['fcp', 'lcp', 'cls', 'fid', 'tti']
      });
      
      metrics.push({
        timestamp: new Date().toISOString(),
        ...audit.metrics
      });
      
      console.log(`   📊 FCP: ${audit.metrics.fcp}ms, LCP: ${audit.metrics.lcp}ms, CLS: ${audit.metrics.cls}`);
      
      await new Promise(resolve => setTimeout(resolve, interval));
      
    } catch (error) {
      console.error('❌ Performance check failed:', error.message);
    }
  }
  
  // Generate performance report
  const report = generatePerformanceReport(metrics);
  console.log('\n📈 Performance Monitoring Complete:');
  console.log(`   Average FCP: ${report.averages.fcp.toFixed(0)}ms`);
  console.log(`   Average LCP: ${report.averages.lcp.toFixed(0)}ms`);
  console.log(`   Performance Stability: ${report.stability}%`);
  
  return report;
}

function generatePerformanceReport(metrics) {
  const averages = {
    fcp: metrics.reduce((sum, m) => sum + m.fcp, 0) / metrics.length,
    lcp: metrics.reduce((sum, m) => sum + m.lcp, 0) / metrics.length,
    cls: metrics.reduce((sum, m) => sum + m.cls, 0) / metrics.length
  };
  
  // Calculate stability (low variance = high stability)
  const fcpVariance = calculateVariance(metrics.map(m => m.fcp));
  const stability = Math.max(0, 100 - (fcpVariance / 100));
  
  return {
    averages,
    stability: stability.toFixed(1),
    totalChecks: metrics.length,
    duration: metrics.length > 0 ? 
      new Date(metrics[metrics.length - 1].timestamp).getTime() - 
      new Date(metrics[0].timestamp).getTime() : 0
  };
}

function calculateVariance(values) {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}
```

### 6. E-commerce Site Audit

```javascript
// examples/ecommerce-audit.js
async function ecommerceAudit(url) {
  console.log(`🛍️ Starting e-commerce site audit for ${url}...`);
  
  const ecommerceChecks = [
    {
      name: 'Product Listing',
      selector: '.product-grid, .products, [data-testid="products"]',
      checks: ['visibility', 'interactivity', 'loading']
    },
    {
      name: 'Shopping Cart',
      selector: '.cart, .shopping-cart, [data-testid="cart"]',
      checks: ['accessibility', 'functionality']
    },
    {
      name: 'Checkout Process',
      selector: '.checkout, [data-testid="checkout"]',
      checks: ['form-validation', 'security', 'accessibility']
    },
    {
      name: 'Search Functionality',
      selector: '.search, [data-testid="search"], input[type="search"]',
      checks: ['usability', 'performance']
    }
  ];
  
  const results = {};
  
  for (const check of ecommerceChecks) {
    console.log(`\n🔍 Checking ${check.name}...`);
    
    try {
      // Find element
      const element = await client.call('find_element', {
        url: url,
        selector: check.selector,
        strategy: 'css',
        wait_timeout: 5000
      });
      
      if (element.found) {
        console.log(`   ✅ Element found: ${element.selector}`);
        
        // Perform element-specific analysis
        const elementAnalysis = await client.call('interact_element', {
          element: element,
          action: 'analyze',
          validation: check.checks
        });
        
        results[check.name] = {
          status: 'found',
          issues: elementAnalysis.issues || [],
          recommendations: elementAnalysis.recommendations || []
        };
        
        console.log(`   📊 Issues: ${results[check.name].issues.length}`);
        console.log(`   💡 Recommendations: ${results[check.name].recommendations.length}`);
        
      } else {
        results[check.name] = {
          status: 'not_found',
          issues: [`${check.name} element not found`],
          recommendations: [`Add ${check.name.toLowerCase()} element with selector: ${check.selector}`]
        };
        console.log(`   ❌ Element not found: ${check.selector}`);
      }
      
    } catch (error) {
      results[check.name] = {
        status: 'error',
        issues: [error.message],
        recommendations: ['Check element implementation']
      };
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Generate e-commerce specific report
  const report = generateEcommerceReport(results);
  console.log('\n📈 E-commerce Audit Summary:');
  console.log(`   Overall Score: ${report.score}/100`);
  console.log(`   Critical Issues: ${report.criticalIssues}`);
  console.log(`   Missing Features: ${report.missingFeatures}`);
  
  return report;
}

function generateEcommerceReport(results) {
  const totalChecks = Object.keys(results).length;
  const foundElements = Object.values(results).filter(r => r.status === 'found').length;
  const totalIssues = Object.values(results).reduce((sum, r) => sum + r.issues.length, 0);
  const criticalIssues = Object.values(results).reduce((sum, r) => 
    sum + r.issues.filter(i => i.severity === 'critical').length, 0);
  
  const score = Math.max(0, 100 - (criticalIssues * 10) - (totalIssues * 2));
  
  return {
    score: Math.round(score),
    foundElements,
    totalChecks,
    missingFeatures: totalChecks - foundElements,
    totalIssues,
    criticalIssues,
    details: results
  };
}
```

## Running the Examples

### Prerequisites

1. Start the Selenium MCP Server:
```bash
npm start
```

2. Install example dependencies:
```bash
cd examples
npm install @modelcontextprotocol/sdk
```

### Execute Examples

```bash
# Basic analysis
node examples/basic-setup-analysis.js

# Cross-browser testing
node examples/cross-browser-testing.js

# Accessibility audit
node examples/accessibility-audit.js

# Batch analysis
node examples/batch-analysis.js

# Performance monitoring
node examples/performance-monitoring.js

# E-commerce audit
node examples/ecommerce-audit.js
```

## Custom Examples

Create your own examples by:

1. Copying an existing example file
2. Modifying the URL and parameters
3. Adding custom analysis logic
4. Running with `node your-example.js`

For more advanced use cases, combine multiple tools and create custom analysis pipelines tailored to your specific needs.