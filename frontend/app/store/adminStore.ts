"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';


export interface Permission {
  key: string;
  label: string;
  category: string;
  group: string;
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

interface Rental {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  status: string;
  amenities?: string[];
  image?: string;
  createdAt: string;
  userProperties?: any[];
}

interface AdminState {
  permissions: Permission[];
  roles: Role[];
  users: User[];
  properties: Property[];
  loading: boolean;
  amenities: { id: number; key: string; label: string; category: string }[];
  fetchUsers: (search?: string) => Promise<void>;
  fetchRoles: () => Promise<void>;
  updateUserRole: (userId: number, roleName: string) => Promise<void>;
  createUser: (setData: any) => Promise<void>;
  fetchUser: (userId: number) => Promise<any>;
  updateUser: (userId: number, setData: any) => Promise<void>;
  deleteUser: (userId: number) => Promise<void>;
  createRole: (role: Omit<Role, 'id'>) => Promise<void>;
  updateRole: (role: Role) => Promise<void>;
  deleteRole: (roleId: number) => Promise<void>;
  fetchProperties: () => Promise<void>;
  createProperty: (data: Partial<Property>) => Promise<void>;
  updateProperty: (id: number, data: Partial<Property>) => Promise<void>;
  deleteProperty: (id: number) => Promise<void>;
  fetchAmenities: () => Promise<void>;
  fetchPermissionsFromDb: () => Promise<void>;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      amenities: [],
      permissions: [],
      roles: [],
      users: [],
      properties: [],
      loading: false,

      fetchUsers: async (search = '') => {
        set({ loading: true });
        try {
          const params = search ? { search } : {};
          const res = await api.get('/api/users', { params });
          set({ users: res.data, loading: false });
        } catch {
          set({ loading: false });
        }
      },

      fetchRoles: async () => {
        set({ loading: true });
        try {
          const res = await api.get('/api/roles');
          set({ roles: res.data, loading: false });
        } catch (error) {
          console.error('fetchRoles error:', error);
          set({ loading: false });
        }
      },

      updateUserRole: async (userId: number, roleName: string) => {
        set({ loading: true });
        try {
          await api.patch(`/api/users/${userId}`, { role: roleName });
          set(state => ({
            users: state.users.map(u => u.id === userId ? { ...u, role: roleName } : u),
          }));
        } catch {
          // 
        } finally {
          set({ loading: false });
        }
      },

      createUser: async (userData: any) => {
        set({ loading: true });
        try {
          const res = await api.post('/api/users', userData);
          set(state => ({ users: [...state.users, res.data] }));
        } catch {
          // 
        } finally {
          set({ loading: false });
        }
      },

      fetchUser: async (userId: number) => {
        try {
          const res = await api.get(`/api/users/${userId}`);
          return res.data;
        } catch {
          return null;
        }
      },

      updateUser: async (userId: number, userData: any) => {
        set({ loading: true });
        try {
          const res = await api.patch(`/api/users/${userId}`, userData);
          set(state => ({
            users: state.users.map(u => u.id === userId ? res.data : u),
          }));
        } catch {
          // 
        } finally {
          set({ loading: false });
        }
      },

      deleteUser: async (userId: number) => {
        set({ loading: true });
        try {
          await api.delete(`/api/users/${userId}`);
          set(state => ({
            users: state.users.filter(u => u.id !== userId),
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
      },

      fetchPermissionsFromDb: async () => {
        set({ loading: true });
        try {
          const res = await api.get('/api/roles/permissions');
          set({ permissions: res.data, loading: false });
        } catch (error) {
          console.error('fetchPermissionsFromDb error:', error);
          set({ loading: false });
        }
      },

      rentals: [],

      fetchProperties: async () => {
        set({ loading: true });
        try {
          const res = await api.get("/api/properties");
          set({ properties: res.data, loading: false });
        } catch {
          set({ loading: false });
        }
      },

      createProperty: async (data) => {
        set({ loading: true });
        try {
          const res = await api.post("/api/properties", data);
          set((state) => ({
            properties: [...state.properties, res.data],
            loading: false,
          }));
        } catch {
          set({ loading: false });
        }
      },

      updateProperty: async (id, data) => {
        set({ loading: true });
        try {
          const res = await api.patch(`/api/properties/${id}`, data);
          set((state) => ({
            properties: state.properties.map((p) =>
              p.id === id ? res.data : p
            ),
            loading: false,
          }));
        } catch {
          set({ loading: false });
        }
      },

      deleteProperty: async (id) => {
        set({ loading: true });
        try {
          await api.delete(`/api/properties/${id}`);
          set((state) => ({
            properties: state.properties.filter((p) => p.id !== id),
            loading: false,
          }));
        } catch {
          set({ loading: false });
        }
      },

      fetchAmenities: async () => {
        set({ loading: true });
        try {
          const res = await api.get('/api/properties/amenities');
          set({ amenities: res.data, loading: false });
        } catch (error) {
          console.error('fetchAmenities error:', error);
          set({ loading: false });
        }
      },
    }),
    { name: 'nexus-rent-admin' }
  )
);


