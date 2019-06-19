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
>   window.g_runToolUrl = '${fyToolUrl}'; // 数据接口
>   window.g_callToolUrl = '${fyCallToolUrl}'; // 工具调用
>   window.g_forwardUrl = '${fyForwardUrl}'; // 跳转接口
>   window.g_resourceUrl = '${resourceUrl}'; // 静态资源
>   window.g_userId = '${userID}'; // 当前用户账号
>   window.g_accessToken = '${accessToken}'; // 当前用户的accessToken
>   window.g_bandId = '${bViewID}'; // 当前运行的帮区ID
>   window.g_rtParam = '${rtParam}'; // 工具运行参数
>   window.g_clientType = '${clientType}'; // 工具当前的运行平台
>   window.g_thisToolId = '${toolID}'; // 工具的ID
> </script>
>```      
> TOOL SDK 3.0 以后为:      
>```html
> <script type="text/javascript">
>   window.g_runToolUrl = '${actionUrl}'; // 数据接口
>   window.g_callToolUrl = '${runToolUrl}'; // 工具调用
>   window.g_forwardUrl = '${forwardUrl}'; // 跳转接口
>   window.g_resourceUrl = '${resourceUrl}'; // 静态资源
>   window.g_userId = '${userID}'; // 当前用户账号
>   window.g_accessToken = '${accessToken}'; // 当前用户的accessToken
>   window.g_bandId = '${bandID}'; // 当前运行的帮区ID
>   window.g_rtParam = '${toolParam}'; // 工具运行参数
>   window.g_clientType = '${clientType}'; // 工具当前的运行平台
>   window.g_thisToolId = '${toolID}'; // 工具的ID
> </script>
>```          
>注意不要更改全局变量的名称以及不要修改其它内容. 保存文件.      
> 5. 启动工具, 进行功能测试(不用webpack调试服务器). 通过后打包为jar准备部署.
### 注意问题
>+ 工具的运行参数请参考`tool/main.jsp`中的`ENV_KEYS`的键. 在工具代码中认为这些键对应的值已存在就好, 直接引用(不过还是建议在`common/env.js`提供接口).
>+ 目前仅支持开发单页应用(SPA).
>+ 在调试过程第一个错误g_xxx is not defined请忽略它.
>+ css如果需要引用图片需使用相对于当前目录的路径即可, 即`../images/xxx.xxx`; 如果在页面中使用img标签引入图片, 请使用vue的数据渲染, 不要直接使用相对于当前页面所在位置的路径(即使打包了该相对位置也是不对的), 而要使用import的方式引入该图片, 即`import imgUrl from 'images/xxx.xxx'`, 然后将变量`imgUrl`设置到需要的地方.

### 相关文档
#### BaseService
> **基础结构**
> 按照'增删改查'划分为4个模板, 分别为: createTemplate, deleteTemplate, updateTemplate, queryTemplate.       

> *以下模板中使用的参数并非必选的, 这里展示的是典型用法, 额外需求请根据参数作用自行理解使用*

> **完整的Service例子(xxx_service.js, 可拷贝修改使用):**     
>>```js
>> import BaseService from 'service/base_service';
>> import XxxModel from 'model/xxx_model';
>>
>> export default class XxxService extends BaseService {
>>
>>      createXxx(params, callbacks) {
>>          return this.createTemplate(params, callbacks, {
>>              url: '/xxx',
>>              ajaxParams: {
>>                  /* action: 'createXxxImpl', */
>>                  param1: params.param1,
>>                  ...  
>>              },
>>              handleDetailsFetchPlaceholdersFn: (json) => {
>>                  return {
>>                      objId: json.result,
>>                      objType: XxxModel,
>>                      ajaxParams: {
>>                          action: 'getXxxByID',
>>                          param1: json.result,
>>                      },
>>                  };
>>              },
>>              errorTag: 'createXxx',
>>              errorMsg: '创建Xxx失败',
>>          }, {
>>             id: 1000,
>>             title: '创建Xxx',
>>             detail: '创建Xxx',
>>          });
>>      }
>>
>>      updateXxx(params, callbacks) {
>>          return this.updateTemplate(params, callbacks, {
>>              ajaxParams: {
>>                  /* action: 'updateXxxImpl', */
>>                  param1: params.param1,
>>                  ...
>>              },
>>              handleDetailsFetchPlaceholdersFn: () => {
>>                  return {
>>                      objId: params.param1,
>>                      objType: XxxModel,
>>                      ajaxParams: {
>>                          action: 'getXxxByID',
>>                          param1: params.param1,
>>                      },
>>                  };
>>              },
>>              objType: XxxModel,
>>              parentObjId: params.param2,
>>              parentObjType: XxxPModel,
>>              subObjIdsCacheKey: 'xxxx',
>>              errorTag: 'updateXxx',
>>              errorMsg: '更新Xxx失败',
>>          }, {
>>              id: 1001,
>>              title: '更新Xxx',
>>              detail: '更新Xxx',
>>          });
>>      }
>>
>>      deleteXxx(params, callbacks) {
>>          return this.deleteTemplate(params, callbacks, {
>>              ajaxParams: {
>>                  /* action: 'deleteXxxImpl', */
>>                  param1: params.param1,
>>                  ...
>>              },
>>              /* notCacheRemove: true, */
>>              removeObjIDs: params.param1,
>>              objType: XxxModel,
>>              parentObjId: params.param2,
>>              parentObjType: XxxPModel,
>>              subObjIdsCacheKey: 'xxxx',
>>              errorTag: 'deleteXxx',
>>              errorMsg: '删除Xxx失败',
>>          }, {
>>              id: 1002,
>>              title: '删除Xxx',
>>              detail: '删除Xxx',
>>          });
>>      }
>>
>>      getXxx(params, callbacks) {
>>          return this.queryTemplate(params, callbacks, {
>>               ajaxParams: {
>>                  /* action: 'getXxx', */
>>                  param1: params.param1,
>>               },
>>              objType: XxxModel,
>>              parentObjId: params.param1,
>>              parentObjType: XxxPModel,
>>              subObjIdsCacheKey: 'xxxx',
>>              errorTag: 'getXxx',
>>              errorMsg: '获取Xxx失败',
>>          }/* GET方法可以没有Task参数, 允许重复获取, 当然也可以限制 */);
>>      }
>> }
>>```

>> **请求参数**: Service的每个方法的参数格式都是一样的, 以保证修改接口参数后带来的影响最小化. 例如:
>>```js
>> foo(params, callbacks)
>>```
>> 调用请求模板时, 则为:
>>```js
>> return xxxTemplate(params, callbacks, placeholders, task /* GETTER方法可以不要此参数 */);
>>```
>> 其中`params`为参数对象, 包括两个部分: 通用参数(缓存策略, 缓存查询, 返回值指定等, 可选); 业务参数(ajax请求参数等, 由service决定).     
>>> `pagination`: 分页对象{id, page, count, total, totalPage, loaded, left, $pagingEnd, command}, 一般指定id, count, command即可, 其它内容会自动填充. 其中command可用值有next,previous,reset,refresh(默认).   
>>> `singleResult`: 指定只返回单个结果, 如果无结果会直接进入`onFail`回调   
>>> `fromCache`: 允许从缓存中获取, 默认不从缓存中获取.   
>>> `preventAjax`: 不进行ajax请求, 如果不用缓存则请求无效   
>>> `isOnlyDeleteCache`:是否只删除缓存, 用于去除缓存关系.   
>>> `searches`: 搜索条件, 该对象中的内容会直接作为ajax请求参数.   
>>> `cacheSearches`: 搜索缓存的搜索条件, 不使用缓存无效.   
>>> `其它`: 可以有其它参数, 由service定义    
>> **注意: `params`中query, resources, extend, field, sort会被直接JSON.stringify作为参数, 这是吾托帮核心或商店的公共参数, 可以在`constants.js`中`Config`的`COPY_PARAM_NAMES`处修改**

>> 至于`callbacks`则为回调对象(*`onSuccess`同时支持回调和async+await的处理方式*).
>> `callbacks`可用的键有(按调用顺序):
>>> `onStart`: ajax请求开始时回调. 参数: *()*   
>>> `onSuccess`: ajax请求成功拿到正确的数据时回调. 参数: *(结果Model, 该结果的父Model, json)*, 如果没有指定model则第一项永远为null, 没有指定父model则第二项永远为null   
>>> `onFail`: ajax请求没有成功拿到数据, 但是请求是成功的情况下回调, 例如参数错误时. 其中错误消息获取规则为有json中有msg使用msg, 有错误处理器处理就使用该处理结果, 否则使用`placeholders`中的`errorMsg`.参数为: *(错误的提示消息, json)*     
>>> `onError`: ajax请求发生错误回调, 例如服务器没有响应. 参数: *()*    
>>> `onEnd`: ajax请求结束时, 总是回调.参数: *()*    
>>> `onLastPage`: 根据`params`.`pagination`分页到最后一页时回调.参数: *(pagination)*    
>>> `onTooFast`: 同一个Task的请求间隔低于配置最小值时回调. 参数: *()*    
>>> `onPostSame`: 同一个Task的请求在上一次请求未结束时再次请求(不会按参数不同区别)时回调. 参数: *()*  
>>> `onBeforeUpdateCache`: 在更新操作模板中, 用此回调处理更新缓存.参数: *(更新Model, json)*   
>>> `onBeforeDeleteCache`: 在删除操作模板中, 用此回调处理删除缓存.参数: *(删除Model, json)*   

>> 对于`params`和`callbacks`都是由顶层调用方直接传递给Service, 再转给Template调用的, 而`placeholders`用于补充Template执行缺失的信息隐藏于Service这一层, 它也是一个对象, `placeholders`可用的键有:
>>> `url`: 请求的url, 可以为字符串(可忽略baseUrl)或数组(格式为['GET', function|string]).   
>>> `ajaxMethod`: 特别指定的请求方法, 会覆盖上面的.   
>>> `ajaxParams`: 请求参数对象   
>>> `ajaxParamsIntercepter`: 请求参数再处理使用的回调, 参数: *(params, ajaxParams, 父Model)*    
>>> `objType`: 对象模型类型   
>>> `objId`: 对象的ID   
>>> `objIds`: 对象的ID集合   
>>> `parentObjType`:父对象模型类型   
>>> `parentObjId`:父对象ID   
>>> `subObjIdCacheKey`:对象在父对象中的键(单个)   
>>> `subObjIdsCacheKey`:对象在父对象中的键(多个)   
>>> `subObjType`:子对象类型, 同`objType`   
>>> `model`: 在未明确传入`objType`指定模型的情况下可以通过此参数指定`id`和`name`的信息源. {idKey,nameKey}    
>>> `singleResult`:只返回单个结果(默认都是列表).   
>>> `canNotFound`:可以没有返回结果(这样没有结果时不会进行`onFail`)   
>>> `cacheSearches`:进行缓存搜索, 和`params`中使用该参数的区别是: 这里定义了的话则总是这样查询缓存.   
>>> `handleDetailsFetchPlaceholdersFn`: 对于创建和更新的请求, 成功后需要在此获取对应的对象可以通过此方法提供请求的`placeholders`进行处理. 参数 *(json, params)*   
>>> `handleBeforeDeleteCache`:在删除缓存前调用. 参数 *(params, deleteObjs, json)*   
>>> `notCacheRemove`:删除对象时不删除缓存, 常用于删除父对象下的子对象处理.   
>>> `removeObjId`:删除的对象ID(单个)   
>>> `removeObjIds`:删除的对象ID(多个)   
>>> `handleDeleteCachePlaceholdersFn`:删除对象时需要进行级联删除可以通过此方法提供的`placeholders`进行处理.参数 *(json, params)*   
>>> `continueFn`:操作成功后继续进行处理   
>>> `errorTag`: 请求错误标签, 用于错误处理器中识别规则所属使用的key.   
>>> `errorMsg`:默认的请求错误时使用的错误提示.   

>> `task`参数用于标识任务. 允许请求受到一些限制, 比如不允许进行短时间内容的重复请求以及未处理完成的重复请求. 未来会添加错误后自动重试和供用户查看的全局的请求任务列表进行任务管理等等.
>>> `id`: 任务的ID, 识别使用的唯一键   
>>> `title`: 任务的标题    
>>> `detail`: 任务的内容描述   

> **完整的Model例子(xxx_model.js, 可拷贝修改使用):**  
> *建议这样写, model的作用主要是隔离后台返回数据库和前端数据差异的处理逻辑, 在这里可以编写相关的处理代码*     
>>```js
>> import Utils from 'common/utils';
>> 
>> export default class XxxModel {
>>     constructor(row, isFromCache) {
>>          Utils.copyProperties(row, this);
>>          if(isFromCache) {
>>              return this;
>>          }
>>          this.id = row.facilityID.toString();
>>          this.name = row.facilityName;
>>      }
>> }
>> XxxModel.typeName = 'XxxModel';
>> XxxModel.displayName = 'Xxx模型';
>>```

> **使用Service的例子(xxx.vue, 可拷贝修改使用):**  
> **     

>>```js
>> import XxxService from 'service/xxx_service';
>> const xxxService = new XxxService();
>> const xxxModels = await xxxService.getXxx({
>>     param1: 123456,
>>     pagination: {
>>          id: 'unique_id', /* 保证整个应用所有的请求中唯一即可 */ 
>>          page: 1, 
>>          count: 10, 
>>          cammand: 'reset', /* 建议由参数列表传入 */ 
>>     }, /* 这个分页可以作为data里的内容 */
>>     // isSingleResult: true,
>>     // canNotFound: true,
>>     // fromCache: true,
>> }, {
>>      onSuccess: (xxxModels) => {
>>          // 对请求结果的数据进行操作
>>      },
>>      onFail: (exMsg, json) => {
>>          // 对错误结果进行提示
>>      },
>> });
>> if(! xxxModels) {
>>      // 任何错误或者请求失败返回内容都是undefined
>> }
>>```