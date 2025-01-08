<template>
	<!-- 因为图片要变换宽高以加以旋转贴合父容器 因此在父容器中要居中 再以中心点旋转 -->
	<div class="img">
		<img :style="图片样式()" :src="`/config/photos/${data.PictureNme}`" />
	</div>
</template>

<script setup lang="ts">
import { computed, defineProps } from 'vue';
import { useStore } from 'vuex';

// 属性
const store = useStore();
const { 组件数据: data } = defineProps(['组件数据']);
const 缩放比 = computed(() => store.getters.缩放比);

// 根据图片文件名后缀区分是否读取本地图片
// let t = data.PictureNme.split('.');
// if (t[t.length - 1] == 'gif' || !data.PictureNme_base) {
// 	// gif图从本地获取
// 	data.PictureNme_base = `/图包/${data.PictureNme}`;
// } else if (data.PictureNme_base && data.PictureNme_base !== 'NONE') {
// 	// base64图片缺少前缀
// 	let reg = /^data\:image\/png\;base64\,/;
// 	// 没有前缀则添加
// 	if (!reg.test(data.PictureNme_base)) {
// 		data.PictureNme_base = `data:image/png;base64,${data.PictureNme_base}`;
// 	}
// }

// 方法
function 图片样式() {
	let style: any = {};
	switch (data.PictureShowWay) {
		case '旋转90°':
			// 旋转 90度时 将父容器宽度作为图片高度 父容器高度作为图片宽度
			style = {
				width: `${data.Height * 缩放比.value.高度比}px`,
				height: `${data.Width * 缩放比.value.宽度比}px`,
				transform: 'rotateZ(90deg)',
			};
			break;
		case '旋转270°':
			style = {
				width: `${data.Height * 缩放比.value.高度比}px`,
				height: `${data.Width * 缩放比.value.宽度比}px`,
				transform: 'rotateZ(270deg)',
			};
			break;
		case '旋转180°':
			style = {
				width: '100%',
				height: '100%',
				transform: 'rotateZ(1800deg)',
			};
			break;
		case '普通':
			style = {
				width: '100%',
				height: '100%',
			};
			break;
		case '水平镜像图':
			style = {
				width: '100%',
				height: '100%',
				transform: 'rotateY(180deg)',
			};
			break;
		case '垂直镜像图':
			style = {
				width: '100%',
				height: '100%',
				transform: 'rotateX(180deg)',
			};
			break;
	}
	return style;
}
</script>

<style lang="less" scoped>
.img {
	display: flex;
	align-items: center;
	justify-content: center;
	> img {
		position: absolute;
	}
}
</style>
