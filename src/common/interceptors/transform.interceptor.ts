import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const url = request.url;

        // Rutas que NO deben ser envueltas (upload, archivos, etc)
        const excludedRoutes = [
            '/api/upload',
            '/uploads',
            '/api/auth/login',
            '/api/auth/register',
        ];

        const shouldExclude = excludedRoutes.some((route) => url.includes(route));

        return next.handle().pipe(
            map((data) => {
                // Si la ruta está excluida, retorna directamente
                if (shouldExclude) {
                    return data;
                }

                // Si no, envuelve la respuesta
                return {
                    success: true,
                    data: data || null,
                    timestamp: new Date().toISOString(),
                };
            }),
        );
    }
}
