import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface TokenStore {
  token: {
    userId: string;
  } | null;
  setToken: (data: { userId: string }) => void;
}

const useTokenStore = create<TokenStore>()(
  devtools(
    persist(
      (set) => ({
        token: null,
        setToken: (data) => set(() => ({ token: data })),
      }),
      { name: "token-store" } // The name for localStorage
    )
  )
);

export { useTokenStore };
