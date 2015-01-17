;(function(Q, $){
///drag and drop
  var DRAGINFO_PREFIX = "draginfo";

  function ondrag(evt) {
    evt = evt || window.event;
    var dataTransfer = evt.dataTransfer;
    var img = evt.target;
    dataTransfer.setData("text", img.getAttribute(DRAGINFO_PREFIX));
  }

  function createDNDImage(parent, src, title, info) {
    var img = document.createElement("img");
    img.src = src;
    img.setAttribute("draggable", "true");
    img.setAttribute("title", title);
    info = info || {};
    if (!info.image && (!info.type || info.type == "Node")) {
      info.image = src;
    }
    info.label = info.label || title;
    info.title = title;
    img.setAttribute(DRAGINFO_PREFIX, JSON.stringify(info));
    img.ondragstart = ondrag;
    parent.appendChild(img);
    return img;
  }
  Q.createDNDImage = createDNDImage;

  function createButtons(buttons, toolbar, scope, vertical, togglable) {
    for (var n in buttons) {
      var info = buttons[n];
      if (Q.isArray(info)) {
        createButtonGroup(info, toolbar, scope, vertical, togglable);
        continue;
      }
      toolbar.appendChild(createGraphButton(info, scope));
    }
  }
  function createButtonGroup(info, toolbar, scope, vertical, togglable){
    var buttonGroup = document.createElement("div");
    buttonGroup.className = vertical ? "btn-group-vertical" : "btn-group";
    if (togglable !== false) {
      buttonGroup.setAttribute("data-toggle", "buttons");
    }
    for (var i = 0, l = info.length; i < l; i++) {
      if (!info[i].type && togglable !== false) {
        info[i].type = 'radio';
      }
      buttonGroup.appendChild(createGraphButton(info[i], scope));
    }
    toolbar.appendChild(buttonGroup);
  }
  function createGraphButton(info, scope) {
    if (info.type == "search") {
      var div = document.createElement("div");
      div.style.display = "inline-block";
      div.style.verticalAlign = "middle";
      div.innerHTML = '<div class="input-group input-group-sm" style="width: 150px;">\
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
      label.onclick = function (evt) {
        info.action.call(scope || window.graph, evt, info);
      }
    }
    return label;
  }

  function createToolbar(graph, toolbar, customButtons){
    function getGraph(){
      if(graph instanceof Q.Graph){
        return graph;
      }
      return graph();
    }
    function setInteractionMode(evt, info, interactionProperties) {
      getGraph().interactionMode = info.value;
      getGraph().interactionProperties = interactionProperties || info;
    }

    var buttons = {
      interactionModes: [
        {
          name: '默认模式',
          value: Q.Consts.INTERACTION_MODE_DEFAULT,
          selected: true,
          iconClass: 'icon toolbar-default',
          action: setInteractionMode
        },
        {
          name: '框选模式',
          value: Q.Consts.INTERACTION_MODE_SELECTION,
          iconClass: 'icon toolbar-rectangle_selection',
          action: setInteractionMode
        },
        {
          name: '浏览模式',
          value: Q.Consts.INTERACTION_MODE_VIEW,
          iconClass: 'icon toolbar-pan',
          action: setInteractionMode
        }
      ],
      zoom: [
        {
          name: '放大', iconClass: 'icon toolbar-zoomin', action: function () {
          getGraph().zoomIn()
        }
        },
        {
          name: '缩小', iconClass: 'icon toolbar-zoomout', action: function () {
          getGraph().zoomOut()
        }
        },
        {
          name: '1:1', iconClass: 'icon toolbar-zoomreset', action: function () {
          getGraph().scale = 1;
        }
        },
        {
          name: '纵览', iconClass: 'icon toolbar-overview', action: function () {
          getGraph().zoomToOverview()
        }
        }
      ],
      editor: [
        {
          name: '创建连线',
          value: Q.Consts.INTERACTION_MODE_CREATE_EDGE,
          iconClass: 'icon toolbar-edge',
          action: setInteractionMode
        },
        //{
        //  name: '创建曲线',
        //  value: Q.Consts.INTERACTION_MODE_CREATE_SIMPLE_EDGE,
        //  iconClass: 'icon toolbar-edge_flex',
        //  action: setInteractionMode,
        //  uiClass: FlexEdgeUI
        //},
        {
          name: '创建L型连线',
          value: Q.Consts.INTERACTION_MODE_CREATE_SIMPLE_EDGE,
          iconClass: 'icon toolbar-edge_VH',
          action: setInteractionMode,
          edgeType: Q.Consts.EDGE_TYPE_VERTICAL_HORIZONTAL
        },
        {
          name: '创建多边形',
          value: Q.Consts.INTERACTION_MODE_CREATE_SHAPE,
          iconClass: 'icon toolbar-polygon',
          action: setInteractionMode
        },
        {
          name: '创建线条',
          value: Q.Consts.INTERACTION_MODE_CREATE_LINE,
          iconClass: 'icon toolbar-line',
          action: setInteractionMode
        }
      ],
      search: {
        name: 'Find', placeholder: 'Name', iconClass: 'icon toolbar-search', type: 'search', id: 'search_input',
        search: function (name, info) {
          var result = [];
          var reg = new RegExp(name, 'i');
          getGraph().forEach(function (e) {
            if (e.name && reg.test(e.name)) {
              result.push(e.id);
            }
          });
          return result;
        }, select: function (item) {
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
      export: {
        name: '导出图片', iconClass: 'icon toolbar-print', action: function(){
          Q.showExportPanel(getGraph());
        }
      }
    };
    if(customButtons){
      for(var n in customButtons){
        buttons[n] = customButtons[n];
      }
    }
    createButtons(buttons, toolbar, this, false, false);
    return toolbar;
  }
  Q.createToolbar = createToolbar;
  Q.createButtonGroup = createButtonGroup;
})(Q, jQuery);
