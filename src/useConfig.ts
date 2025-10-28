import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ConfigStore {
	location: boolean;
	theme: "light" | "dark";
}
export interface ConfigActions {
	get: () => ConfigStore;
	change: (name: string, val: any) => void;
}

export const useConfigStore = create<ConfigStore & ConfigActions>()(
	persist(
		(set, get) => ({
			location: false,
			theme: "light",
			change: (name: string, val: any) =>
				set((state) => ({ ...state, [name]: val })),
			get: () => get()
		}),
		{
			name: "webgal-playground-config"
		}
	)
);
export default useConfigStore;
