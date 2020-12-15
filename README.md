# min-map-js

将对象转为 SVG 脑图

## 使用

**import**

```js
yarn add mind-map-js
//or
npm install mind-map-js
```

项目中引入使用

```js
import mindMap from 'mind-map-js'
mindMap(data, options)
```

**script 标签引入**

下载 `mind-map-js` 并放到项目中 

```js
<script src="mind-map-js.js"></script>
<script>
  mindMap(data, options)
</script>
```

## 参数说明

- `{Object|Array[Object]} data`: 数据源，可以是对象或对象数组，每一个对象应包含的 `key` 为：

  - `{String} label`: 名称，如果没有 `label` 属性，可使用 `options.name` 指定一个 `key` 作为 `label` 使用
  
  - `{Array[Object]} children`: 子节点
  
- `{Object} options`（可选）: 绘制配置（以下配置都是可选）
  
  - `{String||null} direction`: 绘制模式，可选值为 `right`，指定 `right`时表示所有的元素将绘制在中心点的右侧，默认绘制在中心点两侧
  
  - `{String} name`: 如果没有 `label` 字段，可用 `name` 批定哪个 `key` 作为 `label` 使用

  - `{Function} callback`: 点击每一项子元素时触发的回调函数，参数将返回当前对象信息
  
  - `{String} className`: 给 svg 贬值的一个类名
  
  - `{Object} rectStyle`： 绘制 `{svg}rect` 的样式配置（包含 `children` 属性对象都用 `rect` 绘制）
    
    ```js
    // 粟子：
     {
       'font-size': '16px', // 文字大小
       'border-radius': '5', // 圆角大小
       color: '#fff', // 文字颜色
       fill: '#a3c6c0', // 背景颜色
       padding: '2 10', // 文字与边框的间距，同 CSS padding，支持格式 `padding: x` 和 `padding: x x`, 不支持 `padding: x x x x`
     }
    ```
    
  - `textStyle`： 绘制 `{svg}text` 的样式配置（不包含 `children` 属性对象都用 `text` 绘制） 
      
    ```js
    // 粟子：
     {
       'font-size': '16px', // 文字大小
       color: '#fff', // 文字颜色
     }
    ```
  
  - `lineStyle`： 绘制 `{svg}line` 连接线的样式配置
    
    ```js
     // 粟子：
     {
       width: 1, // 线条宽度
       color: '#fff', // 文字颜色  默认值为 textStyle.color
     }
    ```
   
  - `rootStyle`： 绘制`{svg}rect` 中心点的样式配置
    
  ```js
  // 粟子：
   {
     'font-size': '18px', // 文字大小
     'border-radius': '5', // 圆角大小
     color: '#fff', // 文字颜色
     fill: 'transparent', // 背景颜色
     padding: 0, // 文字与边框的间距，同 CSS padding，支持格式 `padding: x` 和 `padding: x x`, 不支持 `padding: x x x x`
   }
  ```

  - `globalStyle`： 绘制元素布局相关的样式配置
    
    ```js
    // 粟子：
     {
       verticalMargin: 20, // 元素上下间距
       rowMargin: 40, // 元素左右间距
     }
    ```

