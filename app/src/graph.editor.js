;
(function (Q, $) {
    'use strict';
    var DRAGINFO_PREFIX = "draginfo";

    function ondrag(evt) {
        var dataTransfer = evt.dataTransfer;
        var img = evt.target;
        dataTransfer.setData("text", img.getAttribute(DRAGINFO_PREFIX));
    }

    /**
     *
     * @param {type} parent
     * @param {type} tag
     * @param {type} className
     * @param {type} innerHTML
     * @param {type} title
     * @returns {unresolved}
     */
    function createElement(parent, tag, className, innerHTML, title) {
        var e = document.createElement(tag);
        if (title || innerHTML) {
            e.setAttribute('title', title || innerHTML);
        }
        if (className) {
            e.className = className;
        }
        if (innerHTML) {
            e.innerHTML = innerHTML;
        }
        if (parent) {
            parent.appendChild(e);
        }
        return e;
    }

//animation
    function animateScrollTo(x, y) {
        if (x instanceof HTMLElement) {
            y = x.offsetTop;
            x = window.scrollX || 0;
        }
        var oldX = window.scrollX || 0;
        var oldY = window.scrollY || 0;
        var time = Math.min(500, Math.abs(x - oldX) + Math.abs(y - oldY));
        var perX = (x - oldX) / time;
        var perY = (y - oldY) / time;

        var now = Date.now();
        var end = now + time;

        function A() {
            var spend = Date.now() - now;
            now = Date.now();
            if (now >= end) {
                window.scrollTo(x, y);
            } else {
                window.scrollTo(oldX = oldX + perX * spend, oldY = oldY + perY
                * spend);
                Q.nextFrame(A);
            }
        }

        A();
    }

    function showDivCenterAt(div, x, y) {
        var width = div.offsetWidth;
        var height = div.offsetHeight;
        div.style.left = (x - width / 2) + 'px';
        div.style.top = (y - height / 2) + 'px';
    }

    var utils = {
        appendDNDInfo: function (img, info) {
            img.setAttribute("draggable", "true");
            img.setAttribute(DRAGINFO_PREFIX, Q.exportJSON(info, true));
            img.ondragstart = ondrag;
            return img;
        },
        getFirstChild: function (parent, childClass) {
            var child = parent.find(childClass);
            if (child.length) {
                return child[0];
            }
        }
    }

    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    var isFileSupported = window.requestFileSystem != null;

    $.fn.graphEditor = function (options) {
        return this.each(function () {
            var editor = this.graphEditor;
            if (!editor) {
                this.graphEditor = editor = new Editor(this, options);
            }
            return editor;
        });
    };

    var createElement = function (className, parent, tag, html) {
        var element = document.createElement(tag || 'div');
        element.className = className;
        $(element).html(html);
        if (parent) {
            parent.appendChild(element);
        }
        return element;
    }

    var forEach = function (object, call, scope) {
        if (Array.isArray(object)) {
            return object.forEach(function (v) {
                call.call(this, v);
            }, scope);
        }
        for (var name in object) {
            call.call(scope, object[name], name);
        }
    }

    var DEFAULT_STYLES = {};
    DEFAULT_STYLES[Q.Styles.SHAPE_FILL_COLOR] = Q.toColor(0xCCCCCCCC);
    DEFAULT_STYLES[Q.Styles.SELECTION_COLOR] = "#888";
    DEFAULT_STYLES[Q.Styles.SELECTION_SHADOW_BLUR] = 5;
    DEFAULT_STYLES[Q.Styles.SELECTION_SHADOW_OFFSET_X] = 2;
    DEFAULT_STYLES[Q.Styles.SELECTION_SHADOW_OFFSET_Y] = 2;

    var defaultImageStyles = {
        fillColor: '#EEE',
        lineWidth: 1,
        strokeStyle: '#2898E0',
        padding: {left: 1, top: 1, right: 5, bottom: 5},
        shadowColor: '#888',
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowBlur: 3
    }
    var nodeImageStyles = {};
    nodeImageStyles[Q.Styles.RENDER_COLOR] = 'renderColor';
    nodeImageStyles[Q.Styles.RENDER_COLOR_BLEND_MODE] = 'renderColorBlendMode';
    nodeImageStyles[Q.Styles.SHAPE_FILL_COLOR] = 'fillColor';
    nodeImageStyles[Q.Styles.SHAPE_STROKE_STYLE] = 'strokeStyle';
    nodeImageStyles[Q.Styles.SHAPE_LINE_DASH] = 'borderLineDash';
    nodeImageStyles[Q.Styles.SHAPE_LINE_DASH_OFFSET] = 'borderLineDashOffset';
    //nodeImageStyles[Q.Styles.SHAPE_FILL_GRADIENT] = 'fillGradient';
    nodeImageStyles[Q.Styles.SHAPE_OUTLINE] = 'outline';
    nodeImageStyles[Q.Styles.SHAPE_OUTLINE_STYLE] = 'outlineStyle';
    nodeImageStyles[Q.Styles.LINE_CAP] = 'lineGap';
    nodeImageStyles[Q.Styles.LINE_JOIN] = 'lineJoin';
    nodeImageStyles[Q.Styles.BACKGROUND_COLOR] = 'backgroundColor';
    nodeImageStyles[Q.Styles.BACKGROUND_GRADIENT] = 'backgroundGradient';
    nodeImageStyles[Q.Styles.BORDER] = 'border';
    nodeImageStyles[Q.Styles.BORDER_COLOR] = 'borderColor';
    nodeImageStyles[Q.Styles.BORDER_LINE_DASH] = 'borderLineDash';
    nodeImageStyles[Q.Styles.BORDER_LINE_DASH_OFFSET] = 'borderLineDashOffset';
    //Styles.IMAGE_BACKGROUND_COLOR = "image.background.color";
    //Styles.IMAGE_BACKGROUND_GRADIENT = "image.background.gradient";
    //Styles.IMAGE_BORDER = "image.border.width";
    //Styles.IMAGE_BORDER_STYLE = Styles.IMAGE_BORDER_COLOR = "image.border.style";
    //Styles.IMAGE_BORDER_LINE_DASH = "image.border.line.dash";
    //Styles.IMAGE_BORDER_LINE_DASH_OFFSET = "image.border.line.dash.offset";
    //Styles.IMAGE_RADIUS = Styles.IMAGE_BORDER_RADIUS = "image.radius";
    //Styles.IMAGE_PADDING = "image.padding";

    //var imageUI = new Q.ImageUI();
    //var imageProperties = {};
    //for(var name in imageUI){
    //    if(name[0] == '_' || name.indexOf('$invalidate') == 0 || imageUI[name] instanceof Function){
    //        continue;
    //    }
    //    if(name[0] == '$'){
    //        name = name.substring(1);
    //    }
    //    imageProperties[name] = imageUI[name];
    //}
    //Q.log(JSON.stringify(imageProperties, null, '\t'));

    function mixStyles(styles){
        if(!styles){
            return defaultImageStyles;
        }
        var result = {};
        for(var name in defaultImageStyles){
            result[name] = defaultImageStyles[name];
        }
        for(var name in styles){
            var propertyName = nodeImageStyles[name];
            if(propertyName){
                result[propertyName] = styles[name];
            }
        }
        return result;
    }

    var onGroupTitleClick = function (evt) {
        var parent = evt.target.parentNode;
        while (parent && !$(parent).hasClass('group')) {
            parent = parent.parentNode;
        }
        if (!parent) {
            return;
        }
        if ($(parent).hasClass('group--closed')) {
            $(parent).removeClass('group--closed');
        } else {
            $(parent).addClass('group--closed');
        }
    }

    function isImage(image) {
        return Q.isString(image) || image.draw instanceof Function;
    }

    function createToolboxGroup(groupInfo, name) {
        name = groupInfo.name || name;
        var root = groupInfo.root;
        var images = groupInfo.images;

        var group = createElement('group');
        var title = createElement('group__title', group);
        title.onclick = onGroupTitleClick;
        createElement(null, title, 'span', name);
        createElement('icon group-expand', title, 'span');
        var items = createElement('group__items', group);
        var clearDiv = document.createElement('div');
        clearDiv.style.clear = 'both';
        group.appendChild(clearDiv);

        if (!images) {
            return group;
        }

        //var images = [{
        //    type: '图元类型',
        //    label: '图元文本',
        //    image: '图元图片',
        //    imageName: '图片名称',
        //    styles: '图元样式',
        //    properties: '图元属性',
        //    clientProperties: '图元client属性',
        //    html: '拖拽html内容'
        //}, 'a.png', {draw: function(g){}}];
        //var group = {
        //    name: '分组名称',
        //    root: '根目录',
        //    images: images//'拖拽图片信息'
        //}

        var imageWidth = groupInfo.imageWidth || this.imageWidth;
        var imageHeight = groupInfo.imageHeight || this.imageHeight;

        forEach(images, function (imageInfo, name) {
            if (name == '_classPath' || name == '_className') {
                return;
            }
            var image;
            if (isImage(imageInfo)) {
                image = imageInfo;
            } else {
                image = imageInfo.image;
            }
            var imageDiv, tooltip;
            if (image) {
                var imageName;
                if (Q.isString(image)) {
                    imageName = image;
                    if (!Q.hasImage(image) && root) {
                        image = root + image;
                    }
                } else {
                    imageName = imageInfo.imageName || imageInfo.name || name || 'drawable-' + this._index++;
                }
                if (!Q.hasImage(imageName)){
                    Q.registerImage(imageName, image);
                }
                imageDiv = Q.createCanvas(imageWidth, imageHeight, true);
                Q.drawImage(imageName, imageDiv, mixStyles(imageInfo.styles));
                if (isImage(imageInfo)) {
                    imageInfo = {image: imageName};
                } else {
                    imageInfo.image = imageName;
                }

                tooltip = imageName;
            } else if (imageInfo.html) {
                var imageDiv = document.createElement('div');
                imageDiv.style.width = imageWidth + 'px';
                imageDiv.style.height = imageHeight + 'px';
                imageDiv.style.lineHeight = imageHeight + 'px';
                imageDiv.style.overflow = 'hidden';
                imageDiv.innerHTML = imageInfo.html;
            } else {
                return;
            }
            tooltip = imageInfo.tooltip || imageInfo.label || tooltip || name;
            imageDiv.setAttribute('title', tooltip);
            var item = createElement('group__item', items);
            utils.appendDNDInfo(imageDiv, imageInfo);
            item.appendChild(imageDiv);
        }, this)
        return group;
    }

    var getFirstChild = function (parent, childClass) {
        var child = parent.find(childClass);
        if (child.length) {
            return child[0];
        }
    }

    function Editor(editor, options) {
        options = options || {};
        this.dom = editor;
        $(editor).addClass('layout graph-editor');

        this.createGraph(options.styles || DEFAULT_STYLES);
        this.createToolbar();
        this.createToolbox();
        //this.createPropertyPane();
        this.createJSONPane();
        $(editor).borderLayout();

        var callback = options.callback || function(){
                this.graph.moveToCenter();
            }
        if (this.toolbar) {
            this.initToolbar(this.toolbar, this.graph);
        }
        if (this.toolbox) {
            this.initToolbox(this.toolbox, this.graph, options.images);
        }
        this.initContextMenu(this.graph);

        if (options.data) {
            this.loadDatas(this.graph, options.data, callback);
        }else{
            callback.call(this, this);
        }
    }

    Editor.prototype = {
        _getFirst: function (childClass) {
            return getFirstChild($(this.dom), '.' + childClass);
        },
        imageWidth: 40,
        imageHeight: 40,
        toolbar: null,
        toolbox: null,
        propertyPane: null,
        graph: null,
        createGraph: function (styles) {
            var canvas = this._getFirst('graph-editor__canvas');
            if (!canvas) {
                canvas = createElement('graph-editor__canvas', this.dom);
                canvas.setAttribute('data-options', 'region:"center"');
            }
            var graph = this.graph = new Q.Graph(canvas);
            graph.allowEmptyLabel = true;
            graph.originAtCenter = false;
            graph.editable = true;
            graph.styles = styles;
            graph.getDropInfo = function(evt, text){
                if(text){
                    return Q.parseJSON(text);
                }
            }
            return graph;
        },
        createToolbar: function () {
            var toolbar = this._getFirst('graph-editor__toolbar');
            if (toolbar) {
                return this.toolbar = toolbar;
            }
            this.toolbar = toolbar = createElement('graph-editor__toolbar', this.dom);
            toolbar.setAttribute('data-options', 'region:"north", height: 40');
            return toolbar;
        },
        createToolbox: function () {
            var toolbox = this._getFirst('graph-editor__toolbox');
            if (toolbox) {
                return this.toolbox = toolbox;
            }
            this.toolbox = toolbox = createElement('graph-editor__toolbox', this.dom);
            toolbox.setAttribute('data-options', "region:'west', width:'18%', left:15, min-width:100, max-width:300");
            return toolbox;

        },
        createPropertyPane: function () {
            var propertyPane = this._getFirst('graph-editor__property');
            if (propertyPane) {
                return this.propertyPane = propertyPane;
            }
            this.propertyPane = propertyPane = createElement('graph-editor__property', this.dom);
            propertyPane.setAttribute('data-options', "region:'east', width: '20%', right: 15, min-width: 100, max-width: '300'");
            return propertyPane;
        },
        getJSONTextArea: function () {
            return getFirstChild($(this.jsonPane), 'textarea');
        },
        exportJSON: function (toString) {
            if (toString && this.jsonPane) {
                var json = this.graph.exportJSON(true, {space: '  '});
                return this.getJSONTextArea().value = json;
            }
            return this.graph.exportJSON.apply(this.graph, arguments);
        },
        submitJSON: function (evt) {
            var json = this.getJSONTextArea().value;
            this.graph.clear();
            this.graph.parseJSON(json);
        },
        createJSONPane: function () {
            var jsonPane = this._getFirst('graph-editor__json');
            if (jsonPane) {
                return this.jsonPane = jsonPane;
            }
            this.jsonPane = jsonPane = createElement('graph-editor__json', this.dom);
            jsonPane.appendChild(document.createElement('textarea'));

            var buttonGroup = createElement('graph-editor__json__buttons', jsonPane);

            var jsonButtons = [
                {name: '更新', action: this.exportJSON.bind(this)},
                {name: '提交', action: this.submitJSON.bind(this)}
            ]
            Q.createButtonGroup(jsonButtons, buttonGroup);
            jsonPane.style.display = 'none';
            return jsonPane;
        },
        _index: 0,
//初始化数据
        loadDatas: function (graph, url, callback) {
            Q.loadJSON(url, function (json) {
                graph.parseJSON(json);
                if(callback instanceof Function){
                    callback.call(this, this);
                }
            }.bind(this))
        },
        _createToolBoxItems: function (groups, toolbox) {
            if(Q.isArray(groups)){
                forEach(groups, function (group, name) {
                    toolbox.appendChild(createToolboxGroup.call(this, group, name));
                }, this);
                return;
            }
            toolbox.appendChild(createToolboxGroup.call(this, groups));
        },
//初始化拖拽节点列表
        initToolbox: function (toolbox, graph, groups) {
            //var defaultNodes = [{type: "Group", label: "分组"}];

            //Q.Graphs.group.type = 'Q.Group';
            var basicNodes = [{
                label: 'Node',
                image: 'Q-node'
            }, {
                type: 'Text',
                label: 'Text',
                html: '<span style="background-color: #2898E0; color:#FFF; padding: 3px 5px;">文本</span>',
                styles: {
                    'label.background.color': '#2898E0',
                    'label.color': '#FFF',
                    'label.padding': new Q.Insets(3, 5)
                }
            }, {
                type: 'Group',
                label: 'Group',
                image: 'Q-group'
            }, {
                label: 'SubNetwork',
                image: 'Q-subnetwork',
                properties: {enableSubNetwork: true}
            }];

            var innerGroups = [{name: '基本节点', images: basicNodes}, {name: '注册图标', images: Q.getAllImages()}, {
                name: '内置形状',
                images: Q.Shapes.getAllShapes(this.imageWidth, this.imageHeight)
            }];
            this._createToolBoxItems(innerGroups, toolbox, 'Q-');
            if (groups) {
                this._createToolBoxItems(groups, toolbox);
            }
        },

//初始化工具栏
        initToolbar: function (toolbar, graph) {
            Q.createToolbar(graph, toolbar, {
                save: {
                    name: '导出JSON', iconClass: 'icon toolbar-json', action: this.showJSONPanel.bind(this)
                }
            })
        },
        showExportPanel: function (evt) {
            Q.showExportPanel(this.graph);
        },
        showJSONPanel: function (evt) {
            var button = evt.target;
            if (!$(button).hasClass('btn')) {
                button = button.parentNode;
            }
            var isDown = $(button).hasClass('active');
            isDown ? $(button).removeClass('active') : $(button).addClass('active');
            isDown = !isDown;

            var jsonPane = this.jsonPane;

            jsonPane.style.display = isDown ? '' : 'none';
            if (isDown) {
                this.exportJSON(true);
            }
        },
//初始化右键菜单
        initContextMenu: function (graph) {
            graph.popupmenu = new Q.PopupMenu();
        }
    }
})(Q, jQuery);
