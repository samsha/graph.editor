!function(Q){
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

    Q.showDivCenterAt = showDivCenterAt;
}(Q)