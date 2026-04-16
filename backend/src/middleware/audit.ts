import { Request, Response, NextFunction } from 'express';
import { logAuditTrail } from '../routes/audit-trails';

interface AuditOptions {
    action: string;
    title: string;
    subtitle?: string | ((req: Request, res: Response) => string | undefined);
    metadata?: (req: Request, res: Response) => Record<string, unknown>;
}

function formatTimestamp(date: Date) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date)
        + ' · ' +
        new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(date);
}

export function audit(options: AuditOptions) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Intercept res.json to know the final status
        const originalJson = res.json.bind(res);

        res.json = function (body: any) {
            const status = res.statusCode < 400 ? 'SUCCESS' : 'FAILED';
            const userId = (req as any).user?.id;

            if (userId) {
                let subtitle =
                    typeof options.subtitle === 'function'
                        ? options.subtitle(req, res)
                        : options.subtitle;

                const timestamp = formatTimestamp(new Date());

                subtitle = subtitle
                    ? `${subtitle} · ${timestamp}`
                    : timestamp;

                logAuditTrail({
                    userId: Number(userId),
                    action: options.action,
                    title: options.title,
                    status,
                    subtitle,
                    metadata: options.metadata?.(req, res),
                }).catch((err) =>
                    console.error('Audit log failed silently:', err)
                );
            }

            return originalJson(body);
        };

        next();
    };
}