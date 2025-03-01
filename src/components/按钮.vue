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
						// 不跳转的取消激活时 要下发取消指令 激活指令已经在点下时下发了
						if (now.触发者 !== data.name && 激活.value) {
							激活.value = false;
							按钮指令(0);
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

const 绑定组件列表 = ref<any[]>([]);
初始化();

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
					激活.value = true;
					switch (跳转类型) {
						case '不跳转':
							按钮指令(1);
							break;
						case '主页面':
						case '附页':
							按钮指令(-1);
							break;
					}
					break;
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
	// 可能有多个指令下发
	let 指令list: 指令参数[] = [];
	if (绑定组件列表.value.length) {
		switch (绑定组件列表.value[0].功能类型) {
			case 功能.切换轮播图:
				for (let val of 绑定组件列表.value) {
					if (val.控制标识 == 1) {
						val.依赖组件.当前显示 < val.依赖组件.total - 1 ? val.依赖组件.当前显示++ : (val.依赖组件.当前显示 = 0);
					} else if (val.控制标识 == 2) {
						val.依赖组件.当前显示 > 0 ? val.依赖组件.当前显示-- : (val.依赖组件.当前显示 = val.依赖组件.total - 1);
					} else if (val.控制标识 == 0) {
						val.依赖组件.当前显示 = 0;
					}
					指令list.push({
						组件名: val.依赖组件.组件名,
						页面名: val.依赖组件.页面名,
						data: {
							value: `${val.依赖组件.当前显示}`,
						},
						type: val.type,
						ispress: arg,
					});
				}
				break;
		}
	} else {
		// 没有修改body 则按默认值下发
		指令list.push({
			组件名: data.name,
			页面名,
			data: {},
			type: 'btn',
			ispress: arg,
		});
	}
	setTimeout(() => {
		for (let val of 指令list) {
			发送指令(val);
		}
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
					style['backgroundImage'] = `url(./config/photos/${data.ActivePictureName})`;
				} else {
					style['background'] = data.ActiveGroundcolor;
				}
			} else {
				// 非激活
				if (data.PictureNme && data.PictureNme !== 'NONE') {
					style['backgroundImage'] = `url(./config/photos/${data.PictureNme})`;
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
function 初始化() {
	if (data.ButtonMode == '图片') {
		let reg = /\s/g; // 匹配空格 每个空格替换为%20
		if (data.ActivePictureName !== 'NONE') {
			// backgroundImage 的url中如果有空格 不会像 img标签一样添加转义字符 会导致名称不符
			data.ActivePictureName = data.ActivePictureName.replace(reg, '%20');
		}
		if (data.PictureNme !== 'NONE') {
			data.PictureNme = data.PictureNme.replace(reg, '%20');
		}
	}
	if (data.Data.length) {
		let t = data.Data.split(';');
		switch (t[0]) {
			case 功能.切换轮播图:
				// 去掉头尾 中间部分是组件列表
				t.shift();
				let 控制标识 = t.pop();
				let 组件名list = t;
				for (let val of store.state.依赖数据) {
					// 一个按钮可能控制多个轮播
					for (let 组件及页面 of 组件名list) {
						let [页面名, 组件名] = 组件及页面.split(',');
						if (val.页面名 == 页面名 && val.组件名 == 组件名) {
							// 当前按钮控的是 对应组件依赖
							// 根据加/减 操作依赖值
							绑定组件列表.value.push({
								依赖组件: val, // 保留父级地址
								type: 'mutiimage',
								控制标识,
								功能类型: 功能.切换轮播图,
							});
							break;
						}
					}
				}
				break;
		}
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
