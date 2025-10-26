import packagejson from "../package.json";
import { useEffect, useMemo, useRef, useState } from "react";
import Flex from "antd/es/flex";
import Layout from "antd/es/layout";
import Splitter from "antd/es/splitter";
import Button from "antd/es/button";
import Editor, { type Monaco } from "@monaco-editor/react";
import { Header, Content } from "antd/es/layout/layout";
import * as monaco from "monaco-editor";

import whiteTheme from "./assets/white.json";
import darkTheme from "./assets/dark.json";
import defaultTextString from "./assets/demo_zh_cn.txt?raw";
import LogoImage from "./assets/icon-192.png";

import webgalTextHL from "./assets/hl.json";
import { loadWASM, OnigScanner, OnigString } from "vscode-oniguruma";
import { INITIAL, Registry, type IRawGrammar } from "vscode-textmate";
import { BulbOutlined, GithubOutlined } from "@ant-design/icons";
import classNames from "classnames";
import type { IParserData } from "./interface";
import { Dropdown } from "antd";
import "./assets/theme.css";

const url = "https://data.jsdelivr.com/v1/package/npm/webgal-parser";

async function liftOff(
	editor: monaco.editor.IStandaloneCodeEditor,
	monaco: Monaco
) {
	monaco.languages.register({
		id: "webgal",
		extensions: [".txt"],
		aliases: ["WebGAL", "WebGAL Script"],
		mimetypes: ["application/webgalscript"]
	});

	await loadWASM({
		data: await fetch("/webgal-parser-playground/onig.wasm").then((res) =>
			res.arrayBuffer()
		)
	});
	const vscodeOnigurumaLib = Promise.resolve({
		createOnigScanner(patterns: string[]) {
			return new OnigScanner(patterns);
		},
		createOnigString(s: string) {
			return new OnigString(s);
		}
	});

	const registry = new Registry({
		onigLib: vscodeOnigurumaLib,
		loadGrammar: (scopeName) => {
			if (scopeName === "source.webgal") {
				return Promise.resolve(webgalTextHL as unknown as IRawGrammar);
			}
			console.log(`Unknown scope name: ${scopeName}`);
			return Promise.resolve(null);
		}
	});

	monaco.editor.defineTheme("webgal-theme", {
		...whiteTheme,
		base: "vs"
	});

	// 处理暗色模式
	const rules = [] as monaco.editor.ITokenThemeRule[];
	darkTheme.tokenColors.forEach((tk) => {
		if (Array.isArray(tk.scope))
			tk.scope.forEach((scope) => {
				rules.push({
					token: scope,
					foreground: tk.settings.foreground
				});
			});
		else
			rules.push({
				token: tk.scope,
				foreground: tk.settings.foreground
			});
	});

	monaco.editor.defineTheme("webgal-theme-dark", {
		base: "vs-dark",
		inherit: false,
		encodedTokensColors: [],
		colors: darkTheme.colors,
		rules
	});

	const grammar = await registry.loadGrammar("source.webgal");
	monaco.languages.setTokensProvider("webgal", {
		getInitialState: () => INITIAL,
		tokenize: (line: string, state: any) => {
			if (!grammar) return state;
			const res = grammar.tokenizeLine(line, state.ruleStack);

			const tokens = res.tokens.map((token) => ({
				startIndex: token.startIndex,
				scopes: token.scopes[token.scopes.length - 1]
			}));

			return {
				endState: res.ruleStack,
				tokens: tokens
			};
		}
	});

	monaco.languages.setLanguageConfiguration("webgal", {
		comments: {
			lineComment: ";"
		},
		brackets: [
			["{", "}"],
			["[", "]"],
			["(", ")"]
		],
		autoClosingPairs: [
			{ open: "{", close: "}" },
			{ open: "[", close: "]" },
			{ open: "(", close: ")" }
		]
	});
	editor.updateOptions({
		unicodeHighlight: { ambiguousCharacters: false },
		wordWrap: "off",
		smoothScrolling: true,
		fontSize: 14,
		tabSize: 2,
		insertSpaces: true,
		theme: "webgal-theme"
	});
}

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

	/**
	 * 处理挂载事件
	 */
	async function handleEditorDidMount(
		editor: monaco.editor.IStandaloneCodeEditor,
		monaco: Monaco
	) {
		editorRef.current = editor;
		liftOff(editor, monaco);
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

	useEffect(() => {
		if (!urlString) return;
		setLoading(true);
		import(urlString)
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
