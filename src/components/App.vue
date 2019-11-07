<template>
	<div class="main-container">
		<mu-appbar class="main-header">
            <mu-button slot="left"
				icon
				@click="back">
                <mu-icon value=":iconfont iconback"></mu-icon>
            </mu-button>
            标题
			<mu-button slot="right"
				icon>
                <mu-icon value=":iconfont iconmenu"></mu-icon>
            </mu-button>
        </mu-appbar>
		<div class="main-body-wrapper">
			<transition name="router-fade" mode="out-in">
				<keep-alive>
					<router-view v-if="$route.meta.keepAlive"></router-view>
				</keep-alive>
			</transition>
			<transition name="router-fade" mode="out-in">
				<router-view v-if="!$route.meta.keepAlive"></router-view>
			</transition>
		</div>
	</div>
</template>
<script>
	import Vue from 'vue';
	import {pageBack} from 'common/env';

	import 'style/reset';
	import 'style/common';

	// import theme from 'muse-ui/lib/theme';
	// theme.add('teal', {
	// 	primary: '#FF8900',
	// 	info: '#FF8900',
	// }, 'light');
	// theme.use('teal');

	import 'muse-ui/lib/styles/base.less';
	import {
		Alert,
		AppBar,
		AutoComplete,
		Avatar,
		Badge,
		BottomNav,
		BottomSheet,
		Breadcrumbs,
		Button,
		Card,
		Checkbox,
		Chip,
		DateInput,
		DataTable,
		Dialog,
		Divider,
		Drawer,
		ExpansionPanel,
		Form,
		Grid,
		GridList,
		Helpers,
		Icon,
		List,
		LoadMore,
		Menu,
		Pagination,
		Paper,
		Picker,
		Popover,
		Progress,
		Radio,
		Select,
		SlidePicker,
		Slider,
		Snackbar,
		Stepper,
		SubHeader,
		Switch,
		Tabs,
		TextField,
		Tooltip,
		theme
	} from 'muse-ui';

	Vue.use(Alert);
	Vue.use(AppBar);
	Vue.use(AutoComplete);
	Vue.use(Avatar);
	Vue.use(Badge);
	Vue.use(BottomNav);
	Vue.use(BottomSheet);
	Vue.use(Breadcrumbs);
	Vue.use(Button);
	Vue.use(Card);
	Vue.use(Checkbox);
	Vue.use(Chip);
	Vue.use(DateInput);
	Vue.use(DataTable);
	Vue.use(Dialog);
	Vue.use(Divider);
	Vue.use(Drawer);
	Vue.use(ExpansionPanel);
	Vue.use(Form);
	Vue.use(Grid);
	Vue.use(GridList);
	Vue.use(Helpers);
	Vue.use(Icon);
	Vue.use(List);
	Vue.use(LoadMore);
	Vue.use(Menu);
	Vue.use(Pagination);
	Vue.use(Paper);
	Vue.use(Picker);
	Vue.use(Popover);
	Vue.use(Progress);
	Vue.use(Radio);
	Vue.use(Select);
	Vue.use(SlidePicker);
	Vue.use(Slider);
	Vue.use(Snackbar);
	Vue.use(Stepper);
	Vue.use(SubHeader);
	Vue.use(Switch);
	Vue.use(Tabs);
	Vue.use(TextField);
	Vue.use(Tooltip);
	import 'muse-ui/lib/styles/theme.less';

	// import 'muse-ui-loading/dist/muse-ui-loading.css';
	// import Loading from 'muse-ui-loading';
	// Vue.use(Loading);

	// import 'muse-ui-progress/dist/muse-ui-progress.css';
	// import NProgress from 'muse-ui-progress';
	// Vue.use(NProgress);

	import 'style/muse-ui-variables';
	import 'style/iconfont/iconfont.css';
	
  	export default {
    	data() {
            return {

            };
		},
		methods: {
			back() {
				pageBack();
			},
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
		width: 100%;
		max-width: 100vw;
		min-height: 100vh;
		position: relative;
		margin: 0 auto;
		.main-header {
			width: 100%;
			max-width: 100vw;
			height: 64px;
			&.fixed {
				position: fixed;
			}
			cite {
				font-size: 14px;
			}
		}
		.main-body-wrapper {
			width: 100%;
			max-width: 100vw;
			.main-body {
				width: 100%;
				max-width: 100vw;
				position: relative;
				&.full-height {
					height: 100%;
					min-height: 100vh;
				}
			}
		}
		.main-header.fixed~.main-body,
		.main-header.fixed~.container {
			padding-top: 72px !important;
		}
	}
</style>
