export interface ServiceCategory {
    id: number;
    name: string;
    slug: string;
    icon: string;
    description?: string;
    createdAt: string;
}

export interface ServiceProvider {
    id: number;
    name: string;
    phone: string;
    email?: string;
    categoryId: number;
    hourlyRate?: number;
    location?: string;
    rating: number;
    isActive: boolean;
    bio?: string;
    image?: string;
    createdAt: string;
    updatedAt: string;
    category: ServiceCategory;
}

export interface CreateServiceProvider {
    name: string;
    phone: string;
    email?: string;
    categoryId: number;
    hourlyRate?: number;
    location?: string;
    bio?: string;
    image?: string;
}

