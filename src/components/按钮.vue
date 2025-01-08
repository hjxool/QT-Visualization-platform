<template>
	<div class="button center" @mousedown="按下()" @mouseup="抬起()" :style="按钮样式()">
		<span class="文字" :style="文字样式()">{{ 文字内容() }}</span>
		<div class="bg_img" :style="按钮背景()"></div>
	</div>
</template>

<script setup lang="ts">
import { computed, defineProps, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { 发送指令, type 指令参数 } from '@/api/发送指令';
import { 功能 } from '@/store/main';

// 属性
const store = useStore();
const { 组件数据: data, 跳转子容器, 互锁, 切换激活, 页面名 } = defineProps(['组件数据', '跳转子容器', '互锁', '切换激活', '页面名']);
const 激活 = ref<boolean>(data.IsActive);
const 缩放比 = computed(() => store.getters.缩放比);
// 按钮组件生成时就查询自身绑定的跳转是主页面还是附页
let 跳转类型: string = 查询跳转页类型();
// 拦截 互锁状态变化
if (data.BtnEffect === '互锁') {
	watch(
		() => 互锁,
		(now: { 互锁组: string; 触发者: string }) => {
			// 修改同一互锁组的按钮激活状态
			if (now.互锁组 === data.Interlock) {
				switch (跳转类型) {
					case '附页':
						if (now.触发者 !== data.JumpToPage && 激活.value) {
							// 触发者 与 当前按钮跳转目标不同 且 当前处于激活状态
							激活.value = false;
						}
						break;
					case '不跳转':
						if (now.触发者 !== data.name && 激活.value) {
							激活.value = false;
						}
						break;
				}
			}
		}
	);
}
// 监听 通信数据变化
// 只有 自锁 互锁 按钮才监听数据回显
if (data.BtnEffect === '互锁' || data.BtnEffect === '自锁') {
	watch(
		() => store.state.通信数据,
		(now: { 类型: string; data: any }) => {
			if (now.类型 === '初始化') {
				let result = now.data['btn'].find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
				if (result) {
					激活.value = result.ispress == 1;
				}
			} else if (now.类型 === '更新') {
				// 先找是否存在于values中
				let result = now.data['values'].find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
				if (result) {
					// 存在 则取外层 ispress字段值
					激活.value = now.data['ispress'] == 1;
				}
			}
		}
	);
}

// 区分按钮功能类型
const 功能类型 = data.Data.split(';')[0];

// 文字类型去空格 分割成数组
data.FontStyle = data.FontStyle.replace(/\s+/g, '').split('+');

// 方法
function 按下() {
	// 区分是否自锁 自锁非激活只下发按下 抬起不下发 激活只在抬起时下发
	switch (功能类型) {
		case '130':
			// 表示双发按钮
			// 只要按下就进入激活状态
			激活.value = true;
			// 不论是否跳转都下发指令
			按钮指令(1);
			break;
		case '125':
			// 关闭所有附页
			激活.value = true;
			按钮指令(1);
			跳转子容器(data.JumpToPage, data.Interlock);
			break;
		default:
			// 其他为单发按钮
			switch (data.BtnEffect) {
				case '自锁':
					if (激活.value) {
						// 激活时 按下下发抬起指令
						激活.value = false;
						按钮指令(0);
					} else {
						// 非激活时 按下发送按下的指令
						激活.value = true;
						按钮指令(1);
					}
					break;
				case '互锁':
				default:
					激活.value = true;
					按钮指令(-1);
					break;
			}
			break;
	}
}
function 抬起() {
	switch (功能类型) {
		case '130':
			激活.value = false;
			按钮指令(0);
			break;
		case '125':
			激活.value = false;
			break;
		default:
			switch (data.BtnEffect) {
				case '自锁':
					break;
				case '互锁':
				default:
					switch (跳转类型) {
						case '主页面':
							激活.value = false;
							// 跳转主页 直接修改全局属性
							store.commit('获取主页面', data.JumpToPage);
							break;
						case '附页':
							// 跳转附页 向自身父组件发送消息 修改父组件的子容器
							// 给其他互锁按钮发送消息 取消其他按钮的激活状态
							跳转子容器(data.JumpToPage, data.Interlock);
							break;
						case '不跳转':
							// 不跳转 但有可能与其他按钮为互锁
							if (data.Interlock === 'NONE') {
								// 不跳转 且 没有互锁 抬起时还原
								激活.value = false;
							} else {
								// 存在互锁组 且 不跳转
								切换激活(data.Interlock, data.name);
							}
							break;
					}
					break;
			}
			break;
	}
}
function 查询跳转页类型(): string {
	if (!data.JumpToPage || data.JumpToPage === 'NONE') {
		return '不跳转';
	}
	// JSON.parse(store.state.源数据)
	let queue = [...store.state.组件树];
	while (queue.length) {
		let node = queue.shift();
		if (node.pagename === data.JumpToPage) {
			// 找到 返回结果
			// 注意 只有组件树最外层才是主页面 所以没有ismainpage字段就是附页
			return node.ismainpage ? '主页面' : '附页';
		}
		// 没找到 将子节点放入队列
		for (let val of node.data || []) {
			if (val.RectText === 'PAGECONTAINER') {
				queue.push(val);
			}
		}
	}
	return '不跳转';
}
function 按钮指令(arg: number) {
	let body: 指令参数 = {
		组件名: data.name,
		页面名,
		data: {},
		type: 'btn',
		ispress: arg,
	};
	if (data.Data.length) {
		let t = data.Data.split(';');
		switch (t[0]) {
			case 功能.切换轮播图:
				body.type = 'mutiimage';
				for (let val of store.state.依赖数据) {
					if (val.组件名 == t[2] && val.页面名 == t[1]) {
						// 当前按钮控的是 对应组件依赖
						// 根据加/减 操作依赖值
						if (t[3] == 1) {
							val.当前显示 < val.total - 1 && val.当前显示++;
						} else if (t[3] == 2) {
							val.当前显示 > 0 && val.当前显示--;
						} else if (t[3] == 0) {
							val.当前显示 = 0;
						}
						body.组件名 = t[2];
						body.页面名 = t[1];
						body.data.value = `${val.当前显示}`;
						break;
					}
				}
				break;
		}
	}
	setTimeout(() => {
		发送指令(body);
	}, data.LateTime * 1000);
}
function 按钮样式() {
	let style: any = {
		borderColor: 激活.value ? data.ActiveRectColor : data.RectColor,
		borderWidth: `${激活.value ? data.ActiveRectWidth : data.RectWidth}px`,
		borderStyle: 'solid',
	};
	return style;
}
function 按钮背景() {
	let style: any = {
		opacity: Math.round((data.ViseValue / 255) * 100) / 100,
	};
	switch (data.ButtonMode) {
		case '纯色':
			style['background'] = 激活.value ? data.ActiveGroundcolor : data.GroundColor;
			break;
		case '图片':
			if (激活.value) {
				// 激活
				if (data.ActivePictureName && data.ActivePictureName !== 'NONE') {
					style['backgroundImage'] = `url(/config/photos/${data.ActivePictureName})`;
				} else {
					style['background'] = data.ActiveGroundcolor;
				}
			} else {
				// 非激活
				if (data.PictureNme && data.PictureNme !== 'NONE') {
					style['backgroundImage'] = `url(/config/photos/${data.PictureNme})`;
				} else {
					style['background'] = data.GroundColor;
				}
			}
			break;
		case '双色水平渐变':
			if (激活.value) {
				style['background'] = `linear-gradient(to right, ${data.ActiveGroundcolor}, ${data.ActiveGroundcolor2})`;
			} else {
				style['background'] = `linear-gradient(to right, ${data.GroundColor}, ${data.GroundColor2})`;
			}
			break;
		case '双色垂直渐变':
			if (激活.value) {
				style['background'] = `linear-gradient(${data.ActiveGroundcolor}, ${data.ActiveGroundcolor2})`;
			} else {
				style['background'] = `linear-gradient(${data.GroundColor}, ${data.GroundColor2})`;
			}
			break;
	}
	return style;
}
function 文字样式() {
	let style: any = {
		color: 激活.value ? data.ActiveFontColor : data.FontColor,
		fontSize: `${data.FontSize * 缩放比.value.高度比}px`,
		fontFamily: data.FontFormat,
		letterSpacing: `${data.Spacing}px`,
	};
	if (data.FontDirection !== '横') {
		style['writingMode'] = 'vertical-lr';
		style['textOrientation'] = 'upright';
	}
	for (let val of data.FontStyle) {
		switch (val) {
			case '斜体':
				style['fontStyle'] = 'italic';
				break;
			case '粗体':
				style['fontWeight'] = 'bold';
				break;
			case '粗斜体':
				style['fontStyle'] = 'italic';
				style['fontWeight'] = 'bold';
				break;
			case '下划线':
				style['textDecoration'] = 'underline';
				break;
			case '删除线':
				style['textDecoration'] = 'line-through';
				break;
		}
	}
	return style;
}
function 文字内容() {
	if (激活.value) {
		return data.ActiveRectText || data.RectText;
	} else {
		return data.RectText;
	}
}
</script>

<style lang="less" scoped>
.文字 {
	position: relative;
}
.bg_img {
	background-size: 100% 100%;
	background-repeat: no-repeat;
}
</style>
