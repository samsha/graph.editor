(function(Q){
    function getPageXY(evt) {
        if (evt.touches && evt.touches.length) {
            evt = evt.touches[0];
        }
        return {x: evt.pageX, y: evt.pageY};
    }
    function showDivAt(div, x, y) {
        if(x instanceof MouseEvent){
            var xy = getPageXY(x);
            x = xy.x;
            y = xy.y;
        }
        var body = document.documentElement;
        var bounds = new Q.Rect(window.pageXOffset, window.pageYOffset, body.clientWidth - 2, body.clientHeight - 2);
        var width = div.offsetWidth;
        var height = div.offsetHeight;

        if (x + width > bounds.x + bounds.width) {
            x = bounds.x + bounds.width - width;
        }
        if (y + height > bounds.y + bounds.height) {
            y = bounds.y + bounds.height - height;
        }
        if (x < bounds.x) {
            x = bounds.x;
        }
        if (y < bounds.y) {
            y = bounds.y;
        }
        div.style.left = x + 'px';
        div.style.top = y + 'px';
    }

    function isDescendant(parent, child) {
        var node = child.parentNode;
        while (node != null) {
            if (node == parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }
    function inBounds(div, x, y){
        var bounds = div.getBoundingClientRect();
        return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
    }

    function showPopup(div, x, y) {
        if(typeof div == 'string'){
            div = document.getElementById(div);
            if(!div){
                throw new Error('div cannot be found');
            }
        }
        div.style.display = 'block';
        showDivAt(div, x, y);
        if(!div.hide){
            div.hide = function(){
                div.style.display = 'none';
            }
            div._onWindowMousedown = function (evt) {
                if (isDescendant(this, evt.target)) {
                    return;
                }
                var xy = getPageXY(evt);
                if(inBounds(this, xy.x, xy.y)){
                    return;
                }

                this.hide();
            }.bind(div)
        }
        window.addEventListener("mousedown", div._onWindowMousedown, true);
    }

    Q.showPopup = showPopup;
}(Q))