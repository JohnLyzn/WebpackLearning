## 吾托帮工具webpack打包辅助
### 调试流程
> 1. 安装好node环境, 获取完整的辅助项目包并解压到工具项目根目录的`webpack`文件夹下(名称没有强制要求, 保证代码能进行版本管理即可).
> 2. 根据需要修改`config/index.js`的配置信息和`package.json`中的作者信息.  
> 3. 执行`npm install`安装依赖包(如果为离线环境下, 在有网络的地方下载好拷贝过去即可).
> 4. 在`src`下按照目录结构添加源码文件.
>> *请不要任意修改其目录名称(可以添加, 子级可以修改), 有些目录是经过特殊配置的, 不知道怎么改配置时请不要修改.*   
>> *目录是不明确区分静态资源, js, 和样式的. 对于打包器来说这些都是资源. 最终打包的结果能保证结构正确.*   
>> #### 目录说明
>>+ `common` 所有公共js, 包括常量和配置.
>>+ `components` 所有组件.vue文件目录, 包括业务页面组件和通用组件, 其中App.vue是主入口组件, 可以根据平台类型建立多个入口.
>>+ `images` 所有图片放这里, 打包后会存放到resource/images目录下.
>>+ `model` 所有的模型放这里.
>>+ `other` 同工具的other, 打包后会存放到resource/other目录下.
>>+ `plugin` 额外的插件, 如果没有使用npm安装的话可以把源文件放在这里进行引用.
>>+ `router` SPA的路由配置文件目录.
>>+ `service` 数据服务js.
>>+ `style` 样式文件, 打包后会生成css文件存放到resource/css目录下.
> 4. 修改`config/index.js`中`dev`配置项中的`server.proxyPath`为工具的服务器地址, 以及`server.proxyFor`列表中的项为工具名称, 使用命令`npm start`启动调试服务器, 启动工具后台服务(工具项目的Tomcat), 打开浏览器访问工具运行界面根据引导进行调试.
### 发布流程
*建议早期上线时准备两个包, 一个包含调试信息, 一个是发布包, 在测试版调试完成测试包后, 再上线发布包*
> 1. 使用命令`npm run build`或`npm run dev-build`(包含调试用的sourcemap文件)进行打包.
> 2. 打包完成后, 在`dist/resource`目录下的文件和`dist`目录(如果是`dev-build`则为`dev-dist`目录下)下能够看见`js`,`css`,`images`,`other`和`main.html`, 正好对应着工具资源中的`resource`目录下的内容和单独的一个页面.
> 3. 使用任意文本编辑器, 将`js`目录下的`main.js`中的字符串`"${resourceUrl}/"`(注意双引号)替换为`g_resourceUrl`, 保存文件.
> 4. 把文件按照对应位置分别拷贝到工具的`resource`和`WEB-INF/pages`下.     
> 5. 删除原来的`main.jsp`(如果要还原到调试环境下, 拷贝`tool/main.jsp`回去即可), 把`main.html`文件修改为`main.jsp`, 打开该文件, 在最开始处添加
> ``` html
> <%@ page language="java" import="java.util.*" contentType="text/html; charset=utf-8"%>
> ```
> 在`body`的结束标签前作为第一个script标签添加以下代码
>```html
> <script type="text/javascript">
>   window.g_runToolUrl = '${fyToolUrl}';
>   window.g_callToolUrl = '${fyCallToolUrl}';
>   window.g_forwardUrl = '${fyForwardUrl}';
>   window.g_resourceUrl = '${resourceUrl}';
>   window.g_userId = '${userID}';
>   window.g_accessToken = '${accessToken}';
>   window.g_bandId = '${bViewID}';
>   window.g_rtParam = '${rtParam}';
>   window.g_clientType = '${clientType}';
>   window.g_thisToolId = '${toolID}';
> </script>
>```      
>注意不要更改全局变量的名称以及不要修改其它内容. 保存文件.        
> 5. 启动工具, 进行功能测试(不用webpack调试服务器). 通过后打包为jar准备部署.
### 注意问题
>+ 工具的运行参数请参考`tool/main.jsp`中的`ENV_KEYS`的键. 在工具代码中认为这些键对应的值已存在就好, 直接引用(不过还是建议在`common/env.js`提供接口).
>+ 目前仅支持开发单页应用(SPA).
>+ css如果需要引用图片需使用相对于当前目录的路径即可, 即`../images/xxx.xxx`; 如果在页面中使用img标签引入图片, 请使用vue的数据渲染, 不要使用相对路径(对于工具开发规范来说本来就是不对的), 而要使用绝对路径即`g_resourceUrl+'images/xxx.xxx'`.