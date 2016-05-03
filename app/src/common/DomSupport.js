!function(Q, $){
    var createElement = function (options) {
        options = options || {};
        var element = document.createElement(options.tagName || 'div');
        if(options.class){
            $(element).addClass(options.class);
        }
        if (options.parent) {
            options.parent.appendChild(element);
        }
        if(options.style){
            element.setAttribute('style', options.style);
        }
        if(options.css){
            $(element).css(options.css);
        }
        if(options.html){
            $(element).html(options.html);
        }
        //$(element).attr(options);
        return element;
    }

    Q.createElement = createElement;

}(Q, jQuery)