import type { TabsProps } from "antd/es/tabs";
import Tabs from "antd/es/tabs";
import Input from "antd/es/input";
import { useContext, useMemo, useState, useCallback } from "react";
import { EditorContext } from "./context";
import darkTheme from "./assets/dark.json";
import whiteTheme from "./assets/white.json";
import useConfigStore from "./useConfig";

type TargetKey = React.MouseEvent | React.KeyboardEvent | string;

function TabsView() {
	const { files, activeId, addFile, removeFile, setActiveId, renameFile } =
		useContext(EditorContext);
	const { theme } = useConfigStore();
	const editorBg =
		theme === "dark"
			? (darkTheme as any).colors["editor.background"]
			: (whiteTheme as any).colors["editor.background"];

	const [editingId, setEditingId] = useState<string>("");
	const [editingName, setEditingName] = useState<string>("");

	const startEdit = useCallback((id: string, name: string) => {
		setEditingId(id);
		setEditingName(name);
	}, []);

	const commitEdit = useCallback(() => {
		if (!editingId) return;
		renameFile(editingId, editingName);
		setEditingId("");
		setEditingName("");
	}, [editingId, editingName, renameFile]);

	const cancelEdit = useCallback(() => {
		setEditingId("");
		setEditingName("");
	}, []);

	const items = useMemo<TabsProps["items"]>(
		() =>
			files.map((f) => ({
				label:
					editingId === f.id ? (
						<Input
							size="small"
							autoFocus
							value={editingName}
							onChange={(e) => setEditingName(e.target.value)}
							onBlur={commitEdit}
							onPressEnter={commitEdit}
							onKeyDown={(e) => {
								if (e.key === "Escape") cancelEdit();
							}}
							onClick={(e) => e.stopPropagation()}
						/>
					) : (
						<span
							style={{ userSelect: "none" }}
							onDoubleClick={() => startEdit(f.id, f.name)}
						>
							{f.name}
						</span>
					),
				key: f.id,
				closable: true
			})),
		[files, editingId, editingName, startEdit, commitEdit, cancelEdit]
	);

	const onEdit = (targetKey: TargetKey, action: "add" | "remove") => {
		if (action === "add") {
			addFile();
		} else {
			removeFile(String(targetKey));
		}
	};

	return (
		<Tabs
			style={{ background: editorBg }}
			type="editable-card"
			size="small"
			activeKey={activeId}
			onChange={setActiveId}
			onEdit={onEdit}
			items={items}
		/>
	);
}
export default TabsView;
