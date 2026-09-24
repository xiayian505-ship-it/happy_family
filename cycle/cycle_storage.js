/* Cycle storage contract: one app data shape, three versioned keys. */
(function (global) { "use strict";
  const C=global.CycleCore, PREFIX="cycle_v1", KEYS=Object.freeze({records:PREFIX+":records",settings:PREFIX+":settings",meta:PREFIX+":meta"});
  const clone=v=>JSON.parse(JSON.stringify(v));
  function decode(storage){
    const raw=Object.fromEntries(Object.entries(KEYS).map(([k,key])=>[k,storage.getItem(key)]));
    if(Object.values(raw).every(v=>v===null))return null;
    if(Object.values(raw).some(v=>v===null))throw new Error("本機資料不完整，已停止寫入；請保留瀏覽器資料並先備份。");
    let records,settings,meta;
    try{records=JSON.parse(raw.records);settings=JSON.parse(raw.settings);meta=JSON.parse(raw.meta);}catch(_){throw new Error("本機資料無法解析，已停止寫入。");}
    if(meta?.schemaVersion!==C.SCHEMA_VERSION || meta?.app!==PREFIX)throw new Error("本機資料版本不相容，已停止寫入。");
    const data={schemaVersion:meta.schemaVersion,periods:records.periods,daily:records.daily,settings,updatedAt:meta.updatedAt};
    const checked=C.validate(data);if(!checked.ok)throw new Error("本機資料驗證失敗："+checked.errors.join(" "));
    return data;
  }
  function write(storage,data){
    const checked=C.validate(data);if(!checked.ok)throw new Error(checked.errors.join(" "));
    const next=C.normalized(data), before=Object.values(KEYS).map(k=>storage.getItem(k));
    const values=[JSON.stringify({periods:next.periods,daily:next.daily}),JSON.stringify(next.settings),JSON.stringify({app:PREFIX,schemaVersion:C.SCHEMA_VERSION,updatedAt:next.updatedAt})];
    const keys=Object.values(KEYS);
    try{keys.forEach((key,i)=>storage.setItem(key,values[i]));}
    catch(error){let restored=true;keys.forEach((key,i)=>{try{if(before[i]===null)storage.removeItem(key);else storage.setItem(key,before[i]);}catch(_){restored=false;}});throw new Error(restored?"儲存失敗，已還原先前資料。":"儲存失敗且無法完整還原，請勿繼續操作，保留瀏覽器資料。",{cause:error});}
    return next;
  }
  class CycleStorage{
    constructor(storage=global.localStorage){this.storage=storage;this.blocked=false;}
    async load(){
      const current=decode(this.storage);if(current)return current;
      return C.emptyData();
    }
    async save(data){if(this.blocked)throw new Error("儲存已暫停，請先處理本機資料錯誤。");return write(this.storage,data);}
    async replace(data){return this.save(data);}
    snapshot(){return Object.fromEntries(Object.entries(KEYS).map(([name,key])=>[name,this.storage.getItem(key)]));}
    restore(snapshot){const keys=Object.keys(KEYS);keys.forEach(name=>{const value=snapshot[name];if(value===null)this.storage.removeItem(KEYS[name]);else this.storage.setItem(KEYS[name],value);});}
  }
  global.CycleStorage=Object.freeze({KEYS,CycleStorage});
})(window);
