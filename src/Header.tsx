import { BulbOutlined, GithubOutlined, ShareAltOutlined } from "@ant-design/icons";
import { Flex, Button, Checkbox, Dropdown, message } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import LogoImage from "./assets/icon-192.png";
import packagejson from "../package.json";
import useConfigStore from "./useConfig";
import darkTheme from "./assets/dark.json";
import whiteTheme from "./assets/white.json";
import { useContext } from "react";
import { EditorContext } from "./context";
import { encodeBase64Utf8 } from "./base64";

export default function HeaderContent({
	parseTime,
	loading,
	version,
	itemsList
}: {
	parseTime: number;
	loading: boolean;
	version: string;
	itemsList: any[];
}) {
	const { files, activeId } = useContext(EditorContext);
	const { theme, location, change } = useConfigStore();
	const parseTimeStr = parseTime.toFixed(2);
	const submit = (name: string, val: any) => {
		change(name, val);
	};
	const editorBg =
		theme === "dark"
			? (darkTheme as any).colors["editor.background"]
			: (whiteTheme as any).colors["editor.background"];

	return (
		<Header
			style={{
				display: "flex",
				alignItems: "center",
				background: editorBg
			}}
		>
			<Flex
				style={{ width: "100%" }}
				justify="space-between"
				align="center"
			>
				<Content>
					<h2 style={{ color: "var(--webgal-playground-primary-color)" }}>
						<img
							style={{ verticalAlign: "middle" }}
							src={LogoImage}
							height="35"
						/>
						<span style={{ marginLeft: "10px" }}>
							WebGAL Parser Playground
						</span>
					</h2>
				</Content>
				<Content> </Content>
				<Flex justify="right">
					<Button type="text" size="large">
						耗时:{parseTimeStr}ms
					</Button>
					<Button type="text" size="large">
						<Checkbox
							checked={location}
							onChange={() => submit("location", !location)}
						>
							定位
						</Checkbox>
					</Button>

					<Dropdown.Button
						menu={{
							items: itemsList,
							style: {
								maxHeight: "300px",
								overflowY: "auto"
							}
						}}
						loading={loading}
						type="text"
						size="large"
					>
						解析器版本：{loading ? "加载中" : version}
					</Dropdown.Button>
					<Button
						type="text"
						onClick={async () => {
							try {
								const active = files.find((f) => f.id === activeId) || files[0];
								const payload = {
									v: version,
									files: files.map((f) => ({ n: f.name, c: f.content })),
									active: active?.name
								};
								const json = JSON.stringify(payload);
								const encoded = encodeURIComponent(encodeBase64Utf8(json));
								const base = window.location.href.split("?")[0];
								const shareUrl = `${base}?s=${encoded}`;
								if (navigator.clipboard?.writeText) {
									await navigator.clipboard.writeText(shareUrl);
									message.success("分享链接已复制到剪贴板");
								} else {
									message.info(shareUrl);
								}
							} catch {
								message.error("生成分享链接失败");
							}
						}}
						size="large"
						style={{
							fontSize: "20px"
						}}
					>
						<ShareAltOutlined />
					</Button>
					<Button
						type="text"
						onClick={() =>
							submit("theme", theme === "dark" ? "light" : "dark")
						}
						size="large"
						style={{
							fontSize: "20px"
						}}
					>
						<BulbOutlined />
					</Button>
					<Button
						type="text"
						onClick={() => window.open(packagejson.homepage)}
						size="large"
						style={{
							fontSize: "20px"
						}}
					>
						<GithubOutlined />
					</Button>
				</Flex>
			</Flex>
		</Header>
	);
}
