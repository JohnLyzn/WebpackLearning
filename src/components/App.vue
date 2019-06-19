<template>
	<div class="main-container">
		<transition name="router-fade" mode="out-in">
			<keep-alive>
				<router-view v-if="$route.meta.keepAlive"></router-view>
			</keep-alive>
		</transition>
		<transition name="router-fade" mode="out-in">
			<router-view v-if="!$route.meta.keepAlive"></router-view>
		</transition>
	</div>
</template>
<script>
	import Vue from 'vue';

	import 'style/reset';
	import 'style/common';

	// import theme from 'muse-ui/lib/theme';
	// theme.add('teal', {
	// 	primary: '#FF8900',
	// 	info: '#FF8900',
	// }, 'light');
	// theme.use('teal');

	import Helpers from 'muse-ui/lib/Helpers';
	Vue.use(Helpers);

	import MuseUI from 'muse-ui';
	import 'muse-ui/dist/muse-ui.css';
	import 'style/muse-ui-variables';

	Vue.use(MuseUI);

	import 'style/iconfont/iconfont.css';
	
  	export default {
    	data() {
            return {

            };
		},
		mounted() {

		},
  	}
</script>
<style lang="scss">
	@import 'style/mixin';

	.router-fade-enter-active, .router-fade-leave-active {
	  	transition: opacity .3s;
	}
	.router-fade-enter, .router-fade-leave-active {
	  	opacity: 0;
	}
	.main-container {
		max-width: 645px;
		position: relative;
		margin: 0 auto;
		.common-header {
			max-width: 645px;
			margin: 0 auto;
			background: $theme;
			height: 45px;
			.mint-header-title {
				font-size: 1.1rem;
				font-weight: bold;
			}
		}
		.main-body {
			width: 100%;
			position: absolute;
			top: 0;
		}
		.common-header~.main-body {
			padding-top: 45px;
		}
	}
</style>
