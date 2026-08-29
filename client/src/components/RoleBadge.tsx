import type { Role } from '../types/room';
export function RoleBadge({ role }: { role: Role }) { return <span className={`role role-${role.toLowerCase()}`}>{role === 'PARTICIPANT' ? 'Participant' : role[0] + role.slice(1).toLowerCase()}</span>; }
