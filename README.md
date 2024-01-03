# Puppy 截图狗 🐶

基于 Puppeteer 实现的网页截图服务

### 功能

* 页面整页截图
* 指定元素及系列元素截图
* 指定区域截图
* 支持 jpg、png 和 pdf 等

### API

| api         | 请求方法  | 说明     |
| ----------- | --------- | -------- |
| /screenshot | GET、POST | 截图     |
| /pdf        | GET、POST | 生成 pdf |

`http://puppyservice.com/screenshot?url=xxxxxxx`

`http://puppyservice.com/pdf?url=xxxxxxx`

参数列表：（GET 请求时需要 encode）

**公共部分**

| 参数          | 类型           | 默认值   | 说明                                                         |
| ------------- | -------------- | -------- | ------------------------------------------------------------ |
| url           | string         | 必填     | 需要截图的网页地址                                           |
| response_type | string         | url      | 接口返回数据格式: buffer, base64, url                                |
| timeout       | integer        | 60000    | 单位 ms。如果未能在指定时间内截取图片，则返回 timeout 报错。 |
| headers       | array          | null     | 请求头，如 Cookie:sessId=xxxxxxxx。<br />数组形式，get 里为 headers[], post 里为 headers。 |
| wait_for      | integer/string | 200ms    | 等待指定时间 ms，或者等待某个元素出现 (css selector)。<br />如果找不到指定的元素，则报错 |
| zoom          | integer        |          | 网页缩放 10 - 400                                            |
| roi           | string         | null     | 截图区域，格式一：css 选择器，selector:#xxid；格式二：region:x,y,w,h<br />null代表整个页面 |
| full_page     | boolean        |          | 为 true，则代表截取整个页面；false，则仅截取视窗             |
| multi         | boolean        | false    | 是否多个元素截图                                             |
| script        | string         | null     | 使用的内置截图脚本名称，不传则使用默认脚本                   |
| custom_script | string         | null     | 自定义脚本，格式为：function(page) { /** 截图逻辑 */ }       |
|               |                |          |                                                              |
| format        | string         | jpeg     | 输出的文件格式: jpeg, png                                    |
| width         | integer        | null     | 图片输出宽度。null 代表使用实际渲染的宽高                    |
| height        | integer        | null     | 图片输出高度                                                 |
| quality       | integer        | 80       | 图片输出质量 0 - 100                                         |
|               |                |          |                                                              |
| paper         | string         |          | 纸张类型：A4, A3, A2, A1, A0 等                              |
| orientation   | string         | portrait | 方向，portrait, landscape                                    |
| media         | string         | print    | 导出 pdf 的模式： screen 整屏, print 只输出打印区域          |
|               |                |          |                                                              |
| upload:type   | string         |          | 配置的上传方式                                            |
| upload:path   | string         |          | 上传的路径                                   |

#### 响应

success: 200

```json
{
  "filename": "xxxx"
}
```

error: 400 校验数据错误

```json
{
  "error": "URL 无效"
}
```

截图服务的 User-Agent 中会加入 `Puppy`

## 开发

### 目录说明

```
.
├── Dockerfile 
├── logs  日志输出目录
└── src
    ├── index.js      入口文件
    ├── app.js      HTTP 服务
    ├── configs      配置目录
    │   ├── chrome.js  
    │   └── index.js
    ├── middleware       express 中间件
    │   └── error-handler.js  错误处理中间件
    ├── puppy          截图核心逻辑
    │   ├── browser-manager.js 浏览器管理器，管理浏览器（页面）的创建、回收、销毁等
    │   └── index.js      负责加载页面，查找 ROI，以及调度具体的处理器来执行逻辑
    ├── handlers         截图处理器目录
    │   ├── index.js
    │   └── internal.js     内置截图处理器
    └── utils          工具类
        ├── index.js
        └── logger.js
```

### Docker

构建 container

```shell
docker build -t puppy .
```

运行 container

```shell
docker run --rm -d -p 4000:3000 -v xxxxxx/puppy/src:/app --cap-add=SYS_ADMIN --name puppy puppy
```

由于 docker 默认限制了 `/dev/shd` 共享内存为 64MB，完全不够 Chrome 使用。解决方法：

```js
const browser = await puppeteer.launch({
  args: ['--disable-dev-shm-usage'],
});
```

更多问题，参考
<https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-in-docker>
