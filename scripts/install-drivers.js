#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Installing WebDriver dependencies...');

try {
  // Install ChromeDriver
  console.log('Installing ChromeDriver...');
  execSync('npx webdriver-manager update --chrome', { stdio: 'inherit' });
  
  // Install GeckoDriver for Firefox
  console.log('Installing GeckoDriver...');
  execSync('npx webdriver-manager update --gecko', { stdio: 'inherit' });
  
  console.log('✅ WebDriver dependencies installed successfully!');
} catch (error) {
  console.error('❌ Failed to install WebDriver dependencies:', error.message);
  process.exit(1);
}