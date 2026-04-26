import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "@arj/arj-common-utils/error";
import { UserService } from "@arj/arj-common-utils/service";
import { resolveJwtSecret } from "./jwtSecret.js";

export interface JwtPayload {
    sub: string;
    apps: string[];
    name: string;
    exp: number;
    iat: number;
}

export interface LoginResult {
    token: string;
    user: {
        userId: string;
        name: string | undefined;
        avatar: string | undefined;
    };
}

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const userService = new UserService();

export const authService = {
    async login(email: string, password: string, appId: string): Promise<LoginResult> {
        const user = await userService.findByEmail(email);

        const invalidCredentials = () => new UnauthorizedError("Invalid credentials.");

        if (!user) throw invalidCredentials();

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) throw invalidCredentials();

        if (!user.apps.includes(appId)) throw new UnauthorizedError("Access denied for this app.");

        const secret = await resolveJwtSecret();
        const now = Math.floor(Date.now() / 1000);

        const payload = {
            sub: user.userId,
            apps: user.apps,
            name: user.name ?? "",
            iat: now,
            exp: now + TOKEN_TTL_SECONDS,
        };

        const token = jwt.sign(payload, secret, { algorithm: "HS256" });

        return {
            token,
            user: {
                userId: user.userId,
                name: user.name,
                avatar: user.avatar,
            },
        };
    },

    async verifyToken(token: string): Promise<JwtPayload> {
        const secret = await resolveJwtSecret();
        return jwt.verify(token, secret, { algorithms: ["HS256"] }) as JwtPayload;
    },
};
