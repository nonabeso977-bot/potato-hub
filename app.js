/* POTATO HUB — frontend foundation
   Supabase is optional until project credentials are configured. */
const SUPABASE_URL = ""; // Add your Supabase project URL
const SUPABASE_ANON_KEY = ""; // Add the public anon/publishable key only. Never put service_role here.
const supabaseClient = (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const demoGames = [
  {id:"orbit-arcade",name:"ORBIT ARCADE",category:"مغامرات",version:"4.6.0",description:"انطلق في رحلة بين النجوم، واكتشف القطاعات والمجرات في مغامرة فضائية مستقلة.",status:"available",kind:"orbit",updated:"تحديث تجريبي",demoUrl:"",downloadUrl:"",featured:true},
  {id:"potato-quest",name:"POTATO QUEST",category:"أركيد",version:"قريباً",description:"مغامرة بطاطا صغيرة في عالم مليء بالمفاجآت. اللعبة قيد التطوير.",status:"coming-soon",kind:"potato",demoUrl:"",downloadUrl:"",featured:false}
];
let games = [...demoGames];
let selectedCategory = "الكل";
let library = JSON.parse(localStorage.getItem("potatoHubLibrary") || "[]");
let favorites = JSON.parse(localStorage.getItem("potatoHubFavorites") || "[]");
const $ = (selector) => document.querySelector(selector);
const gameGrid = $("#gameGrid");

function toast(message){
  const el=$("#toast"); el.textContent=message; el.classList.add("show");
  clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove("show"),2600);
}
function safeText(value){return String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function renderGames(){
  const term=$("#searchInput").value.trim().toLowerCase();
  const visible=games.filter(g=>(selectedCategory==="الكل"||g.category===selectedCategory)&&(!term||(g.name+" "+g.category+" "+g.description).toLowerCase().includes(term)));
  $("#gameCount").textContent=visible.length+" ألعاب";
  if(!visible.length){gameGrid.innerHTML='<div class="empty-state">ما لقينا ألعاب تطابق البحث.</div>';return;}
  gameGrid.innerHTML=visible.map(g=>`
    <article class="game-card">
      <div class="game-cover ${g.kind==="potato"?"blue":""}">
        <span class="cover-tag">${g.status==="available"?"متاحة":"قريباً"}</span>
        ${g.kind==="orbit"?'<div class="cover-orbit"></div>':'<span class="cover-potato">🥔</span>'}
      </div>
      <div class="game-info">
        <div class="game-title-row"><h3 class="game-title">${safeText(g.name)}</h3><button class="favorite ${favorites.includes(g.id)?"active":""}" data-favorite="${safeText(g.id)}" aria-label="إضافة للمفضلة">${favorites.includes(g.id)?"♥":"♡"}</button></div>
        <p class="game-meta">${safeText(g.category)} · ${safeText(g.version)}</p>
        <div class="card-actions">
          <button class="try-button" data-try="${safeText(g.id)}" ${g.status!=="available"?"disabled":""}>جرّب</button>
          <button class="install-button ${g.status!=="available"?"soon-button":""}" data-install="${safeText(g.id)}" ${g.status!=="available"?"disabled":""}>${g.status==="available"?"التفاصيل / تنزيل":"قريباً"}</button>
        </div>
      </div>
    </article>`).join("");
}
function renderUpdates(){
  const available=games.filter(g=>g.status==="available");
  $("#updatesList").innerHTML=available.map(g=>`<div class="update-row"><span class="update-mark">↻</span><div><strong>${safeText(g.name)}</strong><small>الإصدار الحالي ${safeText(g.version)} · ${safeText(g.updated)}</small></div><span class="update-status">محدّث</span></div>`).join("")||'<p class="muted">لا توجد تحديثات حالياً.</p>';
}
function showGame(id,mode){
  const game=games.find(g=>g.id===id); if(!game)return;
  const dialog=$("#gameDialog");
  const isTry=mode==="try";
  $("#dialogContent").innerHTML=`<div class="dialog-cover">${game.kind==="orbit"?"🪐":"🥔"}</div><div class="dialog-content"><p class="eyebrow">${isTry?"تجربة اللعبة":"صفحة اللعبة"}</p><h2>${safeText(game.name)}</h2><p>${safeText(game.description)}</p><p>التصنيف: ${safeText(game.category)} · الإصدار: ${safeText(game.version)}</p><div class="dialog-actions">${isTry?'<button id="launchDemo">فتح التجربة</button>':'<button id="downloadGame">تنزيل اللعبة</button>'}<button class="ghost" id="addLibrary">إضافة لمكتبتي</button></div><p class="muted">${isTry?"ستعمل التجربة في نافذة مستقلة عند ربط رابط اللعبة التجريبي.":"اللعبة المستقلة ستُنزّل من رابطها الرسمي بعد إضافته إلى سجل اللعبة."}</p></div>`;
  dialog.showModal();
  $("#launchDemo")?.addEventListener("click",()=>{if(game.demoUrl)window.open(game.demoUrl,"_blank","noopener");else toast("رابط التجربة لم يُضف بعد.");});
  $("#downloadGame")?.addEventListener("click",()=>{if(game.downloadUrl)window.open(game.downloadUrl,"_blank","noopener");else toast("رابط التنزيل لم يُضف بعد.");});
  $("#addLibrary")?.addEventListener("click",()=>{if(!library.includes(id)){library.push(id);localStorage.setItem("potatoHubLibrary",JSON.stringify(library));}toast("أُضيفت اللعبة إلى مكتبتك.");});
}
async function loadCatalog(){
  if(!supabaseClient)return;
  try{
    const {data,error}=await supabaseClient.from("games").select("id,name,category,version,description,status,kind,demo_url,download_url,updated_at").eq("published",true).order("created_at",{ascending:false});
    if(error)throw error;
    if(data?.length){games=data.map(g=>({...g,demoUrl:g.demo_url||"",downloadUrl:g.download_url||"",updated:g.updated_at?new Date(g.updated_at).toLocaleDateString("ar"): "تحديث جديد"}));renderGames();renderUpdates();}
  }catch(error){console.warn("Supabase catalog unavailable; using demo catalog.",error.message);}
}
async function enableNotifications(){
  if(!("Notification" in window)){toast("هذا المتصفح لا يدعم إشعارات الويب.");return;}
  if(!("serviceWorker" in navigator)){toast("إشعارات الخلفية غير متاحة في هذا المتصفح.");return;}
  try{
    const permission=await Notification.requestPermission();
    if(permission!=="granted"){toast("لم يتم السماح بالإشعارات.");return;}
    await navigator.serviceWorker.register("./sw.js");
    toast("تم السماح بالإشعارات على هذا الجهاز. يلزم ربط خادم Push لإرسال تنبيهات التحديثات فعلياً.");
  }catch(error){toast("تعذر تفعيل الإشعارات على هذا الجهاز.");console.error(error);}
}
gameGrid.addEventListener("click",event=>{
  const favoriteButton=event.target.closest("[data-favorite]");
  if(favoriteButton){const id=favoriteButton.dataset.favorite;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];localStorage.setItem("potatoHubFavorites",JSON.stringify(favorites));renderGames();return;}
  const tryButton=event.target.closest("[data-try]");if(tryButton){showGame(tryButton.dataset.try,"try");return;}
  const installButton=event.target.closest("[data-install]");if(installButton)showGame(installButton.dataset.install,"details");
});
$("#searchInput").addEventListener("input",renderGames);
$("#categoryChips").addEventListener("click",event=>{const chip=event.target.closest("[data-category]");if(!chip)return;selectedCategory=chip.dataset.category;document.querySelectorAll(".chip").forEach(c=>c.classList.toggle("active",c===chip));renderGames();});
$("#themeToggle").addEventListener("click",()=>{document.body.classList.toggle("light");localStorage.setItem("potatoHubTheme",document.body.classList.contains("light")?"light":"dark");});
$("#closeDialog").addEventListener("click",()=>$("#gameDialog").close());
$("#gameDialog").addEventListener("click",event=>{if(event.target===$("#gameDialog"))$("#gameDialog").close();});
$("#enableNotifications").addEventListener("click",enableNotifications);
$("#notificationsButton").addEventListener("click",()=>{document.querySelector("#updates").scrollIntoView({behavior:"smooth"});toast("هذه آخر أخبار الألعاب في المتجر.");});
$("#libraryLink").addEventListener("click",event=>{event.preventDefault();const owned=games.filter(g=>library.includes(g.id));toast(owned.length? "ألعاب مكتبتك: "+owned.map(g=>g.name).join("، "):"مكتبتك فارغة حالياً. أضيفي لعبة من صفحة تفاصيلها.");});
if(localStorage.getItem("potatoHubTheme")==="light")document.body.classList.add("light");
renderGames();renderUpdates();loadCatalog();
if("serviceWorker" in navigator && location.protocol!=="file:")navigator.serviceWorker.register("./sw.js").catch(()=>{});
