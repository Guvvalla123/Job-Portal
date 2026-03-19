/**
 * ABAC permission matrix - resource-level access control.
 * Defines which roles can perform actions and ownership requirements.
 */
const { ROLES } = require("../constants/roles");

const PERMISSIONS = {
  job: {
    update: { roles: [ROLES.RECRUITER, ROLES.ADMIN], ownerField: "postedBy" },
    delete: { roles: [ROLES.RECRUITER, ROLES.ADMIN], ownerField: "postedBy" },
  },
  application: {
    updateStatus: { roles: [ROLES.RECRUITER, ROLES.ADMIN], jobOwnerField: "postedBy" },
    listForJob: { roles: [ROLES.RECRUITER, ROLES.ADMIN], ownerField: "postedBy" },
  },
  company: {
    update: { roles: [ROLES.RECRUITER, ROLES.ADMIN], ownerField: "createdBy" },
    delete: { roles: [ROLES.RECRUITER, ROLES.ADMIN], ownerField: "createdBy" },
  },
};

module.exports = { PERMISSIONS };
