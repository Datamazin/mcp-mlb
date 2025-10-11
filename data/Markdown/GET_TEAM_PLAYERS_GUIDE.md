# Get Team Players Utility

## 📝 **Description**
Dynamic utility script to retrieve roster information for any MLB team. Renamed from `get-mets-players.cjs` to support all 30 MLB teams.

## 🚀 **Usage**

### **Basic Usage**
```bash
# Get Mets roster (default)
node get-team-players.cjs

# Get specific team roster
node get-team-players.cjs yankees

# Get team roster for specific season
node get-team-players.cjs dodgers 2024
```

### **Parameters**
- **Team Name** (optional): Any MLB team name (defaults to 'mets')
- **Season** (optional): Year for roster data (defaults to 2025)

## 🏟️ **Supported Teams**

### **American League**
- **East**: orioles, red sox, yankees, rays, blue jays
- **Central**: white sox, guardians, tigers, royals, twins  
- **West**: astros, angels, athletics, mariners, rangers

### **National League**
- **East**: braves, marlins, mets, phillies, nationals
- **Central**: cubs, reds, brewers, pirates, cardinals
- **West**: diamondbacks, rockies, dodgers, padres, giants

## 📊 **Output**

### **Console Display**
- Team roster summary
- Position players (non-pitchers)
- Player details (name, number, position, ID)
- Top 8 players with MLB IDs for analysis

### **Return Object**
```javascript
{
  team: "Yankees",
  teamId: 147,
  totalPlayers: 40,
  positionPlayers: [...], // Array of position player objects
  playerIds: [...]        // Array of {id, name, position} objects
}
```

## 🔧 **Features**

### **Dynamic Team Selection**
- Case-insensitive team name matching
- Comprehensive team name mapping
- Error handling for invalid team names

### **Position Player Filtering**
- Automatically filters out pitchers
- Focuses on home run potential players
- Provides MLB player IDs for further analysis

### **Flexible Season Support**
- Command-line season parameter
- Defaults to current season (2025)
- Compatible with historical data

## 📋 **Example Outputs**

### **Successful Query**
```
🎯 Getting team roster data...
   Team: yankees
   Season: 2025

🏟️ Getting Yankees roster for 2025...
📋 Found 40 players on Yankees roster
⚾ Position players (potential home run hitters): 17

✅ Successfully retrieved Yankees roster data!
   Total players: 40
   Position players: 17
```

### **Invalid Team**
```
❌ Team "invalid-team" not found. Available teams:
  - orioles
  - red sox
  - yankees
  [... full list of valid teams]
```

## 🔗 **Integration**

This utility can be imported and used in other analysis scripts:

```javascript
const { getTeamPlayers } = require('./get-team-players.cjs');

const teamData = await getTeamPlayers('dodgers', 2024);
console.log(`${teamData.team} has ${teamData.positionPlayers.length} hitters`);
```

---
*Updated: October 11, 2025*
*Renamed from get-mets-players.cjs for dynamic team support*