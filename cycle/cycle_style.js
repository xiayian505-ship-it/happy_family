(function () {
  "use strict";
  const C = window.CycleCore;
  const store = new C.LocalStorageAdapter(window.localStorage);
  let data = C.emptyData(), view = new Date(), selected = C.todayISO();
  const $ = id => document.getElementById(id);
  const pad = n => String(n).padStart(2, "0");
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const labelDate = value => value ? value.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1/$2/$3") : "尚未記錄";
  function toast(message) { $("toast").textContent = message; $("toast").classList.add("show"); setTimeout(() => $("toast").classList.remove("show"), 2600); }
  async function persist(next, message) { data = await store.save(next); render(); if (message) toast(message); }
  function actual(date) { return data.periods.some(p => date >= p.start && date <= (p.end || p.start)); }
  function predicted(date, stats) { return stats.nextPeriod && date >= stats.nextPeriod && date <= C.addDays(stats.nextPeriod, 4); }
  function renderCalendar() {
    const year=view.getFullYear(), month=view.getMonth(), first=new Date(year,month,1), start=new Date(year,month,1-first.getDay());
    $("calendar-title").textContent=`${year} 年 ${month+1} 月`; const stats=C.cycleStats(data); const frag=document.createDocumentFragment();
    for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const date=iso(d), button=document.createElement("button");button.type="button";button.className="day";button.dataset.date=date;button.setAttribute("role","gridcell");button.textContent=d.getDate();const tags=[];
      if(d.getMonth()!==month)button.classList.add("outside");if(date===C.todayISO()){button.classList.add("today");tags.push("今天");}if(date===selected)button.classList.add("selected");
      if(actual(date)){button.classList.add("period");tags.push("月經");}else if(predicted(date,stats)){button.classList.add("forecast");tags.push("預估月經");}else if(stats.fertileStart&&date>=stats.fertileStart&&date<=stats.fertileEnd){button.classList.add("fertile");tags.push("粗估易孕");}
      if(data.daily[date])button.classList.add("has-note");button.setAttribute("aria-label",`${date}${tags.length?"，"+tags.join("，"):""}`);if(tags.length){const marker=document.createElement("span");marker.className="marker";marker.textContent=tags[0];button.append(marker);}frag.append(button);
    } $("calendar").replaceChildren(frag);
  }
  function render() {
    renderCalendar(); const s=C.cycleStats(data); let note=s.insufficient?"至少需要 3 次開始日期，平均值才較有參考性。":"依歷史開始日期間隔估算。";if(s.irregular)note="近期週期間隔差異超過 7 天，預估不確定性較高。";
    $("summary-content").innerHTML=`<div class="summary-grid"><div class="metric"><span>平均週期</span><strong>${s.average?s.average+" 天":"資料不足"}</strong></div><div class="metric"><span>下次粗估</span><strong>${labelDate(s.nextPeriod)}</strong></div></div><p class="form-help">${note}</p>`;
    $("manual-cycle").value=data.settings.manualCycleLength||""; const list=$("period-list");list.replaceChildren();
    if(!data.periods.length){const p=document.createElement("p");p.className="empty";p.textContent="還沒有紀錄。只要先記開始日期就好。";list.append(p);} data.periods.slice().reverse().forEach(p=>{const row=document.createElement("div");row.className="period-row";const span=document.createElement("span");span.textContent=`${labelDate(p.start)} → ${p.end?labelDate(p.end):"進行中"}`;const b=document.createElement("button");b.type="button";b.className="ghost edit-period";b.dataset.id=p.id;b.textContent="編輯";row.append(span,b);list.append(row);});
  }
  function openDay(date){selected=date;const entry=data.daily[date]||{};$("day-title").textContent=labelDate(date);$("day-flow").value=entry.flow||"";$("day-pain").value=entry.pain||"";$("day-note").value=entry.note||"";renderCalendar();$("day-dialog").showModal();}
  function openPeriod(period){$("period-id").value=period?.id||"";$("period-start").value=period?.start||selected;$("period-end").value=period?.end||"";$("period-title").textContent=period?"編輯月經紀錄":"新增月經紀錄";$("delete-period").hidden=!period;$("period-dialog").showModal();}
  $("calendar").addEventListener("click",e=>{const b=e.target.closest(".day");if(b)openDay(b.dataset.date);});
  $("prev-month").onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);renderCalendar();};$("next-month").onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);renderCalendar();};$("today-button").onclick=()=>{view=new Date();selected=C.todayISO();renderCalendar();};
  $("day-form").addEventListener("submit",async e=>{e.preventDefault();try{await persist(C.saveDaily(data,selected,{flow:$("day-flow").value,pain:$("day-pain").value,note:$("day-note").value}),"當日紀錄已儲存");$("day-dialog").close();}catch(err){alert(err.message);}});
  $("clear-day").onclick=async()=>{if(confirm("清除這一天的身體紀錄？月經區間不受影響。")){await persist(C.saveDaily(data,selected,{}),"已清除當日紀錄");$("day-dialog").close();}};
  $("new-period").onclick=()=>openPeriod(null);$("period-list").onclick=e=>{const b=e.target.closest(".edit-period");if(b)openPeriod(data.periods.find(p=>p.id===b.dataset.id));};
  $("period-form").addEventListener("submit",async e=>{e.preventDefault();try{await persist(C.upsertPeriod(data,{id:$("period-id").value||undefined,start:$("period-start").value,end:$("period-end").value||null}),"月經紀錄已儲存");$("period-dialog").close();}catch(err){alert(err.message);}});
  $("delete-period").onclick=async()=>{const id=$("period-id").value;if(id&&confirm("刪除這筆月經紀錄？當日身體紀錄會保留。")){await persist(C.removePeriod(data,id),"月經紀錄已刪除");$("period-dialog").close();}};
  $("save-setting").onclick=async()=>{const raw=$("manual-cycle").value;const n=raw===""?null:Number(raw);if(n!==null&&(!Number.isInteger(n)||n<15||n>90)){alert("請輸入 15–90 的整數，或留空改用歷史平均。");return;}const next=JSON.parse(JSON.stringify(data));next.settings.manualCycleLength=n;await persist(next,"預估設定已更新");};
  $("backup-open").onclick=()=>$("backup-dialog").showModal();document.querySelector('[data-close="backup"]').onclick=()=>$("backup-dialog").close();
  $("export-button").onclick=()=>{const blob=new Blob([C.exportBackup(data)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`slowly-cycle-${C.todayISO()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0);toast("備份已下載");};
  $("import-button").onclick=async()=>{const file=$("import-file").files[0];if(!file){alert("請先選擇 JSON 檔案。");return;}try{const next=C.parseBackup(await file.text());if(!confirm(`已驗證備份：${next.periods.length} 筆月經紀錄、${Object.keys(next.daily).length} 筆身體紀錄。\n\n確定完全覆蓋目前資料？此動作無法復原。`))return;await persist(next,"備份已還原");$("backup-dialog").close();}catch(err){alert("匯入失敗，目前資料未變更。\n"+err.message);}};
  store.load().then(value=>{data=value;render();}).catch(err=>{render();alert(err.message+"\n系統沒有覆蓋原始資料，請先匯出瀏覽器儲存內容尋求協助。");});
})();
