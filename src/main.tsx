import { createRoot } from "react-dom/client";
import { ConfigProvider } from "antd";
import App from "./App.tsx";
import "./index.css";
import "@ant-design/v5-patch-for-react-19";

createRoot(document.getElementById("root")!).render(
	<ConfigProvider>
		<App />
	</ConfigProvider>
);
