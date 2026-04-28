import api from './api';
import type { Lease } from '../../types/lease';

export const getLeases = (): Promise<Lease[]> => {
    return api.get('/api/leases').then(res => res.data.leases as Lease[]);
};

export const getLease = (id: number): Promise<Lease> => {
    return api.get(`/api/leases/${id}`).then(res => res.data.lease as Lease);
};
