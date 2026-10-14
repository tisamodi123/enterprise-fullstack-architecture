export interface BaseApiResponse {
  status?: string;
  errorCode?: number;
  message: string;
}

export interface LoginResponse {
  status: 'success' | 'fail' | 'error';
  token?: string;
  data: {
    user: {
      name: string;
      email: string;
      role: string;
    };
  };
}

export interface UserSession {
  name: string;
  email: string;
  role: string;
  token: string;
}