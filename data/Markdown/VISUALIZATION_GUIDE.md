# MLB Data Visualization Examples

The MLB MCP Server now includes powerful visualization capabilities for game-by-game statistical analysis!

## 🎯 **New Visualization Tool: `visualize-player-stats`**

Generate line charts or bar charts for any player's game-by-game statistics across regular season, playoffs, or spring training.

## 📊 **Mets Home Run Analysis Charts**

### **Chart 1: 2025 Line Chart**
- **File:** `data/visualizations/mets-homeruns-2025-line-chart.png`
- **Type:** Line chart with filled area
- **Focus:** Current season (2025) home run leaders
- **Leader:** Juan Soto (43 HRs)

### **Chart 2: 5-Year Bar Chart Comparison**
- **File:** `data/visualizations/mets-homeruns-5year-comparison.png` 
- **Type:** Multi-series grouped bar chart
- **Focus:** 2021-2025 historical comparison
- **Leader:** Michael Conforto (249 total HRs across 5 years)

### **Parameters:**
- `playerId` (number) - MLB Player ID
- `season` (number) - Season year  
- `gameType` (string, default: 'R') - Game type:
  - `R` = Regular Season
  - `S` = Spring Training  
  - `P` = Playoffs/Postseason
  - `D` = Division Series
  - `L` = League Championship
  - `W` = World Series
- `statCategory` (enum) - Statistical category:
  - `hits`, `runs`, `rbi`, `homeRuns`, `doubles`, `triples`
  - `strikeOuts`, `baseOnBalls`, `atBats`, `avg`
- `chartType` (enum, default: 'line') - Chart type: `line` or `bar`
- `title` (string, optional) - Custom chart title

### **Returns:**
- Base64-encoded PNG chart image
- Statistical summary (min, max, average, total)
- Total number of games analyzed

## 📊 **Usage Examples**

### **Example 1: Pete Alonso Home Runs (Bar Chart)**
```javascript
const result = await client.callTool({
  name: 'visualize-player-stats',
  arguments: {
    playerId: 624413,
    season: 2024,
    gameType: 'R',
    statCategory: 'homeRuns',
    chartType: 'bar',
    title: 'Pete Alonso - Home Runs by Game (2024)'
  }
});
```
**Result:** 162 games analyzed, 34 total home runs, max 2 in a single game

### **Example 2: Vladimir Guerrero Jr Playoff RBIs (Line Chart)**
```javascript
const result = await client.callTool({
  name: 'visualize-player-stats',
  arguments: {
    playerId: 665489,
    season: 2025,
    gameType: 'P',
    statCategory: 'rbi',
    chartType: 'line',
    title: 'Vladimir Guerrero Jr - RBIs by Playoff Game (2025)'
  }
});
```
**Result:** 4 playoff games, 9 total RBIs, average 2.25 per game

### **Example 3: Aaron Judge Batting Average Trend (Line Chart)**
```javascript
const result = await client.callTool({
  name: 'visualize-player-stats',
  arguments: {
    playerId: 592450,
    season: 2024,
    gameType: 'R',
    statCategory: 'avg',
    chartType: 'line',
    title: 'Aaron Judge - Batting Average Trend (2024)'
  }
});
```
**Result:** 158 games analyzed, season average .322

## 🎨 **Chart Features**

### **Visual Elements:**
- **High-resolution PNG output** (800x400 pixels)
- **Professional styling** with titles and axis labels
- **Responsive legends** and data point markers
- **Color-coded data series** for easy interpretation

### **Statistical Analysis:**
- **Comprehensive summary statistics** (min, max, average, total)
- **Game-by-game tracking** across entire seasons
- **Multi-season support** for historical analysis
- **All game types** (regular season, playoffs, spring training)

### **Supported Statistics:**
- **Offensive Stats:** Hits, Runs, RBIs, Home Runs, Doubles, Triples
- **Plate Discipline:** Walks (BB), Strikeouts (SO), At-Bats
- **Performance Metrics:** Batting Average trends

## 🔧 **Integration with MCP Clients**

The visualization tool is fully integrated with the MCP protocol and can be used with any MCP client such as Claude Desktop, custom applications, or API integrations.

### **Saving Charts to Files:**
```javascript
const data = result.content[0];
if (data.type === 'text') {
  const resultData = JSON.parse(data.text);
  const imageData = resultData.chartUrl.split(',')[1];
  fs.writeFileSync('player-chart.png', imageData, 'base64');
}
```

## 🎯 **Perfect for:**
- **Player performance analysis**
- **Trend identification** over time
- **Playoff vs regular season comparisons**
- **Statistical presentations and reports**
- **Fantasy baseball analysis**
- **Sports journalism and research**

The visualization capability transforms raw game-by-game data into clear, professional charts that reveal patterns and insights in player performance!