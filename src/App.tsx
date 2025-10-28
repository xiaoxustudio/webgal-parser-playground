import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import Layout from "antd/es/layout";
import * as monaco from "monaco-editor";

import { loader, type Monaco } from "@monaco-editor/react";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import {
	findSentenceEndLine,
	findSentencePosition,
	initMonaco
} from "./monoca";

import classNames from "classnames";
import defaultTextString from "./assets/demo_zh_cn.txt?raw";
import HeaderContent from "./Header";
import useConfigStore from "./useConfig";
import type { IParserData } from "./interface";
import "./assets/theme.css";
// import TabsView from "./Tabs";
import { EditorContext } from "./context";
import ContentView from "./Content";

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
	const { theme, location } = useConfigStore();

	const [currentText, setCurrentText] = useState(defaultTextString);
	const onDidRef = useRef(null as any);
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

	/**
	 * 处理挂载事件
	 */
	async function handleEditorDidMount(
		editor: monaco.editor.IStandaloneCodeEditor,
		monaco: Monaco
	) {
		editorRef.current = editor;
		initMonaco(editor, monaco).then(() =>
			editor.updateOptions({
				theme: theme === "dark" ? "webgal-theme-dark" : "webgal-theme"
			})
		);
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
			setCurrentText(value);
			parseValue(value);
		}
	}

	const locateInRightEditor = (lineNumber: number) => {
		const rightEditor = editorRightRef.current;
		if (!rightEditor) return;

		const content = rightEditor.getValue();
		const position = findSentencePosition(content, lineNumber);
		if (position) {
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

	const onChangeImported = useEffectEvent((data: any) => {
		WebgalParser.current = new data.default(
			() => {},
			(fileName: string) => fileName,
			[],
			data.SCRIPT_CONFIG
		);
		// 重新解析
		parseValue(currentText);
	});

	useEffect(() => {
		if (!urlString) return;
		setLoading(true);
		import(/* @vite-ignore */ urlString)
			.then((data) => {
				onChangeImported(data);
				setLoading(false);
			})
			.catch(() => {
				setLoading(false);
			});
	}, [urlString]); // eslint-disable-line

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
		if (!editorRef.current || loading) return;

		if (location) {
			onDidRef.current = editorRef.current.onDidChangeCursorPosition(
				(e) => locateInRightEditor(e.position.lineNumber)
			);
		} else {
			onDidRef.current?.dispose();
			onDidRef.current = null;
		}
		console.log(location);

		return () => {
			onDidRef.current?.dispose();
		};
	}, [location, loading]);

	useEffect(() => {
		setLoading(true);
		fetch(url)
			.then((res) => res.json())
			.then((data: IParserData) => {
				setParserList(data.versions);
				setVersion(data.tags.latest);
				setLoading(false);
				parseValue(currentText);
			});
	}, []); // eslint-disable-line

	return (
		<EditorContext.Provider
			value={{
				handleEditorDidMount,
				onChangeData,
				currentText,
				setCurrentText,
				parseDataString,
				editorRightRef
			}}
		>
			<Layout style={{ height: "100vh" }}>
				<HeaderContent
					loading={loading}
					version={version}
					itemsList={itemsList}
					parseTime={parseTime}
				/>
				{/* <TabsView /> */}
				<ContentView />
			</Layout>
		</EditorContext.Provider>
	);
}

export default App;
