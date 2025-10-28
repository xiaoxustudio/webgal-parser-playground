import type { Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { createContext, type RefObject } from "react";

export interface Context {
	handleEditorDidMount: (
		editor: monaco.editor.IStandaloneCodeEditor,
		monaco: Monaco
	) => void;
	onChangeData: (data: any) => void;
	currentText: string;
	setCurrentText: (data: any) => void;
	parseDataString: string;
	editorRightRef: RefObject<any>;
}

export const defaultContext: Context = {
	handleEditorDidMount: () => {},
	onChangeData: () => {},
	setCurrentText: () => {},
	currentText: "",
	parseDataString: "",
	editorRightRef: { current: null } as RefObject<any>
};

export const EditorContext = createContext(defaultContext);
