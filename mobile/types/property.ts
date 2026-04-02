export interface Property {
    id: number;
    title: string;
    location: string;
    price: number;
    beds: number;
    baths: number;
    sqft: number;
    status: string;
    amenities?: string[];
    image?: string | null;
    score?: number | null;
    rating?: number | null;
    createdAt: string;
    updatedAt?: string;
    landlord?: {
        id: number;
        name: string;
    };
}

export interface ApiResponse<T> {
    data: T;
    error?: string;
}

