import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";

const ssmClient = new SSMClient({ region: process.env.AWS_REGION ?? "us-east-1" });
let cachedSecret: string | null = null;

export async function resolveJwtSecret(): Promise<string> {
    const fromEnv = process.env.JWT_SECRET?.trim();
    if (fromEnv) return fromEnv;

    if (cachedSecret) return cachedSecret;

    const paramName = process.env.JWT_SECRET_PARAMETER_NAME?.trim();

    const result = await ssmClient.send(new GetParameterCommand({ Name: paramName, WithDecryption: true }));

    const value = result.Parameter?.Value?.trim();
    if (!value) {
        throw new Error(
            `Parâmetro SSM "${paramName}" vazio ou inexistente. Defina JWT_SECRET ou crie o parâmetro (SecureString).`
        );
    }

    cachedSecret = value;
    return value;
}
