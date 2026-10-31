/* ========================================================================
   SEO HELPER  (seo.js)
   Page address and details for search engines.
   Loaded at the bottom of every page (see the 7. SCRIPTS banner in each HTML file).
   ======================================================================== */

(function(){
  function update(language){
    const fr=language==='fr';
    const title=document.querySelector('title');
    const description=document.querySelector('meta[name="description"]');
    const ogTitle=document.querySelector('meta[property="og:title"]');
    const ogDescription=document.querySelector('meta[property="og:description"]');
    const twitterTitle=document.querySelector('meta[name="twitter:title"]');
    const twitterDescription=document.querySelector('meta[name="twitter:description"]');
    const locale=document.querySelector('meta[property="og:locale"]');
    const page=document.querySelector('script[type="application/ld+json"]');
    const choose=(node,attr,fallback)=>node?.getAttribute(attr)||fallback||'';
    const titleText=choose(title,fr?'data-fr':'data-en',document.title);
    const descText=choose(description,fr?'data-fr':'data-en',description?.content);
    document.title=titleText;
    if(description)description.content=descText;
    if(ogTitle)ogTitle.content=titleText;
    if(ogDescription)ogDescription.content=descText;
    if(twitterTitle)twitterTitle.content=titleText;
    if(twitterDescription)twitterDescription.content=descText;
    if(locale)locale.content=fr?'fr_RW':'en_RW';
    if(page){try{const data=JSON.parse(page.textContent);const webPage=data.find(x=>x['@type']==='WebPage');if(webPage){webPage.name=titleText.split(' | ')[0];webPage.description=descText;webPage.inLanguage=fr?'fr-RW':'en-RW';page.textContent=JSON.stringify(data)}}catch{}}
  }
  window.QartexaSEO={update};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>update(document.documentElement.lang),{once:true});else update(document.documentElement.lang);
  new MutationObserver(()=>update(document.documentElement.lang)).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
