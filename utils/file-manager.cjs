// Utility functions for MLB MCP Server file management
const fs = require('fs');
const path = require('path');

/**
 * Save markdown content to the data/Markdown folder
 * @param {string} filename - Name of the markdown file (with .md extension)
 * @param {string} content - Markdown content to save
 * @returns {string} - Full path where file was saved
 */
function saveMarkdownFile(filename, content) {
  const markdownDir = path.join(process.cwd(), 'data', 'Markdown');
  
  // Ensure directory exists
  if (!fs.existsSync(markdownDir)) {
    fs.mkdirSync(markdownDir, { recursive: true });
  }
  
  const filepath = path.join(markdownDir, filename);
  fs.writeFileSync(filepath, content, 'utf8');
  
  return filepath;
}

/**
 * Save visualization to the data/visualizations folder
 * @param {string} filename - Name of the image file (with extension)
 * @param {Buffer} imageBuffer - Image buffer data
 * @returns {string} - Full path where file was saved
 */
function saveVisualizationFile(filename, imageBuffer) {
  const vizDir = path.join(process.cwd(), 'data', 'visualizations');
  
  // Ensure directory exists
  if (!fs.existsSync(vizDir)) {
    fs.mkdirSync(vizDir, { recursive: true });
  }
  
  const filepath = path.join(vizDir, filename);
  fs.writeFileSync(filepath, imageBuffer);
  
  return filepath;
}

/**
 * Get standardized file paths for MLB analysis outputs
 * @param {string} analysisType - Type of analysis (e.g., 'mets-homerun', 'player-stats')
 * @param {string} timeframe - Timeframe (e.g., '2025', '5year', 'career')
 * @returns {object} - Object with markdown and visualization paths
 */
function getAnalysisPaths(analysisType, timeframe) {
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  
  return {
    markdown: `data/Markdown/${analysisType}-${timeframe}-analysis.md`,
    visualization: `data/visualizations/${analysisType}-${timeframe}-chart.png`,
    timestamp: timestamp
  };
}

module.exports = {
  saveMarkdownFile,
  saveVisualizationFile,
  getAnalysisPaths
};

// Example usage:
/*
const { saveMarkdownFile, saveVisualizationFile } = require('./utils/file-manager.cjs');

// Save markdown analysis
const markdownContent = '# My Analysis\n\nThis is the content...';
const savedPath = saveMarkdownFile('my-analysis.md', markdownContent);
console.log(`Markdown saved to: ${savedPath}`);

// Save visualization
const imageBuffer = await chartCanvas.renderToBuffer(config);
const vizPath = saveVisualizationFile('my-chart.png', imageBuffer);
console.log(`Chart saved to: ${vizPath}`);
*/