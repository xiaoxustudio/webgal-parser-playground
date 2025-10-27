import * as monaco from "monaco-editor";
import type { Monaco } from "@monaco-editor/react";
import whiteTheme from "./assets/white.json";
import darkTheme from "./assets/dark.json";
import { loadWASM, OnigScanner, OnigString } from "vscode-oniguruma";
import { Registry, type IRawGrammar, INITIAL } from "vscode-textmate";
import webgalTextHL from "./assets/hl.json";

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
