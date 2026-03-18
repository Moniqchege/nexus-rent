"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Permission {
  key: string;
  label: string;
  category: string;
}

export interface Role {
  id: number;
  name: string;
  permissions: string[];
  description?: string;
  code?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface AdminState {
  permissions: Permission[];
  roles: Role[];
  users: User[];
  loading: boolean;
  fetchUsers: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  updateUserRole: (userId: number, roleId: string) => Promise<void>;
  createRole: (role: Omit<Role, 'id'>) => Promise<void>;
  updateRole: (role: Role) => Promise<void>;
  deleteRole: (roleId: number) => Promise<void>;
}

const mockPermissions: Permission[] = [
  { key: 'dashboard:view', label: 'View Dashboard', category: 'Dashboard' },
  { key: 'dashboard:edit', label: 'Edit Dashboard', category: 'Dashboard' },
  { key: 'properties:view', label: 'View Properties', category: 'Properties' },
  { key: 'properties:create', label: 'Add Property', category: 'Properties' },
  { key: 'properties:edit', label: 'Edit Property', category: 'Properties' },
  { key: 'properties:delete', label: 'Delete Property', category: 'Properties' },
  { key: 'payments:view', label: 'View Payments', category: 'Payments' },
  { key: 'payments:manage', label: 'Manage Payments', category: 'Payments' },
  { key: 'ai-insights:view', label: 'View AI Insights', category: 'AI Insights' },
  { key: 'ai-insights:manage', label: 'Manage AI Insights', category: 'AI Insights' },
  { key: 'notifications:view', label: 'View Notifications', category: 'Notifications' },
  { key: 'notifications:manage', label: 'Manage Notifications', category: 'Notifications' },
  { key: 'users:view', label: 'View Users', category: 'Users' },
  { key: 'users:create', label: 'Add Users', category: 'Users' },
  { key: 'users:edit', label: 'Edit Users', category: 'Users' },
  { key: 'users:delete', label: 'Delete Users', category: 'Users' },
  { key: 'roles:view', label: 'View Roles', category: 'Roles' },
  { key: 'roles:create', label: 'Create Roles', category: 'Roles' },
  { key: 'roles:edit', label: 'Edit Roles', category: 'Roles' },
  { key: 'roles:delete', label: 'Delete Roles', category: 'Roles' },
  { key: 'tenant:manage', label: 'Manage Tenants', category: 'Tenants' },
  { key: 'review:view', label: 'View Reviews', category: 'Reviews' }
];

const mockRoles: Role[] = [
  { id: 1, name: 'admin', permissions: ['*'], description: 'Full access' },
  { id: 2, name: 'landlord', permissions: ['dashboard:*', 'properties:*', 'payments:*', 'notifications:*'], description: 'Property owner' },
  { id: 3, name: 'tenant', permissions: ['dashboard:view', 'properties:view', 'payments:view'], description: 'Renter' }
];

const mockUsers: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'landlord', createdAt: '2024-01-15' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'tenant', createdAt: '2024-02-20' },
  { id: 3, name: 'Admin User', email: 'admin@example.com', role: 'admin', createdAt: '2023-12-01' }
];

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({

      permissions: mockPermissions,
      roles: mockRoles,
      users: mockUsers,
      loading: false,

      fetchUsers: async () => {
        set({ loading: true });
        // Mock delay
        await new Promise(resolve => setTimeout(resolve, 500));
        // Later: api.get('/api/users')
        set({ loading: false });
      },

      fetchRoles: async () => {
        set({ loading: true });
        await new Promise(resolve => setTimeout(resolve, 500));
        // Later: api.get('/api/roles')
        set({ loading: false });
      },

      updateUserRole: async (userId: number, roleName: string) => {
        set({ loading: true });
        await new Promise(resolve => setTimeout(resolve, 300));
        set(state => ({
          users: state.users.map(u => u.id === userId ? { ...u, role: roleName } : u),
          loading: false
        }));
      },

      createRole: async (newRole) => {
        set({ loading: true });
        await new Promise(resolve => setTimeout(resolve, 500));
        const roleWithId = { ...newRole, id: Date.now() };
        set(state => ({ roles: [...state.roles, roleWithId], loading: false }));
      },

      updateRole: async (updatedRole) => {
        set({ loading: true });
        await new Promise(resolve => setTimeout(resolve, 300));
        set(state => ({
          roles: state.roles.map(r => r.id === updatedRole.id ? updatedRole : r),
          loading: false
        }));
      },

      deleteRole: async (roleId: number) => {
        set({ loading: true });
        await new Promise(resolve => setTimeout(resolve, 300));
        set(state => ({
          roles: state.roles.filter(r => r.id !== roleId),
          loading: false
        }));
      }
    }),
    { name: 'nexus-rent-admin' }
  )
);

