/* POTATO HUB — storefront foundation */
const SUPABASE_URL = ""; // Add the Supabase project URL after creating the project.
const SUPABASE_ANON_KEY = ""; // Public anon/publishable key only. Never expose service_role.
const supabaseClient = (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const demoGames = [
  {id:"orbit-arcade",name:"ORBIT ARCADE",category:"مغامرات",version:"4.6.0",description:"انطلق في رحلة بين النجوم، واكتشف القطاعات والمجرات في مغامرة فضائية مستقلة.",status:"available",kind:"orbit",updated:"الإصدار التجريبي",demoUrl:"",downloadUrl:"",featured:true},
  {id:"potato-quest",name:"POTATO QUEST",category:"أركيد",version:"قريباً",description:"مغامرة بطاطا صغيرة في عالم مليء بالمفاجآت. اللعبة قيد التطوير.",status:"coming-soon",kind:"potato",demoUrl:"",downloadUrl:"",featured:false}
];
let games = [...demoGames];
let selectedCategory = "الكل";
const readStore = (key, fallback) => {
  try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
  catch (_) { return fallback; }
};
let savedLibrary = readStore("potatoHubLibrary", []);
// Migrate the earlier prototype format (an array of game IDs).
let library = savedLibrary.map(item => typeof item === "string"
  ? {id:item, version:"غير معروف", addedAt:new Date().toISOString()}
  : item).filter(item => item && item.id);
let favorites = readStore("potatoHubFavorites", []);
const $ = selector => document.querySelector(selector);
const gameGrid = $("#gameGrid");

function persistLibrary() {
  localStorage.setItem("potatoHubLibrary", JSON.stringify(library));
}
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2800);
}
function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function getGame(id) { return games.find(game => game.id === id); }
function getLibraryEntry(id) { return library.find(item => item.id === id); }
function renderGames() {
  const term = $("#searchInput").value.trim().toLowerCase();
  const visible = games.filter(game =>
    (selectedCategory === "الكل" || game.category === selectedCategory) &&
    (!term || (game.name + " " + game.category + " " + game.description).toLowerCase().includes(term))
  );
  $("#gameCount").textContent = visible.length + " ألعاب";
  if (!visible.length) {
    gameGrid.innerHTML = '<div class="empty-state">ما لقينا ألعاب تطابق البحث.</div>';
    return;
  }
  gameGrid.innerHTML = visible.map(game => {
    const isAvailable = game.status === "available";
    const saved = Boolean(getLibraryEntry(game.id));
    return '<article class="game-card">' +
      '<div class="game-cover ' + (game.kind === "potato" ? "blue" : "") + '">' +
        '<span class="cover-tag">' + (isAvailable ? "متاحة" : "قريباً") + '</span>' +
        (game.kind === "orbit" ? '<div class="cover-orbit"></div>' : '<span class="cover-potato">🥔</span>') +
      '</div><div class="game-info">' +
        '<div class="game-title-row"><h3 class="game-title">' + safeText(game.name) + '</h3>' +
        '<button class="favorite ' + (favorites.includes(game.id) ? "active" : "") + '" data-favorite="' + safeText(game.id) + '" aria-label="إضافة للمفضلة">' + (favorites.includes(game.id) ? "♥" : "♡") + '</button></div>' +
        '<p class="game-meta">' + safeText(game.category) + ' · ' + safeText(game.version) + '</p>' +
        '<div class="card-actions">' +
          '<button class="try-button" data-try="' + safeText(game.id) + '" ' + (!isAvailable ? "disabled" : "") + '>جرّب</button>' +
          '<button class="install-button ' + (!isAvailable ? "soon-button" : "") + '" data-install="' + safeText(game.id) + '" ' + (!isAvailable ? "disabled" : "") + '>' + (saved ? "في مكتبتي" : isAvailable ? "التفاصيل / تنزيل" : "قريباً") + '</button>' +
        '</div></div></article>';
  }).join("");
}
function renderLibrary() {
  const entries = library.map(item => ({item, game:getGame(item.id)})).filter(row => row.game);
  $("#libraryCount").textContent = entries.length + " ألعاب";
  if (!entries.length) {
    $("#libraryList").innerHTML = '<div class="empty-state">مكتبتك فارغة حالياً. جرّبي لعبة ثم ابدئي تنزيلها لتظهر هنا.</div>';
    return;
  }
  $("#libraryList").innerHTML = entries.map(({item,game}) => {
    const hasUpdate = game.version !== "قريباً" && item.version !== game.version;
    return '<article class="library-row"><div class="library-game-icon ' + (game.kind === "potato" ? "blue" : "") + '">' + (game.kind === "orbit" ? "✦" : "🥔") + '</div>' +
      '<div class="library-game-copy"><strong>' + safeText(game.name) + '</strong><small>نسختك: ' + safeText(item.version) + ' · الأحدث: ' + safeText(game.version) + '</small></div>' +
      (hasUpdate ? '<button class="library-update" data-library-update="' + safeText(game.id) + '">تحديث</button>' : '<span class="library-current">محدّثة</span>') +
      '<button class="library-remove" data-library-remove="' + safeText(game.id) + '" aria-label="إزالة من المكتبة">×</button></article>';
  }).join("");
}
function renderUpdates() {
  const entries = library.map(item => ({item,game:getGame(item.id)})).filter(row => row.game);
  const outdated = entries.filter(({item,game}) => game.version !== "قريباً" && item.version !== game.version);
  $("#notificationDot").style.display = outdated.length ? "block" : "none";
  if (!entries.length) {
    $("#updatesList").innerHTML = '<p class="muted">ستظهر تحديثات الألعاب التي أضفتِها إلى مكتبتك هنا.</p>';
    return;
  }
  $("#updatesList").innerHTML = entries.map(({item,game}) => {
    const hasUpdate = game.version !== "قريباً" && item.version !== game.version;
    return '<div class="update-row"><span class="update-mark">' + (hasUpdate ? "!" : "↻") + '</span><div><strong>' + safeText(game.name) + '</strong><small>' +
      (hasUpdate ? "إصدار جديد متاح: " + safeText(game.version) + " · نسختك " + safeText(item.version) : "الإصدار " + safeText(game.version) + " · لا يوجد تحديث جديد") +
      '</small></div><span class="update-status ' + (hasUpdate ? "has-update" : "") + '">' + (hasUpdate ? "تحديث" : "محدّثة") + '</span></div>';
  }).join("");
}
function refreshViews() { renderGames(); renderLibrary(); renderUpdates(); }
function showGame(id, mode) {
  const game = getGame(id);
  if (!game) return;
  const isTry = mode === "try";
  const dialog = $("#gameDialog");
  $("#dialogContent").innerHTML =
    '<div class="dialog-cover">' + (game.kind === "orbit" ? "🪐" : "🥔") + '</div>' +
    '<div class="dialog-content"><p class="eyebrow">' + (isTry ? "تجربة اللعبة" : "صفحة اللعبة") + '</p>' +
    '<h2>' + safeText(game.name) + '</h2><p>' + safeText(game.description) + '</p>' +
    '<p>التصنيف: ' + safeText(game.category) + ' · الإصدار: ' + safeText(game.version) + '</p>' +
    '<div class="dialog-actions">' +
    (isTry ? '<button id="launchDemo">فتح التجربة</button>' : '<button id="downloadGame">تنزيل اللعبة</button>') +
    '</div><p class="muted">' + (isTry ? "التجربة تفتح كرابط مستقل عن المتجر عند إضافة رابطها." : "بعد بدء التنزيل، تُضاف اللعبة إلى مكتبتك على هذا الجهاز.") + '</p></div>';
  dialog.showModal();
  $("#launchDemo")?.addEventListener("click", () => {
    if (game.demoUrl) window.open(game.demoUrl, "_blank", "noopener");
    else toast("رابط تجربة اللعبة لم يُضف بعد.");
  });
  $("#downloadGame")?.addEventListener("click", () => startDownload(game));
}
function startDownload(game) {
  if (!game.downloadUrl) { toast("رابط تنزيل اللعبة لم يُضف بعد."); return; }
  const existing = getLibraryEntry(game.id);
  if (existing) existing.version = game.version;
  else library.push({id:game.id,version:game.version,addedAt:new Date().toISOString()});
  persistLibrary();
  refreshViews();
  window.open(game.downloadUrl, "_blank", "noopener");
  toast("بدأ التنزيل وأُضيفت اللعبة إلى مكتبتك على هذا الجهاز.");
}
async function loadCatalog() {
  if (!supabaseClient) return;
  try {
    const {data,error} = await supabaseClient.from("games")
      .select("id,slug,name,category,version,description,status,kind,demo_url,download_url,cover_url,updated_at")
      .eq("published",true).order("created_at",{ascending:false});
    if (error) throw error;
    if (data?.length) {
      games = data.map(game => ({
        ...game,
        id:game.slug || game.id,
        demoUrl:game.demo_url || "",
        downloadUrl:game.download_url || "",
        updated:game.updated_at ? new Date(game.updated_at).toLocaleDateString("ar") : "تحديث جديد"
      }));
      refreshViews();
    }
  } catch (error) {
    console.warn("Supabase catalog unavailable; using demo catalog.",error.message);
  }
}
async function enableNotifications() {
  if (!("Notification" in window)) { toast("هذا المتصفح لا يدعم إشعارات الويب."); return; }
  if (!("serviceWorker" in navigator)) { toast("إشعارات الخلفية غير متاحة في هذا المتصفح."); return; }
  if (!window.isSecureContext) { toast("الإشعارات تحتاج HTTPS أو localhost."); return; }
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") { toast("لم يتم السماح بالإشعارات."); return; }
    await navigator.serviceWorker.register("./sw.js");
    toast("تم السماح بالإشعارات. إرسال تحديثات فعلية بالخلفية يحتاج إعداد Push على الخادم.");
  } catch (error) {
    toast("تعذر تفعيل الإشعارات على هذا الجهاز.");
    console.error(error);
  }
}
gameGrid.addEventListener("click",event => {
  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) {
    const id = favoriteButton.dataset.favorite;
    favorites = favorites.includes(id) ? favorites.filter(value => value !== id) : [...favorites,id];
    localStorage.setItem("potatoHubFavorites",JSON.stringify(favorites));
    renderGames();
    return;
  }
  const tryButton = event.target.closest("[data-try]");
  if (tryButton) { showGame(tryButton.dataset.try,"try"); return; }
  const installButton = event.target.closest("[data-install]");
  if (installButton) showGame(installButton.dataset.install,"details");
});
$("#libraryList").addEventListener("click",event => {
  const removeButton = event.target.closest("[data-library-remove]");
  if (removeButton) {
    library = library.filter(item => item.id !== removeButton.dataset.libraryRemove);
    persistLibrary(); refreshViews(); toast("أُزيلت اللعبة من مكتبتك على هذا الجهاز."); return;
  }
  const updateButton = event.target.closest("[data-library-update]");
  if (updateButton) {
    const game = getGame(updateButton.dataset.libraryUpdate);
    if (game) startDownload(game);
  }
});
$("#searchInput").addEventListener("input",renderGames);
$("#categoryChips").addEventListener("click",event => {
  const chip = event.target.closest("[data-category]");
  if (!chip) return;
  selectedCategory = chip.dataset.category;
  document.querySelectorAll(".chip").forEach(element => element.classList.toggle("active",element === chip));
  renderGames();
});
$("#themeToggle").addEventListener("click",() => {
  document.body.classList.toggle("light");
  localStorage.setItem("potatoHubTheme",document.body.classList.contains("light") ? "light" : "dark");
});
$("#closeDialog").addEventListener("click",() => $("#gameDialog").close());
$("#gameDialog").addEventListener("click",event => { if (event.target === $("#gameDialog")) $("#gameDialog").close(); });
$("#enableNotifications").addEventListener("click",enableNotifications);
$("#notificationsButton").addEventListener("click",() => $("#updates").scrollIntoView({behavior:"smooth"}));
$("#libraryLink").addEventListener("click",() => {
  document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("selected"));
  $("#libraryLink").classList.add("selected");
});
if (localStorage.getItem("potatoHubTheme") === "light") document.body.classList.add("light");
refreshViews();
loadCatalog();
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js").catch(error => console.warn("Service worker unavailable.",error));
}