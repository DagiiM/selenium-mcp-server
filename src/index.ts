/**
 * Main entry point for the Selenium MCP Server.
 * Provides CLI interface and server startup functionality.
 */

import { SeleniumMCPServer } from './server.js';

/**
 * Main function to start the Selenium MCP Server.
 */
async function main(): Promise<void> {
  console.log('🚀 Starting Selenium MCP Server...');
  
  const server = new SeleniumMCPServer();
  
  try {
    await server.start();
  } catch (error) {
    console.error('❌ Failed to start Selenium MCP Server:', error);
    process.exit(1);
  }
}

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Unhandled error in main:', error);
    process.exit(1);
  });
}

export { main };