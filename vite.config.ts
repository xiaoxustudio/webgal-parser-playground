import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],

	build: {
		sourcemap: false,
		chunkSizeWarningLimit: 1000,
		rollupOptions: {
			output: {
				manualChunks: {
					"react-vendor": ["react", "react-dom"]
				},
				chunkFileNames: () => {
					return `js/[name]-[hash].js`;
				}
			}
		},
		cssCodeSplit: true
	},

	optimizeDeps: {
		include: ["react", "react-dom", "@monaco-editor"],
		exclude: [],
		force: false
	},

	define: {
		__APP_VERSION__: JSON.stringify(process.env.npm_package_version)
	},
	base: "/webgal-parser-playground/"
});
