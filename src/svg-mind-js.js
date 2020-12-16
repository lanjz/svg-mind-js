;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory :
      typeof define === 'function' && define.amd ? define(factory) :
        global.mindMap = factory
}(this, createMind))
function getPadding(val) {
    if(!val) return [0, 0]
    val = (''+val).trim()
    val = val.split(' ')
    if(val.length === 1){
        let d = val[0] || 0
        return [d, d]
    }
    return [val[0] || 0, val[val.length - 1] || 0]
}
function getTranslate(val){
    if(!val) return { x: 0, y: 0 }
    let reg = /translate\(.*(\d+).*(\d+).*/g
    let result = reg.exec(val)
    if(result){
        return {
            x: result[1],
            y: result[2],
        }
    }
    return { x: 0, y: 0 }
}
function setTransform(el, key, value){
    if(!el) return
    let getValue = el.style.getPropertyValue('transform')
    if(!getValue){
        getValue = `${key}${value}`
    } else if(getValue.indexOf(key) < 0){
        getValue = `${getValue} ${key}${value}`
    } else {
       let reg = new RegExp("(?<="+key+")\\(.*?\\)", "g")
        getValue = getValue.replace(reg, value)
    }
    el.style.setProperty('transform', getValue)
}
function cSvgDom() {
    const svgDom = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svgDom.setAttribute('version','full');
    svgDom.setAttribute('baseProfile','baseProfile');
    // svgDom.setAttribute('style', `background: #272b2d`)
    svgDom.setAttribute('xmlns','http://www.w3.org/2000/svg');
    return svgDom
}
// 创建SVG-元素
function cEl(tag, attr) {
    attr = {
        fill: '#000',
        y: attr.initY || 0,
        ...attr,
    }
    const el = document.createElementNS('http://www.w3.org/2000/svg',tag);
    Object.keys(attr).forEach(item => {
        el.setAttribute(item, attr[item]);
    })
    return el
}
// 创建组
function createGroup(attr = {}) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    Object.keys(attr).forEach(item => {
        g.setAttribute(item, attr[item]);
    })
    return document.createElementNS('http://www.w3.org/2000/svg', 'g')
}
function SvgMap(data, options = {}) {
    if(!data && typeof data !== 'object'){
        console.error('svgMap: 无效的数据源')
    }
}
/**
 * @params {Object} data: 数据
 * @params {Object} options: 配置项
 * @property {String} options.title： 主题
 * @property {String <right, null>} options.direction： svg 延展方向, 默认为 null
 * @property {String} options.name：label 的字段名，默认为 label
 * @property {String} options.className：赋加到 svg 上的类名
 * @property {Function} options.callback：点击元素后的回调函数
 * @property {Function} options.rootStyle：中心点样式
 * @property {Function} options.rectStyle：父级元素样式
 * @property {Function} options.textStyle：子级文字样式
 * @property {Function} options.lineStyle：连接线样式
 * */
SvgMap.prototype.init = function(data, options = {}) {
    const copyData = JSON.parse(JSON.stringify(data))
    const type = Object.prototype.toString.call(copyData)
    if(type === '[object Array]'){
        this.data = {
            [options.name||'label']: options.title || 'Root',
            children: copyData
        }
    } else {
        this.data = copyData
    }
    // right: 只呈现在右侧， 默认左右呈现
    this.direction = options.direction|| ''
    this.lableName = options.name || 'label'
    this.callback = options.callback || null
    this.className = options.className || null
    // 中心点样式
    this.rootStyle = {
        'font-size': '18px',
        'border-radius': '5',
        color: '#fff',
        // fill: 'transparent',
        fill: '#a3c6c0',
        padding: '4 8',
        ...(options.rootStyle||{})
    }
    // rect样式
    this.rectStyle = {
        'font-size': '16px',
        'border-radius': '5',
        color: '#fff',
        fill: '#a5a4a4',
        padding: '2 10',
        ...(options.rectStyle||{})
    }
    // text样式
    this.textStyle = {
        'font-size': '16px',
        color: '#a5a4a4',
        ...(options.textStyle||{})
    }
    // 连接线样式
    this.lineStyle = {
        color: this.textStyle.color,
        width: 1,
        fill: 'transparent',
        ...(options.lineStyle||{})
    }
    // 其它布局样式
    this.globalStyle = { 
        verticalMargin: 25, // 元素上下间距
        rowMargin: 40, // 元素左右间距
    }
    let result = this.draw()
    this.addEvent()
    return result
}
SvgMap.prototype.draw = function () {
    this.svgDom = cSvgDom()
    this.svgDom.that = this
    this.svgGroup = createGroup()
    this.svgDom.setAttribute('style', 'opacity: 0; position: fixed; left: 0; top: 0')
    this.svgDom.appendChild(this.svgGroup)
    document.body.appendChild(this.svgDom)
    // 创建中点元素
    let RootG = this.createRootG()
    this.svgGroup.appendChild(RootG)
    this.svgDom.appendChild(this.svgGroup)
    const child = this.data.children || []
    let childRight, childLeft
    if(!this.direction && child.length > 1){
        const half = Math.floor(child.length/2)
        const left = child.splice(0, half)
        // 绘制左侧的元素
        childLeft = this.initWalk(left, 'left')
        this.svgGroup.appendChild(childLeft)
    }
    // 绘制右侧的元素
    if(child.length > 0){
        childRight = this.initWalk(child)
        this.svgGroup.appendChild(childRight)
    }
    this.combineSvg(RootG, childRight, childLeft) // 将三个元素组合在一起
    // 由于文字向上偏移将导致部分溢出,所以将this.svgGroup向下偏移溢出的部分
    setTransform(this.svgGroup, 'translateY', `(${Math.abs(this.getRect(this.svgGroup).y)}px)`)
    const { width: svgW, height: svgH } = this.svgDom.getBBox()
    this.svgDom.setAttribute('width', svgW)
    this.svgDom.setAttribute('height', svgH)
    this.svgDom.removeAttribute('style')
    !!this.className&&this.svgDom.classList.add(this.className)
    this.svgDom.remove()
    return this.svgDom
}
SvgMap.prototype.combineSvg = function(RootG, childRight, childLeft){
    if(!childRight) return
    let centerY = '' // 保存中心点的位置
    // 连接中心点和右侧元素
    let {el: drawRightResult, center: rightEnter} = this.drawRootLine(childRight, RootG)
    centerY = rightEnter.y
    this.svgGroup.insertBefore(drawRightResult, this.svgGroup.firstChild)
    if(!!childLeft){
        let {el: drawLeftResult, center: leftEnter} = this.drawRootLine(childLeft, RootG)
        this.svgGroup.insertBefore(drawLeftResult, this.svgGroup.firstChild)
        // 1. 水平翻转，完成左侧绘制
        drawLeftResult.setAttribute('style', `transform: rotateY(180deg)`)
        // 2. 为了显示翻转后的图形，将 svgGroup 向右偏移
        setTransform(this.svgGroup, 'translateX', `(${this.getRect(drawLeftResult).width}px)`)
        // 3. 设置左右两边图形垂直居中
        let dis = Math.abs((rightEnter.y - leftEnter.y)) // 获取差量
        if(rightEnter.y > leftEnter.y){
            drawLeftResult.setAttribute('style', `transform: rotateY(180deg) translateY(${dis}px)`)
        } else {
            centerY = leftEnter.y
            drawRightResult.setAttribute('style', `transform: translateY(${dis}px)`)
        }
    }
    // 将中点元素放在中心位置
    const { width: rootW, height: rootY} = this.getRect(RootG)
    RootG.setAttribute('transform', `translate(-${rootW/2}, ${centerY - rootY/2})`)
    if(!childLeft){
        // 没有左元素时， 中心点向左溢出一半的宽度，通过偏移纠正偏移量
        setTransform(this.svgGroup, 'translateX', `(${Math.abs(this.getRect(this.svgGroup).x)}px)`)
    }
}
SvgMap.prototype.initWalk = function(tree, direction) {
    const gGroup = this.walk(tree, direction, true)
    return gGroup
}
SvgMap.prototype.walk = function (tree, direction) {
    const svgElArr = []
    let hei = 0 // 设置每个元素的偏移高度
    tree.forEach((item) => {
        let textOpt = {
            'font-size': this.textStyle['font-size'],
            text: item[this.lableName],
            fill: this.textStyle.color,
            initY: hei,
        }
        let rectTextOpt = {
            'font-size': this.rectStyle['font-size'],
            text: item[this.lableName],
            fill: this.rectStyle.color,
            initY: hei,
        }
        const rectOpt = {
            'rx': this.rectStyle['border-radius'],
            'ry': this.rectStyle['border-radius'],
            'padding': this.rectStyle.padding,
            fill: this.rectStyle.fill,
            initY: hei,
        }
        let svgEl = item.type === 'text' ? this.cWord(textOpt, rectOpt) : this.cReact(rectTextOpt, rectOpt, direction)
        svgEl['data-info'] = item
        // 如果有子节点, 给当前 rect 右侧添加小圆圈
        if(item.children && item.children.length){
            this.appendCircle(svgEl, direction)
        }
        // 如果是左侧的元素则水平翻转
        if(direction === 'left'){
            svgEl.style.setProperty('transform-origin', `${this.getRect(svgEl).width/2}px ${this.getRect(svgEl).height/2}px`)
            setTransform(svgEl, 'rotateY', '(180deg)') // 使用方法设置,避免其它属性被覆盖
        }
        // 如果有子节点，则递归子节点后再与当前节点合并成一个G{svg}
        if(item.children && item.children.length) {
            const childSvgEl = this.walk(item.children, direction)
            svgEl = this.combineGroup(svgEl, childSvgEl, item)
        }
        hei += ((this.getRect(svgEl)).height + this.globalStyle.verticalMargin)
        svgElArr.push(svgEl)
    })
    return this.createListGroup(svgElArr) // 返回组成G{svg}
}
SvgMap.prototype.appendCircle = function (cG, direction = 'right'){
    const { width, height, y } = this.getRect(cG)
    const circle = cEl('circle', {
        cx: direction === 'left' ? -5: width + 5,
        cy: y + height/2,
        r: 5,
        fill: this.lineStyle.color,
        'stroke-width': 1,
    })
    cG.appendChild(circle)
}
SvgMap.prototype.createRootG = function(){
    const textOptions = {
        text: this.data[this.lableName],
        fill: this.rootStyle.color,
        'font-size': this.rootStyle['font-size']
    }
    const rectOptions = {
        fill: this.rootStyle.fill,
        'rx': this.rootStyle['border-radius'],
        'ry': this.rootStyle['border-radius'],
        'padding': this.rootStyle.padding,
    }
    let rect = this.cReact(textOptions, rectOptions)
    rect['data-info'] = this.data
    return rect
}
/**
 * 创建SVG-ellipse元素
 * @params {Object} textOptions: 文字相关的配置
 * @params {Object} rectOptions: 矩形相关的配置
 * */
SvgMap.prototype.cReact = function(textOptions, rectOptions = {}) {
    const { text, ...txtOpt } = textOptions
    const { padding } = rectOptions
    const cG = createGroup()
    let sText = this.cText(text, { padding, ...txtOpt })
    let [pt, pl] = getPadding(padding)
    let rectWidth = sText.rect.width + (2 * pl)
    let rectHeight = sText.rect.height + (2 * pt)
    rectOptions = {
        x: 0,
        width: rectWidth,
        height: rectHeight,
        ...rectOptions
    }
    const rect = cEl('rect', rectOptions)
    cG.appendChild(rect)
    cG.appendChild(sText)
    return cG
}
/**
 * 创建文本类型的 svg 元素
 * */
SvgMap.prototype.cWord = function(textOptions, rectOptions = {}) {
    const { text, ...txtOpt } = textOptions
    const { padding } = rectOptions
    const cG = createGroup()
    let [pt, pl] = getPadding(padding)
    let sText = this.cText(text, { padding: `0 ${pl}`, ...txtOpt })
    rectOptions = {
        x: 0,
        width: sText.rect.width + (2 * pl),
        height: sText.rect.height + (2 * pt),
        ...rectOptions,
        fill: 'transparent'
    }
    const rect = cEl('rect', rectOptions)
    cG.appendChild(rect)
    cG.appendChild(sText)
    // 为了连线的时候整齐，跟普通rect一样连到中间的点，所以将文本上向偏移到中间位置
    setTransform(cG, 'translate', `(${getTranslate(sText).x}px, ${getTranslate(sText).y-12}px)`)
    cG.dataType = 'text'
    return cG
}
// 创建SVG-文本元素
/**
 * @params <String> txt : 文本
 * @params <Object> attr: 样式 { fill: '颜色', 'font-size': '文字大小', initY: 偏移高度}
 * */
SvgMap.prototype.cText = function (txt, options = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg','text');
    let { padding = 0, initY, ...attr } = options
    let [pt, pl] = getPadding(padding)
    attr = {
        // dominantBaseline: 'bottom',
        x: pl,
        ...attr
    }
    Object.keys(attr).forEach(item => {
        el.setAttribute(item, attr[item]);
    })
    el.textContent = txt
    let rect = this.getRect(el)
    // svg无法知道文字高度，且文字基准线在底部，当文字出现时文字会向上偏移（偏移量为文字高度）
    el.setAttribute('transform', `translate(0, ${-rect.y})`);// 默认情况文本向偏上，不能垂直居中，所以纠正一下
    el.setAttribute('y', (+pt)+(initY||0));
    return el
}
/**
 * 绘制中心点到最近元素的线
 * @params {svg[g]} group
 * */
SvgMap.prototype.drawRootLine = function(group, root) {
    const cG = createGroup()
    let rootX = 0
    let rootW = this.getRect(root).width
    const endPoint = rootW + this.globalStyle.rowMargin // 计算a,b的间距
    group.setAttribute('transform', `translate(${endPoint}, 0)`) // g 没有 x y属性
    const aHeight = this.findMiddlePosition(group) // 计算垂直方向的中间位置
    const rootCenterX = 0
    const rootCenterY = aHeight
    const M = `${rootCenterX} ${rootCenterY}`
    group.childNodes.forEach(item => {
        const {y: itemY, height} = this.findPositionElY(item)
        const targetX = Number(rootX) +this.globalStyle.rowMargin + rootW
        const targetY = Number(itemY) + Number(height) / 2
        const Q = `${rootCenterX} ${targetY}`
        let E = `${targetX} ${targetY}`
        if(item.dataType === 'text'){ // 是文本元素
            E = E+` h ${this.getRect(item).width}` // 结束的位置
        }
        const line = cEl('path', {
            d: `M${M} Q ${Q} ${E}`,
            style: `stroke:${this.lineStyle.color}`,
            'stroke-width': this.lineStyle.width,
            stroke: this.lineStyle.color,
            fill: 'transparent'
        })
        cG.appendChild(line)
    })
    cG.appendChild(group)
    return {
        el: cG,
        center: {
            x: rootCenterX,
            y: rootCenterY
        }
    }
}
/**
 * @params {svg[g]} a: 父级元素
 * @params {svg[g]} b: a对应的子元素
 * */
SvgMap.prototype.combineGroup = function(a, b) {
    const cG = createGroup()
    const {y: aY, width: aWidth, height: aHeight } = this.getRect(a) // 当前A的几何信息
    const bX = aWidth + this.globalStyle.rowMargin // 计算a,b的间距
    const middleByA = aHeight/2
    // const middleByGroup = this.getRect(b).height/2 // 这个方式取到的整体的中间值，这里需要的 a 一级子元素的中间位置
    const middleByGroup = this.findMiddlePosition(b) // 计算a在b垂直方向的中间位置
    // 1. 将b放在a的右侧 且与a水平对齐
    b.setAttribute('transform', `translate(${bX}, ${aY})`) // g 没有 x y属性
    // 2. 在上一步对齐的基础上,将 a 放到 b 垂直居中的位置
    a.childNodes.forEach(node => {
        if(node.tagName === 'circle') {
            let curY = node.getAttribute('cy') * 1
            node.setAttribute('cy', middleByGroup+curY-middleByA) // （步骤A）相对b的居中位置 + 原本的偏移量
        } else {
            let curY = node.getAttribute('y') * 1
            node.setAttribute('y', middleByGroup+curY-middleByA) // （步骤A）相对b的居中位置 + 原本的偏移量
        }
    })
    cG.appendChild(a)
    cG.appendChild(b)
    // 绘制连接线
    b.childNodes.forEach(item => {
        const {y: positionY, height} = this.findPositionElY(item) // 获取元素在当前组内的Y偏移量
        const M = `${aWidth} ${(aY + middleByGroup)}` // 起点 从父级rect 右侧垂直居中的位置
        const C1 = `${aWidth+20} ${(aY + middleByGroup)}` // 开始转弯的位置
        let endY = Number(positionY) + Number(aY)+height/2 // 结束时的 Y 位置
        const C2 = `${bX - 20} ${endY}` // 结束转弯的位置,子元素左侧位置
        let E = `${bX} ${endY}`
        if(item.dataType === 'text'){ // 是文本元素
            E = E+` h ${this.getRect(item).width}` // 结束的位置
        }
        const line = cEl('path', {
            d: `M${M} C ${C1} ${C2} ${E}`,
            style: `stroke:${this.lineStyle.color}`,
            'stroke-width': this.lineStyle.width,
            stroke: this.lineStyle.color,
            fill: 'transparent'
        })
        cG.appendChild(line)
    })
    return cG
}
// 将同父的元素放同一个组中
SvgMap.prototype.createListGroup = function (svgElArr) {
    const cG = createGroup()
    svgElArr.forEach((item, ind) => {
        cG.appendChild(item)
    })
    return cG
};
/**
 *  获取子元素集合中的垂直居中位置
 *  @params {svg} el, svg元素
 * */
SvgMap.prototype.findMiddlePosition =function(el){
    const firstEl = el.firstChild
    const {y: firstElY, height: firstH} = this.findPositionElY(firstEl)
    const lastEl = el.lastChild
    const {y: lastElY} = this.findPositionElY(lastEl)
    const result = (lastElY*1 + firstElY*1+firstH*1) / 2 //first的下边与last的上边的中间位置
    return result
}
/**
 *  获取元素几何信息
 *  注意：g 元素没有记录几何信息，通过查找g元素下的非g元素，来获取当前g的垂直偏移量
 *  @params {svg} el, svg元素
 * */
// 获取某在元素在的Y偏移量
SvgMap.prototype.findPositionElY = function(el){
    while (el.tagName === 'g'){
        el = el.firstChild
    }
    return {
        y: el.getAttribute('y'),
        x: el.getAttribute('x'),
        width: el.getAttribute('width'),
        height: el.getAttribute('height'),
    }
}
/**
 * 获取元素几何信息，需要在DOM才能得到这些信息，所以先执行appendChild
 * 要注意appendChild后修改节点位置，所以切勿在插入到正确位置后再执行这个方法
 * */
SvgMap.prototype.getRect = function (g){
    if(document.body.contains(g)){
        let rect = g.getBBox()
        g.rect = rect
    } else if(g.rect){
        return g.rect
    } else {
        this.svgGroup.appendChild(g)
        let rect = g.getBBox()
        g.rect = rect
        g.remove()
    }
    return g.rect
}
SvgMap.prototype.addEvent = function(){
    const _this = this
    this.svgDom.addEventListener('click', function (e) {
        if(e.target.tagName === 'circle') {
            // _this.virtualSvg[key].hide = !_this.virtualSvg[key].hide
            // _this.virtualSvg[key].childDom.forEach(item => {
            //     item.style.display = _this.virtualSvg[key].hide ? 'none' : 'block'
            // })
            // e.target.style.opacity = _this.virtualSvg[key].hide ? '.5' : '1'
        } else if(e.target.tagName === 'rect' || e.target.tagName === 'text'){
            _this.callback && _this.callback(e.target.parentNode['data-info'])
        }
    })
}
function createMind(data, options) {
    return (new SvgMap(data, options)).init(data, options)
}