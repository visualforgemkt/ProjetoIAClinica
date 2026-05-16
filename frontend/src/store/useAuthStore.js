import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      clinic: null,
      token: null,
      setAuth: (data) => set({ 
        isAuthenticated: true, 
        user: data.user, 
        clinic: data.clinic, 
        token: data.token 
      }),
      logout: () => set({ 
        isAuthenticated: false, 
        user: null, 
        clinic: null, 
        token: null 
      }),
    }),
    {
      name: 'medai-auth-storage',
    }
  )
);

export default useAuthStore;
