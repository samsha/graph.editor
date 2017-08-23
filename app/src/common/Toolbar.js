;
(function (Q, $) {
    function createButtonGroup(info, toolbar, scope, vertical, togglable) {
        var buttonGroup = document.createElement("div");
        buttonGroup.className = vertical ? "btn-group-vertical" : "btn-group";
        if (togglable) {
            buttonGroup.setAttribute("data-toggle", "buttons");
        }
        for (var i = 0, l = info.length; i < l; i++) {
            if (!info[i].type && togglable) {
                info[i].type = 'radio';
            }
            buttonGroup.appendChild(createGraphButton(info[i], scope)).info = info[i];
        }
        toolbar.appendChild(buttonGroup);
    }

    function createGraphButton(info, scope) {
        if (info.type == "search") {
            var div = document.createElement("div");
            div.style.display = "inline-block";
            div.style.verticalAlign = "middle";
            div.style.width = '170px';
            div.innerHTML = '<div class="input-group input-group-sm" >\
            <input type="text" class="form-control" placeholder="' + (info.placeholder || '') + '">\
                <span class="input-group-btn">\
                    <div class="btn btn-default" type="button"></div>\
                </span>\
            </div>';
            var input = div.getElementsByTagName("input")[0];
            if (info.id) {
                input.id = info.id;
            }
            var button = $(div).find('.btn')[0];
            if (info.iconClass) {
                var icon = document.createElement('div');
                $(icon).addClass(info.iconClass);
                button.appendChild(icon);
            } else if (info.name) {
                button.appendChild(document.createTextNode(" " + info.name));
            }
            info.input = input;
            if (info.search) {
                var clear = function () {
                    info.searchInfo = null;
                }
                var doSearch = function (prov) {
                    var value = input.value;
                    if (!value) {
                        clear();
                        return;
                    }
                    if (!info.searchInfo || info.searchInfo.value != value) {
                        var result = info.search(value, info);
                        if (!result || !result.length) {
                            clear();
                            return;
                        }
                        info.searchInfo = {value: value, result: result};
                    }
                    doNext(prov);
                }
                var doNext = function (prov) {
                    if (!(info.select instanceof Function) || !info.searchInfo || !info.searchInfo.result || !info.searchInfo.result.length) {
                        return;
                    }
                    var searchInfo = info.searchInfo;
                    var result = info.searchInfo.result;
                    if (result.length == 1) {
                        info.select(result[0], 0);
                        return;
                    }
                    if (searchInfo.index === undefined) {
                        searchInfo.index = 0;
                    } else {
                        searchInfo.index += prov ? -1 : 1;
                        if (searchInfo.index < 0) {
                            searchInfo.index += result.length;
                        }
                        searchInfo.index %= result.length;
                    }
                    if (info.select(result[searchInfo.index], searchInfo.index) === false) {
                        info.searchInfo = null;
                        doSearch();
                    }
                    ;
                }
                input.onkeydown = function (evt) {
                    if (evt.keyCode == 27) {
                        clear();
                        input.value = "";
                        Q.stopEvent(evt);
                        return;
                    }
                    if (evt.keyCode == 13) {
                        doSearch(evt.shiftKey);
                    }
                }
                button.onclick = function (evt) {
                    doSearch();
                }
            }
            return div;
        }
        if (info.type == 'file') {
            var label = document.createElement('span');
            var input = document.createElement('input');
            label.className = 'file-input btn btn-default btn-sm btn-file';
            input.setAttribute('type', 'file');
            input.className = 'btn-file';
            if (info.action) {
                input.onchange = function (evt) {
                    var input = $(this),
                        files = input.get(0).files;
                    label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
                    if (files.length) {
                        info.action.call(scope, files, label, evt);
                    }
                };
            }
            label.appendChild(input);

            if (info.icon) {
                var icon = document.createElement('img');
                icon.src = info.icon;
                label.appendChild(icon);
            } else if (info.iconClass) {
                var icon = document.createElement('div');
                $(icon).addClass(info.iconClass);
                label.appendChild(icon);
            } else if (info.name) {
                label.appendChild(document.createTextNode(" " + info.name));
            }
            if (info.name) {
                label.setAttribute("title", info.name);
            }
            return label;
        }
        if (info.type == "input") {
            var div = document.createElement("div");
            div.style.display = "inline-block";
            div.style.verticalAlign = "middle";
            div.innerHTML = '<div class="input-group input-group-sm" style="width: 150px;">\
            <input type="text" class="form-control">\
                <span class="input-group-btn">\
                    <button class="btn btn-default" type="button"></button>\
                </span>\
            </div>';
            var input = div.getElementsByTagName("input")[0];
            var button = div.getElementsByTagName("button")[0];
            button.innerHTML = info.name;
            info.input = input;
            if (info.action) {
                button.onclick = function (evt) {
                    info.action.call(scope || window.graph, evt, info);
                }
            }
            return div;
        } else if (info.type == "select") {
            var div = document.createElement("select");
            div.className = "form-control";
            var options = info.options;
            options.forEach(function (v) {
                var option = document.createElement("option");
                option.innerHTML = v;
                option.value = v;
                div.appendChild(option);
            });
            div.value = info.value;
            if (info.action) {
                div.onValueChange = function (evt) {
                    info.action.call(scope || window.graph, evt, info);
                }
            }
            return div;
        }
        if (!info.type) {
            var label = document.createElement("div");
        } else {
            var label = document.createElement("label");
            var button = document.createElement("input");
            info.input = button;
            button.setAttribute('type', info.type);
            label.appendChild(button);
            if (info.selected) {
                button.setAttribute('checked', 'checked');
                if (info.type == 'radio') {
                    label.className += "active";
                }
            }
        }
        label.className += "btn btn-default btn-sm";
        if (info.icon) {
            var icon = document.createElement('img');
            icon.src = info.icon;
            label.appendChild(icon);
        } else if (info.iconClass) {
            var icon = document.createElement('div');
            $(icon).addClass(info.iconClass);
            label.appendChild(icon);
        } else if (info.name) {
            label.appendChild(document.createTextNode(" " + info.name));
        }
        if (info.name) {
            label.setAttribute("title", info.name);
        }
        if (info.action) {
            (button || label).onclick = function (evt) {
                info.action.call(scope || window.graph, evt, info);
            }
        }
        return label;
    }

    function createToolbar(graph, toolbar, customButtons) {
        function getGraph() {
            return toolbar.graph;
        }

        toolbar.addEventListener('click', function () {
            updateButtonStatus();
        }, false);

        toolbar.setGraph = function (graph) {
            var old = this.graph;
            if (old) {
                old.propertyChangeDispatcher.removeListener(onInteractionModeChange, this);
            }
            this.graph = graph;
            updateButtonStatus();
            if (graph) {
                graph.propertyChangeDispatcher.addListener(onInteractionModeChange, this);
            }
        }

        function hasSameProperty(o1, o2) {
            if (o1 == o2) {
                return true;
            }
            if (!o1 || !o2) {
                return false;
            }
            for (var name in o1) {
                if (o1[name] != o2[name]) {
                    return false;
                }
            }
            return true;
        }

        function updateButtonStatus() {
            var g = getGraph();
            var mode = g ? g.interactionMode : null;
            var interactionProperties = g ? g.interactionProperties : null;
            $(toolbar).find('.btn').each(function (index, btn) {
                if(!btn.info || !btn.info.interactionMode){
                    return;
                }
                if (btn.info.interactionMode == mode) {
                    if (!interactionProperties || hasSameProperty(interactionProperties, btn.info)) {
                        Q.appendClass(btn, 'active');
                        return;
                    }
                }
                Q.removeClass(btn, 'active');
            })
        }

        function onInteractionModeChange(evt) {
            if (evt.kind == 'interactionMode') {
                updateButtonStatus();
            }
        }

        function setInteractionMode(evt, info, interactionProperties) {
            var g = getGraph();
            if (!g) {
                return;
            }
            g.interactionMode = info.value;
            g.interactionProperties = interactionProperties || info;
        }

        var buttons = {
            interactionModes: [
                {
                    name: '默认模式',
                    interactionMode: Q.Consts.INTERACTION_MODE_DEFAULT,
                    selected: true,
                    iconClass: 'q-icon toolbar-default'
                },
                {
                    name: '框选模式',
                    interactionMode: Q.Consts.INTERACTION_MODE_SELECTION,
                    iconClass: 'q-icon toolbar-rectangle_selection'
                },
                {
                    name: '浏览模式',
                    interactionMode: Q.Consts.INTERACTION_MODE_VIEW,
                    iconClass: 'q-icon toolbar-pan'
                }
            ],
            zoom: [
                {
                    name: '放大', iconClass: 'q-icon toolbar-zoomin', action: function () {
                    getGraph().zoomIn()
                }
                },
                {
                    name: '缩小', iconClass: 'q-icon toolbar-zoomout', action: function () {
                    getGraph().zoomOut()
                }
                },
                {
                    name: '1:1', iconClass: 'q-icon toolbar-zoomreset', action: function () {
                    getGraph().scale = 1;
                }
                },
                {
                    name: '纵览', iconClass: 'q-icon toolbar-overview', action: function () {
                    getGraph().zoomToOverview()
                }
                }
            ],
            editor: [
                {
                    name: '创建连线',
                    interactionMode: Q.Consts.INTERACTION_MODE_CREATE_EDGE,
                    iconClass: 'q-icon toolbar-edge'
                },
                // {
                //     name: '创建曲线',
                //     interactionMode: Q.Consts.INTERACTION_MODE_CREATE_SIMPLE_EDGE,
                //     iconClass: 'q-icon toolbar-edge_VH',
                //     edgeType: Q.Consts.EDGE_TYPE_HORIZONTAL_VERTICAL
                // },
                {
                    name: '创建L型连线',
                    interactionMode: Q.Consts.INTERACTION_MODE_CREATE_SIMPLE_EDGE,
                    iconClass: 'q-icon toolbar-edge_VH',
                    edgeType: Q.Consts.EDGE_TYPE_VERTICAL_HORIZONTAL
                },
                {
                    name: '创建多边形',
                    interactionMode: Q.Consts.INTERACTION_MODE_CREATE_SHAPE,
                    iconClass: 'q-icon toolbar-polygon'
                },
                {
                    name: '创建线条',
                    interactionMode: Q.Consts.INTERACTION_MODE_CREATE_LINE,
                    iconClass: 'q-icon toolbar-line'
                }
            ],
            search: {
                name: 'Find',
                placeholder: 'Name',
                iconClass: 'q-icon toolbar-search',
                type: 'search',
                id: 'search_input',
                search: function (name, info) {
                    var result = [];
                    var reg = new RegExp(name, 'i');
                    getGraph().forEach(function (e) {
                        if (e.name && reg.test(e.name)) {
                            result.push(e.id);
                        }
                    });
                    return result;
                },
                select: function (item) {
                    item = getGraph().graphModel.getById(item);
                    if (!item) {
                        return false;
                    }
                    getGraph().setSelection(item);
                    getGraph().sendToTop(item);
                    var bounds = getGraph().getUIBounds(item);
                    if (bounds) {
                        getGraph().centerTo(bounds.cx, bounds.cy, Math.max(2, getGraph().scale), true);
                    }
                }
            },
            exportImage: {
                name: '导出图片', iconClass: 'q-icon toolbar-print', action: function () {
                    Q.showExportPanel(getGraph());
                }
            }
        }
        if (customButtons) {
            for (var n in customButtons) {
                buttons[n] = customButtons[n];
            }
        }
        function createButtons(buttons, toolbar, scope, vertical, togglable) {
            for (var n in buttons) {
                var info = buttons[n];
                if (Q.isArray(info)) {
                    info.forEach(function (item) {
                        if (item.interactionMode) {
                            item.value = item.interactionMode;
                            item.action = setInteractionMode;
                        }
                    })
                    createButtonGroup(info, toolbar, scope, vertical, togglable);
                    continue;
                }
                if (info.interactionMode) {
                    info.value = info.interactionMode;
                    info.action = setInteractionMode;
                }
                toolbar.appendChild(createGraphButton(info, scope)).info = info;
            }
        }

        createButtons(buttons, toolbar, this, false, false);

        toolbar.setGraph(graph);
        return toolbar;
    }

    Q.createToolbar = createToolbar;
    Q.createButtonGroup = createButtonGroup;
    Q.createButton = createGraphButton;

})(Q, jQuery);
