import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import middy from '@middy/core';
import httpEventNormalizer from '@middy/http-event-normalizer';
import jsonBodyParser from '@middy/http-json-body-parser';
import httpRouterHandler from '@middy/http-router';
import { createLogger } from '@arj/common-utils-layer/util';
import {
    globalExceptionHandler,
    requestLoggingMiddleware,
} from '@arj/common-utils-layer/middleware';
import { routes } from '../../controllers/auth/auth.controller.js';
import { corsMiddleware } from '../../middleware/cors.middleware.js';

const tracer = new Tracer({ serviceName: 'auth-service' });
const logger = createLogger('auth-service');

export const handler = middy()
    .use(captureLambdaHandler(tracer))
    .use(injectLambdaContext(logger as any))
    .use(corsMiddleware())
    .use(jsonBodyParser({ disableContentTypeCheck: true } as any))
    .use(httpEventNormalizer())
    .use(requestLoggingMiddleware())
    .use(globalExceptionHandler())
    .handler(httpRouterHandler(routes));
