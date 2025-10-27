import * as monaco from "monaco-editor";
import type { Monaco } from "@monaco-editor/react";
import whiteTheme from "./assets/white.json";
import darkTheme from "./assets/dark.json";
import { loadWASM, OnigScanner, OnigString } from "vscode-oniguruma";
import { Registry, type IRawGrammar, INITIAL } from "vscode-textmate";
import webgalTextHL from "./assets/hl.json";

/**
 * 在右侧的 JSON 字符串中，根据句子索引找到其起始位置。
 * 此版本适配了包含 "sentenceList" 数组的 JSON 结构。
 * @param content 右侧编辑器的完整 JSON 字符串。
 * @param index 左侧编辑器的句子索引（从0开始）。
 * @returns Monaco Editor 的 IPosition 对象，如果找不到则返回 null。
 */
export const findSentencePosition = (
	content: string,
	lineNumber: number
): monaco.IPosition | null => {
	try {
		const data = JSON.parse(content);

		if (
			!data.sentenceList ||
			!Array.isArray(data.sentenceList) ||
			lineNumber < 1
		) {
			return null;
		}

		// 将整个 sentenceList 数组转换为格式化的字符串
		const sentenceListStr = JSON.stringify(data.sentenceList, null, 2);

		// 在原始内容中找到 "sentenceList" 的位置
		const sentenceListPos = content.indexOf('"sentenceList"');
		if (sentenceListPos === -1) {
			return null;
		}

		// 计算 sentenceList 在原始内容中的起始行
		const beforeSentenceList = content.substring(0, sentenceListPos);
		const baseLine = beforeSentenceList.split("\n").length;

		// 将 sentenceList 字符串按行分割
		const sentenceListLines = sentenceListStr.split("\n");

		// 查找包含 "commandRaw" 的行，并计算对应的句子索引
		let commandLineIndex = -1;
		let sentenceIndex = -1;

		for (let i = 0; i < sentenceListLines.length; i++) {
			if (sentenceListLines[i].includes('"commandRaw"')) {
				sentenceIndex++;
				if (sentenceIndex === lineNumber - 1) {
					commandLineIndex = i;
					break;
				}
			}
		}

		if (commandLineIndex === -1) {
			return null;
		}

		// 计算目标句子的最终行号
		const finalLineNumber = baseLine + commandLineIndex + 1; // +1 因为 sentenceList 行本身

		return { lineNumber: finalLineNumber, column: 1 };
	} catch (e) {
		console.error("Failed to parse JSON or find position:", e);
		return null;
	}
};

/**
 * 在右侧的 JSON 字符串中，找到一个对象的结束行。
 * @param content 右侧编辑器的完整 JSON 字符串。
 * @param startLine 对象的起始行号（从1开始）。
 * @returns 对象的结束行号（从1开始）。
 */
export const findSentenceEndLine = (
	content: string,
	startLine: number
): number => {
	const lines = content.split("\n");

	if (startLine < 1 || startLine > lines.length) {
		return lines.length;
	}

	const startLineContent = lines[startLine - 1];
	const startIndent = startLineContent.search(/\S/);

	for (let i = startLine; i < lines.length; i++) {
		const line = lines[i];
		const currentIndent = line.search(/\S/);

		if (line.includes("}") && currentIndent <= startIndent) {
			return i + 1;
		}
	}

	return lines.length;
};

export async function initMonaco(
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
