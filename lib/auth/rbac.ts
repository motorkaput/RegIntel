export type UserRole = 'admin' | 'org_leader' | 'functional_leader' | 'project_lead' | 'team_member';

export type Resource = 'users' | 'goals' | 'projects' | 'tasks' | 'billing' | 'settings' | 'invitations';

export type Permission = 'read' | 'write' | 'delete';

// Role hierarchy (higher roles inherit permissions from lower roles)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 5,
  org_leader: 4,
  functional_leader: 3,
  project_lead: 2,
  team_member: 1,
};

// Permission matrix
const PERMISSIONS: Record<Resource, Record<Permission, UserRole[]>> = {
  users: {
    read: ['admin', 'org_leader', 'functional_leader', 'project_lead', 'team_member'],
    write: ['admin'],
    delete: ['admin'],
  },
  goals: {
    read: ['admin', 'org_leader', 'functional_leader', 'project_lead', 'team_member'],
    write: ['admin', 'org_leader', 'functional_leader'],
    delete: ['admin'],
  },
  projects: {
    read: ['admin', 'org_leader', 'functional_leader', 'project_lead', 'team_member'],
    write: ['admin', 'org_leader', 'functional_leader', 'project_lead'],
    delete: ['admin'],
  },
  tasks: {
    read: ['admin', 'org_leader', 'functional_leader', 'project_lead', 'team_member'],
    write: ['admin', 'org_leader', 'functional_leader', 'project_lead', 'team_member'], // team_member can update assigned tasks
    delete: ['admin'],
  },
  billing: {
    read: ['admin', 'org_leader'],
    write: ['admin'],
    delete: ['admin'],
  },
  settings: {
    read: ['admin', 'org_leader'],
    write: ['admin'],
    delete: ['admin'],
  },
  invitations: {
    read: ['admin', 'org_leader'],
    write: ['admin', 'org_leader'],
    delete: ['admin', 'org_leader'],
  },
};

export function hasPermission(userRole: UserRole, resource: Resource, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[resource]?.[permission] || [];
  return allowedRoles.includes(userRole);
}

export function canRead(userRole: UserRole, resource: Resource): boolean {
  return hasPermission(userRole, resource, 'read');
}

export function canWrite(userRole: UserRole, resource: Resource): boolean {
  return hasPermission(userRole, resource, 'write');
}

export function canDelete(userRole: UserRole, resource: Resource): boolean {
  return hasPermission(userRole, resource, 'delete');
}

export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'admin';
}

export function isOrgLeader(userRole: UserRole): boolean {
  return userRole === 'org_leader' || isAdmin(userRole);
}

export function isFunctionalLeader(userRole: UserRole): boolean {
  return userRole === 'functional_leader' || isOrgLeader(userRole);
}

export function isProjectLead(userRole: UserRole): boolean {
  return userRole === 'project_lead' || isFunctionalLeader(userRole);
}

export function canManageUsers(userRole: UserRole): boolean {
  return isAdmin(userRole);
}

export function canCreateGoals(userRole: UserRole): boolean {
  return isFunctionalLeader(userRole);
}

export function canCreateProjects(userRole: UserRole): boolean {
  return isProjectLead(userRole);
}

export function canInviteUsers(userRole: UserRole): boolean {
  return isOrgLeader(userRole);
}

export function canAccessBilling(userRole: UserRole): boolean {
  return isOrgLeader(userRole);
}

export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    admin: 'Administrator',
    org_leader: 'Organization Leader',
    functional_leader: 'Functional Leader',
    project_lead: 'Project Lead',
    team_member: 'Team Member',
  };
  return displayNames[role] || role;
}