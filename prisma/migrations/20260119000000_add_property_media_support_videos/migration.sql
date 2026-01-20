-- CreateEnum para MediaType
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- Crear nueva tabla property_media
CREATE TABLE "property_media" (
    "id" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "order" INTEGER NOT NULL,
    "duration" INTEGER,
    "size" INTEGER,
    "mimeType" TEXT,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_media_pkey" PRIMARY KEY ("id")
);

-- Migrar datos de property_images a property_media
INSERT INTO "property_media" ("id", "type", "url", "order", "propertyId", "createdAt")
SELECT "id", 'IMAGE'::"MediaType", "url", "order", "propertyId", "createdAt"
FROM "property_images";

-- Eliminar tabla antigua
DROP TABLE "property_images";

-- Crear índices
CREATE UNIQUE INDEX "property_media_propertyId_order_key" ON "property_media"("propertyId", "order");
CREATE INDEX "property_media_propertyId_idx" ON "property_media"("propertyId");
CREATE INDEX "property_media_type_idx" ON "property_media"("type");

-- Añadir foreign key
ALTER TABLE "property_media" ADD CONSTRAINT "property_media_propertyId_fkey" 
    FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
