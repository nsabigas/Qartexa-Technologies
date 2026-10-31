/* ========================================================================
   INTERACTIONS  (interactions.js)
   Scroll-reveal animations and small interface effects.
   Loaded at the bottom of every page (see the 7. SCRIPTS banner in each HTML file).
   ======================================================================== */

(function(){
 function init(){
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(node=>observer.observe(node));}
  else document.querySelectorAll('.reveal').forEach(node=>node.classList.add('visible'));
 }
 window.QartexaInteractions={init};
})();
