import { Team, Player, Game, Tournament, TournamentMatch } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Mock Teams
export const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Backdoor Bandits',
    color: '#3B82F6',
    icon: 'skull',
    wins: 0,
    losses: 0,
    totalPoints: 0,
    gamesPlayed: 0,
    players: ['player-1', 'player-2']
  },
  {
    id: 'team-2',
    name: 'Griers Fishy Autistic Clumpy Discharge',
    color: '#EF4444',
    icon: 'waves',
    wins: 0,
    losses: 0,
    totalPoints: 0,
    gamesPlayed: 0,
    players: ['player-3', 'player-4']
  },
  {
    id: 'team-3',
    name: 'Little Red Rockets',
    color: '#06B6D4',
    icon: 'rocket',
    wins: 0,
    losses: 0,
    totalPoints: 0,
    gamesPlayed: 0,
    players: ['player-5', 'player-6']
  },
  {
    id: 'team-4',
    name: 'Stim Lords',
    color: '#8B5CF6',
    icon: 'crown',
    wins: 0,
    losses: 0,
    totalPoints: 0,
    gamesPlayed: 0,
    players: ['player-7', 'player-8']
  },
  {
    id: 'team-5',
    name: 'Hitler Youth',
    color: '#F59E0B',
    icon: 'flame',
    wins: 0,
    losses: 0,
    totalPoints: 0,
    gamesPlayed: 0,
    players: ['player-9', 'player-10']
  },
  {
    id: 'team-6',
    name: 'The Pants Party',
    color: '#6B7280',
    icon: 'beer',
    wins: 0,
    losses: 0,
    totalPoints: 0,
    gamesPlayed: 0,
    players: ['player-11', 'player-12']
  },
  {
    id: 'team-7',
    name: 'Wam',
    color: '#FBBF24',
    icon: 'zap',
    wins: 0,
    losses: 0,
    totalPoints: 0,
    gamesPlayed: 0,
    players: ['player-13', 'player-14']
  },
  {
    id: 'team-8',
    name: 'Peas n Pickles',
    color: '#10B981',
    icon: 'heart',
    wins: 0,
    losses: 0,
    totalPoints: 0,
    gamesPlayed: 0,
    players: ['player-15', 'player-16']
  }
];

// Mock Players
export const mockPlayers: Player[] = [
  {
    id: 'player-1',
    name: 'Tate Booch',
    teamId: 'team-1',
    bio: 'Once arm-wrestled a cactus and lost. The cactus cheated.',
    year: 'senior',
    photoUrl: '/images/players/Tate Booch.png',
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
    name: 'Diddy',
    teamId: 'team-1',
    bio: 'Claims to have invented the color blue. We have our doubts.',
    year: 'junior',
    photoUrl: '/images/players/Diddy.png',
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
    name: 'Donald Trump',
    teamId: 'team-2',
    bio: "Thinks 'HTML' is a type of sandwich. A tremendous sandwich, the best.",
    year: 'senior',
    photoUrl: '/images/players/Donald Trump.png',
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
    name: 'Yancy Longin',
    teamId: 'team-2',
    bio: 'His spirit animal is a slightly confused pigeon.',
    year: 'sophomore',
    photoUrl: '/images/players/Yancy Longin.png',
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
    name: 'Kamala Harris',
    teamId: 'team-3',
    bio: 'Laughs at her own jokes, which is good because no one else does.',
    year: 'alumni',
    photoUrl: '/images/players/Kamala Harris.png',
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
    name: 'Noah Biggers',
    teamId: 'team-3',
    bio: "Has a pet rock named 'Dwayne'. They have deep conversations.",
    year: 'freshman',
    photoUrl: '/images/players/Noah Biggers.jpg',
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
    name: 'Craig Brandstetter',
    teamId: 'team-4',
    bio: "Believes that pineapple on pizza is a war crime, and he's willing to die on that hill.",
    year: 'junior',
    photoUrl: '/images/players/Craig Brandstetter.png',
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
    name: 'Mason Esworthy',
    teamId: 'team-4',
    bio: 'Still uses a flip phone. Unironically.',
    year: 'sophomore',
    photoUrl: '/images/players/Mason Esworthy.png',
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
    name: 'George Washington',
    teamId: 'team-5',
    bio: 'Wooden teeth? Please. These are artisanal, small-batch, gluten-free dentures.',
    year: 'alumni',
    photoUrl: '/images/players/George Washington.png',
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
    name: 'Evan Eisman',
    teamId: 'team-5',
    bio: "Convinced he's a wizard, but his only trick is making beer disappear.",
    year: 'senior',
    photoUrl: '/images/players/Evan Eisman.png',
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
    name: 'Adam Carey',
    teamId: 'team-6',
    bio: 'Wears socks with sandals and dares you to say something.',
    year: 'freshman',
    photoUrl: '/images/players/Adam Carey.png',
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
    name: 'Ben Penchuk',
    teamId: 'team-6',
    bio: 'Once tried to pay for a burrito with a half-eaten granola bar. The cashier was not amused.',
    year: 'junior',
    photoUrl: '/images/players/Ben Penchuk.png',
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
    id: 'player-13',
    name: 'Jack Silk',
    teamId: 'team-7',
    bio: 'His secret talent is being able to parallel park a unicycle.',
    year: 'sophomore',
    photoUrl: '/images/players/Jack Silk.png',
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
    id: 'player-14',
    name: 'Colin Gross',
    teamId: 'team-7',
    bio: 'Speaks fluent sarcasm and broken English.',
    year: 'senior',
    photoUrl: '/images/players/Colin Gross.png',
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
    id: 'player-15',
    name: 'John Ertel',
    teamId: 'team-8',
    bio: "Is currently in a staring contest with a garden gnome. It's been three days.",
    year: 'junior',
    photoUrl: '/images/players/John Ertel.png',
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
    id: 'player-16',
    name: 'Matt Malarkey',
    teamId: 'team-8',
    bio: "His last name is not an invitation for shenanigans. Or is it?",
    year: 'freshman',
    photoUrl: '/images/players/Matt Malarkey.png',
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
