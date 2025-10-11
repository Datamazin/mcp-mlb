# MLB MCP Server - File Organization

## 📁 **Data Folder Structure**

```
data/
├── Markdown/           # All analysis reports and documentation
│   ├── CORRECTED_METS_5YEAR_ANALYSIS.md
│   ├── IMPLEMENTATION_SUMMARY.md
│   ├── METS_2025_HOMERUN_ANALYSIS.md
│   ├── METS_5YEAR_HOMERUN_COMPARISON.md
│   ├── README.md
│   └── VISUALIZATION_GUIDE.md
│
└── visualizations/     # All generated charts and graphs
    ├── mets-homeruns-2025-line-chart.png
    ├── mets-homeruns-5year-CORRECTED.png
    ├── pete-alonso-homeruns-2024-CORRECTED.png
    └── [other visualization files...]
```

## 🛠️ **File Management Utils**

A new utility module `utils/file-manager.cjs` provides standardized functions for:

- **saveMarkdownFile()** - Saves markdown files to `data/Markdown/`
- **saveVisualizationFile()** - Saves charts to `data/visualizations/`
- **getAnalysisPaths()** - Generates standardized file paths

## 📝 **Usage Guidelines**

### **For Future Scripts:**
- All markdown documentation → `data/Markdown/`
- All charts and visualizations → `data/visualizations/`
- Use the utility functions for consistent file management

### **Naming Conventions:**
- **Markdown files:** `ANALYSIS_TYPE_TIMEFRAME_ANALYSIS.md`
- **Visualizations:** `team-stat-timeframe-charttype.png`

### **Examples:**
```javascript
// Save markdown analysis
const markdownPath = saveMarkdownFile('YANKEES_2025_ANALYSIS.md', content);

// Save visualization
const chartPath = saveVisualizationFile('yankees-homeruns-2025-bar.png', buffer);
```

---
*File organization updated October 11, 2025*