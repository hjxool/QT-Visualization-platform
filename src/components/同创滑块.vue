<template>
	<div class="col_layout">
		<!-- 背景 -->
		<div class="bg_img">
			<img v-if="data.PictureNme != 'NONE'" class="背景" :src="`./config/photos/${data.PictureNme}`" />
			<div v-else class="背景" :style="{ background: data.GroundColor }"></div>
		</div>

		<div class="通道名 zIndex" :style="字体样式()">{{ data.RectText }}</div>

		<div class="flex_grow zIndex" v-height>
			<el-progress
				class="旋转"
				:percentage="增益百分比"
				:stroke-width="12"
				:show-text="false"
				:style="{ width: `${滑动条高度}px` }"
				:color="data.ptype == '接收端' ? 'rgb(83,135,236)' : 'rgb(28,193,122)'"
				striped-flow
				striped
				:duration="进度条动画时间"
				v-cus-progress
			/>

			<el-slider
				class="偏移"
				v-model="值"
				:min="最小值"
				:max="最大值"
				:step="步长"
				:marks="生成刻度值()"
				vertical
				:height="`${滑动条高度}px`"
				@input="控制下发频率('slider')"
				@change="下发指令('slider')"
				v-cus-style
			/>
		</div>

		<div :class="['button', 'bg', 'gap', 'center', 静音 ? 'color2' : 'color1']" @click="控制下发频率('mute')" :style="字体样式()">静音</div>

		<input class="bg gap zIndex" v-model="输入值" @change="校验输入()" type="text" :style="字体样式()" />

		<div class="gap zIndex" :style="字体样式()">{{ data.pid + 1 }}</div>
	</div>
</template>

<script lang="ts" setup>
import { ref, defineProps, computed, watch, reactive } from 'vue';
import { useStore } from 'vuex';
import { 发送指令, type 指令参数 } from '@/api/发送指令';
import { 节流 } from '@/api/通用方法';

interface Marks {
	[key: number]: string;
}

// 属性
const store = useStore();
const { 组件数据: data, 页面名 } = defineProps(['组件数据', '页面名']);
const 缩放比 = computed(() => store.getters.缩放比);
const 最小值 = ref<number>(-72);
const 最大值 = ref<number>(12);
const 值 = ref<number>(最小值.value);
const 步长 = ref<number>(0.1);
const 静音 = ref<boolean>(false);

// 获取当前节点高度
const 滑动条高度 = ref<number>(0);
const vHeight = {
	mounted(dom: any) {
		滑动条高度.value = dom.offsetHeight - 20;
	},
	updated(dom: any) {
		setTimeout(() => {
			滑动条高度.value = dom.offsetHeight - 20;
		});
	},
};

const 增益 = reactive({
	max: 0,
	min: -72,
	value: -72,
	// 300px高度对应动画20s
});
const 增益百分比 = computed(() => {
	let p = ((增益.value - 增益.min) / (增益.max - 增益.min)) * 100;
	return Math.round(p);
});
const 进度条动画时间 = computed(() => {
	let t = (增益百分比.value / 100) * 滑动条高度.value;
	return Math.round((t / 300) * 20);
});

// 输入框相关配置
const 输入值 = ref<number>(最小值.value);
watch(值, (now: number) => {
	输入值.value = now;
});

// 监听 数据变化
watch(
	() => store.state.通信数据,
	(now: { 类型: string; data: any }) => {
		if (now.类型 === '初始化') {
			// 由多个部分组成
			let result1 = now.data['tcslider']?.find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
			if (result1) {
				值.value = parseFloat(result1.value);
			}
			let result2 = now.data['tcbtn']?.find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
			if (result2) {
				静音.value = Number(result2.ispress) == 1;
			}
			let result3 = now.data['tcgain']?.find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
			if (result3) {
				增益.value = parseFloat(result3.value);
			}
		} else if (now.类型 === '更新') {
			let result;
			// 根据类型分别取值
			switch (now.data['type']) {
				case 'tcslider':
					result = now.data['values']?.find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
					if (result) {
						值.value = parseFloat(result.value);
					}
					break;
				case 'tcbtn':
					result = now.data['values']?.find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
					if (result) {
						静音.value = Number(now.data['ispress']) == 1;
					}
					break;
				case 'tcgain':
					result = now.data['values']?.find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
					if (result) {
						增益.value = parseFloat(result.value);
					}
					break;
			}
		}
	}
);

// 修改样式的自定义指令
const vCusStyle = {
	mounted(dom: any) {
		// 修改填充色
		dom.children[0].children[0].style.backgroundColor = data.ptype == '接收端' ? 'rgb(83,135,236)' : 'rgb(28,193,122)';
		// 修改背景色
		dom.children[0].style.backgroundColor = 'rgb(204,223,234)';
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
		粗细 = 'height';
		长 = 'width';
		定位.key = 'left';
		定位.value = 'translateX(-50%)';
		文字边距 = 'left';
		for (let node of dom.children[0].children[2].children) {
			n++;
			node.style.backgroundColor = '#D3D3D3';
			node.style.borderRadius = '0';
			node.style[粗细] = '2px';
			node.style[长] = 刻度线(n);
			node.style[定位.key] = '50%';
			node.style.transform = 定位.value;
		}
		// 刻度线字体
		for (let node of dom.children[0].children[3].children) {
			node.style.color = 'gray';
			node.style.fontSize = `${data.LineFontSize}px`;
			node.style[文字边距] = '25px';
		}
	},
};
const vCusProgress = {
	mounted(dom: any) {
		dom.children[0].children[0].style.backgroundColor = 'rgb(204,223,234)';
	},
};

// 方法
function 生成刻度值(): Marks {
	let m: Marks = {};
	// 总共切成 8份
	let total = 最大值.value - 最小值.value;
	for (let i = 0; i <= 8; i++) {
		let 百分比 = i / 8;
		let num = Math.round(total * 百分比 + 最小值.value);
		m[num] = `${num}`;
	}
	return m;
}
function 下发指令(args: any) {
	let body: 指令参数 = {
		组件名: data.name,
		页面名,
		ispress: -1,
	};
	switch (args) {
		case 'slider':
			body.type = 'tcslider';
			body.data = {
				value: `${值.value}`,
				sliderid: String(data.pid + 1),
			};
			break;
		case 'mute':
			静音.value = !静音.value;
			body.type = 'tcbtn';
			body.data = {
				sliderid: String(data.pid + 1),
			};
			body.ispress = 静音.value ? 1 : 0;
			break;
	}
	发送指令(body);
}
const 控制下发频率 = 节流(下发指令, 100);
function 校验输入() {
	let reg = /^(\-)?\d+(\.\d+)?$/;
	// 校验 输入值合法
	// 注意 校验值为字符串
	if (reg.test(输入值.value.toString()) && Number(输入值.value) > 最小值.value && Number(输入值.value) < 最大值.value) {
		// 根据步长取小数位
		let t = String(步长.value).split('.');
		let 小数位 = t.length == 1 ? 0 : Number(t[1]);
		值.value = Math.round(Number(输入值.value) * Math.pow(10, 小数位)) / Math.pow(10, 小数位);
	} else {
		输入值.value = 值.value;
	}
	下发指令('slider');
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
function 字体样式() {
	return {
		fontSize: `${data.FontSize * 缩放比.value.高度比}px`,
	};
}
</script>

<style lang="less" scoped>
.flex_grow {
	flex-grow: 1;
	margin-bottom: 16px;
	display: flex;
	justify-content: center;
	position: relative;
}
.背景 {
	width: 100%;
	height: 100%;
}
.bg_img {
	z-index: 0;
}
.通道名 {
	font-weight: bold;
	margin: 16px 0;
	align-self: center;
}
.bg {
	border-radius: 10px;
	padding: 6px 0;
	width: 80%;
	text-align: center;
}
.gap {
	margin-bottom: 10px;
	align-self: center;
}
.color1 {
	background-color: rgb(196, 213, 228);
	color: black;
}
.color2 {
	background-color: rgb(208, 103, 103);
	color: #fff;
}
.zIndex {
	position: relative;
	z-index: 10;
}
input {
	border: none;
	outline: none;
	background: none;
	padding: 0;
	margin: 0;
	box-shadow: none;
	-webkit-appearance: none; /* 去除Safari浏览器默认样式 */
	-moz-appearance: none; /* 去除Firefox浏览器默认样式 */
	appearance: none;
	background-color: rgb(196, 213, 228);
}
.旋转 {
	position: absolute;
	transform: rotateZ(-90deg);
	left: 35%;
	bottom: 0;
	transform-origin: 0 100%;
}
.偏移 {
	position: relative;
	left: 10%;
}
</style>
