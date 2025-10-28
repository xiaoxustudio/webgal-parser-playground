import { Editor } from "@monaco-editor/react";
import { Content } from "antd/es/layout/layout";
import Splitter from "antd/es/splitter";
import { EditorContext } from "./context";
import { useContext } from "react";

function ContentView() {
	const {
		parseDataString,
		currentText,
		editorRightRef,
		handleEditorDidMount,
		onChangeData
	} = useContext(EditorContext);
	return (
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
						defaultValue={currentText}
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
						onMount={(editor) => (editorRightRef.current = editor)}
						defaultLanguage="json"
						language="json"
						value={parseDataString}
						height="100%"
						width="100%"
					/>
				</Content>
			</Splitter.Panel>
		</Splitter>
	);
}

export default ContentView;
