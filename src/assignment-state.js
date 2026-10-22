/* Read-only, conservative interpretation of native Sakai submission metadata. */
(() => {
  'use strict';
  const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
  function submission(value){
    const s=clean(value).toLowerCase();
    if(/\b(not graded|ungraded|not returned)\b/.test(s))return null;
    if(/\b(not submitted|unsubmitted|not started|no submission|draft|in progress)\b/.test(s))return false;
    if(/\b(submitted|resubmitted|returned|graded)\b/.test(s))return true;
    return null;
  }
  function dueDate(value){
    let s=clean(value);if(!s)return NaN;
    if(/^\d{10}$/.test(s))return Number(s)*1000;
    if(/^\d{13}$/.test(s))return Number(s);
    // ISO or an English month name is unambiguous. Do not guess 10/11/2026.
    if(!/^\d{4}-\d{2}-\d{2}(?:[T ]|$)/.test(s)&&!/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[ .-]/i.test(s))return NaN;
    if(!/\b\d{4}\b/.test(s))return NaN;
    s=s.replace(/\bPKT\b/ig,'GMT+0500').replace(/\s+at\s+/ig,' ');
    if(/^\d{4}-\d{2}-\d{2}$/.test(s)){const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d,23,59,59,999).getTime();}
    const n=Date.parse(s);if(!Number.isFinite(n))return NaN;
    const hasTime=/\d{1,2}:\d{2}|\d\s*(?:am|pm)\b/i.test(s);
    // A date without a time remains open through the end of that local day.
    if(!hasTime){const d=new Date(n);d.setHours(23,59,59,999);return d.getTime();}
    return n;
  }
  function classify(status,due,now=Date.now()){
    const submitted=submission(status),timestamp=dueDate(due),past=Number.isFinite(timestamp)&&now>timestamp;
    const state=submitted===true&&Number.isFinite(timestamp)?past?'submitted-closed':'submitted-open':submitted===false&&past?'overdue':'open';
    const label={ 'submitted-open':'Submitted · due ahead','submitted-closed':'Submitted · deadline passed',overdue:'Not submitted · overdue',open:'Open' }[state];
    return {state,label,due:timestamp};
  }
  function read(status,due,now){
    const machine=due?.querySelector('time[datetime],[data-due-date],[data-sort-value]');
    const raw=machine?.getAttribute('datetime')||machine?.getAttribute('data-due-date')||machine?.getAttribute('data-sort-value')||due?.getAttribute('datetime')||due?.getAttribute('data-due-date')||due?.getAttribute('data-sort-value')||due?.textContent;
    const s=status?.getAttribute('data-submission-status')||status?.textContent;
    const result=classify(s,raw,now);
    if(result.state==='open')result.label=submission(s)===true?'Submitted · due date unavailable':submission(s)===false?(Number.isFinite(result.due)?'Not submitted · open':'Not submitted · due date unavailable'):'Status/date unconfirmed';
    return result;
  }
  globalThis.AetherAssignmentState={submission,dueDate,classify,read};
})();
