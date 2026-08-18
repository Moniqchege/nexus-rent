export interface UnitType {
    id: number;
    type: string;
    price: number;
    baths: number;
    totalUnits: number;
}

export interface Property {
    id: number;
    title: string;
    location: string;
    status: string;
    amenities?: string[] | null;
    image?: string | null;
    floors?: string | null;
    score?: number | null;
    rating?: number | null;
    createdAt: string;
    updatedAt?: string;
    landlord?: { id: number; name: string } | null;
    unitTypes: UnitType[];
}

export interface ApiResponse<T> {
    data: T;
    error?: string;
}
