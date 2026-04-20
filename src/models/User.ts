export interface User {
    userId: string;
    email: string;
    passwordHash: string;
    apps: string[];
    name?: string;
    avatar?: string;
    createdAt?: string;
}
