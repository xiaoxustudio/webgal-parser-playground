import type ISentence from "webgal-parser";
import { commandType } from "webgal-parser/build/types/interface/sceneInterface";

export enum fileType {
	background,
	bgm,
	figure,
	scene,
	tex,
	vocal,
	video
}
export interface IPerform {
	// 演出名称，用于在后面手动清除演出，如果没有标识，则代表不是保持演出，给予一个随机字符串
	performName: string;
	// 持续时间，单位为ms，持续时间到后自动回收演出
	duration: number;
	// 演出是不是一个保持类型的演出
	isHoldOn: boolean;
	// 卸载演出的函数
	stopFunction: () => void;
	// 演出是否阻塞游戏流程继续（一个函数，返回 boolean类型的结果，判断要不要阻塞）
	blockingNext: () => boolean;
	// 演出是否阻塞自动模式（一个函数，返回 boolean类型的结果，判断要不要阻塞）
	blockingAuto: () => boolean;
	// 自动回收使用的 Timeout
	stopTimeout: undefined | ReturnType<typeof setTimeout>;
	// 演出结束后转到下一句
	goNextWhenOver?: boolean;
	// 对于延迟触发的演出，使用 Promise
	arrangePerformPromise?: Promise<IPerform>;
	// 跳过由 nextSentence 函数引发的演出回收
	skipNextCollect?: boolean;
}

export type ScriptFunction = (sentence: ISentence) => IPerform;

export interface ScriptConfig {
	scriptType: commandType;
	scriptFunction: ScriptFunction;
	next?: boolean;
}

export interface IConfigInterface extends ScriptConfig {
	scriptString: string;
}

export const scriptRegistry: Record<commandType, IConfigInterface> =
	{} as Record<commandType, IConfigInterface>;

export function defineScripts<
	R extends Record<string, Omit<IConfigInterface, "scriptString">>
>(
	record: R
): {
	[K in keyof R]: IConfigInterface;
} {
	const result = {} as Record<keyof R, IConfigInterface>;
	for (const [scriptString, config] of Object.entries(record)) {
		result[scriptString as keyof R] = scriptRegistry[config.scriptType] = {
			scriptString,
			...config
		};
	}
	return result;
}

export function ScriptConfig(
	scriptType: commandType,
	scriptFunction: ScriptFunction,
	config?: Omit<ScriptConfig, "scriptType" | "scriptFunction">
): ScriptConfig {
	return { scriptType, scriptFunction, ...config };
}

const defaultFn = () => ({
	performName: "none",
	duration: 0,
	isHoldOn: false,
	stopFunction: () => {},
	blockingNext: () => false,
	blockingAuto: () => true,
	stopTimeout: undefined
});

export const SCRIPT_TAG_MAP = defineScripts({
	say: ScriptConfig(commandType.say, defaultFn),
	changeBg: ScriptConfig(commandType.changeBg, defaultFn),
	changeFigure: ScriptConfig(commandType.changeFigure, defaultFn),
	bgm: ScriptConfig(commandType.bgm, defaultFn, { next: true }),
	playVideo: ScriptConfig(commandType.video, defaultFn),
	pixiPerform: ScriptConfig(commandType.pixi, defaultFn, { next: true }),
	pixiInit: ScriptConfig(commandType.pixiInit, defaultFn, { next: true }),
	intro: ScriptConfig(commandType.intro, defaultFn),
	miniAvatar: ScriptConfig(commandType.miniAvatar, defaultFn, { next: true }),
	changeScene: ScriptConfig(commandType.changeScene, defaultFn),
	choose: ScriptConfig(commandType.choose, defaultFn),
	end: ScriptConfig(commandType.end, defaultFn),
	setComplexAnimation: ScriptConfig(
		commandType.setComplexAnimation,
		defaultFn
	),
	setFilter: ScriptConfig(commandType.setFilter, defaultFn),
	label: ScriptConfig(commandType.label, defaultFn, { next: true }),
	jumpLabel: ScriptConfig(commandType.jumpLabel, defaultFn),
	// chooseLabel: ScriptConfig(commandType.chooseLabel, undefined),
	setVar: ScriptConfig(commandType.setVar, defaultFn, { next: true }),
	// if: ScriptConfig(commandType.if, undefined, { next: true }),
	callScene: ScriptConfig(commandType.callScene, defaultFn),
	showVars: ScriptConfig(commandType.showVars, defaultFn),
	unlockCg: ScriptConfig(commandType.unlockCg, defaultFn, { next: true }),
	unlockBgm: ScriptConfig(commandType.unlockBgm, defaultFn, { next: true }),
	filmMode: ScriptConfig(commandType.filmMode, defaultFn, { next: true }),
	setTextbox: ScriptConfig(commandType.setTextbox, defaultFn),
	setAnimation: ScriptConfig(commandType.setAnimation, defaultFn),
	playEffect: ScriptConfig(commandType.playEffect, defaultFn, { next: true }),
	setTempAnimation: ScriptConfig(commandType.setTempAnimation, defaultFn),
	__commment: ScriptConfig(commandType.comment, defaultFn, { next: true }),
	setTransform: ScriptConfig(commandType.setTransform, defaultFn),
	setTransition: ScriptConfig(commandType.setTransition, defaultFn, {
		next: true
	}),
	getUserInput: ScriptConfig(commandType.getUserInput, defaultFn),
	applyStyle: ScriptConfig(commandType.applyStyle, defaultFn, { next: true }),
	wait: ScriptConfig(commandType.wait, defaultFn)
});
export const SCRIPT_CONFIG: IConfigInterface[] = Object.values(SCRIPT_TAG_MAP);
