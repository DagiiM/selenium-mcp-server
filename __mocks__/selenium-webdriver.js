/**
 * Mock for selenium-webdriver module
 */

// Mock WebDriver class
class MockWebDriver {
  constructor() {
    this.actions = jest.fn(() => ({
      move: jest.fn().mockReturnThis(),
      perform: jest.fn().mockResolvedValue(undefined)
    }));
  }

  get() {
    return Promise.resolve();
  }

  findElement() {
    return Promise.resolve(new MockWebElement());
  }

  findElements() {
    return Promise.resolve([new MockWebElement()]);
  }

  executeScript() {
    return Promise.resolve([]);
  }

  executeAsyncScript() {
    return Promise.resolve([]);
  }

  manage() {
    return {
      window: () => ({
        getSize: () => Promise.resolve({ width: 1920, height: 1080 }),
        setSize: () => Promise.resolve()
      }),
      timeouts: () => ({
        implicitlyWait: () => Promise.resolve()
      })
    };
  }

  quit() {
    return Promise.resolve();
  }

  getTitle() {
    return Promise.resolve('Test Page');
  }

  getCurrentUrl() {
    return Promise.resolve('https://example.com');
  }

  getPageSource() {
    return Promise.resolve('<html><body>Test Content</body></html>');
  }

  takeScreenshot() {
    return Promise.resolve('base64screenshot');
  }

  wait() {
    return Promise.resolve();
  }

  sleep() {
    return Promise.resolve();
  }

  getCapabilities() {
    return Promise.resolve({
      browserName: 'chrome',
      version: '120.0.0.0'
    });
  }
}

// Mock WebElement class
class MockWebElement {
  click() {
    return Promise.resolve();
  }

  sendKeys() {
    return Promise.resolve();
  }

  getText() {
    return Promise.resolve('Test text');
  }

  getTagName() {
    return Promise.resolve('div');
  }

  getAttribute() {
    return Promise.resolve('test-value');
  }

  getCssValue() {
    return Promise.resolve('test-css-value');
  }

  getRect() {
    return Promise.resolve({
      x: 0,
      y: 0,
      width: 100,
      height: 50
    });
  }

  isDisplayed() {
    return Promise.resolve(true);
  }

  isEnabled() {
    return Promise.resolve(true);
  }
}

// Create By methods as proper functions with static properties
function createByMethod(using) {
  const method = (value) => ({ using, value });
  method.using = using;
  return method;
}

const By = {
  id: createByMethod('id'),
  className: createByMethod('class name'),
  tagName: createByMethod('tag name'),
  css: createByMethod('css selector'),
  xpath: createByMethod('xpath'),
  linkText: createByMethod('link text'),
  partialLinkText: createByMethod('partial link text'),
  name: createByMethod('name')
};

// Mock until conditions
const until = {
  elementLocated: jest.fn(() => ({})),
  elementIsVisible: jest.fn(() => ({})),
  elementIsEnabled: jest.fn(() => ({})),
  titleIs: jest.fn(() => ({})),
  titleContains: jest.fn(() => ({})),
  urlIs: jest.fn(() => ({})),
  urlContains: jest.fn(() => ({}))
};

// Mock Builder class
class Builder {
  forBrowser() {
    return this;
  }

  setChromeOptions() {
    return this;
  }

  setFirefoxOptions() {
    return this;
  }

  build() {
    return new MockWebDriver();
  }
}

// Mock Browser enum
const Browser = {
  CHROME: 'chrome',
  FIREFOX: 'firefox',
  SAFARI: 'safari',
  EDGE: 'MicrosoftEdge',
  IE: 'internet explorer'
};

// Mock Key enum
const Key = {
  ENTER: '\uE007',
  TAB: '\uE004',
  ESCAPE: '\uE00C',
  SPACE: '\uE00D',
  ARROW_UP: '\uE013',
  ARROW_DOWN: '\uE015',
  ARROW_LEFT: '\uE012',
  ARROW_RIGHT: '\uE014'
};

module.exports = {
  WebDriver: MockWebDriver,
  WebElement: MockWebElement,
  By,
  until,
  Builder,
  Browser,
  Key
};

// Also export as default for ES6 compatibility
module.exports.default = module.exports;