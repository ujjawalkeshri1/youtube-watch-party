import { Crown, Shield, UserRound, UserRoundX, ArrowRightLeft } from 'lucide-react';
import type { Participant, Role } from '../types/room';
import { RoleBadge } from './RoleBadge';

interface ParticipantListProps {
  participants: Participant[];
  currentUserId: string;
  canManage: boolean;
  onRole: (id: string, role: Role) => void;
  onRemove: (id: string) => void;
  onTransferHost: (id: string) => void;
}

export function ParticipantList({
  participants,
  currentUserId,
  canManage,
  onRole,
  onRemove,
  onTransferHost,
}: ParticipantListProps) {
  return (
    <section className="side-section">
      <div className="section-heading">
        <h2>Participants</h2>
        <span className="count">{participants.length}</span>
      </div>
      <div className="participant-list">
        {participants.map((participant) => {
          const isSelf = participant.userId === currentUserId;
          return (
            <div className="participant" key={participant.id}>
              <div className="participant-content">
                <div className="avatar">{participant.username.slice(0, 2).toUpperCase()}</div>
                <div className="participant-meta">
                  <div className="participant-name">
                    <strong>{participant.username}</strong>
                    {isSelf && <span className="you-badge">(you)</span>}
                    {participant.role === 'HOST' && <Crown size={16} className="host-icon" />}
                  </div>
                  <RoleBadge role={participant.role} />
                </div>
              </div>

              {canManage && !isSelf && participant.role !== 'HOST' && (
                <div className="participant-actions">
                  <button
                    type="button"
                    title="Transfer host"
                    onClick={() => onTransferHost(participant.id)}
                    className="action-btn"
                  >
                    <ArrowRightLeft size={16} />
                  </button>
                  <button
                    type="button"
                    title={participant.role === 'MODERATOR' ? 'Demote to participant' : 'Promote to moderator'}
                    onClick={() =>
                      onRole(participant.id, participant.role === 'MODERATOR' ? 'PARTICIPANT' : 'MODERATOR')
                    }
                    className="action-btn"
                  >
                    {participant.role === 'MODERATOR' ? <UserRound size={16} /> : <Shield size={16} />}
                  </button>
                  <button
                    type="button"
                    title="Remove participant"
                    onClick={() => onRemove(participant.id)}
                    className="action-btn remove-btn"
                  >
                    <UserRoundX size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
