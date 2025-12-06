# Estructura de Módulos - API Homi Backend

## 📂 Organización del Proyecto

```
src/
├── auth/                           # Módulo de autenticación
│   ├── auth.module.ts             # Módulo principal
│   ├── auth.service.ts            # Lógica de autenticación
│   ├── auth.controller.ts         # Endpoints de auth
│   ├── jwt.strategy.ts            # Estrategia JWT
│   ├── guards/
│   │   ├── jwt-auth.guard.ts      # Guard para JWT
│   │   └── roles.guard.ts         # Guard para roles
│   └── dto/
│       ├── register.dto.ts        # DTO para registro
│       ├── login.dto.ts           # DTO para login
│       └── auth-response.dto.ts   # DTO de respuesta de auth
│
├── users/                          # Módulo de usuarios
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── users.controller.ts
│   └── dto/
│       ├── create-user.dto.ts
│       ├── update-user.dto.ts
│       └── user-response.dto.ts
│
├── properties/                     # Módulo de propiedades
│   ├── properties.module.ts
│   ├── properties.service.ts
│   ├── properties.controller.ts
│   └── dto/
│       ├── create-property.dto.ts
│       ├── update-property.dto.ts
│       ├── filter-property.dto.ts
│       └── property-response.dto.ts
│
├── property-images/                # Módulo de imágenes
│   ├── property-images.module.ts
│   ├── property-images.service.ts
│   ├── property-images.controller.ts
│   └── dto/
│       └── upload-image.dto.ts
│
├── reviews/                        # Módulo de reseñas
│   ├── reviews.module.ts
│   ├── reviews.service.ts
│   ├── reviews.controller.ts
│   └── dto/
│       ├── create-review.dto.ts
│       └── review-response.dto.ts
│
├── favorites/                      # Módulo de favoritos
│   ├── favorites.module.ts
│   ├── favorites.service.ts
│   ├── favorites.controller.ts
│   └── dto/
│       └── favorite-response.dto.ts
│
├── upload/                         # Módulo de upload
│   ├── upload.module.ts
│   ├── upload.service.ts
│   └── upload.controller.ts
│
├── prisma/                         # Servicio de Prisma
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── common/                         # Utilidades compartidas
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── transform.interceptor.ts
│   └── interfaces/
│       └── paginated-response.interface.ts
│
├── app.module.ts                   # Módulo raíz
├── main.ts                         # Punto de entrada
└── README.md                       # Este archivo
```

## 🔧 Módulos Disponibles

### Auth Module (`/api/auth`)
Responsable de la autenticación y autorización.

**Endpoints a implementar:**
- `POST /register` - Registro de usuario
- `POST /login` - Login (retorna JWT)
- `GET /profile` - Perfil del usuario autenticado
- `PATCH /profile` - Actualizar perfil

**Archivos:**
- `auth.service.ts` - Lógica de autenticación, hasheo de passwords, generación de tokens
- `auth.controller.ts` - Endpoints de autenticación
- `jwt.strategy.ts` - Estrategia JWT para Passport
- `guards/jwt-auth.guard.ts` - Guard para proteger rutas
- `guards/roles.guard.ts` - Guard para validar roles de usuario

### Users Module (`/api/users`)
Gestión de perfiles de usuario.

**Endpoints a implementar:**
- `GET /:id` - Ver perfil público de usuario
- `GET /:id/properties` - Propiedades del usuario
- `GET /:id/reviews` - Reseñas recibidas

**Archivos:**
- `users.service.ts` - Lógica de CRUD de usuarios
- `users.controller.ts` - Endpoints de usuarios

### Properties Module (`/api/properties`)
CRUD completo de propiedades.

**Endpoints a implementar:**
- `POST /` - Crear propiedad (requiere auth)
- `GET /` - Listar propiedades con filtros y paginación
- `GET /map` - Obtener propiedades para mapa
- `GET /:id` - Detalle completo de propiedad
- `PATCH /:id` - Actualizar propiedad (solo owner)
- `DELETE /:id` - Soft delete (solo owner)
- `GET /user/:userId` - Propiedades de un usuario
- `GET /nearby` - Propiedades cercanas (radio en km)

**Archivos:**
- `properties.service.ts` - Lógica de CRUD con filtros y búsqueda geográfica
- `properties.controller.ts` - Endpoints de propiedades
- `dto/filter-property.dto.ts` - DTO para filtros avanzados

### Property Images Module (`/api/property-images`)
Gestión de imágenes de propiedades.

**Endpoints a implementar:**
- `POST /upload` - Subir imagen
- `POST /property/:propertyId` - Asociar imagen a propiedad
- `DELETE /:id` - Eliminar imagen

**Archivos:**
- `property-images.service.ts` - Lógica de upload y gestión de imágenes
- `property-images.controller.ts` - Endpoints de imágenes

### Reviews Module (`/api/reviews`)
Sistema de reseñas de propiedades.

**Endpoints a implementar:**
- `POST /property/:propertyId` - Crear reseña
- `GET /property/:propertyId` - Listar reseñas de propiedad
- `GET /user/:userId` - Reseñas recibidas por usuario
- `DELETE /:id` - Soft delete de reseña

**Archivos:**
- `reviews.service.ts` - Lógica de reseñas
- `reviews.controller.ts` - Endpoints de reseñas

### Favorites Module (`/api/favorites`)
Gestión de propiedades favoritas.

**Endpoints a implementar:**
- `POST /property/:propertyId` - Agregar a favoritos
- `GET /` - Listar mis favoritos
- `DELETE /property/:propertyId` - Quitar de favoritos

**Archivos:**
- `favorites.service.ts` - Lógica de favoritos
- `favorites.controller.ts` - Endpoints de favoritos

### Upload Module (`/api/upload`)
Servicio de upload de archivos.

**Endpoints a implementar:**
- `POST /` - Subir archivo (multipart/form-data)

**Archivos:**
- `upload.service.ts` - Lógica de almacenamiento (local o S3)
- `upload.controller.ts` - Endpoints de upload

## 🛠️ Patrones de Diseño

### DTOs (Data Transfer Objects)
Cada módulo tiene carpeta `dto/` con clases para:
- **Create DTOs**: Validación de entrada al crear
- **Update DTOs**: Validación de entrada al actualizar
- **Response DTOs**: Formato de salida (sin campos sensibles)

### Decorators
- `@CurrentUser()` - Inyecta el usuario autenticado desde el JWT
- `@Roles(...)` - Define roles requeridos para una ruta

### Guards
- `JwtAuthGuard` - Valida presencia y validez del JWT
- `RolesGuard` - Valida que el usuario tenga los roles necesarios

### Filters & Interceptors
- `HttpExceptionFilter` - Maneja excepciones HTTP con formato estándar
- `TransformInterceptor` - Transforma respuestas a formato estándar `{ success, data, timestamp }`

## 📋 Próximos Pasos

1. Instalar dependencias faltantes:
```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install --save-dev @types/passport-jwt
```

2. Implementar cada módulo en este orden:
   - ✅ Auth Module
   - ✅ Users Module
   - ✅ Upload Module
   - ✅ Properties Module
   - ✅ Property Images Module
   - ✅ Reviews Module
   - ✅ Favorites Module

3. Crear migrations de Prisma
4. Agregar tests unitarios
5. Documentar con Swagger

## 🔐 Consideraciones de Seguridad

- Validar `ownerId` antes de permitir ediciones
- Usar soft delete para datos sensibles
- Excluir `password` en todas las respuestas
- Implementar rate limiting en endpoints públicos
- Validar permisos con `@Roles` y `RolesGuard`

---

**Nota**: Esta estructura está lista para implementación. Todos los archivos base están creados y listos para agregar la lógica.
