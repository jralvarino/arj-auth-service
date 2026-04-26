import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import middy from "@middy/core";
import { Route } from "@middy/http-router";
import { zodValidator } from "@arj/arj-common-utils/middleware";
import { success } from "@arj/arj-common-utils/util";
import { z } from "zod";
import { authService } from "../services/auth.service.js";

const loginSchema = z.object({
    body: z.object({
        email: z.string().email("E-mail inválido."),
        password: z.string().min(1, "Senha obrigatória."),
    }),
});

type LoginBody = z.infer<typeof loginSchema>["body"];

const login = middy<APIGatewayProxyEvent, APIGatewayProxyResult>()
    .use(zodValidator(loginSchema))
    .handler(async (event) => {
        const { email, password } = (event as APIGatewayProxyEvent & { validated: { body: LoginBody } }).validated.body;

        const result = await authService.login(email, password);
        return success(result);
    });

export const routes: Route<APIGatewayProxyEvent, APIGatewayProxyResult>[] = [
    { method: "POST", path: "/auth/login", handler: login },
];
