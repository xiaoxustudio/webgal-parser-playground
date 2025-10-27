import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ConfigStore {
	location: boolean;
	theme: "light" | "dark";
	set: (state: ConfigStore) => void;
	get: () => ConfigStore;
}

export const useConfigStore = create<ConfigStore>()(
	persist(
		(set, get) => ({
			location: false,
			theme: "light",
			set(state) {
				set({
					...state
				});
			},
			get: () => get()
		}),
		{
			name: "webgal-playground-config"
		}
	)
);
export default useConfigStore;
