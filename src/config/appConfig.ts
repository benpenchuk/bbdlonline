export interface AppConfig {
  league: {
    name: string;
    season: string;
    pointLimit: number;
    contactEmail: string;
    contactPhone: string;
  };
  homepage: {
    sections: {
      statCards: boolean;
      upcomingGames: boolean;
      recentResults: boolean;
      topPlayers: boolean;
      announcements: boolean;
      sponsors: boolean;
    };
    sectionTitles: {
      statCards: string;
      upcomingGames: string;
      recentResults: string;
      topPlayers: string;
      announcements: string;
      sponsors: string;
    };
  };
  admin: {
    password: string;
  };
}

export const defaultConfig: AppConfig = {
  league: {
    name: "Beta Beer Dye League",
    season: "2025 Season",
    pointLimit: 11,
    contactEmail: "info@bbdlonline.com",
    contactPhone: "(555) 123-BBDL"
  },
  homepage: {
    sections: {
      statCards: true,
      upcomingGames: true,
      recentResults: true,
      topPlayers: true,
      announcements: true,
      sponsors: true
    },
    sectionTitles: {
      statCards: "Season Overview",
      upcomingGames: "Upcoming Games",
      recentResults: "Recent Results",
      topPlayers: "Top Performers",
      announcements: "League Announcements",
      sponsors: "Our Sponsors"
    }
  },
  admin: {
    password: "bbdladmin2025"
  }
};

// Config management functions
export const getConfig = (): AppConfig => {
  const saved = localStorage.getItem('bbdl-config');
  return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
};

export const saveConfig = (config: AppConfig): void => {
  localStorage.setItem('bbdl-config', JSON.stringify(config));
};

export const resetConfig = (): void => {
  localStorage.removeItem('bbdl-config');
};
