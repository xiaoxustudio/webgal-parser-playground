import useConfigStore from "./useConfig";

type TranslationKey =
	| "time_cost"
	| "locate"
	| "parser_version"
	| "loading"
	| "share_link"
	| "toggle_theme"
	| "open_github"
	| "language"
	| "share_copied"
	| "share_failed";

type Translations = Record<TranslationKey, string>;

const en: Translations = {
	time_cost: "Time: ",
	locate: "Locate",
	parser_version: "Parser Version: ",
	loading: "Loading",
	share_link: "Share Link",
	toggle_theme: "Toggle Theme",
	open_github: "Open GitHub",
	language: "Language",
	share_copied: "Share link copied",
	share_failed: "Failed to generate share link"
};

const zh: Translations = {
	time_cost: "耗时:",
	locate: "定位",
	parser_version: "解析器版本：",
	loading: "加载中",
	share_link: "分享链接",
	toggle_theme: "切换主题",
	open_github: "打开 GitHub",
	language: "语言",
	share_copied: "分享链接已复制到剪贴板",
	share_failed: "生成分享链接失败"
};

const translations: Record<string, Partial<Translations>> = {
	en,
	zh
};

const localeNames: Record<string, string> = {
	en: "English",
	zh: "中文"
};

export function t(key: TranslationKey): string {
	const { locale } = useConfigStore.getState();
	return translations[locale]?.[key] ?? translations.en[key] ?? key;
}

export function registerLocale(
	locale: string,
	dict: Partial<Translations>,
	name?: string
): void {
	translations[locale] = { ...(translations[locale] || {}), ...dict };
	if (name) {
		localeNames[locale] = name;
	}
}

export function getLocales(): string[] {
	return Object.keys(translations);
}

export function getLocaleName(locale: string): string {
	return localeNames[locale] || locale;
}
