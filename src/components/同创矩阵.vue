<template>
	<div class="grid" :style="栅格布局()">
		<!-- 背景 -->
		<div class="bg_img" :style="{ opacity: data.ViewmatrixTranslate ? 0 : 1 }">
			<img v-if="data.BackGroundPicName != 'NONE'" class="背景" :src="`./config/photos/${data.BackGroundPicName}`" />
			<div v-else class="背景" :style="{ background: data.BackGroundColor }"></div>
		</div>
		<!-- 按钮 -->
		<div :class="能否点击(item)" v-for="item in 矩阵" @click="点击(item)" :style="按钮样式(item)">
			<div v-if="item.id" class="bg_img" :style="按钮背景(item)"></div>

			<span>{{ item.label }}</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { 发送指令 } from '@/api/发送指令';

// 属性
const store = useStore();
const { 组件数据: data, 页面名 } = defineProps(['组件数据', '页面名']);
const 缩放比 = computed(() => store.getters.缩放比);
const reg = /\d+/g;

export interface 矩阵元素 {
	label: string;
	// 标签没有以下属性
	id?: number;
	列?: number; // 行和列从1开始计数
	行?: number; // 因为是可选属性 在取值运算时 要用as类型断言或!非空断言 才不会报错
	激活?: boolean;
}
const 矩阵 = ref<矩阵元素[]>([]);
const INNum = ref(Number(data.Column));
const OUTNum = ref(Number(data.Row));
let 当前状态: any = {
	激活序列: [],
};
初始化();

// 回显
watch(
	() => store.state.通信数据,
	(now: { 类型: string; data: any }) => {
		if (now.类型 === '初始化') {
			let result = now.data['tcmatrix']?.find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
			if (result) {
				当前状态.激活序列 = result.matrixvalues;
				// 接收到初始化数据时要清空 状态
				for (let val of 矩阵.value) {
					if (val.id && val.激活) {
						val.激活 = false;
					}
				}
				// 初始化时 状态都是false 直接计算索引 修改对应按钮状态即可
				// 字符串格式 in1-out2
				for (let val of 当前状态.激活序列) {
					let arr = val.match(reg);
					let 列 = Number(arr[0]);
					let 行 = Number(arr[1]);
					let id = 列 + INNum.value * (行 - 1);
					let index = id - 1;
					if (data.IsLabelShow) {
						// 如果开启标签 则索引要加上抬头的列数 且 每一行多一个
						index += INNum.value + 1 + 行;
					}
					矩阵.value[index].激活 = true;
				}
			}
		} else if (now.类型 === '更新') {
			let result = now.data['values']?.find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
			if (result) {
				// 字符串格式 in1-out2-on/off
				let arr = result.value.split('-');
				let 列 = Number(arr[0].match(reg)[0]);
				let 行 = Number(arr[1].match(reg)[0]);
				let 激活 = arr[2] == 'on';
				let id = 列 + INNum.value * (行 - 1);
				let index = id - 1;
				if (data.IsLabelShow) {
					index += INNum.value + 1 + 行;
				}
				矩阵.value[index].激活 = 激活;
				// 更新当前状态
				let str = `in${列}-out${行}`;
				if (激活) {
					// 新按钮被激活 则添加到激活列表
					当前状态.激活序列.indexOf(str) == -1 && 当前状态.激活序列.push(str);
				} else {
					// 旧按钮被取消激活
					let index = 当前状态.激活序列.indexOf(str);
					当前状态.激活序列.splice(index, 1);
				}
			}
		}
	}
);

// 方法
function 栅格布局() {
	return {
		gridTemplateColumns: `repeat(${data.IsLabelShow ? INNum.value + 1 : INNum.value}, 1fr)`,
		gridTemplateRows: `repeat(${data.IsLabelShow ? OUTNum.value + 1 : OUTNum.value}, 1fr)`,
		gap: `${data.Spacing}px`,
		padding: `${data.UpSpacing}px ${data.RightSpacing}px ${data.DownSpacing}px ${data.LeftSpacing}px`,
	};
}
function 按钮样式(按钮: any) {
	// 标签只应用文字样式
	let style: any = {
		fontSize: `${data.FontSize * 缩放比.value.高度比}px`,
	};
	if (按钮.id) {
		style['borderColor'] = 按钮.激活 ? data.ActiveRectColor : data.RectColor;
		style['borderWidth'] = `${data.RectWidth}px`;
		style['borderStyle'] = 'solid';
		style['color'] = 按钮.激活 ? data.ActiveFontColor : data.FontColor;
	} else {
		style['color'] = data.FontColor;
	}
	return style;
}
function 按钮背景(按钮: any) {
	let style: any = {
		opacity: Math.round((data.ViseValue / 255) * 100) / 100,
	};
	switch (data.ButtonMode) {
		case '纯色':
			style['background'] = 按钮.激活 ? data.ActiveGroundcolor : data.GroundColor;
			break;
		case '图片':
			if (按钮.激活) {
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
			if (按钮.激活) {
				style['background'] = `linear-gradient(to right, ${data.ActiveGroundcolor}, ${data.ActiveGroundcolor2})`;
			} else {
				style['background'] = `linear-gradient(to right, ${data.GroundColor}, ${data.GroundColor2})`;
			}
			break;
		case '双色垂直渐变':
			if (按钮.激活) {
				style['background'] = `linear-gradient(${data.ActiveGroundcolor}, ${data.ActiveGroundcolor2})`;
			} else {
				style['background'] = `linear-gradient(${data.GroundColor}, ${data.GroundColor2})`;
			}
			break;
	}
	return style;
}
function 点击(按钮: any) {
	// 非按钮 不往下执行
	if (!按钮.id) return;
	let str = `in${按钮.列}-out${按钮.行}`;
	// 音频 可以多进多出 则传入按钮激活状态取反
	按钮.激活 = !按钮.激活;
	if (按钮.激活) {
		// 之前是false 则添加到激活数组
		当前状态.激活序列.push(str);
	} else {
		// 之前是true 则从激活数组中移除
		let index = 当前状态.激活序列.indexOf(str);
		当前状态.激活序列.splice(index, 1);
	}
	下发指令([`in${按钮.列}-out${按钮.行}-${按钮.激活 ? 'on' : 'off'}`]);
}
function 能否点击(按钮: any) {
	let arr: string[] = ['center'];
	// 存在id属性说明不是标签
	按钮.id && arr.push('button');
	return arr;
}
function 初始化() {
	let total = Math.min(INNum.value, OUTNum.value);
	if (data.IsLabelShow) {
		// 显示标签 加一行一列
		// 行列标签相交的地方有一个为空的位置
		矩阵.value = [
			{
				label: '',
			},
		];
		// 先构造抬头标签
		for (let col = 1; col <= INNum.value; col++) {
			矩阵.value.push({
				label: `IN${col}`,
			});
		}
		// 再一行一行构造
		for (let row = 1; row <= OUTNum.value; row++) {
			矩阵.value.push({
				label: `OUT${row}`,
			});
			for (let col = 1; col <= INNum.value; col++) {
				// 由计算列公式反推 列 + 总列数 x (行 - 1)
				let id = col + INNum.value * (row - 1);
				let 元素 = data.ButtonInfo[id - 1];
				矩阵.value.push({
					label: 元素.name,
					id: 元素.id,
					行: row,
					列: col,
					激活: false,
				});
			}
		}
		// 显示标签计算公式 (列 - 1) + (行 - 1) x in通道数 + (in通道数 + 1) + 行
		// 又因为是沿斜线 因此行 = 列 简化公式 n x (in通道数 + 2)
		for (let n = 1; n <= total; n++) {
			let index = n * (INNum.value + 2);
			矩阵.value[index].激活 = true;
			当前状态.激活序列.push(`in${n}-out${n}`);
		}
	} else {
		// 不显示标签 则根据行列构造
		// 注意 矩阵内按钮可能并不填充满
		矩阵.value = data.ButtonInfo.map((e: any) => {
			let btn: 矩阵元素 = {
				label: e.name,
				id: e.id,
				// 行 由除法得到(因为一列铺满 行数才能增加)
				// id从1开始 所以向上取整
				行: Math.ceil(e.id / INNum.value),
				激活: false,
			};
			// 列 由减法得到(以前几行行的元素数量为 基准 减去基准值得到当前列)
			btn['列'] = e.id - INNum.value * (btn.行! - 1);
			return btn;
		});
		// 不显示标签计算公式 (列 - 1) + (行 - 1) x in通道数 + in通道数 + 行
		// 又因为是沿斜线 因此行 = 列 简化公式 n x (in通道数 + 1)
		for (let n = 0; n < total; n++) {
			let index = n * (INNum.value + 1);
			矩阵.value[index].激活 = true;
			当前状态.激活序列.push(`in${n + 1}-out${n + 1}`);
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
			type: 'tcmatrix',
			ispress: -1,
		});
	}
}
</script>

<style lang="less" scoped>
.grid {
	display: grid;
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
