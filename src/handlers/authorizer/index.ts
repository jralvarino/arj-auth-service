import {
    APIGatewayAuthorizerResult,
    APIGatewayTokenAuthorizerEvent,
} from 'aws-lambda';
import { authService } from '../../services/auth/auth.service.js';

const APP_ID = process.env.APP_ID!;

export const handler = async (
    event: APIGatewayTokenAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
    const token = event.authorizationToken?.replace(/^Bearer\s+/i, '').trim();

    if (!token) throw new Error('Unauthorized');

    try {
        const payload = await authService.verifyToken(token);

        if (!payload.apps.includes(APP_ID)) {
            return buildPolicy(payload.sub, 'Deny');
        }

        return buildPolicy(payload.sub, 'Allow', {
            userId: payload.sub,
            name: payload.name,
        });
    } catch {
        throw new Error('Unauthorized');
    }
};

function buildPolicy(
    principalId: string,
    effect: 'Allow' | 'Deny',
    context?: Record<string, string>,
): APIGatewayAuthorizerResult {
    return {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: '*',
                },
            ],
        },
        ...(context ? { context } : {}),
    };
}
