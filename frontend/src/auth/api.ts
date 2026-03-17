import { apiFetch } from '../utils/apiFetch'

export interface User {
  username: string;
  email: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  confirmPwd: string;
}

export interface AuthResponse {
  ok: boolean;
  errors: string[];
}

export async function login(dto: LoginDto): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', 'POST', dto);
}

export async function register(dto: RegisterDto): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/register', 'POST', dto);
}