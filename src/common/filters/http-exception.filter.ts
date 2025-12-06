import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        const message =
            typeof exceptionResponse === 'object'
                ? (exceptionResponse as any).message
                : exceptionResponse;

        response.status(status).json({
            success: false,
            error: message || 'An error occurred',
            statusCode: status,
            timestamp: new Date().toISOString(),
        });
    }
}
