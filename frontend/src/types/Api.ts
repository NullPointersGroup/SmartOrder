export interface User {
    username: string;
    password: string;
}

export interface AuthResponse {
    ok: boolean;
    errors: string[];
}