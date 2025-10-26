import SceneParser, { SCRIPT_CONFIG } from "webgal-parser";
import parserMeta from "webgal-parser/package.json";
import { useEffect, useMemo, useRef, useState } from "react";
import Flex from "antd/es/flex";
import Layout from "antd/es/layout";
import Splitter from "antd/es/splitter";
import Button from "antd/es/button";
import Editor, { type Monaco } from "@monaco-editor/react";
import { Header, Content } from "antd/es/layout/layout";
import * as monaco from "monaco-editor";
import whiteTheme from "./assets/white.json";
import defaultTextString from "./assets/demo_zh_cn.txt?raw";
import LogoImage from "./assets/icon-192.png";

import webgalTextHL from "./assets/hl.json";

import { loadWASM, OnigScanner, OnigString } from "vscode-oniguruma";
import { INITIAL, Registry, type IRawGrammar } from "vscode-textmate";
import "./assets/theme.css";

// todo : 控制台 monaco-textmate 报错

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
					background: "#f0f0f0",
					borderBottom: "1px solid #d9d9d9"
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
					<Content>
						<Button type="text">
							耗时:{parseTime.toFixed(2)}ms
						</Button>
						<Button type="text">
							解析器版本：{parserMeta.version}
						</Button>
					</Content>
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
							height="95%"
							width="100%"
						/>
					</Content>
				</Splitter.Panel>
			</Splitter>
		</Layout>
	);
}

export default App;
