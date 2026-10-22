/* Validate bounded ZIP metadata before passing untrusted Office data to readers. */
(() => {
 'use strict';
 function inspect(buffer){
   const bytes=new Uint8Array(buffer),view=new DataView(buffer),fail=()=>{throw Error('This archive is encrypted, damaged, or exceeds the preview limits. Open the original resource.');};
   if(bytes.length<22||bytes.length>32*1024*1024)fail();
   let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(view.getUint32(i,true)===0x06054b50&&i+22+view.getUint16(i+20,true)===bytes.length){end=i;break;}
   if(end<0||view.getUint16(end+4,true)||view.getUint16(end+6,true))fail();
   const count=view.getUint16(end+10,true),size=view.getUint32(end+12,true),start=view.getUint32(end+16,true);
   if(count!==view.getUint16(end+8,true)||!count||count>4000||start+size>end)fail();
   const entries=[],names=new Set();let offset=start,total=0;
   for(let i=0;i<count;i++){
     if(offset+46>end||view.getUint32(offset,true)!==0x02014b50)fail();
     const flags=view.getUint16(offset+8,true),method=view.getUint16(offset+10,true),compressed=view.getUint32(offset+20,true),expanded=view.getUint32(offset+24,true),length=view.getUint16(offset+28,true),extra=view.getUint16(offset+30,true),comment=view.getUint16(offset+32,true),local=view.getUint32(offset+42,true);
     if(flags&1||![0,8].includes(method)||expanded>32*1024*1024||compressed>bytes.length||local+30>start||offset+46+length+extra+comment>start+size)fail();
     const name=new TextDecoder().decode(bytes.slice(offset+46,offset+46+length));
     if(!name||name.includes('\\')||name.startsWith('/')||name.split('/').some(p=>p==='..'||p==='.')||/[\x00-\x1f]/.test(name)||names.has(name))fail();
     if(view.getUint32(local,true)!==0x04034b50)fail();
     total+=expanded;if(total>128*1024*1024)fail();names.add(name);entries.push({name,bytes:expanded});offset+=46+length+extra+comment;
   }
   if(offset!==start+size)fail();
   return entries;
 }
 globalThis.AetherArchiveGuard={inspect};
})();
