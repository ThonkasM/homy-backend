export class PropertyResponseDto {
    id: string;
    title: string;
    description: string;
    price: number;
    propertyType: string;
    operationType: string;
    status: string;
    postStatus: string;
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state?: string;
    country: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    parking: number;
    floor?: number;
    amenities: string[];
    contactPhone: string;
    contactEmail?: string;
    contactWhatsApp?: string;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
}
