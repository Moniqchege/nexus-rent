"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';


interface Permission {
  key: string;
  label: string;
  category: string;
}

export interface Role {
  id: number;
  name: string;
  code: string;
  permissions: string[];
  description?: string;
  // code?: string;
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

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({

      permissions: [
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
      ],
      roles: [],
      users: [],
      loading: false,

      fetchUsers: async () => {
        set({ loading: true });
        try {
          const res = await api.get('/api/users');
          set({ users: res.data, loading: false });
        } catch {
          set({ loading: false });
        }
      },

      fetchRoles: async () => {
  set({ loading: true });
  try {
    const res = await api.get('/api/roles'); // after Option A fix
    set({ roles: res.data, loading: false });
  } catch (error) {
    console.error('fetchRoles error:', error);
    set({ loading: false });
  }
},

      updateUserRole: async (userId: number, roleName: string) => {
        set({ loading: true });
        try {
          await api.patch(`/api/users/${userId}/role`, { role: roleName });
          set(state => ({
            users: state.users.map(u => u.id === userId ? { ...u, role: roleName } : u),
          }));
        } catch {
          // 
        } finally {
          set({ loading: false });
        }
      },

      createRole: async (newRole) => {
        set({ loading: true });
        try {
          const res = await api.post('/api/roles', newRole);
          set(state => ({ roles: [...state.roles, res.data] }));
        } catch {
          // 
        } finally {
          set({ loading: false });
        }
      },

      updateRole: async (updatedRole) => {
        set({ loading: true });
        try {
          await api.patch(`/api/roles/${updatedRole.id}`, updatedRole);
          set(state => ({
            roles: state.roles.map(r => r.id === updatedRole.id ? updatedRole : r),
          }));
        } catch {
          // 
        } finally {
          set({ loading: false });
        }
      },

      deleteRole: async (roleId: number) => {
        set({ loading: true });
        try {
          await api.delete(`/api/roles/${roleId}`);
          set(state => ({
            roles: state.roles.filter(r => r.id !== roleId),
          }));
        } catch {
          // 
        } finally {
          set({ loading: false });
        }
      }
    }),
    { name: 'nexus-rent-admin' }
  )
);


