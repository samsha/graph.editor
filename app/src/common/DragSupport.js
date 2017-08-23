
    !function (Q) {
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
            img.setAttribute("title", title);
            info = info || {};
            info.label = info.label || title;
            info.title = title;
            if (!info.image && (!info.type || info.type == "Node")) {
                info.image = src;
            }
            appendDragInfo(img, info);
            parent.appendChild(img);
            return img;
        }

        function appendDragInfo(img, info) {
            img.setAttribute("draggable", "true");
            img.setAttribute(DRAGINFO_PREFIX, Q.exportJSON ? Q.exportJSON(info, true) : JSON.stringify(info));
            img.ondragstart = ondrag;
            return img;
        }

        var isIE9_10 = /MSIE 9/i.test(navigator.userAgent) || /MSIE 10/i.test(navigator.userAgent);
        var dragSupport = !isIE9_10;
        if (!dragSupport) {
            var DRAG_INFO = {};
            var getMousePageLocation = function (evt) {
                return {
                    x: evt.pageX,
                    y: evt.pageY
                }
            }
            var body = document.documentElement;
            var enableDrag = function () {

                body.addEventListener('mousemove', function (evt) {
                    if (!DRAG_INFO.target) {
                        return;
                    }
                    Q.stopEvent(evt);
                    var point = getMousePageLocation(evt);
                    if (!DRAG_INFO.dragElement) {
                        var target = DRAG_INFO.target;
                        if (Math.abs(point.x - DRAG_INFO.dragPoint.x) <= 5 || Math.abs(point.y - DRAG_INFO.dragPoint.y) <= 5) {
                            return
                        }
                        var div = document.createElement('div');
                        div.style.position = 'absolute';
                        div.style.zIndex = 10000;

                        var dragButton = target.cloneNode(true);
                        if (/canvas/i.test(dragButton.tagName)) {
                            dragButton.getContext('2d').drawImage(target, 0, 0);
                        } else {
                            div.style.maxWidth = '30px';
                            div.style.maxWidth = '30px';
                            div.style.cursor = 'move'
                        }
                        //dragButton.style.pointerEvents = 'none';
                        //div.style.pointerEvents = 'none';
                        dragButton.id = null;
                        //div.setAttribute('class', 'drag-element');
                        div.appendChild(dragButton);
                        body.appendChild(div);
                        DRAG_INFO.dragElement = div;

                        var event = {target: target}
                        //start drag
                        if (target.ondragstart instanceof Function) {
                            DRAG_INFO.dataTransfer = event.dataTransfer = {
                                datas: {},
                                setData: function (name, value) {
                                    this.datas[name] = value;
                                },
                                getData: function (name) {
                                    return this.datas[name];
                                }
                            }
                            target.ondragstart(event);
                        }
                    }
                    DRAG_INFO.dragElement.style.left = (point.x - DRAG_INFO.dragElement.clientWidth / 2) + 'px';
                    DRAG_INFO.dragElement.style.top = (point.y - DRAG_INFO.dragElement.clientHeight / 2) + 'px';
                }, false);
                body.addEventListener('mouseup', function (evt) {
                    if (!DRAG_INFO.target) {
                        return;
                    }
                    delete DRAG_INFO.dragPoint;
                    delete DRAG_INFO.target;

                    if (DRAG_INFO.dragElement) {
                        body.removeChild(DRAG_INFO.dragElement);
                        delete DRAG_INFO.dragElement;
                    }

                    var point = getMousePageLocation(evt);

                    var graphs = document.getElementsByClassName('Q-CanvasPanel');
                    var i = 0;
                    while (i < graphs.length) {
                        var graph = graphs[i];
                        ++i;
                        var viewport = getClientRect(graph);
                        if (!containPoint(viewport, point)) {
                            continue;
                        }
                        if (graph.ondrop instanceof Function) {
                            evt.dataTransfer = DRAG_INFO.dataTransfer;

                            graph.ondrop(evt);
                        }
                        break;
                    }
                    delete DRAG_INFO.dataTransfer;
                }, false);
            }
            var containPoint = function (rect, point) {
                return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
            }
            var getOffset = function (element) {
                var left = 0;
                var top = 0;
                while (element.offsetParent) {
                    left += element.clientLeft + element.offsetLeft - element.scrollLeft;
                    top += element.clientTop + element.offsetTop - element.scrollTop;
                    element = element.offsetParent;
                }
                return {x: left, y: top};
            }
            var getClientRect = function (root) {
                var offset = getOffset(root);
                var x = offset.x + root.scrollLeft;
                var y = offset.y + root.scrollTop;
                var width = root.clientWidth;
                var height = root.clientHeight;
                return {
                    x: x,
                    y: y,
                    left: x,
                    top: y,
                    right: x + width,
                    bottom: y + height,
                    width: width,
                    height: height
                }
            }
            var appendDragInfo2 = function (button) {
                button.onmousedown = function (evt) {
                    DRAG_INFO.dragPoint = getMousePageLocation(evt);
                    DRAG_INFO.target = button;
                    Q.stopEvent(evt);
                }
                return button;
            }

            appendDragInfo = function (img, info) {
                img.setAttribute("draggable", "true");
                img.setAttribute(DRAGINFO_PREFIX, JSON.stringify(info));
                img.ondragstart = ondrag;

                appendDragInfo2(img)
                return img;
            }
            enableDrag();
        }

        Q.createDNDImage = createDNDImage;
        Q.appendDNDInfo = appendDragInfo;
    }(Q)