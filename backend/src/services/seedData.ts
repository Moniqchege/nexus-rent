export const STANDARD_AMENITIES = [
    "GYM",
    "SWIMMING_POOL",
    "YOGA_STUDIO",
    "STEAM_ROOM",
    "SAUNA",
    "CLUBHOUSE",
    "ROOFTOP_LOUNGE",
    "PLAY_AREA",
    "ELEVATOR",
    "BACKUP_GENERATOR",
    "LAUNDRY",
    "BOREHOLE",
    "INTERNET",
    "PARKING",
    "SECURITY",
    "POWER_BACKUP"
] as const;

export interface PermissionData {
    key: string;
    label: string;
    category: string;
}

export const STANDARD_PERMISSIONS: PermissionData[] = [
    // Property Management
    { key: "property:create", label: "Create Property", category: "CONFIG" },
    { key: "property:edit", label: "Edit Property", category: "CONFIG" },
    { key: "property:view", label: "View Property", category: "CONFIG" },
    { key: "property:delete", label: "Delete Property", category: "CONFIG" },
    { key: "property:approve", label: "Approve Property", category: "CONFIG" },

    // Landlord Management
    { key: "landlord:create", label: "Create Landlord", category: "CONFIG" },
    { key: "landlord:view", label: "View Landlords", category: "CONFIG" },
    { key: "landlord:update", label: "Update Landlord", category: "CONFIG" },

    { key: "property:view", label: "View Properties", category: "CONFIG" },
    { key: "property:update", label: "Update Property", category: "CONFIG" },
    { key: "property:delete", label: "Delete Property", category: "CONFIG" },
    { key: "property:approve", label: "Approve Property", category: "CONFIG" },

    // User Management
    { key: "user:create", label: "Create User", category: "CONFIG" },
    { key: "user:view", label: "View User", category: "CONFIG" },
    { key: "user:update", label: "Update User", category: "CONFIG" },
    { key: "user:delete", label: "Delete User", category: "CONFIG" },
    { key: "user:lock_account", label: "Lock User Account", category: "CONFIG" },
    { key: "user:reset_password", label: "Reset User Password", category: "CONFIG" },
    { key: "user:kill_session", label: "Kill User Session", category: "CONFIG" },

    // Role Management
    { key: "role:create", label: "Create Role", category: "CONFIG" },
    { key: "role:view", label: "View Role", category: "CONFIG" },
    { key: "role:update", label: "Update Role", category: "CONFIG" },
    { key: "role:delete", label: "Delete Role", category: "CONFIG" },

    // Tenant Management
    { key: "tenant:create", label: "Create Tenant", category: "CONFIG" },
    { key: "tenant:assign", label: "Assign Tenant", category: "CONFIG" },
    { key: "tenant:view", label: "View Tenants", category: "CONFIG" },
    { key: "tenant:update", label: "Update Tenant", category: "CONFIG" },

    // Payment Management
    { key: "payment:view", label: "View Payments", category: "MODULE" },
    { key: "payment:process", label: "Process Payments", category: "MODULE" },

    // Notification
    { key: "notification:send", label: "Send Notifications", category: "MODULE" },

    // Reports & Audit
    { key: "report:generate", label: "Generate Reports", category: "MODULE" },
    { key: "audit:view", label: "View Audit Trail", category: "MODULE" },

    // Admin & System
    { key: "system:health", label: "View System Health", category: "ADMIN" },
    { key: "admin:*", label: "Full Admin Access", category: "ADMIN" },
    { key: "*", label: "Wildcard All Permissions", category: "ADMIN" }
];

export const getAmenitiesList = () => STANDARD_AMENITIES;
export const getPermissionsList = (): PermissionData[] => STANDARD_PERMISSIONS;
