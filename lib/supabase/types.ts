/**
 * Database types, generated from the live schema.
 *
 * Do not hand-edit. Regenerate after any migration — from a Claude Code
 * session with the Supabase connector, or with:
 *   npx supabase gen types typescript --project-id kprqrxszykdccbuhzglc
 *
 * KNOWN GAP: the `Relationships` arrays are stubbed to []. That only affects
 * type inference for embedded selects (`.select("*, people(*)")`), which the
 * app currently avoids in favour of explicit joins. Regenerate in full before
 * relying on embedded resource syntax.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      game_confirmations: {
        Row: {
          confirmed_at: string;
          confirmed_by: string;
          game_id: string;
          team_id: string;
        };
        Insert: {
          confirmed_at?: string;
          confirmed_by: string;
          game_id: string;
          team_id: string;
        };
        Update: {
          confirmed_at?: string;
          confirmed_by?: string;
          game_id?: string;
          team_id?: string;
        };
        Relationships: [];
      };
      game_participants: {
        Row: {
          game_id: string;
          person_id: string;
          team_id: string;
        };
        Insert: {
          game_id: string;
          person_id: string;
          team_id: string;
        };
        Update: {
          game_id?: string;
          person_id?: string;
          team_id?: string;
        };
        Relationships: [];
      };
      games: {
        Row: {
          away_score: number;
          away_team_id: string;
          created_at: string;
          home_score: number;
          home_team_id: string;
          id: string;
          imported_mvp_person_id: string | null;
          is_tracked: boolean;
          kind: Database["public"]["Enums"]["game_kind"];
          location: string | null;
          playoff_match_id: string | null;
          scheduled_at: string | null;
          season_id: string;
          status: Database["public"]["Enums"]["game_status"];
          tracked_by: string | null;
          updated_at: string;
          week: number | null;
          winner_team_id: string | null;
        };
        Insert: {
          away_score?: number;
          away_team_id: string;
          created_at?: string;
          home_score?: number;
          home_team_id: string;
          id?: string;
          imported_mvp_person_id?: string | null;
          is_tracked?: boolean;
          kind?: Database["public"]["Enums"]["game_kind"];
          location?: string | null;
          playoff_match_id?: string | null;
          scheduled_at?: string | null;
          season_id: string;
          status?: Database["public"]["Enums"]["game_status"];
          tracked_by?: string | null;
          updated_at?: string;
          week?: number | null;
          winner_team_id?: string | null;
        };
        Update: {
          away_score?: number;
          away_team_id?: string;
          created_at?: string;
          home_score?: number;
          home_team_id?: string;
          id?: string;
          imported_mvp_person_id?: string | null;
          is_tracked?: boolean;
          kind?: Database["public"]["Enums"]["game_kind"];
          location?: string | null;
          playoff_match_id?: string | null;
          scheduled_at?: string | null;
          season_id?: string;
          status?: Database["public"]["Enums"]["game_status"];
          tracked_by?: string | null;
          updated_at?: string;
          week?: number | null;
          winner_team_id?: string | null;
        };
        Relationships: [];
      };
      invites: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          email: string | null;
          expires_at: string | null;
          grants_role: Database["public"]["Enums"]["site_role"];
          grants_status: Database["public"]["Enums"]["league_status"];
          id: string;
          max_uses: number | null;
          person_id: string | null;
          revoked_at: string | null;
          use_count: number;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          expires_at?: string | null;
          grants_role?: Database["public"]["Enums"]["site_role"];
          grants_status?: Database["public"]["Enums"]["league_status"];
          id?: string;
          max_uses?: number | null;
          person_id?: string | null;
          revoked_at?: string | null;
          use_count?: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          expires_at?: string | null;
          grants_role?: Database["public"]["Enums"]["site_role"];
          grants_status?: Database["public"]["Enums"]["league_status"];
          id?: string;
          max_uses?: number | null;
          person_id?: string | null;
          revoked_at?: string | null;
          use_count?: number;
        };
        Relationships: [];
      };
      people: {
        Row: {
          auth_user_id: string | null;
          avatar_url: string | null;
          created_at: string;
          dominant_hand: string | null;
          email: string | null;
          first_name: string;
          hometown_city: string | null;
          hometown_state: string | null;
          id: string;
          last_name: string;
          league_status: Database["public"]["Enums"]["league_status"];
          nickname: string | null;
          site_role: Database["public"]["Enums"]["site_role"];
          slug: string;
          updated_at: string;
        };
        Insert: {
          auth_user_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          dominant_hand?: string | null;
          email?: string | null;
          first_name: string;
          hometown_city?: string | null;
          hometown_state?: string | null;
          id?: string;
          last_name: string;
          league_status?: Database["public"]["Enums"]["league_status"];
          nickname?: string | null;
          site_role?: Database["public"]["Enums"]["site_role"];
          slug: string;
          updated_at?: string;
        };
        Update: {
          auth_user_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          dominant_hand?: string | null;
          email?: string | null;
          first_name?: string;
          hometown_city?: string | null;
          hometown_state?: string | null;
          id?: string;
          last_name?: string;
          league_status?: Database["public"]["Enums"]["league_status"];
          nickname?: string | null;
          site_role?: Database["public"]["Enums"]["site_role"];
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      playoff_matches: {
        Row: {
          created_at: string;
          id: string;
          match_number: number;
          next_match_id: string | null;
          playoff_id: string;
          point_target: number;
          round_number: number;
          series_length: number;
          status: string;
          team1_id: string | null;
          team2_id: string | null;
          updated_at: string;
          winner_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          match_number: number;
          next_match_id?: string | null;
          playoff_id: string;
          point_target?: number;
          round_number: number;
          series_length?: number;
          status?: string;
          team1_id?: string | null;
          team2_id?: string | null;
          updated_at?: string;
          winner_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          match_number?: number;
          next_match_id?: string | null;
          playoff_id?: string;
          point_target?: number;
          round_number?: number;
          series_length?: number;
          status?: string;
          team1_id?: string | null;
          team2_id?: string | null;
          updated_at?: string;
          winner_id?: string | null;
        };
        Relationships: [];
      };
      playoffs: {
        Row: {
          bracket_type: string;
          created_at: string;
          id: string;
          name: string;
          season_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          bracket_type?: string;
          created_at?: string;
          id?: string;
          name: string;
          season_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          bracket_type?: string;
          created_at?: string;
          id?: string;
          name?: string;
          season_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rivalry_challenges: {
        Row: {
          challenged_team_id: string;
          challenger_team_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          responded_at: string | null;
          responded_by: string | null;
          season_id: string;
          status: Database["public"]["Enums"]["challenge_status"];
        };
        Insert: {
          challenged_team_id: string;
          challenger_team_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          responded_at?: string | null;
          responded_by?: string | null;
          season_id: string;
          status?: Database["public"]["Enums"]["challenge_status"];
        };
        Update: {
          challenged_team_id?: string;
          challenger_team_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          responded_at?: string | null;
          responded_by?: string | null;
          season_id?: string;
          status?: Database["public"]["Enums"]["challenge_status"];
        };
        Relationships: [];
      };
      seasons: {
        Row: {
          created_at: string;
          end_date: string | null;
          final_point_target: number;
          final_series_length: number;
          id: string;
          name: string;
          number: number;
          point_cap: number | null;
          point_target: number;
          regular_weeks: number;
          semi_point_target: number;
          slug: string;
          start_date: string | null;
          status: Database["public"]["Enums"]["season_status"];
          term: Database["public"]["Enums"]["season_term"];
          updated_at: string;
          win_by: number;
          year: number;
        };
        Insert: {
          created_at?: string;
          end_date?: string | null;
          final_point_target?: number;
          final_series_length?: number;
          id?: string;
          name: string;
          number: number;
          point_cap?: number | null;
          point_target?: number;
          regular_weeks?: number;
          semi_point_target?: number;
          slug: string;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["season_status"];
          term: Database["public"]["Enums"]["season_term"];
          updated_at?: string;
          win_by?: number;
          year: number;
        };
        Update: {
          created_at?: string;
          end_date?: string | null;
          final_point_target?: number;
          final_series_length?: number;
          id?: string;
          name?: string;
          number?: number;
          point_cap?: number | null;
          point_target?: number;
          regular_weeks?: number;
          semi_point_target?: number;
          slug?: string;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["season_status"];
          term?: Database["public"]["Enums"]["season_term"];
          updated_at?: string;
          win_by?: number;
          year?: number;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          created_at: string;
          id: string;
          joined_at: string | null;
          left_at: string | null;
          person_id: string;
          role: Database["public"]["Enums"]["roster_role"];
          team_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          joined_at?: string | null;
          left_at?: string | null;
          person_id: string;
          role?: Database["public"]["Enums"]["roster_role"];
          team_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          joined_at?: string | null;
          left_at?: string | null;
          person_id?: string;
          role?: Database["public"]["Enums"]["roster_role"];
          team_id?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          abbreviation: string | null;
          approved: boolean;
          created_at: string;
          created_by: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          season_id: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          abbreviation?: string | null;
          approved?: boolean;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          season_id: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          abbreviation?: string | null;
          approved?: boolean;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          season_id?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      throws: {
        Row: {
          counts_as_hit: boolean | null;
          created_at: string;
          defender_id: string | null;
          fifa_kicks: number | null;
          game_id: string;
          id: string;
          outcome: Database["public"]["Enums"]["throw_outcome"];
          points: number | null;
          scoring_team_id: string | null;
          seq: number;
          thrower_id: string;
          thrower_team_id: string;
        };
        Insert: {
          created_at?: string;
          defender_id?: string | null;
          fifa_kicks?: number | null;
          game_id: string;
          id?: string;
          outcome: Database["public"]["Enums"]["throw_outcome"];
          scoring_team_id?: string | null;
          seq?: number;
          thrower_id: string;
          thrower_team_id: string;
        };
        Update: {
          created_at?: string;
          defender_id?: string | null;
          fifa_kicks?: number | null;
          game_id?: string;
          id?: string;
          outcome?: Database["public"]["Enums"]["throw_outcome"];
          scoring_team_id?: string | null;
          seq?: number;
          thrower_id?: string;
          thrower_team_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      game_records: {
        Row: {
          game_id: string | null;
          person_id: string | null;
          record: string | null;
          season_id: string | null;
          team_id: string | null;
          value: number | null;
        };
        Relationships: [];
      };
      season_champions: {
        Row: {
          playoff_id: string | null;
          round_number: number | null;
          season_id: string | null;
          team_id: string | null;
        };
        Relationships: [];
      };
      team_streaks: {
        Row: {
          ended: string | null;
          length: number | null;
          season_id: string | null;
          started: string | null;
          team_id: string | null;
          won: boolean | null;
        };
        Relationships: [];
      };
      game_mvp: {
        Row: {
          accuracy_pct: number | null;
          game_id: string | null;
          person_id: string | null;
          team_id: string | null;
          total_points: number | null;
        };
        Relationships: [];
      };
      player_career_stats: {
        Row: {
          accuracy_pct: number | null;
          fifas: number | null;
          games_played: number | null;
          losses: number | null;
          person_id: string | null;
          seasons: number | null;
          sinks: number | null;
          table_hits: number | null;
          throws: number | null;
          total_points: number | null;
          win_pct: number | null;
          wins: number | null;
        };
        Relationships: [];
      };
      player_game_stats: {
        Row: {
          accuracy_pct: number | null;
          catches: number | null;
          defensive_points: number | null;
          dinks: number | null;
          field_goals: number | null;
          fifas: number | null;
          game_id: string | null;
          is_tracked: boolean | null;
          offensive_points: number | null;
          person_id: string | null;
          points_plain: number | null;
          rethrows: number | null;
          season_id: string | null;
          sinks: number | null;
          status: Database["public"]["Enums"]["game_status"] | null;
          table_hits: number | null;
          team_id: string | null;
          throws: number | null;
          total_points: number | null;
          won: boolean | null;
        };
        Relationships: [];
      };
      player_season_stats: {
        Row: {
          accuracy_pct: number | null;
          catches: number | null;
          defensive_points: number | null;
          dinks: number | null;
          field_goals: number | null;
          fifas: number | null;
          games_played: number | null;
          games_tracked: number | null;
          losses: number | null;
          offensive_points: number | null;
          person_id: string | null;
          points_per_game: number | null;
          season_id: string | null;
          sinks: number | null;
          table_hits: number | null;
          throws: number | null;
          total_points: number | null;
          win_pct: number | null;
          wins: number | null;
        };
        Relationships: [];
      };
      standings: {
        Row: {
          games_played: number | null;
          losses: number | null;
          name: string | null;
          point_differential: number | null;
          points_against: number | null;
          points_for: number | null;
          rank: number | null;
          season_id: string | null;
          team_id: string | null;
          win_pct: number | null;
          wins: number | null;
        };
        Relationships: [];
      };
      team_game_results: {
        Row: {
          game_id: string | null;
          kind: Database["public"]["Enums"]["game_kind"] | null;
          opponent_id: string | null;
          points_against: number | null;
          points_for: number | null;
          season_id: string | null;
          status: Database["public"]["Enums"]["game_status"] | null;
          team_id: string | null;
          week: number | null;
          winner_team_id: string | null;
        };
        Relationships: [];
      };
      team_season_stats: {
        Row: {
          games_played: number | null;
          losses: number | null;
          name: string | null;
          point_differential: number | null;
          points_against: number | null;
          points_for: number | null;
          season_id: string | null;
          team_id: string | null;
          win_pct: number | null;
          wins: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      active_season_id: { Args: Record<string, never>; Returns: string };
      current_person_id: { Args: Record<string, never>; Returns: string };
      invite_code_valid: { Args: { p_code: string }; Returns: boolean };
      is_commissioner: { Args: Record<string, never>; Returns: boolean };
      is_in_game: { Args: { p_game: string }; Returns: boolean };
      is_on_team: { Args: { p_team: string }; Returns: boolean };
      is_superadmin: { Args: Record<string, never>; Returns: boolean };
      start_playoff: { Args: { p_playoff: string }; Returns: undefined };
      override_playoff_winner: {
        Args: { p_match: string; p_winner: string };
        Returns: undefined;
      };
    };
    Enums: {
      challenge_status: "pending" | "accepted" | "declined" | "expired";
      game_kind: "regular" | "rivalry" | "playoff";
      game_status:
        | "scheduled"
        | "in_progress"
        | "awaiting_confirmation"
        | "final"
        | "disputed"
        | "canceled";
      league_status: "player" | "alumni" | "spectator";
      roster_role: "starter" | "sub";
      season_status: "upcoming" | "active" | "completed" | "archived";
      season_term: "fall" | "spring";
      site_role: "member" | "commissioner" | "superadmin";
      throw_outcome:
        | "point"
        | "dink"
        | "sink"
        | "field_goal"
        | "fifa"
        | "caught"
        | "missed"
        | "rethrow";
    };
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])> =
  (PublicSchema["Tables"] & PublicSchema["Views"])[T] extends { Row: infer R } ? R : never;

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T] extends { Insert: infer I } ? I : never;

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T] extends { Update: infer U } ? U : never;

export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];

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
