<template>
	<div class="grid_box" :style="行间距()">
		<!-- 背景 -->
		<div class="bg_img" :style="{ opacity: data.ViewmatrixTranslate ? 0 : 1 }">
			<img v-if="data.BackGroundPicName != 'NONE'" class="背景" :src="`./config/photos/${data.BackGroundPicName}`" />
			<div v-else class="背景" :style="{ background: data.BackGroundColor }"></div>
		</div>
		<!-- 按钮IN -->
		<div class="grid" :style="列样式()">
			<div class="button center" v-for="item in IN" @click="点击('in', item)" :style="按钮样式('in', item)">
				<div class="bg_img" :style="按钮背景('in', item)"></div>
				<span>{{ item.label }}</span>
			</div>
		</div>
		<!-- 按钮OUT -->
		<div class="grid" :style="列样式()">
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
const INNum = ref(Number(data.Column));
const OUTNum = ref(Number(data.ViewmatrixColnum));
const reg = /\d+/g;
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
				for (let val of OUT.value) {
					val.激活 && (val.激活 = false);
				}
				// 字符串格式 in1-out2
				// 只找 IN1 下激活的OUT
				for (let val of 当前状态.激活序列) {
					let arr = val.match(reg);
					let in_num = Number(arr[0]);
					let out_num = Number(arr[1]);
					if (in_num == 当前状态.列) {
						OUT.value[out_num - 1].激活 = true;
					}
				}
			}
		} else if (now.类型 === '更新') {
			let result = now.data['values'].find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
			if (result) {
				// 字符串格式 in1-out2-on/off
				let arr = result.value.split('-');
				let in_num = Number(arr[0].match(reg)[0]);
				let out_num = Number(arr[1].match(reg)[0]);
				let 激活 = arr[2] == 'on';
				if (in_num == 当前状态.列) {
					// 只修改当前 IN 下的out
					OUT.value[out_num - 1].激活 = 激活;
				}
				// 更新当前状态
				let str = `in${in_num}-out${out_num}`;
				if (激活) {
					// 新按钮被激活 直接push
					当前状态.激活序列.push(str);
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
function 列样式() {
	// 上下行保持一致 取最长的边
	let total = Math.max(INNum.value, OUTNum.value);
	return {
		gap: `${data.Spacing}px`,
		gridTemplateColumns: `repeat(${total}, 1fr)`,
	};
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
	for (let i = 0; i < INNum.value; i++) {
		IN.value.push({
			label: data.ButtonInfo[i].name,
			列: i + 1, // in只能单选 由全局变量和列确定样式
		});
	}
	for (let o = INNum.value; o < OUTNum.value + INNum.value; o++) {
		OUT.value.push({
			label: data.ButtonInfo[o].name,
			列: o - INNum.value + 1,
			激活: false, // out可以多选 所以由按钮自身属性确定样式
		});
	}
	// 音视频 初始化 按in1-out1 in2-out2... 取短的一边
	let total = Math.min(INNum.value, OUTNum.value);
	for (let n = 1; n <= total; n++) {
		当前状态.激活序列.push(`in${n}-out${n}`);
	}
	OUT.value[0].激活 = true;
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
		// 音频 视频 读取IN下OUT激活状态
		for (let val of 当前状态.激活序列) {
			let arr = val.match(reg);
			let in_num = Number(arr[0]);
			let out_num = Number(arr[1]);
			if (in_num == 当前状态.列) {
				// 取同属一个IN的out
				OUT.value[out_num - 1].激活 = true;
			}
		}
	} else if (类型 == 'out') {
		// 点out时 区分音视频
		let str = `in${当前状态.列}-out${按钮.列}`;
		if (data.matrixType == '视频矩阵') {
			// 分两种情况 点击激活按钮 不执行操作
			// 点击非激活按钮 则激活 并取消激活同一个out的按钮
			if (按钮.激活) {
				return;
			} else {
				let 下发序列: string[] = [];
				// 找之前有没有同一out 将其移除 并添加到代发指令
				let index = 0;
				for (let val of 当前状态.激活序列) {
					let arr = val.split('-');
					let out_num = arr[1].match(reg)[0];
					if (按钮.列 == out_num) {
						// 同一行 且 激活状态
						下发序列.push(`${val}-off`);
						break;
					}
					index++;
				}
				// 当前按钮激活 存到代发指令
				下发序列.push(`${str}-on`);
				// 以新激活按钮字符串替换原位置字符串
				当前状态.激活序列.length != index && 当前状态.激活序列.splice(index, 1, str);
				按钮.激活 = true;
				下发指令(下发序列);
			}
		} else {
			// 音频
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
