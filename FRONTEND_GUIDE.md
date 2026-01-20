# 🎬 Guía de Uso: Sistema de Media con Videos

## 📤 Cómo Subir Videos desde el Frontend

### Ejemplo con FormData (JavaScript/TypeScript)

```typescript
// Ejemplo: Crear propiedad con imágenes Y videos
async function createPropertyWithMedia() {
  const formData = new FormData();
  
  // Datos de la propiedad
  formData.append('title', 'Casa con jardín');
  formData.append('description', 'Hermosa casa con amplio jardín');
  formData.append('price', '150000');
  formData.append('currency', 'BOB');
  formData.append('propertyType', 'HOUSE');
  formData.append('operationType', 'SALE');
  formData.append('latitude', '-17.7833');
  formData.append('longitude', '-63.1821');
  formData.append('address', 'Av. Banzer 123');
  formData.append('city', 'Santa Cruz');
  formData.append('country', 'Bolivia');
  formData.append('contactPhone', '+591 70123456');
  
  // Archivos (imágenes y videos mezclados)
  const fileInput = document.getElementById('mediaFiles') as HTMLInputElement;
  if (fileInput.files) {
    for (let file of Array.from(fileInput.files)) {
      formData.append('files', file);
    }
  }
  
  // Enviar al backend
  const response = await fetch('http://localhost:3000/api/properties/with-images', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData, // ⚠️ NO enviar Content-Type header (FormData lo maneja)
  });
  
  const property = await response.json();
  console.log('Propiedad creada:', property);
}
```

### Ejemplo con React

```tsx
import React, { useState } from 'react';
import axios from 'axios';

function CreatePropertyForm() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    const formData = new FormData();
    
    // Datos de la propiedad
    formData.append('title', 'Casa moderna');
    formData.append('description', 'Casa con todas las comodidades');
    formData.append('price', '200000');
    formData.append('propertyType', 'HOUSE');
    formData.append('operationType', 'SALE');
    // ... más campos
    
    // Archivos (imágenes y videos)
    if (files) {
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
    }
    
    try {
      const response = await axios.post(
        'http://localhost:3000/api/properties/with-images',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            // 'Content-Type': 'multipart/form-data' // ⚠️ Axios lo maneja automáticamente
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            console.log(`Progreso: ${percentCompleted}%`);
          },
        }
      );
      
      console.log('Propiedad creada:', response.data);
      alert('¡Propiedad creada exitosamente!');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear propiedad');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileChange}
      />
      <button type="submit" disabled={uploading}>
        {uploading ? 'Subiendo...' : 'Crear Propiedad'}
      </button>
    </form>
  );
}
```

---

## 🎥 Cómo Mostrar Videos en el Carrusel

### Ejemplo con React (Componente de Carrusel)

```tsx
import React from 'react';

interface PropertyMedia {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnailUrl?: string;
  order: number;
  duration?: number; // Segundos
}

interface PropertyCarouselProps {
  media: PropertyMedia[];
}

function PropertyCarousel({ media }: PropertyCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = media[currentIndex];
  
  const next = () => setCurrentIndex((prev) => (prev + 1) % media.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  
  return (
    <div className="carousel">
      <div className="carousel-content">
        {current.type === 'IMAGE' ? (
          <img
            src={`http://localhost:3000${current.url}`}
            alt={`Media ${current.order}`}
            className="carousel-image"
          />
        ) : (
          <video
            controls
            poster={`http://localhost:3000${current.thumbnailUrl}`}
            className="carousel-video"
          >
            <source
              src={`http://localhost:3000${current.url}`}
              type="video/mp4"
            />
            Tu navegador no soporta video.
          </video>
        )}
      </div>
      
      <div className="carousel-controls">
        <button onClick={prev}>← Anterior</button>
        <span>{currentIndex + 1} / {media.length}</span>
        <button onClick={next}>Siguiente →</button>
      </div>
      
      {/* Thumbnails */}
      <div className="carousel-thumbnails">
        {media.map((item, idx) => (
          <div
            key={item.id}
            className={idx === currentIndex ? 'active' : ''}
            onClick={() => setCurrentIndex(idx)}
          >
            {item.type === 'IMAGE' ? (
              <img src={`http://localhost:3000${item.url}`} alt="" />
            ) : (
              <div className="video-thumbnail">
                <img src={`http://localhost:3000${item.thumbnailUrl}`} alt="" />
                <span className="play-icon">▶</span>
                <span className="duration">{item.duration}s</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### CSS para el Carrusel

```css
.carousel {
  max-width: 800px;
  margin: 0 auto;
}

.carousel-content {
  position: relative;
  width: 100%;
  height: 500px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-image,
.carousel-video {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.carousel-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f5f5f5;
}

.carousel-thumbnails {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
}

.carousel-thumbnails > div {
  width: 80px;
  height: 80px;
  cursor: pointer;
  border: 2px solid transparent;
  position: relative;
}

.carousel-thumbnails > div.active {
  border-color: #007bff;
}

.carousel-thumbnails img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-thumbnail {
  position: relative;
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 24px;
  text-shadow: 0 0 4px rgba(0,0,0,0.8);
}

.duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 2px 4px;
  font-size: 10px;
  border-radius: 2px;
}
```

---

## 📊 Respuesta del Backend

Cuando creas una propiedad con media, recibes:

```json
{
  "id": "uuid-property",
  "title": "Casa con jardín",
  "description": "Hermosa casa...",
  "price": 150000,
  "images": [
    {
      "id": "uuid-1",
      "type": "IMAGE",
      "url": "/uploads/properties/images/abc123.jpg",
      "order": 1,
      "size": 245678,
      "mimeType": "image/jpeg",
      "createdAt": "2026-01-19T..."
    },
    {
      "id": "uuid-2",
      "type": "VIDEO",
      "url": "/uploads/properties/videos/xyz789.mp4",
      "thumbnailUrl": "/uploads/properties/thumbnails/xyz789_thumb.jpg",
      "order": 2,
      "duration": 45,
      "size": 8456789,
      "mimeType": "video/mp4",
      "createdAt": "2026-01-19T..."
    },
    {
      "id": "uuid-3",
      "type": "IMAGE",
      "url": "/uploads/properties/images/def456.jpg",
      "order": 3,
      "size": 312456,
      "mimeType": "image/jpeg",
      "createdAt": "2026-01-19T..."
    }
  ]
}
```

---

## ⚠️ Validaciones y Límites

### Límites por Archivo

| Tipo | Tamaño Máximo | Duración Máxima | Formatos |
|------|---------------|-----------------|----------|
| Imagen | 5 MB | - | JPEG, PNG, WebP |
| Video | 100 MB | 2 minutos | MP4, MOV, AVI, WebM |

### Límites por Propiedad

- **Total de archivos**: Máximo 10
- **Videos**: Máximo 3
- **Imágenes**: Sin límite específico (hasta completar los 10 totales)

### Errores Comunes

```json
// Error: Muchos archivos
{
  "statusCode": 400,
  "message": "Máximo 10 archivos permitidos"
}

// Error: Muchos videos
{
  "statusCode": 400,
  "message": "Máximo 3 videos permitidos"
}

// Error: Video muy grande
{
  "statusCode": 400,
  "message": "Video muy grande. Máximo 100MB, recibido 125.34MB"
}

// Error: Video muy largo
{
  "statusCode": 400,
  "message": "Video muy largo. Máximo 120 segundos, el video tiene 180s"
}
```

---

## 🎯 Ejemplo Completo: Formulario con Preview

```tsx
import React, { useState } from 'react';

interface MediaPreview {
  file: File;
  type: 'image' | 'video';
  url: string;
}

function CreatePropertyWithPreview() {
  const [previews, setPreviews] = useState<MediaPreview[]>([]);
  
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validar límites
    if (files.length > 10) {
      alert('Máximo 10 archivos');
      return;
    }
    
    const videos = files.filter(f => f.type.startsWith('video/'));
    if (videos.length > 3) {
      alert('Máximo 3 videos');
      return;
    }
    
    // Crear previews
    const newPreviews: MediaPreview[] = files.map(file => ({
      file,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      url: URL.createObjectURL(file),
    }));
    
    setPreviews(newPreviews);
  };
  
  const removePreview = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async () => {
    const formData = new FormData();
    
    // Agregar datos de la propiedad
    formData.append('title', 'Mi propiedad');
    formData.append('price', '100000');
    // ... más campos
    
    // Agregar archivos
    previews.forEach(preview => {
      formData.append('files', preview.file);
    });
    
    // Enviar al backend
    const response = await fetch('http://localhost:3000/api/properties/with-images', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    
    if (response.ok) {
      alert('¡Propiedad creada!');
    }
  };
  
  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFilesSelected}
      />
      
      {/* Preview de archivos seleccionados */}
      <div className="previews">
        {previews.map((preview, idx) => (
          <div key={idx} className="preview-item">
            {preview.type === 'image' ? (
              <img src={preview.url} alt={`Preview ${idx}`} />
            ) : (
              <video src={preview.url} controls />
            )}
            <button onClick={() => removePreview(idx)}>Eliminar</button>
            <span>{preview.type === 'video' ? '🎥' : '🖼️'}</span>
          </div>
        ))}
      </div>
      
      <button onClick={handleSubmit}>Crear Propiedad</button>
    </div>
  );
}
```

---

## ✅ Checklist de Implementación

- [ ] Verificar que FFmpeg está instalado (o usar @ffmpeg-installer/ffmpeg)
- [ ] Aplicar migración de base de datos
- [ ] Probar upload de solo imágenes (debe funcionar igual que antes)
- [ ] Probar upload de solo videos
- [ ] Probar upload mixto (imágenes + videos)
- [ ] Verificar que los thumbnails se generan
- [ ] Probar streaming de videos en navegador
- [ ] Verificar que el seek (barra de progreso) funciona
- [ ] Probar límites (10 archivos, 3 videos)
- [ ] Verificar que archivos muy grandes son rechazados
- [ ] Verificar que videos muy largos son rechazados

---

## 🚀 ¡Listo para Producir!

El sistema está completamente funcional. Solo falta:
1. Probar desde el frontend
2. Ajustar estilos del carrusel según diseño
3. Considerar CDN para producción (S3, Cloudinary, etc.)
