export interface ContactCategory {
    id: number;
    name: string;
    slug: string;
    icon: string;
    description: string;
}

export interface Contact {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    type: string;
    role: string;
}
