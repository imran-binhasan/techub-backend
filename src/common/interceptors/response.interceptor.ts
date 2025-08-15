import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";
import { ApiResponse, PaginatedServiceResponse } from "../interfaces/api-response.interface";

@Injectable()
export class ResponseInterceptor<T>
    implements NestInterceptor<T, ApiResponse<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler
    ): Observable<ApiResponse<T>> {

        const requestId = Math.random().toString(20).substring(2, 10);

        return next.handle().pipe(
            map((data) => {

                if (this.isPaginatedResponse(data)) {
                    return this.handlePaginatedResponse(data, requestId)
                }

                return this.handleRegularResponse(data, requestId)
            })
        )
    }

    private isPaginatedResponse(
        data: any
    ): data is PaginatedServiceResponse<any> {
        return (data
            && typeof data === 'object'
            && Array.isArray(data.items) &&
            data.pagination &&
            typeof data.pagination.page === 'number' &&
            typeof data.pagination.limit === 'number' &&
            typeof data.pagination.total === 'number' &&
            data.pagination.totalPages === 'number'
        );
    }

    private handlePaginatedResponse(
        data: PaginatedServiceResponse<any>
        , requestId: string): ApiResponse<any> {
        return {
            data: data.items,
            status: 'success',
            meta: {
                timestamp: new Date().toISOString(),
                requestId,
                pagination: data.pagination
            }
        }
    }


    private handleRegularResponse(
        data: any,
        requestId: string
    ): ApiResponse<any> {
        return {
            data,
            status: 'success',
            meta: {
                timestamp: new Date().toISOString(),
                requestId,
            }
        }
    }


}

