/* N10 hotfix */
(function(){
  var TRAVEL_MS=2500;
  var style=document.createElement("style");
  style.textContent=".travel-banner-overlay{z-index:90;display:flex;align-items:center;justify-content:center;background:rgba(6,4,2,.72)}.travel-banner-panel{min-width:min(92vw,420px);text-align:center;padding:36px 40px 32px;border:3px solid #e4c56a;box-shadow:0 0 0 2px rgba(201,162,39,.35),0 12px 40px rgba(0,0,0,.55);background:#1a140efa}.travel-banner-kicker{color:#e8d48a;letter-spacing:.28em;font-size:1rem}.travel-banner-title{margin:14px 0 8px;color:#f0d878;font-family:serif;font-size:clamp(2.2rem,6vw,3rem);font-weight:900;letter-spacing:.28em}.travel-banner-sub{margin:0;color:#f5e6c8}.five-roads-title{font-size:clamp(1.6rem,4vw,2rem);font-weight:900;text-align:center;color:#e4c56a}";
  document.documentElement.appendChild(style);
  function addQa(){
    var wrap=document.querySelector(".title-wrap .btn-row")||document.querySelector(".title-wrap");
    if(!wrap||document.querySelector("[data-qa=qa-travel-banner]"))return;
    function mk(qa,label,fn){
      var b=document.createElement("button");
      b.type="button";
      b.className="btn title-qa-unlock title-enter";
      b.setAttribute("data-qa",qa);
      b.textContent=label;
      b.onclick=fn;
      wrap.appendChild(b);
    }
    mk("qa-travel-banner","旅途橫幅測試",function(){
      if(document.querySelector("[data-qa=travel-banner]"))return;
      var banner=document.createElement("div");
      banner.className="overlay travel-banner-overlay";
      banner.setAttribute("data-qa","travel-banner");
      banner.setAttribute("role","status");
      banner.innerHTML="<div class='sheet gold-frame travel-banner-panel'><div class='travel-banner-kicker'>天下圖</div><h1 class='travel-banner-title'>旅途…</h1><p class='travel-banner-sub'>驛道塵起，旌旗南指</p></div>";
      (document.getElementById("game-main")||document.body).appendChild(banner);
      setTimeout(function(){banner.remove();},TRAVEL_MS);
    });
    mk("qa-five-roads-clear","五路既竟面板測試",function(){
      var entry=document.querySelector("[data-qa=five-roads-entry]");
      if(entry&&!entry.disabled&&!(entry.classList&&entry.classList.contains("locked"))){entry.click();return;}
      if(document.querySelector("[data-qa=five-roads-panel]"))return;
      var sec=document.createElement("section");
      sec.className="screen select-stage";
      sec.setAttribute("data-qa","five-roads-panel");
      sec.innerHTML="<div class='select-inner'><div class='sheet gold-frame five-roads-sheet' style='margin:24px auto;max-width:480px'><h1 class='five-roads-title' data-qa='five-roads-title' style='margin-top:0'>五路初章既竟</h1><p class='five-roads-hold-hint'>……</p><ul class='five-roads-list' data-qa='five-roads-list'></ul><div class='btn-row' style='margin-top:14px'><button type='button' class='btn btn-primary' data-qa='five-roads-close' disabled>返回標題</button></div></div></div>";
      (document.getElementById("root")||document.body).appendChild(sec);
      setTimeout(function(){
        var hint=sec.querySelector(".five-roads-hold-hint");
        var btn=sec.querySelector("[data-qa=five-roads-close]");
        if(hint)hint.textContent="";
        if(btn){btn.disabled=false;btn.onclick=function(){sec.remove();};}
      },2500);
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",addQa);else addQa();
  setInterval(addQa,1000);
})();
