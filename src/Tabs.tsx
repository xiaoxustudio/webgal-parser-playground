import type { TabsProps } from "antd/es/tabs";
import Tabs from "antd/es/tabs";

import { useState } from "react";

type TargetKey = React.MouseEvent | React.KeyboardEvent | string;

function TabsView() {
	const size = "small";

	const [activeKey, setActiveKey] = useState("1");
	const [items, setItems] = useState<TabsProps["items"]>([
		{
			label: "Tab 1",
			key: "1"
		}
	]);

	const add = () => {
		const newKey = String((items || []).length + 1);
		setItems([
			...(items || []),
			{
				label: `Tab ${newKey}`,
				key: newKey,
				children: `Content of editable tab ${newKey}`
			}
		]);
		setActiveKey(newKey);
	};

	const remove = (targetKey: TargetKey) => {
		if (!items) {
			return;
		}
		const targetIndex = items.findIndex((item) => item.key === targetKey);
		const newItems = items.filter((item) => item.key !== targetKey);

		if (newItems.length && targetKey === activeKey) {
			const newActiveKey =
				newItems[
					targetIndex === newItems.length
						? targetIndex - 1
						: targetIndex
				].key;
			setActiveKey(newActiveKey);
		}

		setItems(newItems);
	};

	const onEdit = (targetKey: TargetKey, action: "add" | "remove") => {
		if (action === "add") {
			add();
		} else {
			remove(targetKey);
		}
	};

	return (
		<Tabs
			type="editable-card"
			size={size}
			activeKey={activeKey}
			onChange={setActiveKey}
			onEdit={onEdit}
			items={items}
		/>
	);
}
export default TabsView;
