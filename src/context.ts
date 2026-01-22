import type { Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { createContext, type RefObject } from "react";

export interface FileItem {
	id: string;
	name: string;
	content: string;
}

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
	files: FileItem[];
	activeId: string;
	addFile: () => void;
	removeFile: (id: string) => void;
	setActiveId: (id: string) => void;
	renameFile: (id: string, name: string) => void;
}

export const defaultContext: Context = {
	handleEditorDidMount: () => {},
	onChangeData: () => {},
	setCurrentText: () => {},
	currentText: "",
	parseDataString: "",
	editorRightRef: { current: null } as RefObject<any>,
	files: [],
	activeId: "",
	addFile: () => {},
	removeFile: () => {},
	setActiveId: () => {},
	renameFile: () => {}
};

export const EditorContext = createContext(defaultContext);
