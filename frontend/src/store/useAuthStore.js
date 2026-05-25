import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      clinic: null,
      token: null,
      refreshToken: null,
      setAuth: (data) => set({
        isAuthenticated: true,
        user: data.user,
        clinic: data.clinic,
        token: data.token,
        refreshToken: data.refreshToken || null
      }),
      logout: () => set({
        isAuthenticated: false,
        user: null,
        clinic: null,
        token: null,
        refreshToken: null
      }),
    }),
    {
      name: 'medai-auth-storage',
    }
  )
);

export default useAuthStore;
