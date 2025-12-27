/**
 * Configuración de campos dinámicos y amenidades por cada tipo de propiedad
 * Esto guía tanto la validación en backend como la renderización en frontend
 */

export type FieldType = 'number' | 'string' | 'decimal' | 'boolean' | 'select';

export interface DynamicField {
    key: string;
    label: string;
    type: FieldType;
    required?: boolean;
    placeholder?: string;
    min?: number;
    max?: number;
    options?: { label: string; value: string }[]; // Para select
    unit?: string; // ej: "m²", "Bs."
}

export interface PropertyTypeConfig {
    type: string;
    label: string;
    description: string;
    fields: DynamicField[];
    amenities: { id: string; label: string }[];
}

/**
 * CONFIGURACIÓN POR TIPO DE PROPIEDAD
 * Frontend usará esto para generar formularios dinámicos
 * Backend usará esto para validar specifications
 */
export const PROPERTY_TYPES_CONFIG: Record<string, PropertyTypeConfig> = {
    APARTMENT: {
        type: 'APARTMENT',
        label: 'Departamento',
        description: 'Unidad de vivienda en edificio',
        fields: [
            {
                key: 'dormitorios',
                label: 'Dormitorios',
                type: 'number',
                required: true,
                min: 1,
                max: 10,
            },
            {
                key: 'baños',
                label: 'Baños',
                type: 'number',
                required: true,
                min: 1,
                max: 10,
            },
            {
                key: 'expensas',
                label: 'Expensas (Bs.)',
                type: 'decimal',
                required: false,
                min: 0,
                unit: 'Bs.',
            },
            {
                key: 'area',
                label: 'Área Total',
                type: 'decimal',
                required: true,
                min: 10,
                unit: 'm²',
            },
            {
                key: 'areaCoworking',
                label: 'Área Coworking',
                type: 'decimal',
                required: false,
                min: 0,
                unit: 'm²',
            },
            {
                key: 'piso',
                label: 'Piso',
                type: 'number',
                required: false,
                min: 0,
                max: 50,
            },
            {
                key: 'garage',
                label: '¿Tiene garage?',
                type: 'boolean',
                required: false,
            },
        ],
        amenities: [
            { id: 'wifi', label: 'WiFi' },
            { id: 'piscina', label: 'Piscina' },
            { id: 'gym', label: 'Gimnasio' },
            { id: 'aireAcondicionado', label: 'Aire Acondicionado' },
            { id: 'ascensor', label: 'Ascensor' },
            { id: 'seguridad24h', label: 'Seguridad 24h' },
            { id: 'estacionamientoIncluido', label: 'Estacionamiento Incluido' },
            { id: 'guarderia', label: 'Guardería' },
            { id: 'areasVerdes', label: 'Áreas Verdes' },
        ],
    },

    HOUSE: {
        type: 'HOUSE',
        label: 'Casa',
        description: 'Vivienda unifamiliar',
        fields: [
            {
                key: 'dormitorios',
                label: 'Dormitorios',
                type: 'number',
                required: true,
                min: 1,
                max: 10,
            },
            {
                key: 'baños',
                label: 'Baños',
                type: 'number',
                required: true,
                min: 1,
                max: 10,
            },
            {
                key: 'area',
                label: 'Área del Terreno',
                type: 'decimal',
                required: true,
                min: 20,
                unit: 'm²',
            },
            {
                key: 'areaBuilt',
                label: 'Área Construida',
                type: 'decimal',
                required: true,
                min: 20,
                unit: 'm²',
            },
            {
                key: 'garage',
                label: 'Lugares de Garaje',
                type: 'number',
                required: false,
                min: 0,
                max: 5,
            },
            {
                key: 'pisos',
                label: 'Número de Pisos',
                type: 'number',
                required: false,
                min: 1,
                max: 5,
            },
            {
                key: 'patio',
                label: '¿Tiene Patio?',
                type: 'boolean',
                required: false,
            },
            {
                key: 'jardin',
                label: '¿Tiene Jardín?',
                type: 'boolean',
                required: false,
            },
        ],
        amenities: [
            { id: 'wifi', label: 'WiFi' },
            { id: 'gimnasio', label: 'Gimnasio' },
            { id: 'piscina', label: 'Piscina' },
            { id: 'salaEstar', label: 'Sala de Estar Común' },
            { id: 'jardinLandscape', label: 'Jardín Paisajístico' },
            { id: 'estacionamiento', label: 'Estacionamiento' },
            { id: 'aireAcondicionado', label: 'Aire Acondicionado' },
            { id: 'calefaccion', label: 'Calefacción' },
        ],
    },

    OFFICE: {
        type: 'OFFICE',
        label: 'Oficina',
        description: 'Espacio de trabajo',
        fields: [
            {
                key: 'area',
                label: 'Área',
                type: 'decimal',
                required: true,
                min: 10,
                unit: 'm²',
            },
            {
                key: 'baños',
                label: 'Baños',
                type: 'number',
                required: false,
                min: 0,
                max: 10,
            },
            {
                key: 'expensas',
                label: 'Expensas (Bs.)',
                type: 'decimal',
                required: false,
                unit: 'Bs.',
            },
            {
                key: 'areaCoworking',
                label: 'Área Coworking (m²)',
                type: 'decimal',
                required: false,
                unit: 'm²',
            },
            {
                key: 'cantidadSalas',
                label: 'Cantidad de Salas',
                type: 'number',
                required: false,
                min: 1,
                max: 20,
            },
            {
                key: 'archivo',
                label: '¿Tiene Archivo?',
                type: 'boolean',
                required: false,
            },
            {
                key: 'estacionamiento',
                label: 'Lugares de Estacionamiento',
                type: 'number',
                required: false,
                min: 0,
            },
        ],
        amenities: [
            { id: 'wifi', label: 'WiFi' },
            { id: 'aireAcondicionado', label: 'Aire Acondicionado' },
            { id: 'cocineta', label: 'Cocineta' },
            { id: 'ascensor', label: 'Ascensor' },
            { id: 'seguridad', label: 'Seguridad 24h' },
            { id: 'recepcion', label: 'Recepción' },
            { id: 'salaReuniones', label: 'Sala de Reuniones' },
            { id: 'areaComun', label: 'Área Común' },
            { id: 'garagem', label: 'Garaje Subterráneo' },
        ],
    },

    LAND: {
        type: 'LAND',
        label: 'Terreno',
        description: 'Terreno sin construcción',
        fields: [
            {
                key: 'area',
                label: 'Área Total',
                type: 'decimal',
                required: true,
                min: 100,
                unit: 'm²',
            },
            {
                key: 'frente',
                label: 'Frente (metros)',
                type: 'decimal',
                required: false,
                min: 1,
                unit: 'm',
            },
            {
                key: 'fondo',
                label: 'Fondo (metros)',
                type: 'decimal',
                required: false,
                min: 1,
                unit: 'm',
            },
            {
                key: 'topografia',
                label: 'Topografía',
                type: 'select',
                required: false,
                options: [
                    { value: 'plano', label: 'Plano' },
                    { value: 'inclinado', label: 'Inclinado' },
                    { value: 'escarpado', label: 'Escarpado' },
                ],
            },
            {
                key: 'esquina',
                label: '¿Es Esquina?',
                type: 'boolean',
                required: false,
            },
        ],
        amenities: [
            { id: 'aguaPotable', label: 'Agua Potable' },
            { id: 'electricidad', label: 'Electricidad' },
            { id: 'gas', label: 'Gas' },
            { id: 'telefonoInternet', label: 'Teléfono/Internet' },
            { id: 'accesoVial', label: 'Acceso Vial' },
            { id: 'proximidadComercial', label: 'Proximidad a Comercial' },
            { id: 'proximidadTransporte', label: 'Proximidad a Transporte' },
            { id: 'zonificacionResidencial', label: 'Zonificación Residencial' },
        ],
    },

    COMMERCIAL: {
        type: 'COMMERCIAL',
        label: 'Local Comercial',
        description: 'Espacio comercial',
        fields: [
            {
                key: 'area',
                label: 'Área',
                type: 'decimal',
                required: true,
                min: 10,
                unit: 'm²',
            },
            {
                key: 'expensas',
                label: 'Expensas (Bs.)',
                type: 'decimal',
                required: false,
                unit: 'Bs.',
            },
            {
                key: 'baños',
                label: 'Baños',
                type: 'number',
                required: false,
                min: 0,
                max: 10,
            },
            {
                key: 'estacionamiento',
                label: 'Lugares de Estacionamiento',
                type: 'number',
                required: false,
                min: 0,
            },
            {
                key: 'frente',
                label: 'Frente (metros)',
                type: 'decimal',
                required: false,
                unit: 'm',
            },
        ],
        amenities: [
            { id: 'wifi', label: 'WiFi' },
            { id: 'aireAcondicionado', label: 'Aire Acondicionado' },
            { id: 'ascensor', label: 'Ascensor' },
            { id: 'transito', label: 'Alto Tránsito' },
            { id: 'visibilidad', label: 'Buena Visibilidad' },
            { id: 'estacionamiento', label: 'Estacionamiento' },
            { id: 'almacen', label: 'Almacén' },
        ],
    },

    WAREHOUSE: {
        type: 'WAREHOUSE',
        label: 'Almacén/Depósito',
        description: 'Espacio de almacenaje',
        fields: [
            {
                key: 'area',
                label: 'Área',
                type: 'decimal',
                required: true,
                min: 50,
                unit: 'm²',
            },
            {
                key: 'altura',
                label: 'Altura (metros)',
                type: 'decimal',
                required: false,
                min: 2,
                unit: 'm',
            },
            {
                key: 'expensas',
                label: 'Expensas (Bs.)',
                type: 'decimal',
                required: false,
                unit: 'Bs.',
            },
            {
                key: 'muelles',
                label: 'Cantidad de Muelles',
                type: 'number',
                required: false,
                min: 0,
            },
            {
                key: 'puertas',
                label: 'Cantidad de Puertas de Acceso',
                type: 'number',
                required: false,
                min: 0,
            },
        ],
        amenities: [
            { id: 'aguaPotable', label: 'Agua Potable' },
            { id: 'electricidad', label: 'Electricidad' },
            { id: 'aireAcondicionado', label: 'Aire Acondicionado' },
            { id: 'sistema360', label: 'Sistema de Vigilancia 360°' },
            { id: 'estacionamiento', label: 'Estacionamiento' },
            { id: 'muelle', label: 'Muelle de Carga' },
            { id: 'piso', label: 'Piso Reforzado' },
        ],
    },

    ROOM: {
        type: 'ROOM',
        label: 'Habitación',
        description: 'Habitación/Cuarto',
        fields: [
            {
                key: 'area',
                label: 'Área',
                type: 'decimal',
                required: true,
                min: 8,
                unit: 'm²',
            },
            {
                key: 'baño',
                label: '¿Baño Privado?',
                type: 'boolean',
                required: false,
            },
            {
                key: 'balcon',
                label: '¿Tiene Balcón?',
                type: 'boolean',
                required: false,
            },
            {
                key: 'closet',
                label: '¿Tiene Closet?',
                type: 'boolean',
                required: false,
            },
        ],
        amenities: [
            { id: 'wifi', label: 'WiFi' },
            { id: 'agua', label: 'Agua Caliente 24h' },
            { id: 'aireAcondicionado', label: 'Aire Acondicionado' },
            { id: 'servicioLimpieza', label: 'Servicio de Limpieza' },
            { id: 'servicioLavanderia', label: 'Servicio de Lavandería' },
            { id: 'comida', label: 'Comida Incluida' },
            { id: 'biblioteca', label: 'Biblioteca Común' },
        ],
    },
};

/**
 * Validar que las specifications cumplan con la config del PropertyType
 */
export function validateSpecifications(
    propertyType: string,
    specifications: Record<string, any>,
): { valid: boolean; errors: string[] } {
    const config = PROPERTY_TYPES_CONFIG[propertyType];
    if (!config) {
        return { valid: false, errors: [`PropertyType inválido: ${propertyType}`] };
    }

    const errors: string[] = [];

    // Validar campos requeridos
    config.fields.forEach((field) => {
        if (field.required && !specifications[field.key]) {
            errors.push(`Campo requerido faltante: ${field.label}`);
        }
    });

    // Validar tipos
    config.fields.forEach((field) => {
        const value = specifications[field.key];
        if (value === null || value === undefined) return;

        switch (field.type) {
            case 'number':
                if (!Number.isInteger(value)) {
                    errors.push(`${field.label} debe ser un número entero`);
                }
                if (field.min && value < field.min) {
                    errors.push(`${field.label} debe ser >= ${field.min}`);
                }
                if (field.max && value > field.max) {
                    errors.push(`${field.label} debe ser <= ${field.max}`);
                }
                break;

            case 'decimal':
                if (typeof value !== 'number') {
                    errors.push(`${field.label} debe ser un número`);
                }
                if (field.min && value < field.min) {
                    errors.push(`${field.label} debe ser >= ${field.min}`);
                }
                break;

            case 'boolean':
                if (typeof value !== 'boolean') {
                    errors.push(`${field.label} debe ser booleano`);
                }
                break;

            case 'select':
                const validOptions = field.options?.map((o) => o.value) || [];
                if (!validOptions.includes(value)) {
                    errors.push(
                        `${field.label} debe ser uno de: ${validOptions.join(', ')}`,
                    );
                }
                break;
        }
    });

    return { valid: errors.length === 0, errors };
}

/**
 * Validar que las amenidades sean válidas para el PropertyType
 */
export function validateAmenities(
    propertyType: string,
    amenities: string[],
): { valid: boolean; errors: string[] } {
    const config = PROPERTY_TYPES_CONFIG[propertyType];
    if (!config) {
        return { valid: false, errors: [`PropertyType inválido: ${propertyType}`] };
    }

    const validIds = config.amenities.map((a) => a.id);
    const errors: string[] = [];

    amenities.forEach((amenity) => {
        if (!validIds.includes(amenity)) {
            errors.push(`Amenidad inválida para ${config.label}: ${amenity}`);
        }
    });

    return { valid: errors.length === 0, errors };
}
