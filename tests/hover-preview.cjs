const {origin}=require('./fixtures.cjs');
module.exports=async({page,context,test,go,assert})=>{
 const panel=page.locator('#aether-resource-preview');
 const hover=async(source=page,id='resource-2')=>{await source.locator('#'+id+' [data-ae-primary="true"] a').first().hover();await panel.waitFor();};
 // Observe dismissal at the end of the leave event itself, so a delayed timer
 // cannot pass merely because the test runner was slow to inspect the DOM.
 const probe=async(source=page,id='resource-2',target='card')=>source.evaluate(({id,target})=>{
   window.previewLeaveResult=null;
   const element=target==='panel'?document.querySelector('#aether-resource-preview'):document.getElementById(id);
   element.addEventListener('pointerleave',()=>queueMicrotask(()=>window.previewLeaveResult=!top.document.querySelector('#aether-resource-preview')),{once:true});
 },{id,target});
 await test('Hover preview: leaving a resource dismisses in the same pointer event',async()=>{
   await go('Resources');await hover();await page.locator('.ae-preview-text').waitFor();await probe();await page.mouse.move(8,8);assert.equal(await page.evaluate(()=>window.previewLeaveResult),true);assert.equal(await panel.count(),0);
 });
 await test('Hover preview: switching resources closes the old preview before the next opens',async()=>{
   await go('Resources');await hover();await probe();await page.locator('#resource-1 [data-ae-primary="true"] a').hover();assert.equal(await page.evaluate(()=>window.previewLeaveResult),true);await panel.getByRole('heading',{name:'Lecture 02.pdf',exact:true}).waitFor();await page.mouse.move(8,8);assert.equal(await panel.count(),0);
 });
 await test('Hover preview: leaving before the opening delay prevents a late preview',async()=>{
   await go('Resources');await page.locator('#resource-2 [data-ae-primary="true"] a').hover();await page.mouse.move(8,8);await page.waitForTimeout(450);assert.equal(await panel.count(),0);
 });
 await test('Hover preview: pointer transfer into the panel works and leaving it dismisses immediately',async()=>{
   await go('Resources');await hover();await panel.locator('.ae-preview-kind').hover();assert.equal(await panel.count(),1);await probe(page,'resource-2','panel');await page.mouse.move(8,8);assert.equal(await page.evaluate(()=>window.previewLeaveResult),true);assert.equal(await panel.count(),0);
 });
 await test('Hover preview: PDF frame entry stays open and viewport exit dismisses immediately',async()=>{
   await go('Resources');await hover(page,'resource-0');await page.locator('#aether-resource-preview[data-pdf-page="1"]').waitFor();await page.frameLocator('.ae-preview-pdf').locator('#next').hover();assert.equal(await panel.count(),1);await page.mouse.move(-10,-10);assert.equal(await panel.count(),0);
 });
 await test('Hover preview: leaving an embedded resource for the portal dismisses immediately',async()=>{
   await go('Frame');const frame=page.frames().find(f=>f.url()===origin+'/tool/resources');assert(frame);await frame.locator('#resource-2.ae-record-card').waitFor();await hover(frame);await probe(frame);await page.mouse.move(8,8);assert.equal(await frame.evaluate(()=>window.previewLeaveResult),true);assert.equal(await panel.count(),0);
 });
 await test('Hover preview: immediate exit aborts a pending read without reopening',async()=>{
   await go('Resources');const slow=origin+'/access/content/group/cs200/hover-slow.txt';let release;
   await context.route(slow,async r=>{await new Promise(resolve=>release=resolve);await r.fulfill({contentType:'text/plain',body:'Delayed hover text'}).catch(()=>{});});
   try{
     await page.locator('#resource-2 a[download]').evaluate((a,url)=>a.href=url,slow);
     const started=page.waitForRequest(slow),cancelled=page.waitForEvent('requestfailed',{predicate:r=>r.url()===slow});await hover();await started;await probe();await page.mouse.move(8,8);assert.equal(await page.evaluate(()=>window.previewLeaveResult),true);await cancelled;release?.();await page.waitForTimeout(100);assert.equal(await panel.count(),0);
   }finally{release?.();await context.unroute(slow);}
 });
 await test('Hover preview: scrolling dismisses a hover while explicit and keyboard previews remain usable',async()=>{
   await go('Resources');await hover();await page.mouse.wheel(0,120);await page.waitForFunction(()=>!document.querySelector('#aether-resource-preview'));
   await page.locator('#resource-2 [data-ae-preview-open]').click();await panel.waitFor();await page.mouse.move(8,8);assert.equal(await panel.count(),1);await page.keyboard.press('Escape');assert.equal(await panel.count(),0);assert(await page.locator('#resource-2 [data-ae-preview-open]').evaluate(e=>e===document.activeElement));
   await page.keyboard.press('Enter');await panel.waitFor();await page.mouse.move(8,8);assert.equal(await panel.count(),1);await page.keyboard.press('Escape');
 });
};
