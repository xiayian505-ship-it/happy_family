/* Cycle's calendar adapter. Calendar implementation remains in the remote library. */
(function(global){"use strict";
  const C=global.CycleCore,pad=n=>String(n).padStart(2,"0");
  class CycleCalendar{
    constructor(target,onSelect){
      if(!global.SlowlyCalendar?.mount||!global.CalendarInteraction?.create)throw new Error("軍火庫日曆尚未載入，請確認網路連線。");
      this.calendar=global.SlowlyCalendar.mount(target,{view:"month",gridLines:false,showLunar:true,showFestivals:true,showSolarTerms:true});
      this.interaction=global.CalendarInteraction.create(this.calendar);
      this.calendar.grid.addEventListener("click",event=>{const button=event.target.closest(".sc-day[data-calendar-date]");if(button)onSelect(button.dataset.calendarDate);});
    }
    render(data,selected){
      const stats=C.cycleStats(data), marked=[];
      const actual=date=>data.periods.some(p=>date>=p.start&&date<=(p.end||p.start));
      this.interaction.setMarkers([]);
      const original=this.calendar.grid.querySelectorAll(".sc-day[data-calendar-date]");
      original.forEach(button=>{
        const date=button.dataset.calendarDate;button.classList.remove("cycle-actual","cycle-forecast","cycle-fertile","cycle-note","is-selected");
        button.classList.toggle("is-selected",date===selected);
        if(date===selected)button.setAttribute("aria-pressed","true");else button.removeAttribute("aria-pressed");
        let tag="";
        if(actual(date))tag="actual";
        else if(stats.nextPeriod&&date>=stats.nextPeriod&&date<=C.addDays(stats.nextPeriod,4))tag="forecast";
        else if(stats.fertileStart&&date>=stats.fertileStart&&date<=stats.fertileEnd)tag="fertile";
        if(tag)button.classList.add("cycle-"+tag);
        if(data.daily[date]){button.classList.add("cycle-note");marked.push(date);}
        const labels={actual:"已記錄月經",forecast:"預估月經",fertile:"粗略易孕期"};
        button.setAttribute("aria-label",[date,labels[tag],data.daily[date]?"有身體紀錄":""].filter(Boolean).join("，"));
      });
      this.interaction.setMarkers(marked);
    }
    refresh(data,selected){this.calendar.render();this.render(data,selected);}
  }
  global.CycleCalendar=CycleCalendar;
})(window);
