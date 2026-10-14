import api from '../config/axios.config';
import { BaseApiResponse, LoginResponse } from '../types/auth.types';

export const authService = {
  // 1. Admin Login API
  async login(payload: Record<string, string>): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/login', payload);
    return data;
  },

  // Isko src/services/auth.service.ts ke andar authService object mein jodh dein:
  async signup(payload: Record<string, any>): Promise<any> {
    // Aapke backend ka standard route mapping path '/signup' ya jo bhi ho
    const { data } = await api.post('/signup', payload);
    return data;
  },

  // 2. Admin Forgot Password Request Link
  async forgotPassword(email: string): Promise<BaseApiResponse> {
    const { data } = await api.post<BaseApiResponse>('/forgot-password', { email });
    return data;
  },

  // 3. Admin Reset Password Action
  async resetPassword(payload: Record<string, string>): Promise<BaseApiResponse> {
    const { token, newPassword } = payload;
    // URL param ke badle direct request body payload system 🔒
    const { data } = await api.post<BaseApiResponse>('/reset-password', { token, password: newPassword });
    return data;
  },

  // 3. Admin OTP Verification API
  async verifyOTP(payload: Record<string, string>): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/verify-otp', payload);
    return data;
  },

  //password-less login
  async passwordlessLogin(payload: Record<string, string>): Promise<BaseApiResponse> {
    const { email } = payload;
    const { data } = await api.post<BaseApiResponse>('/passwordless-login', { email });
    return data;
  }
};