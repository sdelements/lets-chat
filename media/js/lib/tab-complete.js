/*! 
 * Nickname Tab Complete
 * Version: 0.8
 * Copyright (c) Doug Neiner, 2010. Dual licenses under MIT or GPL
 *
 * Includes one function from jQuery plugin: fieldSelection - v0.1.1 (c) 2006 Alex Brem <alex@0xab.cd> - http://blog.0xab.cd (Open Source)
 * 
 * And two functions from an answer 
 * by CMS (http://stackoverflow.com/users/5445/cms) on Stack Overflow:
 * http://stackoverflow.com/questions/499126/jquery-set-cursor-position-in-text-area
 *
 */
(function(f){function k(b){return("selectionStart"in b&&function(){var g=b.selectionEnd-b.selectionStart;return{start:b.selectionStart,end:b.selectionEnd,length:g,text:b.value.substr(b.selectionStart,g)}}||document.selection&&function(){b.focus();var g=document.selection.createRange();if(g===null)return{start:0,end:b.value.length,length:0};var e=b.createTextRange(),a=e.duplicate();e.moveToBookmark(g.getBookmark());a.setEndPoint("EndToStart",e);return{start:a.text.length,end:a.text.length+g.text.length,
 length:g.text.length,text:g.text}}||function(){return null})()}function l(b,g){var e=b.toLowerCase(),a=[],h=b.length,d="",c,i=0;f.each(g,function(m,j){j.toLowerCase().substr(0,h)===e&&a.push(j)});if(a.length===1)return{value:a[0],matches:a};else if(a.length>1){for(;i<a[0].length-h;i+=1){c=a[0].toLowerCase().substr(h+i,1);f.each(a,function(m,j){if(j.toLowerCase().substr(h+i,1)!==c){c="";return false}});if(c)d+=c;else break}return{value:b+d,matches:a}}return{value:"",matches:a}}f.fn.nicknameTabComplete=
 function(b){b=f.extend({},f.fn.nicknameTabComplete.defaults,b);this.bind("keydown.nickname",function(g){var e=b;if(g.which===9){var a=f(this),h=a.val(),d=k(this),c="",i="";if(!d.length&&d.start){if(f.fn.nicknameTabComplete.has_newline_bug){c=this.value.substr(0,d.start);d.start-=c.split("\n").length-1}c=h.substr(0,d.start);if(e.nick_match.test(c)){c=c.match(e.nick_match)[1];i=l(c,e.nicknames);e=f.Event("nickname-complete");f.extend(e,i);e.caret=d.start;a.trigger(e);if(i.value&&!e.isDefaultPrevented()){e=
 h.substr(0,d.start-c.length);h=h.substr(d.start);space=i.matches.length>1||h.length&&h.substr(0,1)==" "?"":" ";a.val(e+i.value+space+h);d=d.start-c.length+i.value.length+space.length;if(f.fn.nicknameTabComplete.has_newline_bug&&!f.browser.msie){a=f(this).val().substr(0,d).split("\n").length-1;d+=a}d=a=d;if(this.setSelectionRange){this.focus();this.setSelectionRange(a,d)}else if(this.createTextRange){c=this.createTextRange();c.collapse(true);c.moveEnd("character",d);c.moveStart("character",a);c.select()}}g.preventDefault();
 this.lastKey=9}}}}).bind("focus.nickname",function(){this.lastKey=0}).bind("blur.nickname",function(){this.lastKey===9&&this.focus()});b.on_complete!==null&&this.bind("nickname-complete",b.on_complete);return this};f.fn.nicknameTabComplete.defaults={nicknames:[],nick_match:/@([-_a-z0-9]*)$/i,on_complete:null};f.fn.nicknameTabComplete.has_newline_bug=f("<textarea>").val("Newline\nTest")[0].value==="Newline\r\nTest"})(jQuery);