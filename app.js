/* POTATO HUB — storefront foundation */
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
const supabaseClient = (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const demoGames = [
  {id:"orbit-arcade",name:"ORBIT ARCADE",category:"مغامرات",version:"4.6.0",description:"انطلق في رحلة بين النجوم، واكتشف القطاعات والمجرات في مغامرة فضائية مستقلة.",status:"available",kind:"orbit",updated:"الإصدار التجريبي",demoUrl:"",downloadUrl:"",featured:true},
  {id:"potato-quest",name:"POTATO QUEST",category:"أركيد",version:"قريباً",description:"مغامرة بطاطا صغيرة في عالم مليء بالمفاجآت. اللعبة قيد التطوير.",status:"coming-soon",kind:"potato",demoUrl:"",downloadUrl:"",featured:false}
];

let games = [...demoGames];
let selectedCategory = "الكل";
const $ = selector => document.querySelector(selector);

function readStore(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch (_) {
    return fallback;
  }
}
function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("Local storage unavailable:", error);
    toast("تعذر الحفظ على هذا الجهاز. تحقق من مساحة التخزين وإعدادات المتصفح.");
    return false;
  }
}
const savedLibrary = readStore("potatoHubLibrary", []);
let library = (Array.isArray(savedLibrary) ? savedLibrary : [])
  .map(item => typeof item === "string"
    ? {id:item, version:"غير معروف", addedAt:new Date().toISOString()}
    : item)
  .filter(item => item && typeof item.id === "string");
const savedFavorites = readStore("potatoHubFavorites", []);
let favorites = Array.isArray(savedFavorites) ? savedFavorites.filter(id => typeof id === "string") : [];
const gameGrid = $("#gameGrid");

function persistLibrary() {
  return writeStore("potatoHubLibrary", library);
}
function toast(message) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 3200);
}
function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function getGame(id) {
  return games.find(game => game.id === id || game.databaseId === id);
}
function getLibraryEntry(id) {
  const game = getGame(id);
  return library.find(item => item.id === id || (game && item.id === game.databaseId));
}
function gameStatusLabel(game) {
  if (game.status === "maintenance") return "تحت الصيانة";
  if (game.status === "coming-soon") return "قريباً";
  return game.status === "available" ? "متاحة" : "غير متاحة";
}
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
        '<span class="cover-tag">' + gameStatusLabel(game) + '</span>' +
        (game.kind === "orbit" ? '<div class="cover-orbit"></div>' : '<span class="cover-potato">🥔</span>') +
      '</div><div class="game-info">' +
        '<div class="game-title-row"><h3 class="game-title">' + safeText(game.name) + '</h3>' +
        '<button class="favorite ' + (favorites.includes(game.id) ? "active" : "") + '" data-favorite="' + safeText(game.id) + '" aria-label="إضافة للمفضلة" aria-pressed="' + favorites.includes(game.id) + '">' + (favorites.includes(game.id) ? "♥" : "♡") + '</button></div>' +
        '<p class="game-meta">' + safeText(game.category) + ' · ' + safeText(game.version) + '</p>' +
        '<div class="card-actions">' +
          '<button class="try-button" data-try="' + safeText(game.id) + '" ' + (!isAvailable ? "disabled" : "") + '>جرّب</button>' +
          '<button class="install-button ' + (!isAvailable ? "soon-button" : "") + '" data-install="' + safeText(game.id) + '" ' + (!isAvailable ? "disabled" : "") + '>' + (saved ? "في مكتبتي" : isAvailable ? "التفاصيل / تنزيل" : game.status === "maintenance" ? "تحت الصيانة" : "قريباً") + '</button>' +
        '</div></div></article>';
  }).join("");
}
function renderLibrary() {
  const entries = library.map(item => ({item, game:getGame(item.id)})).filter(row => row.game);
  $("#libraryCount").textContent = entries.length + " ألعاب";
  if (!entries.length) {
    $("#libraryList").innerHTML = '<div class="empty-state">مكتبتك فارغة حالياً. افتحي صفحة لعبة وابدئي تنزيلها لتظهر هنا.</div>';
    return;
  }
  $("#libraryList").innerHTML = entries.map(({item,game}) => {
    const hasUpdate = game.status === "available" && game.version !== "قريباً" && item.version !== game.version;
    return '<article class="library-row"><div class="library-game-icon ' + (game.kind === "potato" ? "blue" : "") + '">' + (game.kind === "orbit" ? "✦" : "🥔") + '</div>' +
      '<div class="library-game-copy"><strong>' + safeText(game.name) + '</strong><small>النسخة المسجلة: ' + safeText(item.version) + ' · أحدث نسخة: ' + safeText(game.version) + '</small></div>' +
      (hasUpdate ? '<button class="library-update" data-library-update="' + safeText(game.id) + '">تنزيل التحديث</button>' : '<span class="library-current">' + (game.status === "maintenance" ? "تحت الصيانة" : "لا يوجد تحديث") + '</span>') +
      '<button class="library-remove" data-library-remove="' + safeText(game.id) + '" aria-label="إزالة من المكتبة">×</button></article>';
  }).join("");
}
function renderUpdates() {
  const entries = library.map(item => ({item,game:getGame(item.id)})).filter(row => row.game);
  const outdated = entries.filter(({item,game}) => game.status === "available" && game.version !== "قريباً" && item.version !== game.version);
  $("#notificationDot").style.display = outdated.length ? "block" : "none";
  if (!entries.length) {
    $("#updatesList").innerHTML = '<p class="muted">ستظهر تحديثات الألعاب التي أضفتِها إلى مكتبتك هنا.</p>';
    return;
  }
  $("#updatesList").innerHTML = entries.map(({item,game}) => {
    const hasUpdate = game.status === "available" && game.version !== "قريباً" && item.version !== game.version;
    const detail = game.status === "maintenance"
      ? "اللعبة تحت الصيانة حالياً"
      : hasUpdate
        ? "إصدار جديد متاح: " + safeText(game.version) + " · النسخة المسجلة " + safeText(item.version)
        : "الإصدار " + safeText(game.version) + " · لا يوجد تحديث جديد";
    return '<div class="update-row"><span class="update-mark">' + (hasUpdate ? "!" : "↻") + '</span><div><strong>' + safeText(game.name) + '</strong><small>' + detail +
      '</small></div><span class="update-status ' + (hasUpdate ? "has-update" : "") + '">' + (hasUpdate ? "تحديث" : "الحالة") + '</span></div>';
  }).join("");
}
function refreshViews() {
  renderGames();
  renderLibrary();
  renderUpdates();
}
function safeHttpUrl(value) {
  if (!value || typeof value !== "string") return null;
  try {
    const url = new URL(value, location.href);
    if (url.protocol === "https:" || (url.protocol === "http:" && ["localhost","127.0.0.1"].includes(url.hostname))) return url.href;
  } catch (_) {}
  return null;
}
function openExternal(url) {
  const safeUrl = safeHttpUrl(url);
  if (!safeUrl) return false;
  const opened = window.open(safeUrl, "_blank");
  if (!opened) return false;
  try { opened.opener = null; } catch (_) {}
  return true;
}
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
    (isTry ? '<button id="launchDemo">فتح التجربة</button>' : '<button id="downloadGame"' + (game.status !== "available" ? " disabled" : "") + '>تنزيل اللعبة</button>') +
    '</div><p class="muted">' + (isTry ? "التجربة تفتح في صفحة مستقلة عند إضافة رابطها." : "تُسجل النسخة في المكتبة بعد نجاح فتح رابط التنزيل، ولا يمكن للمتصفح تأكيد تثبيت APK.") + '</p></div>';
  dialog.showModal();
  $("#launchDemo")?.addEventListener("click", () => {
    if (!game.demoUrl) { toast("رابط تجربة اللعبة لم يُضف بعد."); return; }
    if (!openExternal(game.demoUrl)) toast("تعذر فتح رابط التجربة. تحقق من الرابط والسماح بالنوافذ المنبثقة.");
  });
  $("#downloadGame")?.addEventListener("click", () => startDownload(game));
}
function startDownload(game) {
  if (!game || game.status !== "available") {
    toast("اللعبة غير متاحة للتنزيل حالياً.");
    return;
  }
  if (!game.downloadUrl) {
    toast("رابط تنزيل اللعبة لم يُضف بعد.");
    return;
  }
  if (!openExternal(game.downloadUrl)) {
    toast("لم يُفتح رابط التنزيل. لم نغيّر حالة اللعبة في مكتبتك.");
    return;
  }
  const previousLibrary = library.map(item => ({...item}));
  const existing = getLibraryEntry(game.id);
  if (existing) {
    existing.id = game.id;
    existing.version = game.version;
    existing.downloadOpenedAt = new Date().toISOString();
  } else {
    library.push({id:game.id,version:game.version,addedAt:new Date().toISOString(),downloadOpenedAt:new Date().toISOString()});
  }
  if (!persistLibrary()) {
    library = previousLibrary;
    refreshViews();
    return;
  }
  refreshViews();
  toast("فُتح رابط التنزيل وسُجل الإصدار المختار في مكتبتك. تثبيت اللعبة غير مؤكد من المتصفح.");
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
        databaseId:game.id,
        id:game.slug || game.id,
        demoUrl:game.demo_url || "",
        downloadUrl:game.download_url || "",
        updated:game.updated_at ? new Date(game.updated_at).toLocaleDateString("ar") : "تحديث جديد"
      }));
      library = library.map(item => {
        const match = games.find(game => game.databaseId === item.id || game.id === item.id);
        return match ? {...item,id:match.id} : item;
      });
      persistLibrary();
      refreshViews();
    }
  } catch (error) {
    console.warn("Supabase catalog unavailable; using demo catalog.",error.message);
    toast("تعذر تحميل كتالوج المتجر. نعرض البيانات التجريبية مؤقتاً.");
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
    toast("تم السماح بالإشعارات. إرسال تحديثات فعلية يحتاج خادم Push واشتراكاً محفوظاً.");
  } catch (error) {
    toast("تعذر تفعيل الإشعارات على هذا الجهاز.");
    console.error(error);
  }
}

gameGrid.addEventListener("click",event => {
  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) {
    const id = favoriteButton.dataset.favorite;
    const nextFavorites = favorites.includes(id) ? favorites.filter(value => value !== id) : [...favorites,id];
    if (writeStore("potatoHubFavorites",nextFavorites)) {
      favorites = nextFavorites;
      renderGames();
    }
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
    const previousLibrary = library;
    library = library.filter(item => item.id !== removeButton.dataset.libraryRemove);
    if (!persistLibrary()) {
      library = previousLibrary;
      refreshViews();
      return;
    }
    refreshViews();
    toast("أُزيلت اللعبة من مكتبتك على هذا الجهاز.");
    return;
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
$("#filterButton").addEventListener("click",() => {
  const chips = $("#categoryChips");
  const willShow = chips.style.display === "none";
  chips.style.display = willShow ? "flex" : "none";
  $("#filterButton").setAttribute("aria-expanded",String(willShow));
});
$("#themeToggle").addEventListener("click",() => {
  document.body.classList.toggle("light");
  try { localStorage.setItem("potatoHubTheme",document.body.classList.contains("light") ? "light" : "dark"); }
  catch (_) { toast("تعذر حفظ المظهر، لكن التغيير الحالي ما زال فعالاً."); }
});
$("#closeDialog").addEventListener("click",() => $("#gameDialog").close());
$("#gameDialog").addEventListener("click",event => { if (event.target === $("#gameDialog")) $("#gameDialog").close(); });
$("#enableNotifications").addEventListener("click",enableNotifications);
$("#notificationsButton").addEventListener("click",() => $("#updates").scrollIntoView({behavior:"smooth"}));
document.querySelector(".bottom-nav").addEventListener("click",event => {
  const item = event.target.closest(".nav-item");
  if (!item) return;
  document.querySelectorAll(".nav-item").forEach(link => link.classList.toggle("selected",link === item));
});
try {
  if (localStorage.getItem("potatoHubTheme") === "light") document.body.classList.add("light");
} catch (_) {}
refreshViews();
loadCatalog();
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js").catch(error => console.warn("Service worker unavailable.",error));
}
