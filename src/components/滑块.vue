<template>
	<div :class="[data.ScrollDirect == '横' ? 'row_layout' : 'col_layout']">
		<!-- 背景 -->
		<div class="bg_img">
			<img v-if="data.PictureNme != 'NONE'" class="背景" :src="`/config/photos/${data.PictureNme}`" />
			<div v-else class="背景" :style="{ background: data.GroundColor }"></div>
		</div>

		<el-input v-if="data.ValueShow && data.ScrollDirect != '横'" v-model="输入值" @change="校验输入($event)" style="width: 80%; margin-top: 6px" v-input-size />

		<div :class="[data.ScrollDirect == '横' ? 'row_layout' : '', 'flex_grow']">
			<el-slider v-model="target.值" :min="最小值" :max="最大值" :step="步长" :marks="生成刻度值()" v-bind="动态属性" @input="下发指令()" v-cus-style />
		</div>

		<el-input v-if="data.ValueShow && data.ScrollDirect == '横'" v-model="输入值" @change="校验输入($event)" style="width: 10%" />
	</div>
</template>

<script lang="ts" setup>
import { ref, defineProps, computed, watch, reactive } from 'vue';
import { useStore } from 'vuex';
import { 发送指令, type 指令参数 } from '@/api/发送指令';
import { 功能 } from '@/store/main';

interface Marks {
	[key: number]: string;
}

// 属性
const store = useStore();
const { 组件数据: data, 页面名 } = defineProps(['组件数据', '页面名']);
const 缩放比 = computed(() => store.getters.缩放比);
const 最小值 = ref<number>(parseFloat(data.SliderMin));
const 最大值 = ref<number>(parseFloat(data.SliderMax));
// 找自己
let target = store.state.依赖数据.find((e: any) => e.组件名 == data.name && e.页面名 == 页面名);
if (!target) {
	// 滑块不一定绑定了其他组件 就不会添加到依赖 因此构造新的值
	target = reactive({ 值: 最小值.value }); // 必须用reactive 否则下面要用target.value.值
}
const 步长 = ref<number>(计算步长());
// 监听 数据变化
watch(
	() => store.state.通信数据,
	(now: { 类型: string; data: any }) => {
		if (now.类型 === '初始化') {
			let result = now.data['slider'].find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
			if (result) {
				target.值 = parseFloat(result.value);
			}
		} else if (now.类型 === '更新') {
			let result = now.data['values'].find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
			if (result) {
				target.值 = parseFloat(result.value);
			}
		}
	}
);

// 输入框相关配置
const 输入值 = ref<number>(最小值.value);
const 输入框大小 = ref(0);
// 垂直显示时 获取输入框大小
const vInputSize = {
	updated(dom: any) {
		setTimeout(() => {
			// 父容器显示和隐藏时会触发子组件 updated 但是此时dom获取的高度为0
			// 因此要放到异步事件队列 此时dom已经显示在页面 因此高度值才正确
			输入框大小.value = dom.offsetHeight;
		});
	},
};

const 动态属性 = computed(() => {
	if (data.ScrollDirect !== '横') {
		return {
			vertical: true,
			// 20是滑块上下固定边距 还要再减去输入框大小 10是父容器上边距
			height: `${data.Height * 缩放比.value.高度比 - 20 - 输入框大小.value - 6}px`,
		};
	} else {
		return {};
	}
});

// 修改样式的自定义指令
const vCusStyle = {
	mounted(dom: any) {
		// 修改填充色
		dom.children[0].children[0].style.backgroundColor = data.ScrollVolFillColor;
		// 修改背景色
		dom.children[0].style.backgroundColor = data.ScrollColor;
		if (data.LineShow) {
			dom.children[0].style.borderRadius = '0';
			// 修改刻度线
			let n = 0;
			let 粗细 = '';
			let 长 = '';
			let 定位 = {
				key: '',
				value: '',
			};
			let 文字边距 = '';
			if (data.ScrollDirect == '横') {
				粗细 = 'width';
				长 = 'height';
				定位.key = 'top';
				定位.value = 'translateY(-50%)';
				文字边距 = 'marginTop';
			} else {
				粗细 = 'height';
				长 = 'width';
				定位.key = 'left';
				定位.value = 'translateX(-50%)';
				文字边距 = 'left';
			}
			for (let node of dom.children[0].children[2].children) {
				n++;
				node.style.backgroundColor = data.LineFontColor;
				node.style.borderRadius = '0';
				node.style[粗细] = '2px';
				node.style[长] = 刻度线(n);
				node.style[定位.key] = '50%';
				node.style.transform = 定位.value;
			}
			// 刻度线字体
			for (let node of dom.children[0].children[3].children) {
				node.style.color = data.LineFontColor;
				node.style.fontSize = `${data.LineFontSize}px`;
				node.style[文字边距] = '25px';
			}
		}
	},
};

// 方法
function 生成刻度值(): Marks {
	let m: Marks = {};
	if (data.LineShow) {
		// 总共切成 8份
		let total = 最大值.value - 最小值.value;
		for (let i = 0; i <= 8; i++) {
			let 百分比 = i / 8;
			let num = Math.round(total * 百分比 + 最小值.value);
			m[num] = `${num}`;
		}
	}
	return m;
}
function 下发指令() {
	输入值.value = target.值;
	let body: 指令参数 = {
		组件名: data.name,
		页面名,
		data: {
			value: `${target.值}`,
		},
		type: 'slider',
		ispress: -1,
	};
	if (data.device.length) {
		let t = data.device.split(';');
		switch (t[0]) {
			case 功能.控制窗帘:
				body.type = 'curtain';
				body.data.value = `${((target.值 - 最小值.value) / (最大值.value - 最小值.value)) * 100}`;
				// 以窗帘组件名义下发
				body.组件名 = target.目标组件;
				body.页面名 = target.目标页面;
				break;
		}
	}
	发送指令(body);
}
function 计算步长(): number {
	// data.LevelCount 表示全程滑动次数
	return Math.round(((最大值.value - 最小值.value) / data.LevelCount) * 10) / 10;
}
function 校验输入(num: string) {
	let reg = /^(\-)?\d+(\.\d+)?$/;
	// 校验 输入值合法
	if (reg.test(num) && Number(num) > 最小值.value && Number(num) < 最大值.value) {
		// 根据步长取小数位
		let t = String(步长.value).split('.');
		let 小数位 = t.length == 1 ? 0 : Number(t[1]);
		target.值 = Math.round(Number(num) * Math.pow(10, 小数位)) / Math.pow(10, 小数位);
	}
	下发指令();
}
function 刻度线(num: number) {
	switch (num) {
		case 1:
		case 9:
			return '26px';
		default:
			return '16px';
	}
}
</script>

<style lang="less" scoped>
.row_layout > .row_layout {
	padding: 0 10px;
}
.flex_grow {
	flex-grow: 1;
}
.col_layout {
	align-items: center;
}
.背景 {
	width: 100%;
	height: 100%;
}
.bg_img {
	z-index: 0;
}
</style>
