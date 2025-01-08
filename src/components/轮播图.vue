<template>
	<div :class="[data.loopmode != '图片循环' ? 'center' : '']">
		<template v-if="data.loopmode == '图片循环'">
			<img class="bg_img" v-for="item in 轮播图" v-show="target.当前显示 == item.id" :key="item.id" :src="item.url" />
		</template>

		<template v-else>
			<span v-for="item in 轮播图" v-show="target.当前显示 == item.id" :key="item.id" :style="文字样式(item as text)">
				{{ item.label }}
			</span>
		</template>
	</div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import { useStore } from 'vuex';

// 属性
const store = useStore();
const { 组件数据: data, 页面名 } = defineProps(['组件数据', '页面名']);
const 缩放比 = computed(() => store.getters.缩放比);

// 找依赖数据
let target = store.state.依赖数据.find((e: any) => e.组件名 == data.name && e.页面名 == 页面名);
if (!target) {
	target = reactive({
		组件名: data.name,
		页面名,
		当前显示: 0,
		total: data.loopmode == '图片循环' ? data.MutiPicturenames.length : data.MutiFontname.length,
	});
}

interface img {
	id: number;
	url: string;
	[key: string]: any;
}
interface text {
	id: number;
	字体颜色: string;
	文字方向: string;
	字体: string;
	字体大小: string;
	字体间距: string;
	文字样式: string[];
	label: string;
	[key: string]: any;
}
const 轮播图 = ref<(img | text)[]>(初始化());

// 监听同步数据
watch(
	() => store.state.通信数据,
	(now: { 类型: string; data: any }) => {
		if (now.类型 === '初始化') {
			let result = now.data['mutiimage'].find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
			if (result) {
				target.当前显示 = parseInt(result.value);
			}
		} else if (now.类型 === '更新') {
			let result = now.data['values'].find((e: any) => e.pagename === 页面名 && e.rectname === data.name);
			if (result) {
				target.当前显示 = parseInt(result.value);
			}
		}
	}
);

// 方法
function 初始化(): (img | text)[] {
	if (data.loopmode == '图片循环') {
		return data.MutiPicturenames.map((e: any) => ({
			id: e.id,
			url: `/config/photos/${e.picturename}`,
		}));
	} else {
		return data.MutiFontname.map((e: any) => ({
			id: e.id,
			字体颜色: e.fontcolor,
			文字方向: e.fontdirection,
			字体: e.fontformat,
			字体大小: `${e.fontsize * 缩放比.value.高度比}px`,
			字体间距: `${e.fontspacing}px`,
			文字样式: e.fontstyle.split('+'),
			label: e.text,
		}));
	}
}
function 文字样式(item: text) {
	let style: any = {
		fontSize: item.字体大小,
		fontFamily: item.字体,
		color: item.字体颜色,
		letterSpacing: item.字体间距,
	};
	if (item.文字方向 !== '横') {
		style['writingMode'] = 'vertical-lr';
		style['textOrientation'] = 'upright';
	}
	for (let val of item.文字样式) {
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
</script>

<style lang="less" scoped>
.bg_img {
	z-index: 10;
}
</style>
