// Generated from the live database by `generate_typescript_types`.
// The helper aliases at the bottom are hand-maintained — keep them when
// regenerating.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      game_confirmations: {
        Row: {
          confirmed_at: string
          confirmed_by: string
          game_id: string
          team_id: string
        }
        Insert: {
          confirmed_at?: string
          confirmed_by: string
          game_id: string
          team_id: string
        }
        Update: {
          confirmed_at?: string
          confirmed_by?: string
          game_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_confirmations_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_confirmations_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_confirmations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "game_confirmations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_season_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "game_confirmations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      game_participants: {
        Row: {
          game_id: string
          person_id: string
          team_id: string
        }
        Insert: {
          game_id: string
          person_id: string
          team_id: string
        }
        Update: {
          game_id?: string
          person_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_participants_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "game_participants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_season_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "game_participants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          away_score: number
          away_team_id: string
          created_at: string
          home_score: number
          home_team_id: string
          id: string
          imported_mvp_person_id: string | null
          is_tracked: boolean
          kind: Database["public"]["Enums"]["game_kind"]
          location: string | null
          playoff_match_id: string | null
          scheduled_at: string | null
          season_id: string
          status: Database["public"]["Enums"]["game_status"]
          tracked_by: string | null
          updated_at: string
          week: number | null
          winner_team_id: string | null
        }
        Insert: {
          away_score?: number
          away_team_id: string
          created_at?: string
          home_score?: number
          home_team_id: string
          id?: string
          imported_mvp_person_id?: string | null
          is_tracked?: boolean
          kind?: Database["public"]["Enums"]["game_kind"]
          location?: string | null
          playoff_match_id?: string | null
          scheduled_at?: string | null
          season_id: string
          status?: Database["public"]["Enums"]["game_status"]
          tracked_by?: string | null
          updated_at?: string
          week?: number | null
          winner_team_id?: string | null
        }
        Update: {
          away_score?: number
          away_team_id?: string
          created_at?: string
          home_score?: number
          home_team_id?: string
          id?: string
          imported_mvp_person_id?: string | null
          is_tracked?: boolean
          kind?: Database["public"]["Enums"]["game_kind"]
          location?: string | null
          playoff_match_id?: string | null
          scheduled_at?: string | null
          season_id?: string
          status?: Database["public"]["Enums"]["game_status"]
          tracked_by?: string | null
          updated_at?: string
          week?: number | null
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "games_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "team_season_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "games_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "games_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "team_season_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "games_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_imported_mvp_person_id_fkey"
            columns: ["imported_mvp_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_playoff_match_fk"
            columns: ["playoff_match_id"]
            isOneToOne: false
            referencedRelation: "playoff_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_tracked_by_fkey"
            columns: ["tracked_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "games_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "team_season_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "games_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      imported_player_season_stats: {
        Row: {
          catches: number | null
          dinks: number | null
          field_goals: number | null
          fifas: number | null
          imported_at: string
          mvps: number | null
          naked_laps: number | null
          note: string | null
          person_id: string
          season_id: string
          self_sinks: number | null
          sinks: number | null
          source: string
          source_games_played: number | null
          special_points: number | null
          table_hits: number | null
          throws: number | null
          total_points: number | null
        }
        Insert: {
          catches?: number | null
          dinks?: number | null
          field_goals?: number | null
          fifas?: number | null
          imported_at?: string
          mvps?: number | null
          naked_laps?: number | null
          note?: string | null
          person_id: string
          season_id: string
          self_sinks?: number | null
          sinks?: number | null
          source: string
          source_games_played?: number | null
          special_points?: number | null
          table_hits?: number | null
          throws?: number | null
          total_points?: number | null
        }
        Update: {
          catches?: number | null
          dinks?: number | null
          field_goals?: number | null
          fifas?: number | null
          imported_at?: string
          mvps?: number | null
          naked_laps?: number | null
          note?: string | null
          person_id?: string
          season_id?: string
          self_sinks?: number | null
          sinks?: number | null
          source?: string
          source_games_played?: number | null
          special_points?: number | null
          table_hits?: number | null
          throws?: number | null
          total_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "imported_player_season_stats_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imported_player_season_stats_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          email: string | null
          expires_at: string | null
          grants_role: Database["public"]["Enums"]["site_role"]
          grants_status: Database["public"]["Enums"]["league_status"]
          id: string
          max_uses: number | null
          person_id: string | null
          revoked_at: string | null
          use_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          grants_role?: Database["public"]["Enums"]["site_role"]
          grants_status?: Database["public"]["Enums"]["league_status"]
          id?: string
          max_uses?: number | null
          person_id?: string | null
          revoked_at?: string | null
          use_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          grants_role?: Database["public"]["Enums"]["site_role"]
          grants_status?: Database["public"]["Enums"]["league_status"]
          id?: string
          max_uses?: number | null
          person_id?: string | null
          revoked_at?: string | null
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string
          dominant_hand: string | null
          email: string | null
          first_name: string
          hometown_city: string | null
          hometown_state: string | null
          id: string
          last_name: string
          league_status: Database["public"]["Enums"]["league_status"]
          nickname: string | null
          site_role: Database["public"]["Enums"]["site_role"]
          slug: string
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          dominant_hand?: string | null
          email?: string | null
          first_name: string
          hometown_city?: string | null
          hometown_state?: string | null
          id?: string
          last_name: string
          league_status?: Database["public"]["Enums"]["league_status"]
          nickname?: string | null
          site_role?: Database["public"]["Enums"]["site_role"]
          slug: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          dominant_hand?: string | null
          email?: string | null
          first_name?: string
          hometown_city?: string | null
          hometown_state?: string | null
          id?: string
          last_name?: string
          league_status?: Database["public"]["Enums"]["league_status"]
          nickname?: string | null
          site_role?: Database["public"]["Enums"]["site_role"]
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      playoff_matches: {
        Row: {
          created_at: string
          id: string
          match_number: number
          next_match_id: string | null
          playoff_id: string
          point_target: number
          round_number: number
          series_length: number
          status: string
          team1_id: string | null
          team2_id: string | null
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          match_number: number
          next_match_id?: string | null
          playoff_id: string
          point_target?: number
          round_number: number
          series_length?: number
          status?: string
          team1_id?: string | null
          team2_id?: string | null
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          match_number?: number
          next_match_id?: string | null
          playoff_id?: string
          point_target?: number
          round_number?: number
          series_length?: number
          status?: string
          team1_id?: string | null
          team2_id?: string | null
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playoff_matches_next_match_id_fkey"
            columns: ["next_match_id"]
            isOneToOne: false
            referencedRelation: "playoff_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playoff_matches_playoff_id_fkey"
            columns: ["playoff_id"]
            isOneToOne: false
            referencedRelation: "playoffs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playoff_matches_playoff_id_fkey"
            columns: ["playoff_id"]
            isOneToOne: false
            referencedRelation: "season_champions"
            referencedColumns: ["playoff_id"]
          },
          {
            foreignKeyName: "playoff_matches_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "playoff_matches_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "team_season_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "playoff_matches_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playoff_matches_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "playoff_matches_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "team_season_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "playoff_matches_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playoff_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "playoff_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "team_season_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "playoff_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      playoffs: {
        Row: {
          bracket_type: string
          created_at: string
          id: string
          name: string
          season_id: string
          status: string
          updated_at: string
        }
        Insert: {
          bracket_type?: string
          created_at?: string
          id?: string
          name: string
          season_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          bracket_type?: string
          created_at?: string
          id?: string
          name?: string
          season_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playoffs_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      rivalry_challenges: {
        Row: {
          challenged_team_id: string
          challenger_team_id: string
          created_at: string
          created_by: string | null
          id: string
          responded_at: string | null
          responded_by: string | null
          season_id: string
          status: Database["public"]["Enums"]["challenge_status"]
        }
        Insert: {
          challenged_team_id: string
          challenger_team_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          responded_at?: string | null
          responded_by?: string | null
          season_id: string
          status?: Database["public"]["Enums"]["challenge_status"]
        }
        Update: {
          challenged_team_id?: string
          challenger_team_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          responded_at?: string | null
          responded_by?: string | null
          season_id?: string
          status?: Database["public"]["Enums"]["challenge_status"]
        }
        Relationships: [
          {
            foreignKeyName: "rivalry_challenges_challenged_team_id_fkey"
            columns: ["challenged_team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "rivalry_challenges_challenged_team_id_fkey"
            columns: ["challenged_team_id"]
            isOneToOne: false
            referencedRelation: "team_season_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "rivalry_challenges_challenged_team_id_fkey"
            columns: ["challenged_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rivalry_challenges_challenger_team_id_fkey"
            columns: ["challenger_team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "rivalry_challenges_challenger_team_id_fkey"
            columns: ["challenger_team_id"]
            isOneToOne: false
            referencedRelation: "team_season_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "rivalry_challenges_challenger_team_id_fkey"
            columns: ["challenger_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rivalry_challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rivalry_challenges_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rivalry_challenges_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          end_date: string | null
          final_point_target: number
          final_series_length: number
          id: string
          locked: boolean
          name: string
          number: number
          point_cap: number | null
          point_target: number
          regular_weeks: number
          semi_point_target: number
          slug: string
          start_date: string | null
          status: Database["public"]["Enums"]["season_status"]
          term: Database["public"]["Enums"]["season_term"]
          updated_at: string
          win_by: number
          year: number
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          final_point_target?: number
          final_series_length?: number
          id?: string
          locked?: boolean
          name: string
          number: number
          point_cap?: number | null
          point_target?: number
          regular_weeks?: number
          semi_point_target?: number
          slug: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["season_status"]
          term: Database["public"]["Enums"]["season_term"]
          updated_at?: string
          win_by?: number
          year: number
        }
        Update: {
          created_at?: string
          end_date?: string | null
          final_point_target?: number
          final_series_length?: number
          id?: string
          locked?: boolean
          name?: string
          number?: number
          point_cap?: number | null
          point_target?: number
          regular_weeks?: number
          semi_point_target?: number
          slug?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["season_status"]
          term?: Database["public"]["Enums"]["season_term"]
          updated_at?: string
          win_by?: number
          year?: number
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          joined_at: string | null
          left_at: string | null
          person_id: string
          role: Database["public"]["Enums"]["roster_role"]
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          person_id: string
          role?: Database["public"]["Enums"]["roster_role"]
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          person_id?: string
          role?: Database["public"]["Enums"]["roster_role"]
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_season_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          abbreviation: string | null
          approved: boolean
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          name: string
          season_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          abbreviation?: string | null
          approved?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name: string
          season_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          abbreviation?: string | null
          approved?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          season_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      throws: {
        Row: {
          counts_as_hit: boolean | null
          created_at: string
          defender_id: string | null
          fifa_kicks: number | null
          game_id: string
          id: string
          outcome: Database["public"]["Enums"]["throw_outcome"]
          points: number | null
          scoring_team_id: string | null
          seq: number
          thrower_id: string
          thrower_team_id: string
        }
        Insert: {
          counts_as_hit?: boolean | null
          created_at?: string
          defender_id?: string | null
          fifa_kicks?: number | null
          game_id: string
          id?: string
          outcome: Database["public"]["Enums"]["throw_outcome"]
          points?: number | null
          scoring_team_id?: string | null
          seq: number
          thrower_id: string
          thrower_team_id: string
        }
        Update: {
          counts_as_hit?: boolean | null
          created_at?: string
          defender_id?: string | null
          fifa_kicks?: number | null
          game_id?: string
          id?: string
          outcome?: Database["public"]["Enums"]["throw_outcome"]
          points?: number | null
          scoring_team_id?: string | null
          seq?: number
          thrower_id?: string
          thrower_team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "throws_defender_id_fkey"
            columns: ["defender_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "throws_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "throws_scoring_team_id_fkey"
            columns: ["scoring_team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "throws_scoring_team_id_fkey"
            columns: ["scoring_team_id"]
            isOneToOne: false
            referencedRelation: "team_season_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "throws_scoring_team_id_fkey"
            columns: ["scoring_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "throws_thrower_id_fkey"
            columns: ["thrower_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "throws_thrower_team_id_fkey"
            columns: ["thrower_team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "throws_thrower_team_id_fkey"
            columns: ["thrower_team_id"]
            isOneToOne: false
            referencedRelation: "team_season_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "throws_thrower_team_id_fkey"
            columns: ["thrower_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      game_mvp: {
        Row: {
          accuracy_pct: number | null
          game_id: string | null
          person_id: string | null
          team_id: string | null
          total_points: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_participants_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "game_participants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_season_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "game_participants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      game_records: {
        Row: {
          game_id: string | null
          person_id: string | null
          record: string | null
          season_id: string | null
          team_id: string | null
          value: number | null
        }
        Relationships: []
      }
      player_career_stats: {
        Row: {
          accuracy_pct: number | null
          fifas: number | null
          games_played: number | null
          has_imported_seasons: boolean | null
          losses: number | null
          person_id: string | null
          seasons: number | null
          sinks: number | null
          table_hits: number | null
          throws: number | null
          total_points: number | null
          win_pct: number | null
          wins: number | null
        }
        Relationships: []
      }
      player_game_stats: {
        Row: {
          accuracy_pct: number | null
          catches: number | null
          defensive_points: number | null
          dinks: number | null
          field_goals: number | null
          fifas: number | null
          game_id: string | null
          is_tracked: boolean | null
          offensive_points: number | null
          person_id: string | null
          points_plain: number | null
          rethrows: number | null
          season_id: string | null
          sinks: number | null
          status: Database["public"]["Enums"]["game_status"] | null
          table_hits: number | null
          team_id: string | null
          throws: number | null
          total_points: number | null
          won: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "game_participants_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "game_participants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_season_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "game_participants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      player_season_stats: {
        Row: {
          accuracy_pct: number | null
          catches: number | null
          defensive_points: number | null
          dinks: number | null
          field_goals: number | null
          fifas: number | null
          games_played: number | null
          games_tracked: number | null
          is_imported: boolean | null
          losses: number | null
          mvps: number | null
          naked_laps: number | null
          offensive_points: number | null
          person_id: string | null
          points_per_game: number | null
          season_id: string | null
          self_sinks: number | null
          sinks: number | null
          source_games_played: number | null
          special_points: number | null
          table_hits: number | null
          throws: number | null
          total_points: number | null
          win_pct: number | null
          wins: number | null
        }
        Relationships: []
      }
      season_champions: {
        Row: {
          playoff_id: string | null
          round_number: number | null
          season_id: string | null
          team_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playoff_matches_winner_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "standings"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "playoff_matches_winner_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_season_stats"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "playoff_matches_winner_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playoffs_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      standings: {
        Row: {
          games_played: number | null
          losses: number | null
          name: string | null
          point_differential: number | null
          points_against: number | null
          points_for: number | null
          rank: number | null
          season_id: string | null
          team_id: string | null
          win_pct: number | null
          wins: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      team_game_results: {
        Row: {
          game_id: string | null
          kind: Database["public"]["Enums"]["game_kind"] | null
          opponent_id: string | null
          points_against: number | null
          points_for: number | null
          season_id: string | null
          status: Database["public"]["Enums"]["game_status"] | null
          team_id: string | null
          week: number | null
          winner_team_id: string | null
        }
        Relationships: []
      }
      team_season_stats: {
        Row: {
          games_played: number | null
          losses: number | null
          name: string | null
          point_differential: number | null
          points_against: number | null
          points_for: number | null
          season_id: string | null
          team_id: string | null
          win_pct: number | null
          wins: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      team_streaks: {
        Row: {
          ended: string | null
          length: number | null
          season_id: string | null
          started: string | null
          team_id: string | null
          won: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "games_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      active_season_id: { Args: never; Returns: string }
      advance_playoff_winner: {
        Args: { p_match: string; p_winner: string }
        Returns: undefined
      }
      current_person_id: { Args: never; Returns: string }
      ensure_playoff_game: { Args: { p_match: string }; Returns: undefined }
      invite_code_valid: { Args: { p_code: string }; Returns: boolean }
      invite_is_usable: {
        Args: { inv: Database["public"]["Tables"]["invites"]["Row"] }
        Returns: boolean
      }
      is_commissioner: { Args: never; Returns: boolean }
      is_in_game: { Args: { p_game: string }; Returns: boolean }
      is_on_team: { Args: { p_team: string }; Returns: boolean }
      is_superadmin: { Args: never; Returns: boolean }
      override_playoff_winner: {
        Args: { p_match: string; p_winner: string }
        Returns: undefined
      }
      playoff_wins_needed: { Args: { p_series: number }; Returns: number }
      season_is_open: { Args: { p_season: string }; Returns: boolean }
      start_playoff: { Args: { p_playoff: string }; Returns: undefined }
      team_season_is_open: { Args: { p_team: string }; Returns: boolean }
    }
    Enums: {
      challenge_status: "pending" | "accepted" | "declined" | "expired"
      game_kind: "regular" | "rivalry" | "playoff"
      game_status:
        | "scheduled"
        | "in_progress"
        | "awaiting_confirmation"
        | "final"
        | "disputed"
        | "canceled"
      league_status: "player" | "alumni" | "spectator"
      roster_role: "starter" | "sub"
      season_status: "upcoming" | "active" | "completed" | "archived"
      season_term: "fall" | "spring"
      site_role: "member" | "commissioner" | "superadmin"
      throw_outcome:
        | "point"
        | "dink"
        | "sink"
        | "field_goal"
        | "fifa"
        | "caught"
        | "missed"
        | "rethrow"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// ---------- convenience aliases used across the app ----------
export type Person = Tables<"people">;
export type Season = Tables<"seasons">;
export type Team = Tables<"teams">;
export type Game = Tables<"games">;
export type Throw = Tables<"throws">;
export type Standing = Tables<"standings">;
export type PlayerSeasonStats = Tables<"player_season_stats">;
export type PlayerGameStats = Tables<"player_game_stats">;

export type SiteRole = Enums<"site_role">;
export type LeagueStatus = Enums<"league_status">;
export type ThrowOutcome = Enums<"throw_outcome">;
export type GameStatus = Enums<"game_status">;
