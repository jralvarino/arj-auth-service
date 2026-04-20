import type { MiddlewareObj } from '@middy/core';
import type { APIGatewayProxyResult } from 'aws-lambda';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
};

export function corsMiddleware(): MiddlewareObj {
    return {
        after(request) {
            const response = request.response as APIGatewayProxyResult;
            if (response) {
                response.headers = { ...CORS_HEADERS, ...response.headers };
            }
        },
        onError(request) {
            const response = request.response as APIGatewayProxyResult;
            if (response) {
                response.headers = { ...CORS_HEADERS, ...response.headers };
            }
        },
    };
}
