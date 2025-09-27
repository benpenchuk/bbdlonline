import { Team, Player, Game, Tournament, TournamentMatch } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Mock Teams
export const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Thunder Bolts',
    color: '#3B82F6',
    wins: 0,
    losses: 0,
    totalPoints: 0,
    gamesPlayed: 0,
    players: ['player-1', 'player-2']
  },
  {
    id: 'team-2',
    name: 'Fire Dragons',
    color: '#EF4444',
    wins: 0,
    losses: 0,
    totalPoints: 0,
    gamesPlayed: 0,
    players: ['player-3', 'player-4']
  },
  {
    id: 'team-3',
    name: 'Ice Wolves',
    color: '#06B6D4',
    wins: 0,
    losses: 0,
    totalPoints: 0,
    gamesPlayed: 0,
    players: ['player-5', 'player-6']
  },
  {
    id: 'team-4',
    name: 'Storm Hawks',
    color: '#8B5CF6',
    wins: 0,
    losses: 0,
    totalPoints: 0,
    gamesPlayed: 0,
    players: ['player-7', 'player-8']
  },
  {
    id: 'team-5',
    name: 'Iron Lions',
    color: '#F59E0B',
    wins: 0,
    losses: 0,
    totalPoints: 0,
    gamesPlayed: 0,
    players: ['player-9', 'player-10']
  },
  {
    id: 'team-6',
    name: 'Shadow Panthers',
    color: '#6B7280',
    wins: 0,
    losses: 0,
    totalPoints: 0,
    gamesPlayed: 0,
    players: ['player-11', 'player-12']
  }
];

// Mock Players
export const mockPlayers: Player[] = [
  {
    id: 'player-1',
    name: 'Alex Thunder',
    teamId: 'team-1',
    bio: 'Veteran player with lightning-fast reflexes and strategic gameplay.',
    photoUrl: '/api/placeholder/150/150',
    stats: {
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      totalPoints: 0,
      averagePoints: 0,
      shutouts: 0,
      blowoutWins: 0,
      clutchWins: 0,
      longestWinStreak: 0,
      currentWinStreak: 0
    }
  },
  {
    id: 'player-2',
    name: 'Sam Bolt',
    teamId: 'team-1',
    bio: 'Known for incredible accuracy and clutch performance under pressure.',
    photoUrl: '/api/placeholder/150/150',
    stats: {
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      totalPoints: 0,
      averagePoints: 0,
      shutouts: 0,
      blowoutWins: 0,
      clutchWins: 0,
      longestWinStreak: 0,
      currentWinStreak: 0
    }
  },
  {
    id: 'player-3',
    name: 'Jordan Fire',
    teamId: 'team-2',
    bio: 'Aggressive player who brings intensity and passion to every game.',
    photoUrl: '/api/placeholder/150/150',
    stats: {
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      totalPoints: 0,
      averagePoints: 0,
      shutouts: 0,
      blowoutWins: 0,
      clutchWins: 0,
      longestWinStreak: 0,
      currentWinStreak: 0
    }
  },
  {
    id: 'player-4',
    name: 'Casey Dragon',
    teamId: 'team-2',
    bio: 'Strategic mastermind with an eye for finding opponents\' weaknesses.',
    photoUrl: '/api/placeholder/150/150',
    stats: {
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      totalPoints: 0,
      averagePoints: 0,
      shutouts: 0,
      blowoutWins: 0,
      clutchWins: 0,
      longestWinStreak: 0,
      currentWinStreak: 0
    }
  },
  {
    id: 'player-5',
    name: 'Riley Ice',
    teamId: 'team-3',
    bio: 'Cool under pressure with consistent performance game after game.',
    photoUrl: '/api/placeholder/150/150',
    stats: {
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      totalPoints: 0,
      averagePoints: 0,
      shutouts: 0,
      blowoutWins: 0,
      clutchWins: 0,
      longestWinStreak: 0,
      currentWinStreak: 0
    }
  },
  {
    id: 'player-6',
    name: 'Morgan Wolf',
    teamId: 'team-3',
    bio: 'Team captain with natural leadership and tactical expertise.',
    photoUrl: '/api/placeholder/150/150',
    stats: {
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      totalPoints: 0,
      averagePoints: 0,
      shutouts: 0,
      blowoutWins: 0,
      clutchWins: 0,
      longestWinStreak: 0,
      currentWinStreak: 0
    }
  },
  {
    id: 'player-7',
    name: 'Taylor Storm',
    teamId: 'team-4',
    bio: 'Dynamic player known for unpredictable and creative strategies.',
    photoUrl: '/api/placeholder/150/150',
    stats: {
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      totalPoints: 0,
      averagePoints: 0,
      shutouts: 0,
      blowoutWins: 0,
      clutchWins: 0,
      longestWinStreak: 0,
      currentWinStreak: 0
    }
  },
  {
    id: 'player-8',
    name: 'Avery Hawk',
    teamId: 'team-4',
    bio: 'Precision shooter with eagle-eye accuracy and mental toughness.',
    photoUrl: '/api/placeholder/150/150',
    stats: {
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      totalPoints: 0,
      averagePoints: 0,
      shutouts: 0,
      blowoutWins: 0,
      clutchWins: 0,
      longestWinStreak: 0,
      currentWinStreak: 0
    }
  },
  {
    id: 'player-9',
    name: 'Blake Iron',
    teamId: 'team-5',
    bio: 'Powerhouse player with incredible strength and determination.',
    photoUrl: '/api/placeholder/150/150',
    stats: {
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      totalPoints: 0,
      averagePoints: 0,
      shutouts: 0,
      blowoutWins: 0,
      clutchWins: 0,
      longestWinStreak: 0,
      currentWinStreak: 0
    }
  },
  {
    id: 'player-10',
    name: 'Drew Lion',
    teamId: 'team-5',
    bio: 'Fearless competitor who never backs down from a challenge.',
    photoUrl: '/api/placeholder/150/150',
    stats: {
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      totalPoints: 0,
      averagePoints: 0,
      shutouts: 0,
      blowoutWins: 0,
      clutchWins: 0,
      longestWinStreak: 0,
      currentWinStreak: 0
    }
  },
  {
    id: 'player-11',
    name: 'Quinn Shadow',
    teamId: 'team-6',
    bio: 'Stealthy player with surprising moves and tactical brilliance.',
    photoUrl: '/api/placeholder/150/150',
    stats: {
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      totalPoints: 0,
      averagePoints: 0,
      shutouts: 0,
      blowoutWins: 0,
      clutchWins: 0,
      longestWinStreak: 0,
      currentWinStreak: 0
    }
  },
  {
    id: 'player-12',
    name: 'Sage Panther',
    teamId: 'team-6',
    bio: 'Experienced veteran with wisdom and skill earned through years of play.',
    photoUrl: '/api/placeholder/150/150',
    stats: {
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      totalPoints: 0,
      averagePoints: 0,
      shutouts: 0,
      blowoutWins: 0,
      clutchWins: 0,
      longestWinStreak: 0,
      currentWinStreak: 0
    }
  }
];

// Helper function to generate realistic game scores
const generateGameScore = (): { team1Score: number; team2Score: number; winnerId: string } => {
  const pointLimit = 11;
  const scenarios = [
    // Close games (1-2 point difference)
    { team1Score: 11, team2Score: 9, probability: 0.25 },
    { team1Score: 11, team2Score: 10, probability: 0.20 },
    { team1Score: 9, team2Score: 11, probability: 0.15 },
    { team1Score: 10, team2Score: 11, probability: 0.15 },
    // Moderate games (3-6 point difference)
    { team1Score: 11, team2Score: 8, probability: 0.10 },
    { team1Score: 11, team2Score: 7, probability: 0.05 },
    { team1Score: 8, team2Score: 11, probability: 0.05 },
    { team1Score: 7, team2Score: 11, probability: 0.03 },
    // Blowouts (7+ point difference)
    { team1Score: 11, team2Score: 4, probability: 0.01 },
    { team1Score: 11, team2Score: 3, probability: 0.005 },
    // Shutouts
    { team1Score: 11, team2Score: 0, probability: 0.005 }
  ];

  const random = Math.random();
  let cumulative = 0;
  
  for (const scenario of scenarios) {
    cumulative += scenario.probability;
    if (random <= cumulative) {
      return {
        team1Score: scenario.team1Score,
        team2Score: scenario.team2Score,
        winnerId: scenario.team1Score > scenario.team2Score ? 'team1' : 'team2'
      };
    }
  }

  // Fallback to close game
  return { team1Score: 11, team2Score: 9, winnerId: 'team1' };
};

// Generate mock games with realistic data
export const generateMockGames = (): Game[] => {
  const games: Game[] = [];
  const teams = mockTeams;
  const now = new Date();
  
  // Generate completed games (last 30 days)
  for (let i = 0; i < 25; i++) {
    const team1 = teams[Math.floor(Math.random() * teams.length)];
    let team2 = teams[Math.floor(Math.random() * teams.length)];
    
    // Ensure different teams
    while (team2.id === team1.id) {
      team2 = teams[Math.floor(Math.random() * teams.length)];
    }
    
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    const scheduledDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const completedDate = new Date(scheduledDate.getTime() + Math.random() * 2 * 60 * 60 * 1000); // 0-2 hours after scheduled
    
    const scoreResult = generateGameScore();
    const winnerId = scoreResult.winnerId === 'team1' ? team1.id : team2.id;
    const scoreDiff = Math.abs(scoreResult.team1Score - scoreResult.team2Score);
    
    games.push({
      id: uuidv4(),
      team1Id: team1.id,
      team2Id: team2.id,
      team1Score: scoreResult.team1Score,
      team2Score: scoreResult.team2Score,
      scheduledDate,
      completedDate,
      status: 'completed',
      winnerId,
      isBlowout: scoreDiff >= 7,
      isClutch: scoreDiff <= 2,
      isShutout: scoreResult.team1Score === 0 || scoreResult.team2Score === 0
    });
  }
  
  // Generate upcoming games (next 14 days)
  for (let i = 0; i < 8; i++) {
    const team1 = teams[Math.floor(Math.random() * teams.length)];
    let team2 = teams[Math.floor(Math.random() * teams.length)];
    
    // Ensure different teams
    while (team2.id === team1.id) {
      team2 = teams[Math.floor(Math.random() * teams.length)];
    }
    
    const daysAhead = Math.floor(Math.random() * 14) + 1;
    const scheduledDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    games.push({
      id: uuidv4(),
      team1Id: team1.id,
      team2Id: team2.id,
      scheduledDate,
      status: 'scheduled'
    });
  }
  
  // Add a few cancelled games
  for (let i = 0; i < 2; i++) {
    const team1 = teams[Math.floor(Math.random() * teams.length)];
    let team2 = teams[Math.floor(Math.random() * teams.length)];
    
    while (team2.id === team1.id) {
      team2 = teams[Math.floor(Math.random() * teams.length)];
    }
    
    const daysAgo = Math.floor(Math.random() * 15) + 1;
    const scheduledDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    games.push({
      id: uuidv4(),
      team1Id: team1.id,
      team2Id: team2.id,
      scheduledDate,
      status: 'cancelled'
    });
  }
  
  return games.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
};

// Generate a sample tournament
export const generateMockTournament = (): Tournament => {
  const selectedTeams = mockTeams.slice(0, 4); // 4-team tournament
  const bracket: TournamentMatch[] = [];
  
  // Semi-finals
  bracket.push({
    id: uuidv4(),
    tournamentId: 'tournament-1',
    round: 1,
    position: 1,
    team1Id: selectedTeams[0].id,
    team2Id: selectedTeams[1].id,
    status: 'completed',
    team1Score: 11,
    team2Score: 8,
    winnerId: selectedTeams[0].id,
    nextMatchId: 'final-match'
  });
  
  bracket.push({
    id: uuidv4(),
    tournamentId: 'tournament-1',
    round: 1,
    position: 2,
    team1Id: selectedTeams[2].id,
    team2Id: selectedTeams[3].id,
    status: 'completed',
    team1Score: 11,
    team2Score: 9,
    winnerId: selectedTeams[2].id,
    nextMatchId: 'final-match'
  });
  
  // Final
  bracket.push({
    id: 'final-match',
    tournamentId: 'tournament-1',
    round: 2,
    position: 1,
    team1Id: selectedTeams[0].id,
    team2Id: selectedTeams[2].id,
    status: 'completed',
    team1Score: 11,
    team2Score: 7,
    winnerId: selectedTeams[0].id
  });
  
  return {
    id: 'tournament-1',
    name: 'Spring Championship',
    type: 'single-elimination',
    status: 'completed',
    teams: selectedTeams.map(t => t.id),
    bracket,
    winnerId: selectedTeams[0].id,
    createdDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    completedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  };
};

// Mock announcements
export const mockAnnouncements = [
  {
    id: '1',
    title: 'Season Playoffs Starting Soon!',
    content: 'The playoff bracket will be announced next week. Top 8 teams qualify.',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    important: true
  },
  {
    id: '2',
    title: 'New Team Registration Open',
    content: 'Registration for the summer season is now open. Contact us for details.',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    important: false
  },
  {
    id: '3',
    title: 'League Meetup This Saturday',
    content: 'Join us for food, drinks, and casual games at the community center.',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    important: false
  }
];
