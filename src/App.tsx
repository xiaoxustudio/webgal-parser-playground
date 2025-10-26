import SceneParser, { SCRIPT_CONFIG } from "webgal-parser";
import parserMeta from "webgal-parser/package.json";
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
import "./assets/theme.css";
import { BulbOutlined, GithubOutlined } from "@ant-design/icons";
import classNames from "classnames";

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

const WebgalParser = new SceneParser(
	() => {},
	(fileName: string) => fileName,
	[],
	SCRIPT_CONFIG
);

function App() {
	const currentText = {
		value: defaultTextString
	};

	const [theme, setTheme] = useState("light");
	const [parserData, setParserData] = useState({});
	const [parseTime, setParseTime] = useState(0);

	const parseDataString = useMemo(
		() => JSON.stringify(parserData, null, 2),
		[parserData]
	);

	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

	const updateEditData = () => {};

	/**
	 * 处理挂载事件
	 */
	async function handleEditorDidMount(
		editor: monaco.editor.IStandaloneCodeEditor,
		monaco: Monaco
	) {
		editorRef.current = editor;
		liftOff(editor, monaco).then(() => updateEditData());
	}

	function parseValue(val: string) {
		const startTime = performance.now();
		const p = WebgalParser.parse(val, "test", "");
		setParserData(p);
		setParseTime(performance.now() - startTime);
	}

	function onChangeData(value?: string) {
		if (value) {
			currentText.value = value;
			parseValue(value);
		}
	}
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
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				updateEditData();
			}
		};

		window.addEventListener("focus", handleVisibilityChange);
		document.addEventListener("visibilitychange", handleVisibilityChange);

		parseValue(currentText.value);
		return () => {
			window.removeEventListener("focus", handleVisibilityChange);
			document.removeEventListener(
				"visibilitychange",
				handleVisibilityChange
			);
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

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
						<Button type="text" size="large">
							解析器版本：{parserMeta.version}
						</Button>
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
							defaultValue={currentText.value}
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
