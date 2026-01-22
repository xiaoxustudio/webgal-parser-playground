import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import Layout from "antd/es/layout";
import ConfigProvider from "antd/es/config-provider";
import { theme as antdTheme } from "antd";
import * as monaco from "monaco-editor";

import { loader, type Monaco } from "@monaco-editor/react";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import {
	findSentenceEndLine,
	findSentencePosition,
	initMonaco
} from "./monoca";

import defaultTextString from "./assets/demo_zh_cn.txt?raw";
import HeaderContent from "./Header";
import useConfigStore from "./useConfig";
import type { IParserData } from "./interface";
import TabsView from "./Tabs";
import { EditorContext, type FileItem } from "./context";
import ContentView from "./Content";
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
	const { theme, location } = useConfigStore();

	// 文件与活动文件
	const [files, setFiles] = useState<FileItem[]>([
		{
			id: String(Date.now()),
			name: "main.txt",
			content: defaultTextString
		}
	]);
	const [activeId, setActiveId] = useState<string>(() =>
		files.length ? files[0].id : ""
	);
	const currentFile = useMemo(
		() => files.find((f) => f.id === activeId),
		[activeId, files]
	);
	const [currentText, setCurrentText] = useState(
		currentFile?.content || defaultTextString
	);
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
	const parseTimerRef = useRef<number | null>(null);

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
		editor.setValue(currentText);
	}

	function parseValue(val: string) {
		if (!WebgalParser.current) return;
		const startTime = performance.now();
		const p = WebgalParser.current.parse(
			val,
			currentFile?.name.replace(".txt", ""),
			currentFile?.name
		);
		setParserData(p);
		setParseTime(performance.now() - startTime);
	}

	function onChangeData(value: string) {
		setCurrentText(value);
		setFiles((prev) =>
			prev.map((f) => (f.id === activeId ? { ...f, content: value } : f))
		);
		if (parseTimerRef.current) {
			clearTimeout(parseTimerRef.current);
		}
		parseTimerRef.current = window.setTimeout(() => {
			parseValue(value);
			parseTimerRef.current = null;
		}, 150);
	}

	const addFile = () => {
		const newFile: FileItem = {
			id: String(Date.now()),
			name: `untitled-${(files.length + 1).toString()}.txt`,
			content: ""
		};
		setFiles((prev) => [...prev, newFile]);
		setActiveId(newFile.id);
		setCurrentText(newFile.content);
		parseValue(newFile.content);
	};

	const removeFile = (id: string) => {
		setFiles((prev) => {
			if (prev.length <= 1) return prev; // 保留至少一个文件
			const idx = prev.findIndex((f) => f.id === id);
			const next = prev.filter((f) => f.id !== id);
			// 如果删除的是当前文件，切换到相邻文件
			if (id === activeId) {
				const fallback = next[idx > 0 ? idx - 1 : 0] || {
					id: "",
					content: ""
				};
				setActiveId(fallback.id);
				setCurrentText(fallback.content || "");
				parseValue(fallback.content || "");
			}
			return next;
		});
	};

	const renameFile = (id: string, name: string) => {
		const safeName = name?.trim() || "untitled.txt";
		const ensureTxt = safeName.endsWith(".txt")
			? safeName
			: `${safeName}.txt`;
		setFiles((prev) =>
			prev.map((f) => (f.id === id ? { ...f, name: ensureTxt } : f))
		);
	};

	useEffect(() => {
		// 当活动文件改变时，同步编辑器内容并解析
		const active = files.find((f) => f.id === activeId);
		if (active) {
			setCurrentText(active.content);
			if (editorRef.current) {
				editorRef.current.setValue(active.content);
			}
			parseValue(active.content);
		}
	}, [activeId]); // eslint-disable-line

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
		<ConfigProvider
			theme={{
				components: {
					Button: {
						colorPrimary: "var(--webgal-playground-primary-color)"
					},
					Tabs: {
						colorPrimary: "var(--webgal-playground-primary-color)"
					},
					Input: {
						colorPrimary: "var(--webgal-playground-primary-color)"
					}
				}
			}}
		>
			<EditorContext.Provider
				value={{
					handleEditorDidMount,
					onChangeData,
					currentText,
					setCurrentText,
					parseDataString,
					editorRightRef,
					files,
					activeId,
					addFile,
					removeFile,
					setActiveId,
					renameFile
				}}
			>
			<ConfigProvider
				theme={{
					algorithm:
						theme === "dark"
							? antdTheme.darkAlgorithm
							: antdTheme.defaultAlgorithm
				}}
			>
				<Layout style={{ height: "100vh" }}>
					<HeaderContent
						loading={loading}
						version={version}
						itemsList={itemsList}
						parseTime={parseTime}
					/>
					<TabsView />
					<ContentView />
				</Layout>
			</ConfigProvider>
			</EditorContext.Provider>
		</ConfigProvider>
	);
}

export default App;
