# Selenium MCP Server - Enhanced Project Rules
use #setup.md
## Core Principles
- **Agent-Managed Automation**: Self-initializing, self-healing browser automation system
- **Autonomous Resource Management**: Intelligent driver installation, browser lifecycle management, and resource optimization
- **Comprehensive UI Analysis**: Beyond basic automation - full UI quality auditing, performance analysis, and accessibility testing
- **First Principles Architecture**: Minimal dependencies with maximum capability through intelligent orchestration
- **Target Environment**: Ubuntu 20.04+ with auto-detection and fallback support

## Project Vision

This MCP server creates an autonomous Selenium-powered UI analysis agent that bridges AI assistants with comprehensive browser automation, quality auditing, and cross-browser testing capabilities. The agent self-manages its entire testing environment while providing enterprise-grade UI analysis.

### Enhanced Tool Matrix

| Tool Name | Core Function | Advanced Capabilities | Analysis Output |
|-----------|---------------|----------------------|-----------------|
| `autonomous_setup` | Self-initializing environment setup | Auto-installs drivers, configures browsers, tests connectivity | Environment readiness report |
| `start_browser` | Intelligent browser session management | Multi-browser spawning, resource monitoring, auto-recovery | Browser instance health metrics |
| `navigate` | Smart navigation with stability detection | Page load optimization, dynamic content waiting, stability verification | Performance navigation metrics |
| `comprehensive_analysis` | Full UI quality audit across browsers/viewports | Accessibility audit, performance analysis, visual regression | Detailed quality score + recommendations |
| `find_element` | Enhanced element discovery with context | Smart selector strategies, element stability verification, visual mapping | Element analysis with interaction metadata |
| `interact_element` | Intelligent interaction simulation | Click, hover, drag-drop with failure recovery and validation | Interaction success metrics |
| `extract_content` | Advanced content extraction with analysis | Text extraction, semantic analysis, content quality assessment | Structured content analysis |
| `capture_analysis` | Intelligent screenshot with annotations | Multi-viewport capture, visual annotations, diff analysis | Annotated visual analysis report |
| `performance_audit` | Core Web Vitals and performance monitoring | Real-time performance tracking, bottleneck identification | Performance quality score |
| `accessibility_audit` | WCAG compliance testing with axe-core | Automated accessibility testing, violation annotation, remediation | Accessibility compliance report |

## Advanced Technical Architecture

### Self-Managing Agent Core
```
├── Autonomous Setup System
│   ├── WebDriver auto-installation (Chrome, Firefox, Edge)
│   ├── Browser configuration management
│   └── Health monitoring and self-healing
├── Multi-Browser Orchestration
│   ├── Parallel browser instance management
│   ├── Resource optimization and cleanup
│   └── Cross-browser consistency analysis
├── Intelligent Analysis Engine
│   ├── UI quality scoring algorithms
│   ├── Performance metrics collection
│   └── Accessibility compliance validation
└── Recommendation System
    ├── Actionable improvement suggestions
    ├── Code fix generation
    └── Priority-based issue categorization
```

### Core Dependencies (Minimal + Strategic)
- **Runtime**: Node.js 18+ LTS
- **Automation**: Selenium WebDriver 4.x
- **Protocol**: MCP SDK
- **Auto-Management**: WebDriver Manager equivalents
- **Analysis**: Axe-core (injected), Performance APIs
- **Image Processing**: Canvas/Sharp for visual analysis

### System Requirements
- Ubuntu 20.04+ (auto-detects and configures)
- Automatic browser installation (Chrome/Chromium, Firefox)
- WebDriver auto-installation and management
- 4GB+ RAM (for multi-browser instances)
- GPU acceleration support (optional, auto-detected)

## Autonomous Operation Modes

### 1. **Self-Initializing Setup**
```javascript
// Agent automatically configures entire environment
await mcp.call('autonomous_setup', {
  browsers: ['chrome', 'firefox', 'edge'],
  auto_install: true,
  optimize_for: 'quality_analysis'  // vs 'speed', 'compatibility'
})
```

### 2. **Comprehensive UI Analysis**
```javascript
// Single command for complete UI quality audit
await mcp.call('comprehensive_analysis', {
  url: 'https://example.com',
  analysis_types: ['accessibility', 'performance', 'responsive', 'cross_browser'],
  viewports: ['mobile', 'tablet', 'desktop', 'wide'],
  generate_report: true,
  auto_annotations: true
})
```

### 3. **Intelligent Batch Processing**
```javascript
// Process multiple URLs with smart resource management
await mcp.call('batch_analysis', {
  urls: ['url1', 'url2', 'url3'],
  analysis_depth: 'comprehensive',
  parallel_browsers: 2,
  auto_cleanup: true
})
```

## Enhanced Quality Scoring Framework

### **Composite Quality Score (0-100)**

**Performance Analysis (25%)**
- First Contentful Paint optimization
- Cumulative Layout Shift measurement
- Core Web Vitals compliance
- Resource loading efficiency

**Accessibility Compliance (30%)**
- WCAG 2.1 AA/AAA validation
- Keyboard navigation testing
- Screen reader compatibility
- Color contrast verification

**Cross-Browser Consistency (20%)**
- Visual parity analysis
- Feature compatibility testing
- Layout stability verification
- JavaScript execution consistency

**Responsive Design Quality (25%)**
- Viewport adaptation analysis
- Touch target accessibility
- Content reflow validation
- Progressive enhancement verification

### **Intelligent Recommendation Engine**

```javascript
// Example enhanced recommendation output
{
  "critical_issues": [
    {
      "category": "accessibility",
      "severity": "critical",
      "wcag_criterion": "1.3.1",
      "issue": "Form controls missing programmatic labels",
      "affected_selectors": ["#login-email", "#login-password"],
      "browsers_affected": ["all"],
      "user_impact": "Screen readers cannot identify form purpose",
      "auto_fix_available": true,
      "fix_code": "<label for='login-email'>Email Address</label>",
      "testing_verification": "npm run test:accessibility",
      "estimated_fix_time": "5 minutes"
    }
  ],
  "performance_optimizations": [...],
  "design_improvements": [...],
  "code_quality_suggestions": [...]
}
```

## Advanced Capabilities

### **Self-Healing Architecture**
- Automatic browser crash detection and recovery
- Driver version mismatch resolution
- Network failure retry mechanisms
- Resource leak prevention and cleanup

### **Intelligent Content Waiting**
- Dynamic content detection algorithms
- Animation completion verification
- Lazy-loading content handling
- SPA route change detection

### **Visual Analysis Engine**
- Pixel-perfect visual regression detection
- Layout shift visualization
- Color accessibility analysis
- Typography and spacing validation

### **Multi-Viewport Intelligence**
- Responsive breakpoint detection
- Content adaptation analysis
- Touch target size validation
- Orientation change testing

## Success Metrics

### **Technical Excellence**
- **Reliability**: 99.5%+ successful analysis completion rate
- **Performance**: Analysis completion under 60 seconds for standard pages
- **Accuracy**: Visual regression detection with 95%+ precision
- **Resource Efficiency**: Maximum 2GB memory usage during peak analysis

### **Quality Insights**
- **Accessibility**: WCAG 2.1 compliance detection accuracy > 98%
- **Performance**: Core Web Vitals measurement precision within 5%
- **Cross-Browser**: Visual difference detection threshold < 1px
- **Recommendations**: Actionable fix suggestions with verified solutions

### **Agent Autonomy**
- **Self-Setup**: Zero-configuration environment initialization
- **Self-Healing**: Automatic recovery from 90%+ failure scenarios  
- **Self-Optimization**: Adaptive resource management based on system capabilities
- **Self-Validation**: Continuous quality assurance of analysis accuracy

## Implementation Validation

This enhanced MCP server transforms basic Selenium automation into an intelligent UI analysis platform, providing:

1. **Autonomous Testing Infrastructure**: Self-managing, self-healing browser automation
2. **Enterprise-Grade Analysis**: Comprehensive quality auditing beyond simple automation
3. **Actionable Intelligence**: Specific, prioritized recommendations with fix suggestions
4. **Cross-Browser Excellence**: Consistent testing across all major browsers
5. **Accessibility Leadership**: WCAG-compliant analysis with remediation guidance
6. **Performance Optimization**: Real-time Core Web Vitals monitoring and improvement suggestions

The system operates as an intelligent agent that not only executes commands but provides deep insights, predictive analysis, and autonomous optimization of the testing environment itself.