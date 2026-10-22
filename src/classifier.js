/* Conservative adaptation boundary: native operational geometry wins. */
(() => {
 'use strict';
 function classify(el,kind){
   const form=el.closest('form'),resources=kind==='resource'&&el.matches('table');
   // Sakai wraps the resource browser, upload toolbar and pagination in one
   // management form. Classify the records themselves, not unrelated controls.
   if(!resources&&form?.querySelector('textarea,[contenteditable="true"],input[type="file"],input[type="password"]'))return 'sensitive';
   if(kind==='assessment'||el.closest('.Mrphs-sakai-samigo,[data-aether-native]'))return 'sensitive';
   if(resources){
     if(el.querySelector('textarea,[contenteditable="true"],input[type="file"],input[type="password"]'))return 'sensitive';
     const fields=el.querySelectorAll('input:not([type="checkbox"]):not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]),select');
     if([...fields].some(field=>!field.closest('thead,tfoot,.navPanel,.resource-toolbar,.act,td[colspan],th[colspan],[headers~="actions"],[headers~="actions1"],[headers~="actions2"]')))return 'sensitive';
   }else if(el.querySelector('textarea,[contenteditable="true"],input:not([type="checkbox"]):not([type="hidden"]),select:not(.roster-groups-selector)'))return 'sensitive';
   if(el.matches('[role="presentation"],[data-layout="matrix"]')||[...el.querySelectorAll('table')].some(table=>!resources||!table.closest('td[colspan],th[colspan],tfoot,.navPanel')))return 'unsupported';
   if(kind==='grade'){
     // A student's item-by-item summary is a record list; multi-student and
     // comparison matrices keep their native geometry, with matching styling.
     if(el.matches('#gradeSummaryTable')&&el.querySelector('.gb-summary-grade-row'))return 'cards';
     const headers=Array.from(el.querySelectorAll('thead th')).map(h=>h.textContent.replace(/\s+/g,' ').trim());
     if(headers.some(h=>/^(?:student|name|member|participant)\b/i.test(h)))return 'responsive-table';
     return headers.some(h=>/^(?:gradebook item|item(?: name)?|assignment(?: title)?|title|assessment)\b/i.test(h))&&headers.some(h=>/grade|score|points/i.test(h))?'cards':'responsive-table';
   }
   if(el.matches('table')&&(el.querySelector('tbody th[scope="row"]')||el.querySelector('td[rowspan]:not([rowspan="1"]),td[colspan]:not([colspan="1"])'))&&kind!=='resource')return 'responsive-table';
   if(['resource','assignment','announcement','discussion','message','person','event'].includes(kind))return 'cards';
   return el.matches('table')?'responsive-table':'unsupported';
 }
 globalThis.AetherClassifier={classify};
})();
