<template>
	<div class="grid" :style="栅格布局()">
		<!-- 背景 -->
		<img v-if="data.ActivePictureName_base != 'NONE'" class="bg_img" :src="data.BackGroundPicName_base" />
		<div v-else class="bg_img" :style="{ background: data.BackGroundColor }"></div>
		<!-- 按钮 -->
		<div class="button center" v-for="item in data.ButtonCount" @click="点击(item)" :style="按钮样式(item)">
			<div class="bg_img" :style="按钮背景(data.ButtonMode, item)"></div>

			<span>{{ item }}</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useStore } from 'vuex';

// 属性
const store = useStore();
const { 组件数据: data, 页面名 } = defineProps(['组件数据', '页面名']);
// 创建一个对象 将其地址传入 依赖收集
// 这样在修改里面的值时 依赖数据也会跟着变
// const 依赖数据: 依赖数据格式 = {
// 	激活序列: ref<number[]>([]), // 这里需要响应式 更新时 触发:style上的方法
// };
const 缩放比 = computed(() => store.getters.缩放比);
// 当前组件执行初始化时 已经存在于依赖数据 将其找到并在组件中响应式使用
// 注意 这里必须要保留父级编辑激活序列 否则直接替换序列会丢失响应式
let target = store.state.依赖数据.find((e: any) => e.组件名 == data.name && e.页面名 == 页面名);
// 没有找到target 为了不影响使用自己构造
if (!target) {
	target = reactive({
		组件名: data.name,
		页面名,
		激活序列: [],
		是否为输入端: data.IsIput,
		采集者: '',
		采集者所在页面: '',
	});
}
// let reg = /^data\:image\/png\;base64\,/;
// if (data.BackGroundPicName_base !== 'NONE' && !reg.test(data.BackGroundPicName_base)) {
// 	data.BackGroundPicName_base = `data:image/png;base64,${data.BackGroundPicName_base}`;
// }
// if (data.ButtonMode == '图片') {
// 	if (data.ActivePictureName_base !== 'NONE' && !reg.test(data.ActivePictureName_base)) {
// 		data.ActivePictureName_base = `data:image/png;base64,${data.ActivePictureName_base}`;
// 	}
// 	if (data.PictureNme_base !== 'NONE' && !reg.test(data.PictureNme_base)) {
// 		data.PictureNme_base = `data:image/png;base64,${data.PictureNme_base}`;
// 	}
// }

// 只有输入矩阵能接收到数据上报 然后根据输入矩阵相同采集者找输出矩阵依赖 更新输出矩阵
if (data.IsIput) {
	watch(
		() => store.state.通信数据,
		(now: { 类型: string; data: any }) => {
			if (now.类型 === '初始化') {
				let result = now.data['matrix'].find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
				if (result) {
					target.激活序列 = result['input'].map((num: string) => num);
					// 找到对应输出端 同一个采集者 且 为输出
					let 输出端 = store.state.依赖数据.find((e: any) => e.采集者 == target.采集者 && e.采集者所在页面 == target.采集者所在页面 && e.是否为输入端 === false);
					输出端 && (输出端.激活序列 = result['output'].map((num: string) => num));
				}
			} else if (now.类型 === '更新') {
				let result = now.data['values'].find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
				if (result) {
					target.激活序列 = now.data['input'].map((num: string) => num);
					let 输出端 = store.state.依赖数据.find((e: any) => e.采集者 == target.采集者 && e.采集者所在页面 == target.采集者所在页面 && e.是否为输入端 === false);
					输出端 && (输出端.激活序列 = now.data['output'].map((num: string) => num));
				}
			}
		}
	);
}

// 方法
function 栅格布局() {
	return {
		gridTemplateColumns: `repeat(${data.Column}, 1fr)`,
		gridTemplateRows: `repeat(${data.Row}, 1fr)`,
		gap: `${data.Spacing}px`,
		padding: `${data.UpSpacing}px ${data.RightSpacing}px ${data.DownSpacing}px ${data.LeftSpacing}px`,
	};
}
function 按钮样式(num: number) {
	return {
		borderColor: target.激活序列.indexOf(String(num)) == -1 ? data.RectColor : data.ActiveRectColor,
		borderWidth: `${data.RectWidth}px`,
		borderStyle: 'solid',
		color: target.激活序列.indexOf(String(num)) == -1 ? data.FontColor : data.ActiveFontColor,
		fontSize: `${data.FontSize * 缩放比.value.高度比}px`,
	};
}
function 按钮背景(type: string, num: number) {
	let style: any = {
		opacity: Math.round((data.ViseValue / 255) * 100) / 100,
	};
	switch (type) {
		case '纯色':
			style['background'] = target.激活序列.indexOf(String(num)) == -1 ? data.GroundColor : data.ActiveGroundcolor;
			break;
		case '图片':
			if (target.激活序列.indexOf(String(num)) == -1) {
				// 非激活
				if (data.PictureNme && data.PictureNme !== 'NONE') {
					style['backgroundImage'] = `url(/config/photos/${data.PictureNme})`;
				} else {
					style['background'] = data.GroundColor;
				}
			} else {
				// 激活
				if (data.ActivePictureName && data.ActivePictureName !== 'NONE') {
					style['backgroundImage'] = `url(/config/photos/${data.ActivePictureName})`;
				} else {
					style['background'] = data.ActiveGroundcolor;
				}
			}
			break;
		case '双色水平渐变':
			if (target.激活序列.indexOf(String(num)) == -1) {
				style['background'] = `linear-gradient(to right, ${data.GroundColor}, ${data.GroundColor2})`;
			} else {
				style['background'] = `linear-gradient(to right, ${data.ActiveGroundcolor}, ${data.ActiveGroundcolor2})`;
			}
			break;
		case '双色垂直渐变':
			if (target.激活序列.indexOf(String(num)) == -1) {
				style['background'] = `linear-gradient(${data.GroundColor}, ${data.GroundColor2})`;
			} else {
				style['background'] = `linear-gradient(${data.ActiveGroundcolor}, ${data.ActiveGroundcolor2})`;
			}
			break;
	}
	return style;
}
function 点击(num: number) {
	if (data.IsIput) {
		// 输入 只能激活一个按钮
		target.激活序列 = [String(num)];
	} else {
		// 输出可以多个一起点亮
		let index = target.激活序列.indexOf(String(num));
		if (index == -1) {
			// 点击的不是同一个 则添加
			target.激活序列.push(String(num));
		} else {
			// 点的相同  则取出
			target.激活序列.splice(index, 1);
		}
	}
}
</script>

<style lang="less" scoped>
.grid {
	display: grid;
}
.button {
	overflow: hidden;
}
.bg_img {
	background-size: 100% 100%;
	background-repeat: no-repeat;
}
</style>
