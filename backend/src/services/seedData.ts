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
    group: string;
}

export const STANDARD_PERMISSIONS: PermissionData[] = [
    // Property Management
    { key: "property:create", label: "Create Property", category: "CONFIG", group: "Property Management" },
    { key: "property:edit", label: "Edit Property", category: "CONFIG", group: "Property Management" },
    { key: "property:view", label: "View Property", category: "CONFIG", group: "Property Management" },
    { key: "property:delete", label: "Delete Property", category: "CONFIG", group: "Property Management" },
    { key: "property:approve", label: "Approve Property", category: "CONFIG", group: "Property Management" },

    // User Management
    { key: "user:create", label: "Create User", category: "CONFIG", group: "User Management" },
    { key: "user:view", label: "View User", category: "CONFIG", group: "User Management" },
    { key: "user:update", label: "Update User", category: "CONFIG", group: "User Management" },
    { key: "user:delete", label: "Delete User", category: "CONFIG", group: "User Management" },
    { key: "user:update_role", label: "Update User Role", category: "CONFIG", group: "User Management" },
    { key: "user:lock_account", label: "Lock User Account", category: "CONFIG", group: "User Management" },
    { key: "user:reset_password", label: "Reset User Password", category: "CONFIG", group: "User Management" },
    { key: "user:kill_session", label: "Kill User Session", category: "CONFIG", group: "User Management" },

    // Role Management
    { key: "role:create", label: "Create Role", category: "CONFIG", group: "Role Management" },
    { key: "role:view", label: "View Role", category: "CONFIG", group: "Role Management" },
    { key: "role:update", label: "Update Role", category: "CONFIG", group: "Role Management" },
    { key: "role:delete", label: "Delete Role", category: "CONFIG", group: "Role Management" },

    // Payment Management
    { key: "payment:view", label: "View Payments", category: "MODULE", group: "Payment Management" },
    { key: "payment:process", label: "Process Payments", category: "MODULE", group: "Payment Management" },

    // Notification
    { key: "notification:send", label: "Send Notifications", category: "MODULE", group: "Notifications" },

    // Reports & Audit
    { key: "report:generate", label: "Generate Reports", category: "MODULE", group: "Reports & Audit" }
];

export const getAmenitiesList = () => STANDARD_AMENITIES;
export const getPermissionsList = (): PermissionData[] => STANDARD_PERMISSIONS;
