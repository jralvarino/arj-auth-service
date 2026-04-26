import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from "aws-lambda";
import { createLogger } from "@arj/arj-common-utils/util";
import { authService } from "../../services/auth.service.js";

const logger = createLogger("authorizer");

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
    const methodArn = event.methodArn;
    logger.info("Authorization request received", { methodArn });

    const token = event.authorizationToken?.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
        logger.error("Authorization denied — missing token", { methodArn });
        throw new Error("Unauthorized");
    }

    const appId = extractAppId(methodArn);

    if (!appId) {
        logger.error("Authorization denied — could not extract appId from methodArn", { methodArn });
        throw new Error("Unauthorized");
    }

    try {
        const payload = await authService.verifyToken(token);

        if (!payload.apps.includes(appId)) {
            logger.info("Authorization denied — app not in token", { userId: payload.sub, appId });
            return buildPolicy(payload.sub, "Deny");
        }

        logger.info("Authorization allowed", { userId: payload.sub, appId });
        return buildPolicy(payload.sub, "Allow", {
            userId: payload.sub,
            name: payload.name,
        });
    } catch (err) {
        logger.error("Authorization denied — token verification failed", { error: (err as Error).message });
        throw new Error("Unauthorized");
    }
};

function extractAppId(methodArn: string): string | undefined {
    const segments = methodArn.split("/");
    return segments[3];
}

function buildPolicy(
    principalId: string,
    effect: "Allow" | "Deny",
    context?: Record<string, string>
): APIGatewayAuthorizerResult {
    return {
        principalId,
        policyDocument: {
            Version: "2012-10-17",
            Statement: [
                {
                    Action: "execute-api:Invoke",
                    Effect: effect,
                    Resource: "*",
                },
            ],
        },
        ...(context ? { context } : {}),
    };
}
