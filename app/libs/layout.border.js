/**
 * by sam@qunee.com
 */
;(function ($){
  'use strict';
  function _isNumber(n) {
    return n instanceof Number || (typeof n == "number");
  }
  $.fn.borderLayout = function() {
    var setBounds = function(element, bounds){
      element.style.position = 'absolute';
      element.style.boxSizing = 'border-box';
      for(var name in bounds){
        var v = bounds[name];
        if(_isNumber(v)){
          v = parseInt(v) + 'px';
        }
        element.style[name] = v;
      }
      $(element).trigger('size.change');
    };
    var toNumber = function(sNumber, sum){
      if(sNumber[sNumber.length - 1] === '%'){
        return sum * parseInt(sNumber) / 100;
      }
      return parseInt(sNumber);
    }
    var calculateLength = function(sNumber, sum, min, max){
      var n = toNumber(sNumber, sum);
      if(min){
        min = toNumber(min, sum);
        if(n < min){
          return min;
        }
      }
      if(max){
        max = toNumber(max, sum);
        if(n > max){
          return max;
        }
      }
      return n;
    };
    return this.each(function() {
      this.style.boxSizing = 'border-box';
      this.style.overflow = 'hidden';
      if(this == document.body || $(this).hasClass('layout--body')){
        setBounds(this, {top: 0, bottom: 0, left: 0, right: 0})
      }
      var isH = $(this).hasClass('layout--h');

      var width = this.clientWidth;
      var height = this.clientHeight;
      var i = 0;
      var children = this.children;
      var center, north, south, east, west;
      while(i < children.length){
        var child = children[i++];
        var data = child.getAttribute('data-options');
        if(!data){
          continue;
        }
        //http://stackoverflow.com/questions/4210160/safely-parsing-a-json-string-with-unquoted-keys
        data = data.replace(/(['"])?([a-zA-Z0-9\-]+)(['"])?:/g, '"$2":');
        data = data.replace(/'/g, '"');
        data = '{' + data + '}';
        try{
          data = JSON.parse(data);
        }catch(error){
          continue;
        }
        var region = data.region;
        if(!region){
          continue;
        }
        child._data = data;
        if(/center/i.test(region)){
          center = child;
          continue;
        }
        if(/north/i.test(region)){
          north = child;
          continue;
        }
        if(/south/i.test(region)){
          south = child;
          continue;
        }
        if(/east/i.test(region)){
          east = child;
          continue;
        }
        if(/west/i.test(region)){
          west = child;
        }
      }
      var widthRest = width, heightRest = height, top = 0, left = 0, temp, temp2;
      function setWestAndEast(){
        if(west){
          temp = west._data.width;
          if(temp){
            temp = calculateLength(temp, width, west._data['min-width'], west._data['max-width']);
            left = temp;
            temp2 = parseInt(west._data.left) || 0;
            if(temp2){
              widthRest -= temp2;
              left += temp2;
            }
            widthRest -= temp;
            setBounds(west, {top: top, left: temp2, width: temp, height: heightRest});
          }
        }
        if(east){
          temp = east._data.width;
          if(temp){
            temp = calculateLength(temp, width, east._data['min-width'], east._data['max-width']);
            temp2 = parseInt(east._data.right) || 0;
            if(temp2){
              widthRest -= temp2;
            }
            widthRest -= temp;
            setBounds(east, {top: top, right: temp2, width: temp, height: heightRest});
          }
        }
      }
      function setNorthAndSouth(){
        if(north){
          temp = north._data.height;
          if(temp){
            temp = calculateLength(temp, height, north._data['min-height'], north._data['max-height']);
            heightRest -= temp;
            top = temp;
            setBounds(north, {top: 0, left: left, width: widthRest, height: temp});
          }
        }
        if(south){
          temp = south._data.height;
          if(temp){
            temp = calculateLength(temp, height, south._data['min-height'], south._data['max-height']);
            heightRest -= temp;
            setBounds(south, {bottom: 0, left: left, height: temp, width: widthRest});
          }
        }
      }
      if(isH){
        setWestAndEast();
        setNorthAndSouth();
      }else{
        setNorthAndSouth();
        setWestAndEast();
      }
      if(center){
        setBounds(center, {top: top, left: left, width: widthRest, height: heightRest});
      }
    });
  };
  $(function(){
    $('.layout').borderLayout();
    $(window).resize(function(){
      $('.layout').borderLayout();
    });
  });
})(jQuery);
