(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))a(t);new MutationObserver(t=>{for(const n of t)if(n.type==="childList")for(const c of n.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&a(c)}).observe(document,{childList:!0,subtree:!0});function r(t){const n={};return t.integrity&&(n.integrity=t.integrity),t.referrerPolicy&&(n.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?n.credentials="include":t.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function a(t){if(t.ep)return;t.ep=!0;const n=r(t);fetch(t.href,n)}})();async function l(){const e=await fetch("projects.json",{cache:"no-cache"});if(!e.ok)throw new Error(`failed to load projects.json (${e.status})`);return e.json()}const i={live:{label:"Live",cls:"b-live"},internal:{label:"Internal",cls:"b-internal"},beta:{label:"Beta",cls:"b-beta"},lab:{label:"WIP",cls:"b-lab"},private:{label:"Private",cls:"b-private"},archived:{label:"Stale",cls:"b-stale"}};function d(e){const s=i[e.status]??{label:e.status,cls:"b-internal"};return`<span class="badge ${s.cls}">${s.label}</span>`}function u(e){const s=e.description&&e.description!=="projet local (pas de repo GitHub)"?e.description:e.name,r=e.language?`<span class="chip">${e.language}</span>`:"",a=e.url??e.repo??"#",t=e.url?"↗":"→";return`
  <a class="card" href="${a}" target="_blank" rel="noopener">
    <div class="card-head">
      <span class="name">${e.name}</span>${d(e)}
    </div>
    <p class="desc">${s}</p>
    <div class="card-foot">
      ${r}
      <span class="go">${t}</span>
    </div>
  </a>`}function o(e,s,r){return`
  <section class="section">
    <div class="sec-head">
      <h2>${e}</h2>
      <span class="sec-note">${s}</span>
    </div>
    <div class="grid">${r.map(u).join("")}</div>
  </section>`}async function f(){const e=document.getElementById("content");if(!e)return;let s;try{s=await l()}catch(t){e.innerHTML=`<p class="err">Failed to load projects.json: ${t.message}</p>`;return}const r=s.filter(t=>t.status==="live"),a=s.filter(t=>t.lab_candidate);e.innerHTML=o("Live","shipped & running on the lab",r)+o("Playground",`${a.length} WIP experiments`,a)}f();
