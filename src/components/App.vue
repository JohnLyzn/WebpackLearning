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
	
	// Vue.directive('loadmore', ...);

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
		.common-header {
			background: $theme;
			height: 45px;
			.mint-header-title {
				font-size: 1.1rem;
				font-weight: bold;
			}
		}
		.main-body {
			width: 100vw;
			height: 100vh;
			position: absolute;
			top: 0;
		}
		.common-header~.main-body {
			padding-top: 45px;
		}
	}
</style>
