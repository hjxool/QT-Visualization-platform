<template>
	<div class="grid_box" :style="行间距()">
		<!-- 背景 -->
		<div class="bg_img" :style="{ opacity: data.ViewmatrixTranslate ? 0 : 1 }">
			<img v-if="data.BackGroundPicName != 'NONE'" class="背景" :src="`/config/photos/${data.BackGroundPicName}`" />
			<div v-else class="背景" :style="{ background: data.BackGroundColor }"></div>
		</div>
		<!-- 按钮IN -->
		<div class="grid" :style="列样式('in')">
			<div class="button center" v-for="item in IN" @click="点击('in', item)" :style="按钮样式('in', item)">
				<div class="bg_img" :style="按钮背景('in', item)"></div>
				<span>{{ item.label }}</span>
			</div>
		</div>
		<!-- 按钮OUT -->
		<div class="grid" :style="列样式('out')">
			<div class="button center" v-for="item in OUT" @click="点击('out', item)" :style="按钮样式('out', item)">
				<div class="bg_img" :style="按钮背景('out', item)"></div>
				<span>{{ item.label }}</span>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { 发送指令 } from '@/api/发送指令';
import { 矩阵元素 as Btn } from './按钮矩阵-样式一.vue';

// 属性
const store = useStore();
const { 组件数据: data, 页面名 } = defineProps(['组件数据', '页面名']);
const 缩放比 = computed(() => store.getters.缩放比);

const IN = ref<Btn[]>([]);
const OUT = ref<Btn[]>([]);
const 当前状态 = reactive<any>({
	列: 1, // 默认激活in1
	激活序列: [],
});
初始化();

watch(
	() => store.state.通信数据,
	(now: { 类型: string; data: any }) => {
		if (now.类型 === '初始化') {
			let result = now.data['matrix'].find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
			if (result) {
				当前状态.激活序列 = result.matrixvalues;
				let reg = /\d+/g;
				// 字符串格式 in1-out2
				if (data.matrixType == '视频矩阵') {
					// 视频 才找对应IN 以及 IN下OUT 激活
					for (let val of 当前状态.激活序列) {
						let arr = val.match(reg);
						当前状态.列 = Number(arr[0]);
						let out_num = Number(arr[1]);
						OUT.value[out_num - 1].激活 = true;
					}
				} else {
					// 音频 只找 IN1 下激活的OUT
					for (let val of 当前状态.激活序列) {
						let arr = val.match(reg);
						let in_num = Number(arr[0]);
						let out_num = Number(arr[1]);
						if (in_num == 1) {
							OUT.value[out_num - 1].激活 = true;
						}
					}
				}
			}
		} else if (now.类型 === '更新') {
			let result = now.data['values'].find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
			if (result) {
				// 字符串格式 in1-out2-on/off
				let reg = /\d+/g;
				let arr = result.value.split('-');
				let in_num = Number(arr[0].match(reg)[0]);
				let out_num = Number(arr[1].match(reg)[0]);
				let 激活 = arr[2] == 'on';
				if (data.matrixType == '视频矩阵' || in_num == 当前状态.列) {
					// 视频 或 音频只修改当前 IN 下的out
					OUT.value[out_num - 1].激活 = 激活;
				}
				// 更新当前状态
				let str = `in${in_num}-out${out_num}`;
				if (激活) {
					// 新按钮被激活
					if (data.matrixType == '视频矩阵' && in_num != 当前状态.列) {
						// 视频 且 不同 IN 按钮被激活 则重置序列
						当前状态.列 = in_num;
						当前状态.激活序列 = [str];
					} else {
						// 当前 IN 有新的激活按钮 则直接push
						当前状态.激活序列.push(str);
					}
				} else {
					// 旧按钮被取消激活
					let index = 当前状态.激活序列.indexOf(str);
					当前状态.激活序列.splice(index, 1);
					if (当前状态.激活序列.length == 0) {
						当前状态.列 = 0;
					}
				}
			}
		}
	}
);

// 方法
function 行间距() {
	return {
		gap: `${data.Spacing}px`,
		padding: `${data.UpSpacing}px ${data.RightSpacing}px ${data.DownSpacing}px ${data.LeftSpacing}px`,
	};
}
function 列样式(类型: string) {
	let style: any = {
		gap: `${data.Spacing}px`,
	};
	switch (类型) {
		case 'in':
			style['gridTemplateColumns'] = `repeat(${data.Column}, 1fr)`;
			break;
		case 'out':
			style['gridTemplateColumns'] = `repeat(${data.ViewmatrixColnum}, 1fr)`;
			break;
	}
	return style;
}
function 按钮样式(类型: string, 按钮: any) {
	let flag: boolean;
	switch (类型) {
		case 'in':
			flag = 按钮.列 == 当前状态.列;
			break;
		case 'out':
			flag = 按钮.激活;
			break;
	}
	return {
		fontSize: `${data.FontSize * 缩放比.value.高度比}px`,
		borderWidth: `${data.RectWidth}px`,
		borderStyle: 'solid',
		borderColor: flag! ? data.ActiveRectColor : data.RectColor,
		color: flag! ? data.ActiveFontColor : data.FontColor,
	};
}
function 按钮背景(类型: string, 按钮: any) {
	let style: any = {
		opacity: Math.round((data.ViseValue / 255) * 100) / 100,
	};
	let flag: boolean;
	switch (类型) {
		case 'in':
			flag = 按钮.列 == 当前状态.列;
			break;
		case 'out':
			flag = 按钮.激活;
			break;
	}
	switch (data.ButtonMode) {
		case '纯色':
			style['background'] = flag! ? data.ActiveGroundcolor : data.GroundColor;
			break;
		case '图片':
			if (flag!) {
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
			if (flag!) {
				style['background'] = `linear-gradient(to right, ${data.ActiveGroundcolor}, ${data.ActiveGroundcolor2})`;
			} else {
				style['background'] = `linear-gradient(to right, ${data.GroundColor}, ${data.GroundColor2})`;
			}
			break;
		case '双色垂直渐变':
			if (flag!) {
				style['background'] = `linear-gradient(${data.ActiveGroundcolor}, ${data.ActiveGroundcolor2})`;
			} else {
				style['background'] = `linear-gradient(${data.GroundColor}, ${data.GroundColor2})`;
			}
			break;
	}
	return style;
}
function 初始化() {
	for (let i = 0; i < data.Column; i++) {
		IN.value.push({
			label: data.ButtonInfo[i].name,
			列: i + 1, // in只能单选 由全局变量和列确定样式
		});
	}
	for (let o = data.Column; o < data.ViewmatrixColnum + data.Column; o++) {
		OUT.value.push({
			label: data.ButtonInfo[o].name,
			列: o - data.Column + 1,
			激活: false, // out可以多选 所以由按钮自身属性确定样式
		});
	}
}
function 点击(类型: string, 按钮: any) {
	if (类型 == 'in') {
		// 点同一个in不执行操作
		if (按钮.列 == 当前状态.列) return;
		// 不同列 则重置out状态
		for (let btn of OUT.value) {
			btn.激活 = false;
		}
		// 更新当前状态
		当前状态.列 = 按钮.列;
		if (data.matrixType == '视频矩阵') {
			// 群发 之前激活序列的off指令
			let 下发序列 = 当前状态.激活序列.map((e: any) => `${e}-off`);
			// 因为之前的都off 所以清空激活序列
			当前状态.激活序列 = [];
			下发指令(下发序列);
		} else {
			// 音频 则读取IN下OUT激活状态
			let reg = /\d+/g;
			for (let val of 当前状态.激活序列) {
				let arr = val.match(reg);
				let in_num = Number(arr[0]);
				let out_num = Number(arr[1]);
				if (in_num == 当前状态.列) {
					// 取同属一个IN的out
					OUT.value[out_num - 1].激活 = true;
				}
			}
		}
	} else if (类型 == 'out') {
		let str = `in${当前状态.列}-out${按钮.列}`;
		// 点out才下发指令并同步
		按钮.激活 = !按钮.激活;
		if (按钮.激活) {
			// 之前为false 则添加到激活数组
			当前状态.激活序列.push(str);
		} else {
			// 之前是true 则从激活数组中移除
			let index = 当前状态.激活序列.indexOf(str);
			当前状态.激活序列.splice(index, 1);
		}
		// 单发 当前按钮状态
		下发指令([`${str}-${按钮.激活 ? 'on' : 'off'}`]);
	}
}
function 下发指令(下发序列: string[]) {
	for (let val of 下发序列) {
		发送指令({
			组件名: data.name,
			页面名,
			data: {
				value: val,
				matrixvalues: 当前状态.激活序列,
			},
			type: 'matrix',
			ispress: -1,
		});
	}
}
</script>

<style lang="less" scoped>
.grid_box {
	display: grid;
	grid-template-rows: 1fr 1fr; // 固定两行
	grid-template-columns: 100%;
	> .grid {
		display: grid;
		grid-template-rows: 100%;
	}
}
.button {
	overflow: hidden;
	> .bg_img {
		background-size: 100% 100%;
		background-repeat: no-repeat;
	}
}
.背景 {
	width: 100%;
	height: 100%;
}
</style>
