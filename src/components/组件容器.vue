<template>
	<div>
		<!-- 普通组件
     不要用template标签 没法绑定key 没有key会导致节点被复用 -->
		<div v-for="item in 面板数据.data" :key="item.rectid">
			<cus-button v-if="item.property == 3" class="component" :组件数据="item" :跳转子容器="显示子容器" :互锁="互锁" :切换激活="切换激活" :页面名="面板数据.pagename" :style="通用组件样式(item)" />

			<cus-img v-if="item.property == 5" class="component" :组件数据="item" :style="通用组件样式(item)" />

			<cus-text v-if="item.property == 12 || item.property === 4" class="component" :组件数据="item" :页面名="面板数据.pagename" />

			<cus-slider v-if="item.property == 7" class="component" :组件数据="item" :页面名="面板数据.pagename" :style="通用组件样式(item)" />

			<cus-button-matrix1 v-if="item.property == 18 && item.ViewmatrixStyle == '样式一'" class="component" :组件数据="item" :页面名="面板数据.pagename" :style="通用组件样式(item)" />

			<cus-button-matrix2 v-if="item.property == 18 && item.ViewmatrixStyle == '样式二'" class="component" :组件数据="item" :页面名="面板数据.pagename" :style="通用组件样式(item)" />

			<container v-if="item.property == 8" v-show="item.ShowPage === 子容器" class="component container" :面板数据="item" :style="面板样式(item)"></container>

			<cus-curtain v-if="item.property == 25" class="component" :组件数据="item" :页面名="面板数据.pagename" :style="通用组件样式(item)" />

			<cus-scroll-img v-if="item.property == 26" class="component" :组件数据="item" :页面名="面板数据.pagename" :style="通用组件样式(item)" />

			<tc-matrix v-if="item.property == 19" class="component" :组件数据="item" :页面名="面板数据.pagename" :style="通用组件样式(item)" />

			<tc-slider v-if="item.property == 16" class="component" :组件数据="item" :页面名="面板数据.pagename" :style="通用组件样式(item)" />
		</div>
	</div>
</template>

<script lang="ts" setup>
import { ref, defineProps, computed, onMounted } from 'vue';
import container from './组件容器.vue';
import { useStore } from 'vuex';
import cusButton from './按钮.vue';
import cusImg from './图片.vue';
import cusText from './文本.vue';
import cusSlider from './滑块.vue';
import cusButtonMatrix1 from './按钮矩阵-样式一.vue';
import cusButtonMatrix2 from './按钮矩阵-样式二.vue';
import cusCurtain from './窗帘.vue';
import cusScrollImg from './轮播图.vue';
import tcMatrix from './同创矩阵.vue';
import tcSlider from './同创滑块.vue';

onMounted(() => {
	初始化互锁组件状态();
});

// 属性
const store = useStore();
const 子容器 = ref<string>('');
const { 面板数据 } = defineProps(['面板数据']); // function defineProps<T>(arr: <T>[])
const 缩放比 = computed(() => store.getters.缩放比);
// 组件一加载 找是否有默认显示子容器
显示子容器();
const 互锁 = ref({
	触发者: '',
	互锁组: '',
});

// 方法
function 面板样式(box: any): object {
	let style = 通用组件样式(box);
	return {
		background: box.grondcolor,
		...style,
	};
}
function 显示子容器(name?: string, 互锁组?: string): void {
	if (name) {
		// 有跳转目标name 一定有互锁组
		子容器.value = name;
		// 关闭所有附页时传递过来的值不会改变互锁
		if (互锁组 && 互锁组 !== 'NONE') {
			互锁.value = {
				互锁组,
				触发者: name,
			};
		}
	} else {
		// 没有指定名称 取 附页 IsShow属性为true的
		if (面板数据.data) {
			let t = 面板数据.data.find((e: any) => e.RectText === 'PAGECONTAINER' && e.IsShow); // 附页 且 默认显示
			t && (子容器.value = t.ShowPage);
		}
	}
}
function 通用组件样式(item: any): object {
	return {
		width: `${item.Width * 缩放比.value.宽度比}px`,
		height: `${item.Height * 缩放比.value.高度比}px`,
		left: `${item.X1 * 缩放比.value.宽度比}px`,
		top: `${item.Y1 * 缩放比.value.高度比}px`,
		zIndex: item.zValue || 100,
	};
}
function 初始化互锁组件状态() {
	// 先找到附页名称
	let 触发者 = 子容器.value;
	// 再找当前面板下哪个组件触发者相同 取其互锁组属性
	let 互锁组 = 触发者 && 面板数据.data.find((e: any) => e.JumpToPage === 触发者)?.Interlock;
	// 对传入的互锁属性进行初始化
	互锁.value = {
		触发者: 触发者 || '',
		互锁组: 互锁组 || '',
	};
}
function 切换激活(互锁组: string, 触发组件名: string) {
	// 注意 这里是非跳转组件 切换互锁状态
	互锁.value = {
		互锁组,
		触发者: 触发组件名,
	};
}
</script>

<style lang="less" scoped>
.component {
	position: absolute;
}
.container {
	overflow: hidden;
}
</style>
