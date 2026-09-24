/* 功能核心：專案資料、指令範本、產生完整可複製文字。 */
(function(global){"use strict";
const KEY="sbs_termux_projects_v1",ACTIVE="sbs_termux_active_v1";
const defaults=[{id:"happy_family",name:"happy_family",path:"~/storage/shared/Projects/happy_family"},{id:"desk",name:"desk",path:"~/storage/shared/Projects/desk"},{id:"pocket",name:"pocket",path:"~/storage/shared/Projects/still_by_slowly_pocket"},{id:"lib",name:"軍火庫（唯讀）",path:"~/storage/shared/Projects/stillnessbyslowly_data_core",readonly:true}];
const entries=[
{id:"pwd",cat:"專案切換",title:"查看目前位置",desc:"確認目前終端機所在目錄。",body:()=>"pwd"},
{id:"cd",cat:"專案切換",title:"切換到目前專案",desc:"進入上方選取的專案根目錄。",body:p=>`cd ${p.path}`},
{id:"ls",cat:"專案切換",title:"查看專案檔案",desc:"進入專案並列出檔案。",body:p=>`cd ${p.path}\nls -la`},
{id:"home",cat:"專案切換",title:"回到 Termux 家目錄",desc:"不影響任何檔案。",body:()=>"cd ~\npwd"},
{id:"projects",cat:"專案切換",title:"查看 Projects 資料夾",desc:"確認手機共享儲存空間的專案列表。",body:()=>"cd ~/storage/shared/Projects\nls -la"},
{id:"status",cat:"專案檢查",title:"檢查目前專案狀態",desc:"確認修改、未追蹤檔案和目前分支。",body:p=>`cd ${p.path}\ngit status`},
{id:"branch",cat:"專案檢查",title:"查看分支與遠端",desc:"檢查分支名稱和遠端網址，避免推錯 repo。",body:p=>`cd ${p.path}\ngit branch --show-current\ngit remote -v`},
{id:"diff",cat:"專案檢查",title:"查看尚未暫存的修改",desc:"檢視尚未 git add 的文字差異。",body:p=>`cd ${p.path}\ngit diff`},
{id:"staged",cat:"專案檢查",title:"檢查準備提交的檔案",desc:"查看已暫存檔案清單及修改摘要。",body:p=>`cd ${p.path}\ngit diff --cached --stat\ngit status`},
{id:"log",cat:"專案檢查",title:"最近五筆提交",desc:"快速核對最近的版本。",body:p=>`cd ${p.path}\ngit log -5 --oneline`},
{id:"fetch",cat:"同步與更新",title:"取得遠端資訊（不合併）",desc:"只更新遠端追蹤資訊，不覆蓋工作檔案。",body:p=>`cd ${p.path}\ngit fetch origin\ngit status`},
{id:"pull",cat:"同步與更新",title:"拉取目前分支更新",desc:"可能觸發合併或衝突；先檢查本機變更。",risk:"執行前確認 git status；有未提交修改時先處理。",body:p=>`cd ${p.path}\ngit status\ngit pull --ff-only origin "$(git branch --show-current)"`},
{id:"addcycle",cat:"提交與上傳",title:"只加入 cycle 整包",desc:"只暫存 cycle/ 目錄的新增、修改與刪除。",risk:"包含 cycle/ 內所有變更；提交前看清楚清單。",body:p=>`cd ${p.path}\ngit add -A cycle/\ngit diff --cached --stat\ngit status`},
{id:"addall",cat:"提交與上傳",title:"加入整個專案所有變更",desc:"包含新增、修改、刪除及其他資料夾。",risk:"範圍是整個 repo；務必確認沒有私密檔案或不想提交的內容。",body:p=>`cd ${p.path}\ngit add -A\ngit diff --cached --stat\ngit status`},
{id:"commit",cat:"提交與上傳",title:"提交已暫存的修改",desc:"先查看暫存清單，再自行修改提交訊息。",risk:"此指令只提交已暫存內容；不會自動加入其他檔案。",body:p=>`cd ${p.path}\ngit diff --cached --stat\ngit commit -m "Update project"`},
{id:"push",cat:"提交與上傳",title:"推送目前分支",desc:"推送到 origin 的同名分支，不預設 main。",risk:"推送前確認 git remote -v 與目前分支。",body:p=>`cd ${p.path}\ngit status\ngit branch --show-current\ngit remote -v\ngit push origin "$(git branch --show-current)"`},
{id:"cyclepush",cat:"提交與上傳",title:"Cycle 整包上傳",desc:"只加入 cycle/，確認清單後提交並推送目前分支。",risk:"整段貼上會接著 commit 與 push；請先核對 cycle/ 內容、分支和遠端。",body:p=>`cd ${p.path}\ngit status\ngit add -A cycle/\ngit diff --cached --stat\ngit commit -m "Update cycle"\ngit push origin "$(git branch --show-current)"`},
{id:"projectpush",cat:"提交與上傳",title:"整個專案上傳",desc:"加入整個 repo 後提交、推送目前分支。",risk:"會加入整個 repo 的所有變更，包含刪除；請先檢查檔案。",body:p=>`cd ${p.path}\ngit status\ngit add -A\ngit diff --cached --stat\ngit commit -m "Update project"\ngit push origin "$(git branch --show-current)"`},
{id:"storage",cat:"Termux 環境",title:"查看共享儲存空間",desc:"檢查 Termux 是否能看到手機共享儲存空間。",body:()=>"ls -la ~/storage/shared"},
{id:"version",cat:"Termux 環境",title:"檢查 Git 與 Node 版本",desc:"Node 沒安裝時會顯示找不到指令。",body:()=>"git --version\nnode --version"},
{id:"syntax",cat:"Termux 環境",title:"檢查 JavaScript 語法",desc:"切換到專案後，請將範例檔名改成實際檔案。",body:p=>`cd ${p.path}\nnode --check cycle/cycle_calendar.js`},
{id:"zip",cat:"Termux 環境",title:"列出 ZIP 內的檔案",desc:"先把範例 ZIP 名稱改成實際檔名。",body:p=>`cd ${p.path}\nunzip -Z1 example.zip`}
];
function validPath(v){return typeof v==="string"&&v.trim().length>0&&!/[\r\n\0'"`$\\]/.test(v)&&/^(~\/|\/)/.test(v.trim());}
function read(){try{const value=JSON.parse(localStorage.getItem(KEY));if(Array.isArray(value)&&value.length&&value.every(p=>p&&typeof p.name==="string"&&validPath(p.path)))return value;}catch(_){}return defaults.map(p=>({...p}));}
let projects=read();let active=localStorage.getItem(ACTIVE);if(!projects.some(p=>p.id===active))active=projects[0].id;
function save(){localStorage.setItem(KEY,JSON.stringify(projects));localStorage.setItem(ACTIVE,active);}
function current(){return projects.find(p=>p.id===active)||projects[0];}
function select(id){if(projects.some(p=>p.id===id)){active=id;save();return true;}return false;}
function upsert(value,id){const name=value.name.trim(),path=value.path.trim();if(!name||!validPath(path))throw new Error("請填入名稱及有效的絕對路徑（~ 或 / 開頭，不含引號或換行）。");if(id){const p=projects.find(p=>p.id===id);if(!p)throw new Error("找不到專案。");p.name=name;p.path=path;}else{const next={id:"p_"+Date.now().toString(36)+Math.random().toString(36).slice(2,7),name,path};projects.push(next);active=next.id;}save();}
function remove(id){if(projects.length===1)throw new Error("至少要保留一個專案。");projects=projects.filter(p=>p.id!==id);if(active===id)active=projects[0].id;save();}
global.SBSTermux=Object.freeze({entries,projects:()=>projects.map(p=>({...p})),current,select,upsert,remove,validPath});
})(window);
