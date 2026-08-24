import { axiosClient } from './axiosClient'
import type {
  CurrentUser,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
} from '../types'

export const authApi = {
  login: async (body: LoginRequest) => (await axiosClient.post<LoginResponse>('/auth/login', body)).data,
  logout: async () => {
    await axiosClient.post('/auth/logout')
  },
  me: async () => (await axiosClient.get<CurrentUser>('/auth/me')).data,
  changePassword: async (body: { currentPassword: string; newPassword: string }) => {
    await axiosClient.post('/auth/change-password', body)
  },
  forgotPassword: async (userName: string) =>
    (await axiosClient.post<ForgotPasswordResponse>('/auth/forgot-password', { userName })).data,
  resetPassword: async (body: { userName: string; token: string; newPassword: string }) => {
    await axiosClient.post('/auth/reset-password', body)
  },
}
