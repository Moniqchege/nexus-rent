"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import { Lease, CreateLeaseInput, UpdateLeaseInput } from '../../types/lease';


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

export interface UnitType {
  id: number;
  propertyId: number;
  type: string;
  baths: number;
  price: number;
  totalUnits: number;
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
  floors?: string;
  status: string;
  amenities?: string[];
  image?: string;
  createdAt: string;
  unitTypes: UnitType[];
  userProperties?: any[];
}

interface AdminState {
  permissions: Permission[];
  roles: Role[];
  users: User[];
  properties: Property[];
  leases: Lease[];
  loading: boolean;
  amenities: { id: number; key: string; label: string; category: string }[];

  userStats: { totalUsers: number; activeUsers: number; lockedUsers: number };

  fetchUsers: (search?: string) => Promise<void>;
  fetchUserStats: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  updateUserRole: (userId: number, roleName: string) => Promise<void>;

  createUser: (setData: any) => Promise<void>;
  fetchUser: (userId: number) => Promise<any>;
  updateUser: (userId: number, setData: any) => Promise<void>;

  lockUnlockUser: (userId: number, locked: boolean) => Promise<void>;
  killUserSessions: (userId: number) => Promise<void>;
  resetUserPassword: (userId: number) => Promise<void>;

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
  fetchLeases: () => Promise<void>;
  createLease: (data: CreateLeaseInput) => Promise<void>;
  updateLease: (id: number, data: UpdateLeaseInput) => Promise<void>;
  deleteLease: (id: number) => Promise<void>;
  uploadSignedLease: (id: number, formData: FormData) => Promise<void>;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      amenities: [],
      permissions: [],
      roles: [],
      users: [],
      properties: [],
      userStats: {
        totalUsers: 0,
        activeUsers: 0,
        lockedUsers: 0,
      },
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

      createUser: async (userData: FormData) => {
        set({ loading: true });

        try {
          const res = await api.post('/api/users', userData, {
            headers: {
              "Content-Type": "multipart/form-data"
            }
          });

          set(state => ({ users: [...state.users, res.data] }));
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

      fetchUserStats: async () => {
        try {
          const res = await api.get('/api/users/stats');
          set({ userStats: res.data });
        } catch (error) {
          console.error('fetchUserStats error:', error);
        }
      },

      lockUnlockUser: async (userId: number, locked: boolean) => {
        set({ loading: true });
        try {
          const res = await api.post(`/api/users/${userId}/lock`, { locked });
          const updated = res.data?.user;
          set(state => ({
            users: state.users.map(u =>
              u.id === userId
                ? { ...u, isLocked: updated?.isLocked ?? locked }
                : u
            ),
          }));
          await get().fetchUserStats();
        } catch (error) {
          console.error('lockUnlockUser error:', error);
        } finally {
          set({ loading: false });
        }
      },

      killUserSessions: async (userId: number) => {
        set({ loading: true });
        try {
          await api.delete(`/api/users/${userId}/sessions`);
        } catch (error) {
          console.error('killUserSessions error:', error);
        } finally {
          set({ loading: false });
        }
      },

      resetUserPassword: async (userId: number) => {
        set({ loading: true });
        try {
          await api.post(`/api/users/${userId}/reset-password`);
        } catch (error) {
          console.error('resetUserPassword error:', error);
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
      leases: [],

      fetchLeases: async () => {
        set({ loading: true });
        try {
          const res = await api.get('/api/leases');
          set({ leases: res.data.leases || [], loading: false });
        } catch {
          set({ loading: false });
        }
      },

      createLease: async (data: CreateLeaseInput) => {
        set({ loading: true });
        try {
          const res = await api.post('/api/leases', data);
          set((state) => ({
            leases: [...state.leases, res.data.lease],
            loading: false,
          }));
        } catch {
          set({ loading: false });
        }
      },

      updateLease: async (id: number, data: UpdateLeaseInput) => {
        set({ loading: true });
        try {
          const res = await api.patch(`/api/leases/${id}`, data);
          set((state) => ({
            leases: state.leases.map((l) =>
              l.id === id ? res.data.lease : l
            ),
            loading: false,
          }));
        } catch {
          set({ loading: false });
        }
      },

      deleteLease: async (id) => {
        set({ loading: true });
        try {
          await api.delete(`/api/leases/${id}`);
          set((state) => ({
            leases: state.leases.filter((l) => l.id !== id),
            loading: false,
          }));
        } catch {
          set({ loading: false });
        }
      },

      uploadSignedLease: async (id, formData) => {
        set({ loading: true });
        try {
          const res = await api.post(`/api/leases/${id}/sign`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          set((state) => ({
            leases: state.leases.map((l) =>
              l.id === id ? res.data.lease : l
            ),
            loading: false,
          }));
        } catch {
          set({ loading: false });
        }
      },

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


