/* ========================================================================
   START-UP  (main.js)
   Starts navigation, interactions and search when the page is ready. Keep this script last.
   Loaded at the bottom of every page (see the 7. SCRIPTS banner in each HTML file).
   ======================================================================== */

(function(){
 function init(){window.QartexaNavigation?.init();window.QartexaInteractions?.init();window.QartexaSearch?.init();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
