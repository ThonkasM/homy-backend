"""
ARQUITECTURA API HOMI - Vista General
======================================

┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTE MÓVIL                              │
│                  (App React Native / Flutter)                       │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ HTTP/REST + JWT
                         │
┌────────────────────────▼────────────────────────────────────────────┐
│                      NESTJS API (PORT 3000)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │               Global Interceptor                          │   │
│  │  (Transform Response: { success, data, timestamp })       │   │
│  └─────────────────────────┬────────────────────────────────┘   │
│                            │                                     │
│  ┌─────────────────────────▼────────────────────────────────┐   │
│  │                Global Exception Filter                   │   │
│  │  (Error Handling: { success: false, error, statusCode })│   │
│  └─────────────────────────┬────────────────────────────────┘   │
│                            │                                     │
│  ┌─────────────────────────▼────────────────────────────────┐   │
│  │                   AUTH CONTROLLER                        │   │
│  │  POST   /api/auth/register    → JWT + User             │   │
│  │  POST   /api/auth/login       → JWT + User             │   │
│  │  GET    /api/auth/profile     → Current User (JWT)      │   │
│  └─────────────────────────┬────────────────────────────────┘   │
│                            │                                     │
│  ┌─────────────────────────▼────────────────────────────────┐   │
│  │              PROTECTED MODULES (JWT Guard)              │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │        PROPERTIES MODULE                        │  │   │
│  │  │ POST   / → Create                              │  │   │
│  │  │ GET    / → List + Filter + Paginate            │  │   │
│  │  │ GET    /map → For Map View                      │  │   │
│  │  │ GET    /nearby → Geo Search (Haversine)        │  │   │
│  │  │ GET    /:id → Detail                           │  │   │
│  │  │ PATCH  /:id → Update (Owner Only)              │  │   │
│  │  │ DELETE /:id → Soft Delete (Owner Only)         │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │      PROPERTY-IMAGES MODULE                     │  │   │
│  │  │ POST   / → Upload + Attach to Property         │  │   │
│  │  │ DELETE /:id → Remove Image                      │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │         REVIEWS MODULE                          │  │   │
│  │  │ POST   /property/:id → Create Review            │  │   │
│  │  │ GET    /property/:id → List by Property         │  │   │
│  │  │ GET    /user/:id → List by User (Received)      │  │   │
│  │  │ DELETE /:id → Soft Delete Review (Author)       │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │        FAVORITES MODULE                         │  │   │
│  │  │ POST   /property/:id → Add Favorite             │  │   │
│  │  │ GET    / → List My Favorites                    │  │   │
│  │  │ DELETE /property/:id → Remove Favorite          │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │         USERS MODULE                            │  │   │
│  │  │ GET    /:id → Public Profile                    │  │   │
│  │  │ GET    /:id/properties → User Properties        │  │   │
│  │  │ GET    /:id/reviews → User Reviews              │  │   │
│  │  │ PATCH  /profile → Update My Profile             │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │        UPLOAD MODULE                            │  │   │
│  │  │ POST   / → Upload File (multipart)              │  │   │
│  │  │         Returns URL for use                      │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │          COMMON UTILITIES LAYER                          │   │
│  │ ├─ Decorators: @CurrentUser(), @Roles()                  │   │
│  │ ├─ Guards: JwtAuthGuard, RolesGuard                       │   │
│  │ ├─ Filter: HttpExceptionFilter                           │   │
│  │ ├─ Interceptor: TransformInterceptor                     │   │
│  │ └─ Interface: PaginatedResponse<T>                       │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │         PRISMA SERVICE LAYER                             │   │
│  │ ├─ Database Connections                                  │   │
│  │ ├─ Query Building                                        │   │
│  │ └─ Transaction Handling                                  │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                         │
                         │ SQL Queries
                         │
┌────────────────────────▼────────────────────────────────────────────┐
│                    POSTGRESQL DATABASE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Tables:                                                           │
│  ├─ users (id, email, password, role, profile, timestamps)       │
│  ├─ properties (id, title, price, location, owner_id, status)   │
│  ├─ property_images (id, url, order, property_id)               │
│  ├─ reviews (id, rating, comment, property_id, user_id)         │
│  └─ favorites (id, user_id, property_id)                         │
│                                                                     │
│  Indexes:                                                          │
│  ├─ properties(latitude, longitude) - Geo search                 │
│  ├─ properties(property_type, operation_type, status)            │
│  ├─ properties(owner_id)                                          │
│  ├─ reviews(property_id, user_id)                                │
│  └─ favorites(user_id, property_id)                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                  LOCAL FILE STORAGE (Future: S3)                    │
├─────────────────────────────────────────────────────────────────────┤
│  /uploads/                                                          │
│  └─ properties/                                                     │
│     └─ {uuid}.{jpg|png|jpeg}                                       │
│        (Max 10 per property, 5MB each)                             │
└─────────────────────────────────────────────────────────────────────┘


FLUJO DE AUTENTICACIÓN
======================

1. POST /api/auth/register
   Input:  { email, password, firstName, lastName, phone }
   Process: Hashear password + Crear user + Generar JWT
   Output: { accessToken, user }

2. POST /api/auth/login
   Input:  { email, password }
   Process: Validar credenciales + Generar JWT
   Output: { accessToken, user }

3. GET /api/properties (Header: Authorization: Bearer TOKEN)
   Process: Validar JWT → Extraer userId → Ejecutar query
   Output: { success: true, data: [...], pagination: {...} }

4. POST /api/properties (JWT + Body)
   Process: Validar JWT → Validar DTO → Crear en BD → Retornar
   Output: { success: true, data: {...} }


FLUJO DE BÚSQUEDA GEOGRÁFICA
============================

GET /api/properties/nearby?latitude=-17.5&longitude=-63.2&radius=5

Haversine Formula SQL:
  WHERE (
    6371 * acos(
      cos(radians($lat)) * cos(radians(latitude)) *
      cos(radians(longitude) - radians($lon)) +
      sin(radians($lat)) * sin(radians(latitude))
    )
  ) <= $radiusKm

Result: Properties within $radiusKm from the location


VALIDACIONES
============

Auth:
  - Email: unique, valid format
  - Password: min 6 chars, hashed with bcrypt
  - JWT: expires in 7 days, HS256

Properties:
  - Title: required string
  - Price: decimal(12,2), > 0
  - Location: valid lat/lon format
  - Owner: must own property to edit/delete

Reviews:
  - Rating: 1-5 stars
  - User: one review per property
  - Comment: required text

PropertyImages:
  - Order: 1-10 (unique per property)
  - File: jpg/jpeg/png, max 5MB
  - Max: 10 per property


RESPONSE FORMATS
================

Success Response:
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-10-24T20:00:00Z"
}

Paginated Response:
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "timestamp": "2025-10-24T20:00:00Z"
}

Error Response:
{
  "success": false,
  "error": "Error message",
  "statusCode": 400,
  "timestamp": "2025-10-24T20:00:00Z"
}


SEGURIDAD
=========

- Passwords: bcrypt con salt rounds 10
- JWT: HS256, válido 7 días
- Guards: JwtAuthGuard en rutas protegidas
- Authorization: RolesGuard para admin endpoints
- Soft Delete: no elimina, marca deletedAt
- Ownership: valida userId antes de editar/eliminar
- CORS: habilitado para frontend
- Rate Limiting: (implementar en futuro)
- Input Validation: class-validator en todos los DTOs

"""
