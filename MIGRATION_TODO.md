# Database Schema Migration - Remaining Work

## Status: IN PROGRESS

### ✅ Completed
- [x] Updated core types (`types/index.ts`)
- [x] Updated API layer (`services/api.ts`)
- [x] Updated DataContext with new methods
- [x] Created helper utilities (`playerHelpers.ts`, `gameHelpers.ts`)
- [x] Fixed `statsCalculations.ts` for new schema
- [x] Fixed `PlayerCard.tsx`
- [x] Fixed `GameCard.tsx`
- [x] Fixed `HeroSection.tsx`
- [x] Fixed `TeamStatsPanel.tsx`
- [x] Disabled mock data (moved to database)
- [x] Temporarily disabled tournament utils

### 🚧 In Progress - Admin Components
These need updates for the new schema (remove old properties, add playerTeams):

- [ ] `admin/GameFormModal.tsx` - Update to use homeTeam/awayTeam, gameDate
- [ ] `admin/GamesTab.tsx` - Update Game display
- [ ] `admin/PlayersTab.tsx` - Update Player display, remove teamId
- [ ] `admin/TeamsTab.tsx` - Update Team display, remove color/wins/losses
- [ ] `admin/DataManagementTab.tsx` - Already mostly working

### 🚧 In Progress - Game Components  
- [ ] `games/ESPNGameCard.tsx` - Update for new Game schema
- [ ] `games/GameModal.tsx` - Update for new Game schema
- [ ] `games/GameTable.tsx` - Update for new Game schema

### 🚧 In Progress - Player Components
- [ ] `players/PlayerModal.tsx` - Update for new Player schema
- [ ] `players/TeamSection.tsx` - Update for new Team schema

### 🚧 In Progress - Stats Components
- [ ] `stats/HeadToHeadComparison.tsx` - Update for new Game schema
- [ ] `stats/LeaderboardTable.tsx` - Update for new Player schema, compute stats
- [ ] `stats/NotableRecords.tsx` - Update for new schema, compute records

### 🚧 In Progress - Pages
- [ ] `pages/HomePage.tsx` - Pass playerTeams to components, remove announcements
- [ ] `pages/PlayersPage.tsx` - Massive updates needed for new Player/Team schema
- [ ] `pages/GamesPage.tsx` - Update for new Game schema
- [ ] `pages/GamesPageESPN.tsx` - Update for new Game schema
- [ ] `pages/StandingsPage.tsx` - Update for new schema
- [ ] `pages/TournamentPage.tsx` - Disable or update for new Tournament schema

### 🔴 Blocked - Tournament Components
Tournaments need complete redesign for new schema:
- [ ] `tournament/TournamentBracket.tsx`
- [ ] `tournament/TournamentCard.tsx`
- [ ] `tournament/TournamentHistory.tsx`
- [ ] `tournament/CreateTournamentModal.tsx`

## Key Schema Changes

### Game Object
```typescript
// OLD
game.team1Id, game.team2Id, game.team1Score, game.team2Score
game.scheduledDate, game.completedDate
game.winnerId, game.isBlowout, game.isClutch, game.isShutout

// NEW
game.homeTeamId, game.awayTeamId, game.homeScore, game.awayScore
game.gameDate
game.winningTeamId (computed via getWinnerId helper)
// Tags computed via getGameTags helper
```

### Player Object
```typescript
// OLD
player.name, player.photoUrl, player.teamId, player.stats, player.bio, player.year

// NEW
player.firstName, player.lastName, player.nickname, player.avatarUrl
// No direct teamId - use playerTeams junction table
// Use helpers: getPlayerFullName(), getPlayerInitials(), getPlayerTeam()
```

### Team Object
```typescript
// OLD
team.color, team.icon, team.wins, team.losses, team.players

// NEW
team.abbreviation
// Use TeamIcon component with abbreviation
// Stats computed from games
// Players via playerTeams junction table
```

## Helper Functions

### Player Helpers (`core/utils/playerHelpers.ts`)
- `getPlayerFullName(player)` - Get formatted name
- `getPlayerInitials(player)` - Get initials
- `getPlayerTeam(player, teams, playerTeams, seasonId?)` - Get player's team
- `getTeamPlayers(teamId, players, playerTeams, seasonId?)` - Get team roster

### Game Helpers (`core/utils/gameHelpers.ts`)
- `getGameTags(game)` - Get {isBlowout, isClutch, isShutout}
- `getWinnerId(game)` - Get winning team ID
- `didTeamWinGame(game, teamId)` - Check if team won
- `getTeamScoreInGame(game, teamId)` - Get team's score
- `getOpponentTeamId(game, teamId)` - Get opponent ID

## Quick Fix Patterns

### For Game Components
```typescript
// Replace:
game.team1Id → game.homeTeamId
game.team2Id → game.awayTeamId
game.team1Score → game.homeScore
game.team2Score → game.awayScore
game.scheduledDate → game.gameDate
game.winnerId → getWinnerId(game) or game.winningTeamId
game.isBlowout → getGameTags(game).isBlowout
```

### For Player Components
```typescript
// Replace:
player.name → getPlayerFullName(player)
player.photoUrl → player.avatarUrl
player.teamId → getPlayerTeamId(player, playerTeams, seasonId)
// For initials:
player.name.split(' ').map(n => n[0]) → getPlayerInitials(player)
```

### For Team Components
```typescript
// Replace:
team.color → Remove or use static color based on team ID
team.icon → team.abbreviation (use with TeamIcon component)
team.wins/losses → Calculate from games using calculateTeamStatsForGames()
players.filter(p => p.teamId === teamId) → getTeamPlayers(teamId, players, playerTeams)
```

## Next Steps
1. Fix critical path: HomePage → working display
2. Fix admin panels → data management
3. Fix player/game display pages
4. Fix stats components
5. Redesign or disable tournaments

## Notes
- Stats are now computed on-the-fly, not stored in Player/Team objects
- Player-team relationships via `player_teams` junction table
- Use helper functions instead of accessing properties directly
- Tournament system needs complete redesign

