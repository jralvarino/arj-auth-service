import { Tracer } from "@aws-lambda-powertools/tracer";
import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import middy from "@middy/core";
import httpEventNormalizer from "@middy/http-event-normalizer";
import jsonBodyParser from "@middy/http-json-body-parser";
import httpRouterHandler from "@middy/http-router";
import { createLogger } from "@arj/arj-common-utils/util";
import { corsMiddleware, globalExceptionHandler, requestLoggingMiddleware } from "@arj/arj-common-utils/middleware";
import { routes } from "../../controllers/login.controller.js";

const tracer = new Tracer({ serviceName: "auth-service" });
const logger = createLogger("auth-service");

export const handler = middy()
    .use(captureLambdaHandler(tracer))
    .use(injectLambdaContext(logger as any))
    .use(corsMiddleware())
    .use(jsonBodyParser({ disableContentTypeCheck: true } as any))
    .use(httpEventNormalizer())
    .use(requestLoggingMiddleware())
    .use(globalExceptionHandler())
    .handler(httpRouterHandler(routes));
