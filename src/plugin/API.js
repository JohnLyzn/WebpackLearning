/**
 * 调用app上的方法
 * @param {Object} name app上的事件名称
 * @param {Object} args 传给app上的方法的参数
 * @param {Object} callBackEventName 执行完app上的方法后通知此工具的事件的名称， 可为空
 * @param {Object} fireWebviewID 要通知的webview的id，可为空，为空时默认通知的是index
 */
export function callAppAPI(name, args, callBackEventName, fireWebviewID) {
	// var webView = null;
	// if(fireWebviewID != undefined && fireWebviewID != null){
	// 	webView = plus.webview.getWebviewById(fireWebviewID);
	// }else{
	// 	webView = plus.webview.getWebviewById('index');
	// }
	// if(webView == null || webView == undefined){
	// 	webView = plus.webview.getLaunchWebview();
	// }
	// var currentWebviewID = plus.webview.currentWebview().id;
	var _plus = null;
	if(window.plus){
		_plus = window.plus;
	}
	if(window.top.plus){
		_plus = window.top.plus;
	}
	if(window.parent.plus){
		_plus = window.parent.plus;
	}
	if(_plus == null || !_plus){
		alert("无法获取Plus");
		return;
	}
	if(!_plus.wtbAppAPIPlugin){
		alert("无法获取wtbAppAPIPlugin");
	}
	try{
		_plus.wtbAppAPIPlugin.callApi(name,args);
	}catch(e){
		alert(e);
	}
};

export function quitToolPageAPI() {
	var toolPageview = plus.webview.currentWebview().parent();
	toolPageview.canBack(function(e){
		if (e.canBack) {
			toolPageview.back();
		} else{
			if (toolPageview == null || toolPageview == undefined) {
				plus.webview.currentWebview().close();
			} else {
				plus.webview.currentWebview().parent().close();
			}
		}
	});
}