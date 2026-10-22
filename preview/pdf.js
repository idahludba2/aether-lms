let task=null,pdf=null,renderTask=null,pageNumber=1,busy=false;
const params=new URLSearchParams(location.hash.slice(1)),token=params.get('token'),parentOrigin=params.get('origin');
const status=document.querySelector('#status'),pages=document.querySelector('#pages'),canvas=document.querySelector('#page'),count=document.querySelector('#count'),prev=document.querySelector('#prev'),next=document.querySelector('#next');
const send=data=>parent.postMessage({...data,type:'aether-pdf-preview',token},parentOrigin);
function fail(message){status.hidden=false;status.textContent=message;pages.hidden=true;send({state:'error',message});}
async function draw(number){if(busy||!pdf)return;busy=true;prev.disabled=next.disabled=true;
 try{const page=await pdf.getPage(number),base=page.getViewport({scale:1}),paper=document.querySelector('#paper');
  const scale=Math.min((paper.clientWidth-6)/base.width,(paper.clientHeight-6)/base.height,1.5),dpr=Math.min(devicePixelRatio||1,1.5),view=page.getViewport({scale:Math.max(.1,scale)});
  canvas.width=Math.round(view.width*dpr);canvas.height=Math.round(view.height*dpr);canvas.style.width=view.width+'px';canvas.style.height=view.height+'px';
  renderTask=page.render({canvasContext:canvas.getContext('2d'),viewport:view,transform:dpr===1?null:[dpr,0,0,dpr,0,0],annotationMode:0});await renderTask.promise;pageNumber=number;canvas.setAttribute('aria-label','PDF page '+number+' of '+pdf.numPages);count.textContent=number+' / '+pdf.numPages;send({state:'rendered',page:number,pages:pdf.numPages});
 }catch(error){if(error.name!=='RenderingCancelledException')fail('This PDF cannot be previewed. Open the original resource.');}
 finally{busy=false;if(pdf){prev.disabled=pageNumber<=1;next.disabled=pageNumber>=pdf.numPages;}}
}
prev.addEventListener('click',()=>draw(pageNumber-1));next.addEventListener('click',()=>draw(pageNumber+1));
window.addEventListener('keydown',e=>{if(e.key==='Escape')send({state:'close'});else if(e.key==='ArrowRight'&&!next.disabled)draw(pageNumber+1);else if(e.key==='ArrowLeft'&&!prev.disabled)draw(pageNumber-1);});
window.addEventListener('message',async e=>{
 let portalFrame=false;try{portalFrame=e.source===parent||e.source?.top===parent;}catch{}
 if(!portalFrame||e.origin!==parentOrigin||e.data?.type!=='aether-pdf-data'||e.data.token!==token||task||!(e.data.bytes instanceof ArrayBuffer))return;
 try{const lib=await import('../vendor/pdfjs/pdf.min.mjs');lib.GlobalWorkerOptions.workerSrc=new URL('../vendor/pdfjs/pdf.worker.min.mjs',import.meta.url).href;
  const root=new URL('../vendor/pdfjs/',import.meta.url).href;
  task=lib.getDocument({data:new Uint8Array(e.data.bytes),isEvalSupported:false,enableXfa:false,useWasm:true,cMapUrl:root+'cmaps/',cMapPacked:true,standardFontDataUrl:root+'standard_fonts/',wasmUrl:root+'wasm/',maxImageSize:16000000,canvasMaxAreaInBytes:16000000,verbosity:0});
  task.onPassword=()=>{fail('Password-protected PDF. Open the original resource to continue.');task.destroy();};
  pdf=await task.promise;status.hidden=true;pages.hidden=false;await new Promise(requestAnimationFrame);await draw(1);
 }catch(error){fail('This PDF cannot be previewed. Open the original resource.');}
});
window.addEventListener('pagehide',()=>{renderTask?.cancel();task?.destroy();});
if(parentOrigin==='https://lms.lums.edu.pk'&&token)send({state:'ready'});
