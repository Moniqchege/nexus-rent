/**
 * homeUtils.ts
 * Pure utility functions for the mobile home screen.
 * No React Native dependencies — fully testable in Node.
 */

// ---------------------------------------------------------------------------
// 1. Active lease selection
// ---------------------------------------------------------------------------

/**
 * Filters leases by status === "active", returns the one with the latest
 * startDate, or null if none exist.
 */
export function selectActiveLease(leases: any[]): any | null {
    const actives = leases.filter((l) => l.status === "active");
    if (actives.length === 0) return null;
    return actives.reduce((best, curr) => {
        const bestDate = new Date(best.startDate).getTime();
        const currDate = new Date(curr.startDate).getTime();
        return currDate > bestDate ? curr : best;
    });
}

// ---------------------------------------------------------------------------
// 2. Next due date computation
// ---------------------------------------------------------------------------

/**
 * Computes the next future due date based on billing cycle:
 *  - "monthly": next future date with the same day-of-month as startDate
 *               (handles month-end overflow by clamping to last day of month)
 *  - "weekly":  next future date with the same day-of-week as startDate
 *               (1–7 days ahead; never today)
 *  - fallback:  first day of the next calendar month
 */
export function computeNextDue(
    startDate: Date,
    billingCycle: string,
    today: Date
): Date {
    if (billingCycle === "monthly") {
        const targetDay = startDate.getDate();
        // Start checking from tomorrow
        const candidate = new Date(today);
        candidate.setDate(candidate.getDate() + 1);
        candidate.setHours(0, 0, 0, 0);

        // Advance until we find a date whose clamped day-of-month matches targetDay
        for (let i = 0; i < 366; i++) {
            const year = candidate.getFullYear();
            const month = candidate.getMonth();
            // Clamp targetDay to the actual number of days in this month
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const clampedDay = Math.min(targetDay, daysInMonth);
            if (candidate.getDate() === clampedDay) {
                return new Date(candidate);
            }
            candidate.setDate(candidate.getDate() + 1);
        }
        // Should never reach here, but fallback just in case
        return new Date(today.getFullYear(), today.getMonth() + 1, 1);
    }

    if (billingCycle === "weekly") {
        const targetDow = startDate.getDay(); // 0 (Sun) – 6 (Sat)
        const todayDow = today.getDay();
        let daysUntil = (targetDow - todayDow + 7) % 7;
        if (daysUntil === 0) daysUntil = 7; // never today, always at least 1 day ahead
        const result = new Date(today);
        result.setDate(result.getDate() + daysUntil);
        result.setHours(0, 0, 0, 0);
        return result;
    }

    // Fallback: first day of next calendar month
    return new Date(today.getFullYear(), today.getMonth() + 1, 1);
}

// ---------------------------------------------------------------------------
// 3. Occupancy months computation
// ---------------------------------------------------------------------------

/**
 * Returns the number of complete calendar months elapsed from
 * originalStartDate to today. Returns 0 if today < startDate.
 */
export function computeOccupancyMonths(
    originalStartDate: Date,
    today: Date
): number {
    const years = today.getFullYear() - originalStartDate.getFullYear();
    const months = today.getMonth() - originalStartDate.getMonth();
    let total = years * 12 + months;
    if (today.getDate() < originalStartDate.getDate()) {
        total -= 1;
    }
    return Math.max(0, total);
}

// ---------------------------------------------------------------------------
// 4. Occupancy formatting
// ---------------------------------------------------------------------------

/**
 * Formats the occupancy month count:
 *  - 0        → "< 1 mo"
 *  - 1–11     → "X mo"
 *  - 12+      → "X yr Y mo"
 */
export function formatOccupancy(months: number): string {
    if (months === 0) return "< 1 mo";
    if (months < 12) return `${months} mo`;
    const yr = Math.floor(months / 12);
    const mo = months % 12;
    return `${yr} yr ${mo} mo`;
}

/**
 * Returns the occupancy tier label:
 *  - "New"       when months === 0
 *  - "↑ Active"  when 1 ≤ months < 12
 *  - "↑ Loyal"   when months ≥ 12
 */
export function occupancyLabel(months: number): string {
    if (months === 0) return "New";
    if (months < 12) return "↑ Active";
    return "↑ Loyal";
}

// ---------------------------------------------------------------------------
// 5. On-time payment rate
// ---------------------------------------------------------------------------

/**
 * Computes the on-time payment rate from an array of schedule objects.
 * Returns null when there are no settled (paid or overdue) entries.
 * Otherwise returns Math.round((paid / (paid + overdue)) * 1000) / 10.
 */
export function computeOnTimeRate(
    schedules: { status: string }[]
): number | null {
    const paid = schedules.filter((s) => s.status === "paid").length;
    const overdue = schedules.filter((s) => s.status === "overdue").length;
    const settled = paid + overdue;
    if (settled === 0) return null;
    return Math.round((paid / settled) * 1000) / 10;
}

/**
 * Formats the rate for display:
 *  - null or 100 → "100%"
 *  - otherwise   → "X.X%" (1 decimal place)
 */
export function formatRate(rate: number | null): string {
    if (rate === null || rate === 100) return "100%";
    return `${rate.toFixed(1)}%`;
}

/**
 * Returns the rate tier label:
 *  - "↑ Perfect"  when rate is null or ≥ 100
 *  - "↑ Great"    when 80 ≤ rate < 100
 *  - "↓ Improve"  when rate < 80
 */
export function rateLabel(rate: number | null): string {
    const r = rate ?? 100;
    if (r >= 100) return "↑ Perfect";
    if (r >= 80) return "↑ Great";
    return "↓ Improve";
}

// ---------------------------------------------------------------------------
// 6. Contacts filter
// ---------------------------------------------------------------------------

/**
 * Excludes contacts whose role.name (case-insensitive) equals "tenant".
 */
export function filterNonTenantContacts(contacts: any[]): any[] {
    return contacts.filter(
        (c) => c?.role?.name?.toLowerCase() !== "tenant"
    );
}

// ---------------------------------------------------------------------------
// 7. Pay Rent params builder
// ---------------------------------------------------------------------------

/**
 * Assembles the route params object for navigation to /pay/method.
 *
 * Fields:
 *  - amount:        String(lease.rentAmount)
 *  - propertyId:    String(lease.property?.id ?? lease.propertyId ?? 0)
 *  - tenantId:      String(userId)
 *  - propertyTitle: lease.property?.title ?? ""
 *  - dueDate:       nextDue.toISOString()
 *  - scheduleId:    id of first schedule with status === "scheduled", or "0"
 *  - accountRef:    "SCHED-{scheduleId}" if scheduleId !== "0",
 *                   else "PROP-{propertyId}"
 */
export function buildPayRentParams(
    lease: any,
    userId: number,
    schedules: any[],
    nextDue: Date
): Record<string, string> {
    const propertyId = String(
        lease.property?.id ?? lease.propertyId ?? 0
    );
    const firstScheduled = schedules.find((s) => s.status === "scheduled");
    const scheduleId = firstScheduled ? String(firstScheduled.id) : "0";
    const accountRef =
        scheduleId !== "0" ? `SCHED-${scheduleId}` : `PROP-${propertyId}`;

    return {
        amount: String(lease.rentAmount),
        propertyId,
        tenantId: String(userId),
        propertyTitle: lease.property?.title ?? "",
        dueDate: nextDue.toISOString(),
        scheduleId,
        accountRef,
    };
}

// ---------------------------------------------------------------------------
// 8. Root lease finder
// ---------------------------------------------------------------------------

/**
 * Walks the renewedFromId chain from activeLease backwards through the
 * leases array to find the root lease (renewedFromId === null).
 * Returns activeLease itself if no chain is found or activeLease is null.
 */
export function findRootLease(leases: any[], activeLease: any): any {
    if (!activeLease) return activeLease;

    const leaseMap = new Map<number, any>(
        leases.map((l) => [l.id, l])
    );

    let current = activeLease;
    const visited = new Set<number>();

    while (current.renewedFromId !== null && current.renewedFromId !== undefined) {
        if (visited.has(current.id)) {
            // Cycle guard — return what we have
            break;
        }
        visited.add(current.id);
        const parent = leaseMap.get(current.renewedFromId);
        if (!parent) break; // parent not in the list, stop here
        current = parent;
    }

    return current;
}
