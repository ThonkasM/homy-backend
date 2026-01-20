export class PropertyMediaDto {
    id: string;
    type: 'IMAGE' | 'VIDEO';
    url: string;
    thumbnailUrl?: string;
    order: number;
    duration?: number; // Solo para videos (segundos)
    size?: number; // Tamaño en bytes
    mimeType?: string;
    createdAt: Date;
}
