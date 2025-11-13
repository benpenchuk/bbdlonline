# Database Schema Migration Status

## ✅ Completed

### 1. Database Schema (Supabase)
- **DONE**: New clean UUID-based schema deployed to Supabase
- **DONE**: 9 core tables created: `players`, `teams`, `seasons`, `player_teams`, `games`, `player_game_stats`, `player_season_stats`, `team_season_stats`, `tournaments`
- **DONE**: Enums created for type safety
- **DONE**: Roster constraints enforced (2 starters + 1 sub per team)
- **DONE**: RLS policies configured
- **DONE**: Auto-updating timestamps via triggers

### 2. TypeScript Types (`src/core/types/index.ts`)
- **DONE**: Complete rewrite to match new schema
- **DONE**: UUID-based IDs
- **DONE**: Separate `firstName`/`lastName` for players
- **DONE**: `Season` type added
- **DONE**: `PlayerTeam` type added for roster management
- **DONE**: Game now uses `homeTeamId`/`awayTeamId` + `homeScore`/`awayScore`
- **DONE**: All aggregate stat types updated

### 3. API Layer (`src/core/services/api.ts`)
- **DONE**: Complete rewrite for new schema
- **DONE**: All transformation functions updated (camelCase ↔ snake_case)
- **DONE**: `playersApi` - UUID-based CRUD
- **DONE**: `teamsApi` - UUID-based CRUD
- **DONE**: `seasonsApi` - Complete API for season management
- **DONE**: `playerTeamsApi` - Roster management API
- **DONE**: `gamesApi` - Updated for `homeTeam`/`awayTeam` structure
- **DONE**: `playerGameStatsApi` - Per-game individual performance
- **DONE**: `playerSeasonStatsApi` - Aggregate stats
- **DONE**: `teamSeasonStatsApi` - Team standings
- **DONE**: `tournamentsApi` - Updated for new structure

### 4. Supabase Client (`src/core/config/supabaseClient.ts`)
- **DONE**: Updated table constants to match new schema

### 5. DataContext (`src/state/DataContext.tsx`)
- **DONE**: State updated to include `seasons`, `playerTeams`, `activeSeason`
- **DONE**: All CRUD operations updated
- **DONE**: Season management operations added
- **DONE**: Player-team roster operations added
- **DONE**: Game validation updated for `homeTeam`/`awayTeam`
- **DONE**: Removed `announcements` (table no longer exists)

## ⚠️ Requires Updates (Breaking Changes)

### 6. Stats Calculations (`src/core/utils/statsCalculations.ts` & `src/core/services/stats.ts`)
**Status**: ❌ NOT YET UPDATED

**Issues**:
- Still references `team1Id`/`team2Id`/`team1Score`/`team2Score` (should be `homeTeamId`/`awayTeamId`/`homeScore`/`awayScore`)
- References `player.teamId` directly (no longer exists - players are linked via `player_teams`)
- Needs to be season-aware
- Game status uses old values (`completed` should be `completed`)

**Required Changes**:
- Update all game field references to use `homeTeam`/`awayTeam`
- Fetch player's team via `player_teams` table for the active season
- Add season filtering to all stat calculations
- Update `calculatePlayerStats` to work with new structure
- Update `calculateTeamStats` to work with new structure

### 7. Components
**Status**: ❌ NOT YET UPDATED

**All components will have breaking changes**. Key issues:

#### Player-Related:
- `player.name` → `player.firstName` + `player.lastName`
- `player.teamId` → Need to look up via `player_teams` table
- `player.stats` → No longer exists on player object
- `player.photoUrl` → `player.avatarUrl`

#### Team-Related:
- `team.wins`/`team.losses`/`team.totalPoints`/`team.gamesPlayed` → No longer exist (use `team_season_stats`)
- `team.players[]` → No longer exists (use `player_teams`)
- `team.icon` → No longer exists (use `team.logoUrl`)

#### Game-Related:
- `game.team1Id`/`game.team2Id` → `game.homeTeamId`/`game.awayTeamId`
- `game.team1Score`/`game.team2Score` → `game.homeScore`/`game.awayScore`
- `game.scheduledDate` → `game.gameDate`
- `game.isBlowout`/`game.isClutch`/`game.isShutout` → No longer stored (calculate from scores)
- Games now require `seasonId`

#### Season-Related:
- Need to add season selection UI
- Need to filter games/stats by season
- Need to create an active season before any data entry

### 8. Admin Components
**Status**: ❌ NOT YET UPDATED

- **TeamsTab**: Needs to remove stats fields (wins/losses/etc)
- **PlayersTab**: Needs to split name into firstName/lastName, use avatar_url
- **GamesTab**: Needs major updates for homeTeam/awayTeam, seasonId requirement
- **New Needed**: SeasonsTab for managing seasons
- **New Needed**: RosterTab for managing player-team assignments

## 🚧 Critical Missing Pieces

### 1. **NO DATA IN DATABASE**
Your database is completely empty. You need:
1. Create at least one Season
2. Create Teams
3. Create Players
4. Assign Players to Teams via `player_teams`
5. Create Games (all require `seasonId`)

### 2. **No Seed Data Script**
Need to create a seed data script to populate initial data.

### 3. **No Migration from Old Data**
If you had data in the old schema, it's gone. The new schema is incompatible.

## 📋 Next Steps (Priority Order)

### IMMEDIATE (Before app will work):
1. **Create seed data script** to populate database
2. **Create initial season** in Supabase manually or via script
3. **Fix stats calculation** files (critical for app functionality)
4. **Update key components** to handle new data structure

### HIGH PRIORITY:
5. Update admin components (especially for creating data)
6. Add season management UI
7. Add roster management UI
8. Test all CRUD operations

### MEDIUM PRIORITY:
9. Update all display components
10. Update stats pages
11. Test game entry workflow
12. Test tournament features

## 🔧 Quick Fixes Needed

### To make app minimally functional:

1. **Comment out stats calculations temporarily** to prevent crashes
2. **Create a simple seed script** with:
   - 1 active season
   - 4-8 teams
   - 8-16 players assigned to teams
   - A few sample games
3. **Update HomePage** to handle new player structure
4. **Update PlayersPage** to display firstName/lastName
5. **Update GamesPage** to use homeTeam/awayTeam

## ⚠️ Important Notes

- **UUID IDs**: All IDs are now UUIDs generated by Postgres, not prefixed strings
- **No Direct Relationships**: Players no longer have `teamId`. Use `player_teams` junction table
- **Season-Based**: Everything must be associated with a season
- **Roster Constraints**: Database enforces exactly 2 starters + 1 optional sub per team
- **Stats Are Computed**: Player/team stats are no longer stored on the entity - they're in separate aggregate tables

## 🎯 Testing Checklist (Once Updates Complete)

- [ ] Can create a season
- [ ] Can create teams
- [ ] Can create players
- [ ] Can assign players to teams (roster management)
- [ ] Can create games
- [ ] Can record game scores
- [ ] Stats calculate correctly
- [ ] Leaderboards display correctly
- [ ] Player pages show correct info
- [ ] Team pages show correct info
- [ ] Games page displays correctly
- [ ] Admin panel works for all CRUD operations

---

## Summary

**Good News**: Core infrastructure (database, types, API layer, data context) is completely rebuilt and ready.

**Bad News**: The application will not run yet because:
1. Database is empty (no seed data)
2. Stats calculations not updated (will crash)
3. All components expect old data structure (will crash or display incorrectly)

**Estimate**: You need ~4-8 hours of focused work to:
1. Create seed data
2. Fix stats calculations
3. Update critical components
4. Test and fix breaking changes

This is a major architectural upgrade that modernizes your schema significantly!

