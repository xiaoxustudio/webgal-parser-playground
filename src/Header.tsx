import { BulbOutlined, GithubOutlined } from "@ant-design/icons";
import { Flex, Button, Checkbox, Dropdown } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import LogoImage from "./assets/icon-192.png";
import packagejson from "../package.json";
import useConfigStore from "./useConfig";

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
	const { theme, location, change } = useConfigStore();
	const parseTimeStr = parseTime.toFixed(2);
	const submit = (name: string, val: any) => {
		change(name, val);
	};

	return (
		<Header
			style={{
				display: "flex",
				alignItems: "center",
				background: "var(--webgal-playground-background)"
			}}
		>
			<Flex
				style={{ width: "100%" }}
				justify="space-between"
				align="center"
			>
				<Content>
					<h2 style={{ color: "#b5495b" }}>
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
