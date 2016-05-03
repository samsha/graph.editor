;
(function (Q, $) {
    'use strict';

    var createElement = function (className, parent, tag, html) {
        return Q.createElement({class: className, parent: parent, tagName: tag, html: html});
    }
    var getFirstChild = function (parent, childClass) {
        var child = parent.find(childClass);
        if (child.length) {
            return child[0];
        }
    }
    $.fn.graphEditor = function (options) {
        return this.each(function () {
            var editor = this.graphEditor;
            if (!editor) {
                this.graphEditor = editor = new Editor(this, options);
            }
            return editor;
        });
    };

    var DEFAULT_STYLES = {};
    DEFAULT_STYLES[Q.Styles.SHAPE_FILL_COLOR] = Q.toColor(0xCCCCCCCC);
    DEFAULT_STYLES[Q.Styles.SELECTION_COLOR] = "#888";
    DEFAULT_STYLES[Q.Styles.SELECTION_SHADOW_BLUR] = 5;
    DEFAULT_STYLES[Q.Styles.SELECTION_SHADOW_OFFSET_X] = 2;
    DEFAULT_STYLES[Q.Styles.SELECTION_SHADOW_OFFSET_Y] = 2;

    function Editor(editor, options) {
        this._initEditor(editor, options);
        this.loadDatas(this.options.data, this.options.callback || function () {
            this.graph.moveToCenter();
        });
    }

    Editor.prototype = {
        _initEditor: function (editor, options) {
            this.options = options = options || {};
            this.dom = editor;
            $(editor).addClass('layout graph-editor');
            this.createGraph(this.options.styles || DEFAULT_STYLES);
            this.createToolbar(options);
            this.createToolbox(this.options.images);
            this.createPropertyPane(options);
            this.createJSONPane();
            $(editor).borderLayout();

            if (this.toolbar) {
                this.initToolbar(this.toolbar, this.graph);
            }
            this.initContextMenu(this.graph);
            window.addEventListener('beforeunload', this.onbeforeunload.bind(this));
        },
        onbeforeunload: function (evt) {
            //this.saveLocal();
        },
        _getFirst: function (childClass) {
            return getFirstChild($(this.dom), '.' + childClass);
        },
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
            graph.getDropInfo = function (evt, text) {
                if (text) {
                    return Q.parseJSON(text);
                }
            }
            graph.dropAction = function(){
                return this.dropAction.apply(this, arguments);
            }.bind(this);
            $(canvas).bind('size.change', function () {
                graph.updateViewport();
            })
            return graph;
        },
        dropAction: function(evt, xy, info){
            if(info.ondrop){
                var ondrop = window[info.ondrop];
                if(ondrop instanceof Function){
                    ondrop.call(this, evt, this.graph, xy, info);
                    Q.stopEvent(evt);
                    return false;
                }
            }
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
        createToolbox: function (images) {
            var toolbox = document.createElement('div');
            this.dom.appendChild(toolbox);
            toolbox.setAttribute('data-options', "region:'west', width:'18%', left:0, min-width:220, max-width:400");
            this.toolbox = new Q.ToolBox(this.graph, toolbox, images);

            this.graph.toolbox = this.toolbox;
        },
        createPropertyPane: function (options) {
            if(!Q.PropertyPane){
                return;
            }
            var propertyPane = this._getFirst('graph-editor__property');
            if (!propertyPane) {
                propertyPane = createElement('graph-editor__property', this.dom);
                propertyPane.setAttribute('data-options', "region:'east', width: '20%', right: 0, min-width: 100, max-width: '300'");
            }
            return this.propertyPane = new Q.PropertyPane(this.graph, propertyPane, options);
        },
        getJSONTextArea: function () {
            return getFirstChild($(this.jsonPane), 'textarea');
        },
        loadJSONFile: function (files) {
            if (!files[0]) {
                return;
            }
            Q.readerSingleFile(files[0], 'json', function (json) {
                if (!json) {
                    alert(getI18NString('json file is empty'));
                    return;
                }
                this.graph.clear();
                this.graph.parseJSON(json);
            }.bind(this));
        },
        exportJSONFile: function (saveAs) {
            if (saveAs) {
                var name = this.graph.name || 'graph';
                var json = this.graph.exportJSON(true);
                var blob = new Blob([json], {type: "text/plain;charset=utf-8"});
                saveAs(blob, name + ".json");
            }
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
        //加载数据
        loadDatas: function (data, callback) {
            if (data) {
                if (Q.isString(data)) {
                    Q.loadJSON(data, function (json) {
                        this.graph.parseJSON(json.json || json);
                        if (callback instanceof Function) {
                            callback.call(this, this);
                        }
                    }.bind(this), function(err){
                        if (callback instanceof Function) {
                            callback.call(this, this);
                        }
                    }.bind(this));
                    return;
                }
                this.graph.parseJSON(data);
            }
            if (callback instanceof Function) {
                callback.call(this, this);
            }
        },
        onsave: function (err, evt) {
            if (err) {
                return alert(getI18NString('Save Error'));
            }
            alert(getI18NString('Save Success'));
        },
        /**
         * 保存json到后台
         */
        save: function () {
            if (!this.options.saveService) {
                return;
            }
            var saveService = this.options.saveService;
            var json = this.graph.exportJSON(true);
            var xhr = new XMLHttpRequest();
            xhr.open('post', saveService, true);
            xhr.onerror = function (e) {
                this.onsave(e);
            }.bind(this)
            xhr.onload = function (e) {
                if(e.target.status == 200){
                    this.onsave(null, e);
                }else{
                    this.onsave(e);//load error
                }
            }.bind(this)
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify({name: this.name, json: json}));
        },
        createJSONPane: function () {
            var jsonPane = this._getFirst('graph-editor__json');
            if (jsonPane) {
                return this.jsonPane = jsonPane;
            }
            this.jsonPane = jsonPane = createElement('graph-editor__json', this.dom);
            var textarea = document.createElement('textarea');
            jsonPane.appendChild(textarea);
            textarea.spellcheck = false;

            var buttonGroup = createElement('graph-editor__json__buttons', jsonPane);

            var jsonButtons = [
                {name: getI18NString('Update'), action: this.exportJSON.bind(this, true)},
                {name: getI18NString('Submit'), action: this.submitJSON.bind(this)}
            ]
            Q.createButtonGroup(jsonButtons, buttonGroup);
            jsonPane.style.display = 'none';
            return jsonPane;
        },
        //初始化工具栏
        initToolbar: function (toolbar, graph) {
            var exportButtons = [{
                    name: getI18NString('Export JSON'), iconClass: 'q-icon toolbar-json', action: this.showJSONPanel.bind(this)
                }, {
                    iconClass: 'q-icon toolbar-upload',
                    name: getI18NString('Load File ...'), action: this.loadJSONFile.bind(this), type: 'file'
                }
            ]
            if (window.saveAs) {
                exportButtons.push({
                    iconClass: 'q-icon toolbar-download',
                    name: getI18NString('Download File'), action: this.exportJSONFile.bind(this, window.saveAs)
                })
            }
            if(this.options.saveService){
                exportButtons.push({
                    iconClass: 'q-icon toolbar-save',
                    name: getI18NString('Save'), action: this.save.bind(this)
                })
            }
            Q.createToolbar(graph, toolbar, {export: exportButtons})
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
        initContextMenu: function (graph) {
            graph.popupmenu = new Q.PopupMenu();
        }
    }

    if (window.localStorage) {
        Editor.prototype.loadLocal = function () {
            if (localStorage.graph) {
                this.graph.clear();
                this.graph.parseJSON(localStorage.graph);
                return true;
            }
        }
        Editor.prototype.saveLocal = function () {
            localStorage.graph = this.graph.exportJSON(true);
        }
    }
    Q.Editor = Editor;
})(Q, jQuery);
