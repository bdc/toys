//(function() {  // scope


// Includes
{{ include('jquery-2.1.3.min.js') }}
{{ include('jquery-ui.js') }}


// Consts

var SERVER_ROOT = 'http://localhost:9080/memorydoc';
var VERSION = 1;


// Util

function atOrAboveMidpoint(elem) {
  var docViewTop = $(window).scrollTop();
  var docViewMid = docViewTop + $(window).height() / 2;

  var elemTop = $(elem).offset().top;

  return elemTop <= docViewMid;
};

function visibleToc(tocList, defaultText) {
  // input: [{ anchor: '#Thing_a', index: 0, name: 'Thing A' }, ...]
  // returns: { anchor: '#Thing_a', index: 0, name: 'Thing A' }
  var somethingVisible = false;
  for (var i = 0; i < tocList.length; i++) {
    var elem = $(tocList[i].anchor);
    var elemAtOrAboveMidpoint = atOrAboveMidpoint($(elem));
    if (elemAtOrAboveMidpoint) somethingVisible = true;
    if (somethingVisible && !elemAtOrAboveMidpoint) return tocList[i-1];
  };
  if (somethingVisible) {
    return tocList[tocList.length - 1];
  }
  return {name: defaultText};
};


// Init
$('head').append(
    '<link rel="stylesheet" href="' +
    SERVER_ROOT + '/s/mem.' + VERSION + '.css" />');
$('body').append('<div id="memory-document-container"></div>');
$('#memory-document-container').load(
    SERVER_ROOT + '/s/dom.' + VERSION + '.html',
    undefined,
    function() {
      $('#memory-document').draggable();
    });


var spriteSet = '/sprites/mario';
var spriteList = [];
$.ajax(SERVER_ROOT + '/s' + spriteSet + '.json')
    .done(function(data) {
      spriteList = data;
    });


var tocList = $('.toclevel-1').map(function(index, elem) {
  // { anchor: '#A_b_c', index: 0, name: 'A B C' }
  return {
    anchor: $(elem).find('a').attr('href'),
    index: index,
    name: $.trim($(elem).contents().eq(0).text())
  };
});


var onScroll = function() {
  var tocItem = visibleToc(tocList, $('#firstHeading').text());
  if (tocItem && tocItem.name &&
      $('#memory-document #section-title').text() != tocItem.name) {
    $('#memory-document #section-title').text(tocItem.name);
    $('#memory-document #section-img img').attr(
        'src',
        SERVER_ROOT + '/img' + spriteSet + '/' + spriteList[tocItem.index]);
  };
};
onScroll();
$(document).scroll(function(evt) {
  onScroll();
});




//})();  // scope


