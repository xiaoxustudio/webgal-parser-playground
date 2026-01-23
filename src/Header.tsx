import {
	BulbOutlined,
	GithubOutlined,
	ShareAltOutlined
} from "@ant-design/icons";
import { Flex, Button, Checkbox, Dropdown, message, Tooltip } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import LogoImage from "./assets/icon-192.png";
import packagejson from "../package.json";
import useConfigStore from "./useConfig";
import darkTheme from "./assets/dark.json";
import whiteTheme from "./assets/white.json";
import { useContext } from "react";
import { EditorContext } from "./context";
import { encodeBase64Utf8 } from "./base64";
import { t, getLocales, getLocaleName } from "./i18n";

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
	const { theme, location, locale, change } = useConfigStore();
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
					<h2
						style={{
							color: "var(--webgal-playground-primary-color)"
						}}
					>
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
						{t("time_cost")}
						{parseTimeStr}ms
					</Button>
					<Button type="text" size="large">
						<Checkbox
							checked={location}
							onChange={() => submit("location", !location)}
						>
							{t("locate")}
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
						{t("parser_version")}
						{loading ? t("loading") : version}
					</Dropdown.Button>
					<Dropdown.Button
						menu={{
							items: getLocales().map((l) => ({
								key: l,
								label: getLocaleName(l),
								disabled: l === locale,
								onClick: () => submit("locale", l)
							}))
						}}
						type="text"
						size="large"
					>
						{t("language")}
					</Dropdown.Button>
					<Tooltip title={t("share_link")}>
						<Button
							type="text"
							onClick={async () => {
								try {
									const active =
										files.find((f) => f.id === activeId) ||
										files[0];
									const payload = {
										v: version,
										files: files.map((f) => ({
											n: f.name,
											c: f.content
										})),
										active: active?.name
									};
									const json = JSON.stringify(payload);
									const encoded = encodeURIComponent(
										encodeBase64Utf8(json)
									);
									const base =
										window.location.href.split("?")[0];
									const shareUrl = `${base}?s=${encoded}`;
									if (navigator.clipboard?.writeText) {
										await navigator.clipboard.writeText(
											shareUrl
										);
										message.success(t("share_copied"));
									} else {
										message.info(shareUrl);
									}
								} catch {
									message.error(t("share_failed"));
								}
							}}
							size="large"
							style={{
								fontSize: "20px"
							}}
						>
							<ShareAltOutlined />
						</Button>
					</Tooltip>
					<Tooltip title={t("toggle_theme")}>
						<Button
							type="text"
							onClick={() =>
								submit(
									"theme",
									theme === "dark" ? "light" : "dark"
								)
							}
							size="large"
							style={{
								fontSize: "20px"
							}}
						>
							<BulbOutlined />
						</Button>
					</Tooltip>
					<Tooltip title={t("open_github")}>
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
					</Tooltip>
				</Flex>
			</Flex>
		</Header>
	);
}
