<template>
	<div>
		<div v-if="方向 == '垂直模式'" class="垂直" :style="遮盖范围()">
			<img class="bg_img" src="/img/窗帘-垂直.png" />
		</div>

		<div v-else class="水平">
			<div class="左">
				<img class="bg_img" :style="遮盖范围()" src="/img/窗帘-水平-左.png" />
			</div>
			<div class="右">
				<img class="bg_img" :style="遮盖范围()" src="/img/窗帘-水平-右.png" />
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import { useStore } from 'vuex';

// 属性
const store = useStore();
const { 组件数据: data, 页面名 } = defineProps(['组件数据', '页面名']);
const 方向 = ref(data.CurtainMode);
// 找依赖数据
let target = store.state.依赖数据.find((e: any) => e.目标组件 == data.name && e.目标页面 == 页面名);
if (!target) {
	target = reactive({
		组件名: '',
		页面名,
		最小值: 0,
		最大值: 100,
		值: 0,
		目标页面: '',
		目标组件: '',
	});
}

// 窗帘同步数据不是给滑块的 而是给窗帘下发 因此要监听同步数据
watch(
	() => store.state.通信数据,
	(now: { 类型: string; data: any }) => {
		if (now.类型 === '初始化') {
			let result = now.data['curtain'].find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
			if (result) {
				// 拿到的值是百分比 要转换成滑块能接受的值
				target.值 = (parseFloat(result.value) / 100) * (target.最大值 - target.最小值) + target.最小值;
			}
		} else if (now.类型 === '更新') {
			let result = now.data['values'].find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
			if (result) {
				target.值 = (parseFloat(result.value) / 100) * (target.最大值 - target.最小值) + target.最小值;
			}
		}
	}
);

// 方法
function 遮盖范围() {
	let 百分比 = 0;
	if (target) {
		百分比 = ((target.值 - target.最小值) / (target.最大值 - target.最小值)) * 100;
	}
	if (方向.value == '垂直模式') {
		return {
			height: `${100 - 百分比}%`,
		};
	} else {
		return {
			width: `${100 - 百分比}%`,
		};
	}
}
</script>

<style lang="less" scoped>
.垂直 {
	overflow: hidden;
	width: 100%;
	position: relative;
	z-index: 10;
}
.水平 {
	position: relative;
	z-index: 10;
	width: 100%;
	height: 100%;
	display: grid;
	grid-template-columns: 1fr 1fr;
	> .左 {
		position: relative;
		overflow: hidden;
		> .bg_img {
			left: 0;
			top: 0;
			bottom: 0;
		}
	}
	> .右 {
		position: relative;
		overflow: hidden;
		> .bg_img {
			right: 0;
			top: 0;
			bottom: 0;
			left: auto;
		}
	}
}
</style>
