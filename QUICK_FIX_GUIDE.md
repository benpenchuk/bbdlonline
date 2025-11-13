# Quick Fix Patterns for Schema Migration

## Game Property Changes

### Find and Replace Patterns

```typescript
// Team IDs
game.team1Id → game.homeTeamId
game.team2Id → game.awayTeamId

// Scores
game.team1Score → game.homeScore
game.team2Score → game.awayScore

// Dates  
game.scheduledDate → game.gameDate
game.completedDate → REMOVE (no longer exists)

// Winner & Tags (now computed)
game.winnerId → game.winningTeamId (or use getWinnerId(game))
game.isBlowout → getGameTags(game).isBlowout
game.isClutch → getGameTags(game).isClutch  
game.isShutout → getGameTags(game).isShutout

// Status
'cancelled' → 'canceled' (spelling fix)
```

## Player Property Changes

```typescript
// Name
player.name → getPlayerFullName(player) or `${player.firstName} ${player.lastName}`

// Avatar
player.photoUrl → player.avatarUrl

// Team (now via junction table)
player.teamId → getPlayerTeamId(player, playerTeams, seasonId)

// For team object:
teams.find(t => t.id === player.teamId) → getPlayerTeam(player, teams, playerTeams, seasonId)

// Initials
player.name.split(' ').map(n => n[0]).join('').toUpperCase() → getPlayerInitials(player)

// Stats (now computed, not stored)
player.stats.wins → Compute from games
player.stats.* → Compute from games

// Removed fields
player.bio → Use player.hometownCity, player.hometownState
player.year → REMOVED
```

## Team Property Changes

```typescript
// Visual
team.color → REMOVED (use TeamIcon or static colors)
team.icon → team.abbreviation (use with TeamIcon component)

// Stats (now computed)
team.wins → Calculate from games
team.losses → Calculate from games  
team.totalPoints → Calculate from games
team.gamesPlayed → Calculate from games

// Roster (now via junction table)
team.players → REMOVED
players.filter(p => p.teamId === teamId) → getTeamPlayers(teamId, players, playerTeams, seasonId)
```

## Import Statements to Add

```typescript
import { getPlayerFullName, getPlayerInitials, getPlayerTeam, getTeamPlayers } from '../core/utils/playerHelpers';
import { getGameTags, getWinnerId, getTeamScoreInGame } from '../core/utils/gameHelpers';
import { TeamIcon } from '../common/TeamIcon';
import { PlayerTeam } from '../core/types'; // Add to type imports
```

## Common Component Prop Changes

```typescript
// Add playerTeams prop to most components
interface Props {
  players: Player[];
  teams: Team[];
  games: Game[];
  playerTeams: PlayerTeam[]; // ADD THIS
  seasonId?: string; // Optional, for filtering
}

// Pass from DataContext
const { players, teams, games, playerTeams, activeSeason } = useData();
```

## Stats Calculation Changes

```typescript
// OLD: Direct property access
team.wins, team.losses

// NEW: Calculate from games
import { calculateTeamStatsForGames } from '../core/utils/statsCalculations';
const teamStats = calculateTeamStatsForGames(teamId, games);
// Returns: { wins, losses, gamesPlayed, pointsFor, pointsAgainst, winPct }
```

## Team Icon Usage

```typescript
// OLD
<div style={{ backgroundColor: team.color }} />

// NEW
<TeamIcon iconId={team.abbreviation} color="#3b82f6" size={24} />
```

## Files Still Needing Updates

### High Priority (Blocking Compilation)
- [ ] admin/GamesTab.tsx
- [ ] admin/PlayersTab.tsx
- [ ] admin/TeamsTab.tsx
- [ ] games/ESPNGameCard.tsx
- [ ] games/GameModal.tsx
- [ ] games/GameTable.tsx
- [ ] players/PlayerModal.tsx
- [ ] players/TeamSection.tsx

### Medium Priority (Stats/Display)
- [ ] stats/HeadToHeadComparison.tsx
- [ ] stats/LeaderboardTable.tsx
- [ ] stats/NotableRecords.tsx

### Low Priority (Pages - depend on above)
- [ ] pages/PlayersPage.tsx (LARGE FILE - many changes)
- [ ] pages/GamesPage.tsx
- [ ] pages/GamesPageESPN.tsx
- [ ] pages/StandingsPage.tsx

### Can be Disabled
- [ ] pages/TournamentPage.tsx
- [ ] tournament/* (all tournament components)

