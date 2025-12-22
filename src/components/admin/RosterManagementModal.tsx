import React, { useState, useEffect, useMemo } from 'react';
import { X, Users, Plus, Trash2, Crown, AlertCircle } from 'lucide-react';
import { Team, PlayerTeam, RosterRole, RosterStatus } from '../../core/types';
import { useData } from '../../state';
import { getPlayerFullName } from '../../core/utils/playerHelpers';

interface RosterManagementModalProps {
  team: Team;
  onClose: () => void;
  onSave: () => void;
}

const RosterManagementModal: React.FC<RosterManagementModalProps> = ({ team, onClose, onSave }) => {
  const {
    players,
    seasons,
    playerTeams,
    activeSeason,
    createPlayerTeam,
    updatePlayerTeam,
    deletePlayerTeam,
  } = useData();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSeasonId, setSelectedSeasonId] = useState(activeSeason?.id || '');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedRole, setSelectedRole] = useState<RosterRole>('sub');
  const [isCaptain, setIsCaptain] = useState(false);

  // Get current roster for selected season
  const currentRoster = useMemo(() => {
    if (!selectedSeasonId) return [];
    return playerTeams.filter(
      pt => pt.teamId === team.id && pt.seasonId === selectedSeasonId
    );
  }, [playerTeams, team.id, selectedSeasonId]);

  // Get available players (not already on roster for this season)
  const availablePlayers = useMemo(() => {
    if (!selectedSeasonId) return players.filter(p => p.status === 'active');
    
    const rosterPlayerIds = currentRoster
      .filter(pt => pt.status === 'active')
      .map(pt => pt.playerId);
    
    return players.filter(
      p => p.status === 'active' && !rosterPlayerIds.includes(p.id)
    );
  }, [players, currentRoster, selectedSeasonId]);

  // Get players on roster with their details
  const rosterWithPlayers = useMemo(() => {
    return currentRoster
      .map(pt => {
        const player = players.find(p => p.id === pt.playerId);
        return { ...pt, player };
      })
      .filter(item => item.player) // Filter out any missing players
      .sort((a, b) => {
        // Sort by role priority, then by name
        const roleOrder: Record<RosterRole, number> = {
          starter_1: 1,
          starter_2: 2,
          sub: 3,
        };
        const roleDiff = roleOrder[a.role] - roleOrder[b.role];
        if (roleDiff !== 0) return roleDiff;
        return getPlayerFullName(a.player!).localeCompare(getPlayerFullName(b.player!));
      });
  }, [currentRoster, players]);

  // Count starters
  const starterCount = useMemo(() => {
    return currentRoster.filter(pt => 
      (pt.role === 'starter_1' || pt.role === 'starter_2') && pt.status === 'active'
    ).length;
  }, [currentRoster]);

  useEffect(() => {
    if (activeSeason && !selectedSeasonId) {
      setSelectedSeasonId(activeSeason.id);
    }
  }, [activeSeason, selectedSeasonId]);

  const handleAddPlayer = async () => {
    if (!selectedPlayerId || !selectedSeasonId) {
      setError('Please select a player and season');
      return;
    }

    // Check if player is already on roster
    const existing = currentRoster.find(
      pt => pt.playerId === selectedPlayerId && pt.seasonId === selectedSeasonId
    );
    if (existing) {
      setError('Player is already on this team for this season');
      return;
    }

    // Validate starter limit
    if ((selectedRole === 'starter_1' || selectedRole === 'starter_2') && starterCount >= 2) {
      setError('Maximum of 2 starters allowed per team');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createPlayerTeam({
        playerId: selectedPlayerId,
        teamId: team.id,
        seasonId: selectedSeasonId,
        role: selectedRole,
        status: 'active',
        isCaptain: isCaptain,
        joinedAt: new Date(),
      });

      // Reset form
      setSelectedPlayerId('');
      setSelectedRole('sub');
      setIsCaptain(false);
      onSave();
    } catch (err: any) {
      console.error('Failed to add player to roster:', err);
      setError(err.message || 'Failed to add player to roster');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (playerTeamId: string, newRole: RosterRole) => {
    // Validate starter limit
    if ((newRole === 'starter_1' || newRole === 'starter_2') && starterCount >= 2) {
      const currentEntry = currentRoster.find(pt => pt.id === playerTeamId);
      if (currentEntry && currentEntry.role !== 'starter_1' && currentEntry.role !== 'starter_2') {
        setError('Maximum of 2 starters allowed per team');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      await updatePlayerTeam(playerTeamId, { role: newRole });
      onSave();
    } catch (err: any) {
      console.error('Failed to update player role:', err);
      setError(err.message || 'Failed to update player role');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (playerTeamId: string, newStatus: RosterStatus) => {
    setLoading(true);
    setError('');

    try {
      const updates: Partial<PlayerTeam> = { status: newStatus };
      if (newStatus === 'inactive' || newStatus === 'ir') {
        updates.leftAt = new Date();
      }
      await updatePlayerTeam(playerTeamId, updates);
      onSave();
    } catch (err: any) {
      console.error('Failed to update player status:', err);
      setError(err.message || 'Failed to update player status');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCaptain = async (playerTeamId: string, currentValue: boolean) => {
    setLoading(true);
    setError('');

    try {
      await updatePlayerTeam(playerTeamId, { isCaptain: !currentValue });
      onSave();
    } catch (err: any) {
      console.error('Failed to update captain status:', err);
      setError(err.message || 'Failed to update captain status');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlayer = async (playerTeamId: string) => {
    const rosterEntry = currentRoster.find(pt => pt.id === playerTeamId);
    const player = players.find(p => p.id === rosterEntry?.playerId);
    const playerName = player ? getPlayerFullName(player) : 'this player';

    if (!window.confirm(`Are you sure you want to remove ${playerName} from ${team.name}?`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await deletePlayerTeam(playerTeamId);
      onSave();
    } catch (err: any) {
      console.error('Failed to remove player from roster:', err);
      setError(err.message || 'Failed to remove player from roster');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            <Users size={20} />
            Manage Roster: {team.name}
          </h2>
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Close modal"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Error Message */}
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Season Selector */}
          <div className="form-group">
          <label htmlFor="season" className="form-label">
            Season *
          </label>
          <select
            id="season"
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
            className="form-input"
            required
            disabled={loading}
          >
            <option value="">Select a season</option>
            {seasons.map(season => (
              <option key={season.id} value={season.id}>
                {season.name} {season.status === 'active' && '(Active)'}
              </option>
            ))}
          </select>
        </div>

        {selectedSeasonId && (
          <>
            {/* Add Player Section */}
            <div className="roster-add-section">
              <h3>Add Player to Roster</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="player" className="form-label">
                    Player *
                  </label>
                  <select
                    id="player"
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    className="form-input"
                    disabled={loading || availablePlayers.length === 0}
                  >
                    <option value="">
                      {availablePlayers.length === 0 ? 'No available players' : 'Select a player'}
                    </option>
                    {availablePlayers.map(player => (
                      <option key={player.id} value={player.id}>
                        {getPlayerFullName(player)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="role" className="form-label">
                    Role *
                  </label>
                  <select
                    id="role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as RosterRole)}
                    className="form-input"
                    disabled={loading}
                  >
                    <option value="starter_1">Starter 1</option>
                    <option value="starter_2">Starter 2</option>
                    <option value="sub">Substitute</option>
                  </select>
                  {starterCount >= 2 && (selectedRole === 'starter_1' || selectedRole === 'starter_2') && (
                    <p className="form-hint text-warning">
                      Maximum of 2 starters reached
                    </p>
                  )}
                </div>

                <div className="form-group form-group-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={isCaptain}
                      onChange={(e) => setIsCaptain(e.target.checked)}
                      disabled={loading}
                    />
                    <span>Team Captain</span>
                  </label>
                </div>

                <div className="form-group">
                  <button
                    type="button"
                    onClick={handleAddPlayer}
                    className="btn btn-primary"
                    disabled={loading || !selectedPlayerId || (starterCount >= 2 && (selectedRole === 'starter_1' || selectedRole === 'starter_2'))}
                  >
                    <Plus size={16} />
                    Add Player
                  </button>
                </div>
              </div>
            </div>

            {/* Current Roster */}
            <div className="roster-list-section">
              <h3>Current Roster ({rosterWithPlayers.length})</h3>
              {rosterWithPlayers.length === 0 ? (
                <div className="empty-state-small">
                  <Users size={32} />
                  <p>No players on roster for this season</p>
                </div>
              ) : (
                <div className="roster-list">
                  {rosterWithPlayers.map(({ id, player, role, status, isCaptain: captain }) => (
                    <div key={id} className="roster-item">
                      <div className="roster-item-info">
                        <div className="roster-item-main">
                          <span className="roster-player-name">
                            {getPlayerFullName(player!)}
                            {captain && (
                              <span title="Team Captain">
                                <Crown size={14} className="captain-icon" />
                              </span>
                            )}
                          </span>
                          <span className={`roster-role-badge role-${role}`}>
                            {role === 'starter_1' ? 'Starter 1' : role === 'starter_2' ? 'Starter 2' : 'Sub'}
                          </span>
                          <span className={`roster-status-badge status-${status}`}>
                            {status === 'active' ? 'Active' : status === 'inactive' ? 'Inactive' : 'IR'}
                          </span>
                        </div>
                      </div>

                      <div className="roster-item-actions">
                        {/* Role Selector */}
                        <select
                          value={role}
                          onChange={(e) => handleUpdateRole(id, e.target.value as RosterRole)}
                          className="form-input form-input-small"
                          disabled={loading}
                        >
                          <option value="starter_1">Starter 1</option>
                          <option value="starter_2">Starter 2</option>
                          <option value="sub">Substitute</option>
                        </select>

                        {/* Status Selector */}
                        <select
                          value={status}
                          onChange={(e) => handleUpdateStatus(id, e.target.value as RosterStatus)}
                          className="form-input form-input-small"
                          disabled={loading}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="ir">IR</option>
                        </select>

                        {/* Captain Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleCaptain(id, captain)}
                          className={`btn-icon btn-icon-small ${captain ? 'btn-icon-active' : ''}`}
                          title={captain ? 'Remove captain' : 'Make captain'}
                          disabled={loading}
                        >
                          <Crown size={16} />
                        </button>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemovePlayer(id)}
                          className="btn-icon btn-icon-danger btn-icon-small"
                          title="Remove from roster"
                          disabled={loading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            disabled={loading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RosterManagementModal;

