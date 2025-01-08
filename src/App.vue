<template>
	<div id="root" v-loading="加载">
		<main_page></main_page>
	</div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import main_page from './components/主页.vue';
import { useStore } from 'vuex';
import { 连接websocket } from './api/连接websocket';
import { 获取页面数据 } from './api/获取页面数据';
import { 设备开始上报 } from './api/设备开始上报';
import { 生成uuid } from './api/uuid';

const store = useStore();
const 加载 = computed(() => store.state.加载);
// 页面一启动生成唯一ID 用于过滤通信数据
生成uuid();
store.dispatch('获取界面');

// 在页面组件加载完后再获取初始化状态和建立websocket连接
onMounted(() => {
	获取页面数据();
	设备开始上报();
	连接websocket();
});
</script>

<style lang="less" scoped>
#root {
	position: absolute;
	width: 100%;
	height: 100%;
	overflow: hidden;
}
</style>
