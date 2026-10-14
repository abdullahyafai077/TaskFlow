const ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  MEMBER: 'Member',
};

const ROLE_RANK = {
  [ROLES.MEMBER]: 1,
  [ROLES.MANAGER]: 2,
  [ROLES.ADMIN]: 3,
};

function hasMinRole(userRole, minRole) {
  return (ROLE_RANK[userRole] || 0) >= (ROLE_RANK[minRole] || 0);
}

module.exports = { ROLES, ROLE_RANK, hasMinRole };
