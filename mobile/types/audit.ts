export interface AuditTrail {
    id: number;
    userId: number;
    action: string;
    status: 'SUCCESS' | 'FAILED';
    title: string;
    subtitle?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    user?: {
        name: string;
    };
}
