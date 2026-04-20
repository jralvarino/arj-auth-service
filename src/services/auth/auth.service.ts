import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '@arj/common-utils-layer/error';
import { userRepository } from '../../repositories/user/user.repository.js';
import { resolveJwtSecret } from './jwtSecret.js';

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

export const authService = {
    async login(email: string, password: string): Promise<LoginResult> {
        const user = await userRepository.findByEmail(email);

        const invalidCredentials = () => new UnauthorizedError('Credenciais inválidas.');

        if (!user) throw invalidCredentials();

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) throw invalidCredentials();

        const secret = await resolveJwtSecret();
        const now = Math.floor(Date.now() / 1000);

        const payload = {
            sub: user.userId,
            apps: user.apps,
            name: user.name ?? '',
            iat: now,
            exp: now + TOKEN_TTL_SECONDS,
        };

        const token = jwt.sign(payload, secret, { algorithm: 'HS256' });

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
        return jwt.verify(token, secret, { algorithms: ['HS256'] }) as JwtPayload;
    },
};
