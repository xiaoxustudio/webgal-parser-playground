import packagejson from "../package.json";
import { useEffect, useMemo, useRef, useState } from "react";
import Flex from "antd/es/flex";
import Layout from "antd/es/layout";
import Splitter from "antd/es/splitter";
import Button from "antd/es/button";
import { Header, Content } from "antd/es/layout/layout";
import { BulbOutlined, GithubOutlined } from "@ant-design/icons";

import * as monaco from "monaco-editor";
import Editor, { loader, type Monaco } from "@monaco-editor/react";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import {
	findSentenceEndLine,
	findSentencePosition,
	initMonaco
} from "./monoca";

import classNames from "classnames";
import { Dropdown } from "antd";
import type { IParserData } from "./interface";
import defaultTextString from "./assets/demo_zh_cn.txt?raw";
import LogoImage from "./assets/icon-192.png";
import "./assets/theme.css";

const url = "https://data.jsdelivr.com/v1/package/npm/webgal-parser";

self.MonacoEnvironment = {
	getWorker(_, label) {
		if (label === "json") {
			return new jsonWorker();
		}
		return new editorWorker();
	}
};
loader.config({ monaco });
loader.init();

function App() {
	const currentText = useRef(defaultTextString);
	const WebgalParser = useRef(null as any); // 实例

	const [loading, setLoading] = useState(true); // 加载状态
	const [version, setVersion] = useState(""); // 版本文本
	const urlString = useMemo(
		() =>
			!version
				? ""
				: `https://cdn.jsdelivr.net/npm/webgal-parser@${version}/build/es/index.js`,
		[version]
	);
	const [theme, setTheme] = useState("light"); // 主题
	const [parserList, setParserList] = useState<string[]>([]); // 版本列表
	const itemsList = useMemo(
		() =>
			parserList.map((i, ind) => ({
				key: i + ind,
				label: i,
				onClick: () => setVersion(i)
			})),
		[parserList]
	);

	const [parserData, setParserData] = useState({});
	const [parseTime, setParseTime] = useState(0); // 耗时

	const parseDataString = useMemo(
		() => JSON.stringify(parserData, null, 2),
		[parserData]
	);

	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
	const editorRightRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
		null
	);

	function initMonacoMouseMove(
		editor: monaco.editor.IStandaloneCodeEditor,
		isLeft: boolean = true
	) {
		if (isLeft) {
			editor.onDidChangeCursorPosition((e) => {
				locateInRightEditor(e.position.lineNumber);
			});
		}
	}

	/**
	 * 处理挂载事件
	 */
	async function handleEditorDidMount(
		editor: monaco.editor.IStandaloneCodeEditor,
		monaco: Monaco
	) {
		editorRef.current = editor;
		initMonaco(editor, monaco);
		initMonacoMouseMove(editor);
	}

	function parseValue(val: string) {
		if (!WebgalParser.current) return;
		const startTime = performance.now();
		const p = WebgalParser.current.parse(val, "test", "");
		setParserData(p);
		setParseTime(performance.now() - startTime);
	}

	function onChangeData(value?: string) {
		if (value) {
			currentText.current = value;
			parseValue(value);
		}
	}

	const locateInRightEditor = (lineNumber: number) => {
		const rightEditor = editorRightRef.current;
		if (!rightEditor) return;

		const content = rightEditor.getValue();
		// 使用行号直接定位
		const position = findSentencePosition(content, lineNumber);
		if (position) {
			// 滚动
			rightEditor.revealPositionInCenter(position);

			const endLine = findSentenceEndLine(content, position.lineNumber);
			const range = {
				startLineNumber: position.lineNumber - 2,
				startColumn: 1,
				endLineNumber: endLine,
				endColumn: 1
			};

			rightEditor.setSelection(range);
		}
	};

	useEffect(() => {
		if (!urlString) return;
		setLoading(true);
		import(/* @vite-ignore */ urlString)
			.then((data) => {
				WebgalParser.current = new data.default(
					() => {},
					(fileName: string) => fileName,
					[],
					data.SCRIPT_CONFIG
				);
				// 重新解析
				parseValue(currentText.current);
				setLoading(false);
			})
			.catch(() => {
				setLoading(false);
			});
	}, [urlString]);

	useEffect(() => {
		if (editorRef.current) {
			editorRef.current.updateOptions({
				theme: theme === "dark" ? "webgal-theme-dark" : "webgal-theme"
			});
		}
		// 设置根元素的class
		document.documentElement.className = classNames({
			dark: theme === "dark"
		});
	}, [theme]);

	useEffect(() => {
		parseValue(currentText.current);

		setLoading(true);
		fetch(url)
			.then((res) => res.json())
			.then((data: IParserData) => {
				setParserList(data.versions);
				setVersion(data.tags.latest);
				setLoading(false);
			});
	}, []);

	return (
		<Layout style={{ height: "100vh" }}>
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
							耗时:{parseTime.toFixed(2)}ms
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
								setTheme(theme === "dark" ? "light" : "dark")
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
			<Splitter>
				<Splitter.Panel defaultSize="40%" min="20%" max="70%">
					<Content
						style={{
							padding: 0,
							margin: 0,
							height: "calc(100vh - 64px)",
							overflow: "hidden"
						}}
					>
						<Editor
							onMount={handleEditorDidMount}
							onChange={onChangeData}
							defaultLanguage="webgal"
							language="webgal"
							defaultValue={currentText.current}
							height="100%"
							width="100%"
						/>
					</Content>
				</Splitter.Panel>
				<Splitter.Panel>
					<Content
						style={{
							padding: 0,
							margin: 0,
							height: "calc(100vh - 64px)",
							overflow: "hidden"
						}}
					>
						<Editor
							onMount={(editor) => {
								editorRightRef.current = editor;
								initMonacoMouseMove(editor, false);
							}}
							defaultLanguage="json"
							language="json"
							value={parseDataString}
							height="100%"
							width="100%"
						/>
					</Content>
				</Splitter.Panel>
			</Splitter>
		</Layout>
	);
}

export default App;
