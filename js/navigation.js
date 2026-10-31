/* ========================================================================
   MENU / NAVIGATION  (navigation.js)
   Dropdown menus, mobile menu button and highlighting of the current page.
   Loaded at the bottom of every page (see the 7. SCRIPTS banner in each HTML file).
   ======================================================================== */

(function(){
  function init(){
    const nav=document.getElementById('nav');
    const menus=[...document.querySelectorAll('.mega')];
    const close=()=>menus.forEach(item=>{item.classList.remove('open');item.querySelector(':scope > button')?.setAttribute('aria-expanded','false')});
    document.querySelectorAll('.mega > button').forEach((button,index)=>{
      const panel=button.nextElementSibling;
      if(panel && !panel.id) panel.id='mega-panel-'+(index+1);
      button.setAttribute('aria-haspopup','true');
      button.setAttribute('aria-expanded',String(!!panel && itemOpen(button.parentElement)));
      if(panel)button.setAttribute('aria-controls',panel.id);
      button.addEventListener('click',()=>{const item=button.parentElement,wasOpen=item.classList.contains('open');close();if(!wasOpen){item.classList.add('open');button.setAttribute('aria-expanded','true')}});
      button.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();button.click();panel?.querySelector('a')?.focus()}});
    });
    menus.forEach(item=>{const button=item.querySelector(':scope > button');item.addEventListener('mouseenter',()=>{if(!item.classList.contains('open'))close();button?.setAttribute('aria-expanded','true')});item.addEventListener('mouseleave',()=>{if(!item.classList.contains('open')&&!item.contains(document.activeElement))button?.setAttribute('aria-expanded','false')});item.addEventListener('focusin',()=>button?.setAttribute('aria-expanded','true'));item.addEventListener('focusout',()=>queueMicrotask(()=>{if(!item.classList.contains('open')&&!item.contains(document.activeElement))button?.setAttribute('aria-expanded','false')}))});
    document.addEventListener('click',event=>{if(!event.target.closest('.mega'))close()});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'){const active=menus.find(item=>item.classList.contains('open'));close();active?.querySelector(':scope > button')?.focus()}});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'){const h=document.querySelector('.hamb');if(h&&h.getAttribute('aria-expanded')==='true'){h.click();h.focus()}}});
    const primary=document.querySelector('.menu');const breadcrumbs=document.querySelectorAll('.crumb');const updateNavLabels=()=>{const fr=document.documentElement.lang==='fr';primary?.setAttribute('aria-label',fr?'Navigation principale':'Primary navigation');breadcrumbs.forEach(node=>node.setAttribute('aria-label',fr?'Fil d’Ariane':'Breadcrumb'))};updateNavLabels();new MutationObserver(updateNavLabels).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});const hamburger=document.querySelector('.hamb');
    if(nav && hamburger){hamburger.setAttribute('aria-controls','nav');const updateMenuLabel=()=>{const french=document.documentElement.lang==='fr',open=hamburger.getAttribute('aria-expanded')==='true';hamburger.setAttribute('aria-label',french?(open?'Fermer le menu':'Ouvrir le menu'):(open?'Close menu':'Open menu'))};updateMenuLabel();hamburger.addEventListener('click',event=>{const open=nav.classList.toggle('open');event.currentTarget.setAttribute('aria-expanded',String(open));updateMenuLabel();if(!open)close()});new MutationObserver(updateMenuLabel).observe(document.documentElement,{attributes:true,attributeFilter:['lang']})}
    document.querySelectorAll('.menu a,.mega-panel a,.nav-tools .nav-cta').forEach(link=>link.addEventListener('click',()=>{nav?.classList.remove('open');hamburger?.setAttribute('aria-expanded','false');close()}));
    const currentPath=new URL(location.href).pathname;
    document.querySelectorAll('.menu a,.mega-panel a,.nav-tools .nav-cta').forEach(link=>{
      const linkPath=new URL(link.href,location.href).pathname;
      if(linkPath===currentPath){if(!link.hash)link.setAttribute('aria-current','page');link.closest('.mega')?.classList.add('current');}
    });
    const brand=document.querySelector('.brand');brand?.setAttribute('aria-label','Qartexa Technologies home');
    const brandPath=brand?new URL(brand.href,location.href).pathname:'';
    if(currentPath===brandPath||(currentPath==='/'&&brandPath.endsWith('/index.html')))brand?.setAttribute('aria-current','page');
  }
  function itemOpen(item){return item.classList.contains('open')}
  window.QartexaNavigation={init};
})();
