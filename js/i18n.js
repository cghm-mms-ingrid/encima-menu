/* UI strings for launch languages. Marked NEEDS REVIEW by a native speaker before launch.
   Item names/descriptions fall back to English until translated in the admin (Phase 3). */
/* =====================================================================
   HOW TO ADD A LANGUAGE (everything is in this file)
   1. Add ONE line to LANGS below.
        code    : short id, e.g. "de"
        label   : the language's own name first, English name in brackets, e.g. "Deutsch (German)"
        google  : (only if different from code) the Google Translate code
        detect  : (optional) browser-language prefixes that should pick it automatically
   2. Copy the "Español" block at the bottom of this file, rename es -> your code and translate the
      strings. Anything you leave out simply shows in English, so it is safe to do this in stages.
   3. Make sure the Google code is listed in includedLanguages in index.html AND room-service/index.html
      (most common languages already are).
   The language menu labels are locked from Google Translate, so they always keep their own name.
   ===================================================================== */
const LANGS = [
  { code: "en", label: "English" },
  { code: "fil", label: "Filipino", google: "tl", detect: ["fil", "tl"] },
  { code: "zh-Hans", label: "简体中文 (Simplified Chinese)", google: "zh-CN" },
  { code: "zh-Hant", label: "繁體中文 (Traditional Chinese)", google: "zh-TW" },
  { code: "ko", label: "한국어 (Korean)", detect: ["ko"] },
  { code: "ja", label: "日本語 (Japanese)", detect: ["ja"] },
  { code: "es", label: "Español (Spanish)", detect: ["es"] },
  { code: "fr", label: "Français (French)", detect: ["fr"] }
];

const UI = {
  en: { food: "Food", drinks: "Drinks", setmenu: "Set Menu", roomservice: "Room Service", search: "Search the menu…", all: "All", filters: "Filters", clear: "Clear",
        reserve: "Reserve on OpenTable", hours: "Open daily", vat: "All prices inclusive of VAT. No service charge.",
        noResults: "Nothing matches your search or filters.", soldOut: "Sold out", tbd: "Price on request", glass: "Glass", bottle: "Bottle", shot: "Shot", glass200: "200 ml",
        pairing: "Pairs with", photo: "Photo coming soon", close: "Close", tagline: "Bar & Restaurant", menu: "Menu", visit: "Visit us", items: "items",
        chooseOne: "Choose one", best: "Best Sellers" },
  fil: { food: "Pagkain", drinks: "Inumin", setmenu: "Set Menu", search: "Hanapin sa menu…", all: "Lahat", filters: "Mga Filter", clear: "I-clear",
        reserve: "Mag-reserve sa OpenTable", hours: "Bukas araw-araw", vat: "Kasama na ang VAT sa lahat ng presyo. Walang service charge.",
        noResults: "Walang tugma sa hinahanap o filter mo.", soldOut: "Ubos na", tbd: "Itanong ang presyo", glass: "Baso", bottle: "Bote", shot: "Shot", glass200: "200 ml",
        pairing: "Bagay sa", photo: "Paparating ang larawan", close: "Isara", tagline: "Bar at Restaurant", menu: "Menu", visit: "Bisitahin kami", items: "item",
        chooseOne: "Pumili ng isa", best: "Mga Best Seller" },
  "zh-Hans": { food: "餐点", drinks: "饮品", setmenu: "套餐", search: "搜索菜单…", all: "全部", filters: "筛选", clear: "清除",
        reserve: "通过 OpenTable 订位", hours: "每日营业", vat: "所有价格均含增值税，不收服务费。",
        noResults: "没有符合搜索或筛选条件的项目。", soldOut: "已售罄", tbd: "价格请询问", glass: "杯", bottle: "瓶", shot: "单份", glass200: "200毫升",
        pairing: "搭配", photo: "图片即将上线", close: "关闭", tagline: "酒吧与餐厅", menu: "菜单", visit: "光临我们", items: "项",
        chooseOne: "任选一项", best: "人气之选" },
  "zh-Hant": { food: "餐點", drinks: "飲品", setmenu: "套餐", search: "搜尋菜單…", all: "全部", filters: "篩選", clear: "清除",
        reserve: "透過 OpenTable 訂位", hours: "每日營業", vat: "所有價格均含增值稅，不收服務費。",
        noResults: "沒有符合搜尋或篩選條件的項目。", soldOut: "已售完", tbd: "價格請洽詢", glass: "杯", bottle: "瓶", shot: "單份", glass200: "200毫升",
        pairing: "搭配", photo: "圖片即將上線", close: "關閉", tagline: "酒吧與餐廳", menu: "菜單", visit: "蒞臨我們", items: "項",
        chooseOne: "任選一項", best: "人氣之選" },
  ko: { food: "음식", drinks: "음료", setmenu: "세트 메뉴", search: "메뉴 검색…", all: "전체", filters: "필터", clear: "초기화",
        reserve: "OpenTable에서 예약", hours: "매일 영업", vat: "모든 가격은 부가세 포함이며 서비스 요금은 없습니다.",
        noResults: "검색어나 필터와 일치하는 항목이 없습니다.", soldOut: "품절", tbd: "가격 문의", glass: "글라스", bottle: "병", shot: "샷", glass200: "200ml",
        pairing: "추천 페어링", photo: "사진 준비 중", close: "닫기", tagline: "바 & 레스토랑", menu: "메뉴", visit: "오시는 길", items: "개",
        chooseOne: "택 1", best: "베스트셀러" },
  ja: { food: "フード", drinks: "ドリンク", setmenu: "セットメニュー", search: "メニューを検索…", all: "すべて", filters: "絞り込み", clear: "クリア",
        reserve: "OpenTableで予約", hours: "毎日営業", vat: "全て税込価格です。サービス料はかかりません。",
        noResults: "検索条件に一致する項目がありません。", soldOut: "売り切れ", tbd: "価格はお問い合わせください", glass: "グラス", bottle: "ボトル", shot: "ショット", glass200: "200ml",
        pairing: "おすすめの組み合わせ", photo: "写真は準備中です", close: "閉じる", tagline: "バー＆レストラン", menu: "メニュー", visit: "アクセス", items: "品",
        chooseOne: "1つお選びください", best: "人気メニュー" }
};

const TAG_LABELS = {
  fil: { best: "Best Seller", spicy: "Maanghang", veg: "Vegetarian", pork: "May Baboy", seafood: "Seafood", peanut: "May Mani", share: "Pang-share", organic: "Organic", vegan: "Vegan-Certified" },
  "zh-Hans": { best: "人气", spicy: "辣", veg: "素食", pork: "含猪肉", seafood: "海鲜", peanut: "含花生", share: "适合分享", organic: "有机", vegan: "纯素认证" },
  "zh-Hant": { best: "人氣", spicy: "辣", veg: "素食", pork: "含豬肉", seafood: "海鮮", peanut: "含花生", share: "適合分享", organic: "有機", vegan: "純素認證" },
  ko: { best: "베스트셀러", spicy: "매운맛", veg: "채식", pork: "돼지고기 포함", seafood: "해산물", peanut: "땅콩 포함", share: "나눠 먹기 좋음", organic: "유기농", vegan: "비건 인증" },
  ja: { best: "人気", spicy: "辛い", veg: "ベジタリアン", pork: "豚肉を含む", seafood: "シーフード", peanut: "ピーナッツを含む", share: "シェア向け", organic: "オーガニック", vegan: "ヴィーガン認証" }
};

const SECTION_NAMES = {
  fil: { starters: "Panimula", salads: "Mga Salad", especiales: "Especiales", pasta: "Pasta", pizza: "Pizza", "naked-burrito": "Naked Burrito", tacos: "Tacos | Burritos | Sandwiches", dessert: "Panghimagas", sides: "Mga Sahog" },
  "zh-Hans": { starters: "前菜", salads: "沙拉", especiales: "招牌主菜", pasta: "意面", pizza: "披萨", "naked-burrito": "无饼皮墨西哥卷", tacos: "塔可 | 卷饼 | 三明治", dessert: "甜点", sides: "配菜" },
  "zh-Hant": { starters: "前菜", salads: "沙拉", especiales: "招牌主餐", pasta: "義大利麵", pizza: "披薩", "naked-burrito": "無餅皮墨西哥捲", tacos: "塔可 | 捲餅 | 三明治", dessert: "甜點", sides: "配菜" },
  ko: { starters: "스타터", salads: "샐러드", especiales: "스페셜", pasta: "파스타", pizza: "피자", "naked-burrito": "네이키드 부리토", tacos: "타코 | 부리토 | 샌드위치", dessert: "디저트", sides: "사이드" },
  ja: { starters: "前菜", salads: "サラダ", especiales: "スペシャル", pasta: "パスタ", pizza: "ピザ", "naked-burrito": "ネイキッドブリトー", tacos: "タコス | ブリトー | サンドイッチ", dessert: "デザート", sides: "サイドメニュー" }
};

/* ---- Layout v2 strings. Long hero/story copy is English-only until translated in Phase 3. ---- */
Object.assign(UI.en, {
  navBest: "Best Sellers", navStory: "Our Story", navContact: "Contact", reserveShort: "Reserve",
  heroKick: "Rooftop dining · 23rd floor", heroLead: "Mexican- and Spanish-inspired plates, wine, cocktails and coffee, high above Makati.",
  viewFull: "View full menu", fact1t: "23rd Floor", fact1d: "City Garden Hotel Makati", fact2t: "Open daily", fact3t: "Food & Drinks", fact3d: "Wine, cocktails, coffee",
  bestKick: "Guest favorites", bestTitle: "Best Sellers", bestSub: "Our most-loved dishes, chosen by the people who dine with us.",
  storyKick: "Our story", storyTitle: "Above the city, around the table",
  storyP1: "Encima means \"above\" in Spanish, and that is where you will find us: on the 23rd floor of City Garden Hotel Makati, with the skyline at your table.",
  storyP2: "Our kitchen cooks Mexican- and Spanish-inspired plates alongside pasta, pizza and steaks, made for sharing. Pair them with wine, a signature cocktail or a good cup of coffee.",
  storyP3: "Open every day from morning until midnight.",
  menuKick: "The menu", menuTitle: "Eat, drink, enjoy",
  sectionLbl: "Section", sortLbl: "Sort by", allSections: "All sections", sortMenu: "Menu order", sortDesc: "Price: high to low", sortAsc: "Price: low to high",
  optTitle: "Sort & filter", searchBtn: "Search the menu", showResults: "Show results",
  rsAvail: "Available daily", rsDial: "Dial", rsOrders: "for orders",
  done: "Done", backFull: "← Back to full menu", activeFilters: "Showing only", selected: "selected", filtersN: "Filters"
});
const _x = (code, o) => Object.assign(UI[code], o);
_x("fil", { optTitle: "Ayusin at i-filter", searchBtn: "Hanapin sa menu", showResults: "Ipakita ang resulta", navBest: "Best Sellers", navStory: "Aming Kuwento", navContact: "Makipag-ugnayan", reserveShort: "Mag-reserve", viewFull: "Tingnan ang buong menu", sectionLbl: "Seksyon", sortLbl: "Ayusin ayon sa", allSections: "Lahat ng seksyon", sortMenu: "Ayos ng menu", sortDesc: "Presyo: mataas hanggang mababa", sortAsc: "Presyo: mababa hanggang mataas", done: "Tapos", backFull: "← Balik sa buong menu", activeFilters: "Ipinapakita lang", fact2t: "Bukas araw-araw", bestTitle: "Mga Best Seller", menuTitle: "Kain, inom, saya" });
_x("zh-Hans", { optTitle: "排序与筛选", searchBtn: "搜索菜单", showResults: "查看结果", navBest: "人气之选", navStory: "我们的故事", navContact: "联系我们", reserveShort: "订位", viewFull: "查看完整菜单", sectionLbl: "分类", sortLbl: "排序", allSections: "全部分类", sortMenu: "菜单顺序", sortDesc: "价格：从高到低", sortAsc: "价格：从低到高", done: "完成", backFull: "← 返回完整菜单", activeFilters: "仅显示", fact2t: "每日营业", bestTitle: "人气之选", menuTitle: "尽享美食美酒" });
_x("zh-Hant", { optTitle: "排序與篩選", searchBtn: "搜尋菜單", showResults: "查看結果", navBest: "人氣之選", navStory: "我們的故事", navContact: "聯絡我們", reserveShort: "訂位", viewFull: "查看完整菜單", sectionLbl: "分類", sortLbl: "排序", allSections: "全部分類", sortMenu: "菜單順序", sortDesc: "價格：由高至低", sortAsc: "價格：由低至高", done: "完成", backFull: "← 返回完整菜單", activeFilters: "僅顯示", fact2t: "每日營業", bestTitle: "人氣之選", menuTitle: "盡享美食美酒" });
_x("ko", { optTitle: "정렬 및 필터", searchBtn: "메뉴 검색", showResults: "결과 보기", navBest: "베스트셀러", navStory: "스토리", navContact: "문의", reserveShort: "예약", viewFull: "전체 메뉴 보기", sectionLbl: "섹션", sortLbl: "정렬", allSections: "전체 섹션", sortMenu: "메뉴 순서", sortDesc: "가격 높은 순", sortAsc: "가격 낮은 순", done: "완료", backFull: "← 전체 메뉴로", activeFilters: "표시 중", fact2t: "매일 영업", bestTitle: "베스트셀러", menuTitle: "먹고 마시고 즐기세요" });
_x("ja", { optTitle: "並び替えとフィルター", searchBtn: "メニューを検索", showResults: "結果を見る", navBest: "人気メニュー", navStory: "私たちについて", navContact: "お問い合わせ", reserveShort: "予約", viewFull: "全メニューを見る", sectionLbl: "カテゴリ", sortLbl: "並び替え", allSections: "すべてのカテゴリ", sortMenu: "メニュー順", sortDesc: "価格の高い順", sortAsc: "価格の安い順", done: "完了", backFull: "← 全メニューに戻る", activeFilters: "表示中", fact2t: "毎日営業", bestTitle: "人気メニュー", menuTitle: "食べて、飲んで、楽しむ" });

/* Room Service info line (needs native-speaker review like the rest). The words "Room Service" itself stay English. */
_x("fil", { rsAvail: "Bukas araw-araw", rsDial: "I-dial ang", rsOrders: "para mag-order" });
_x("zh-Hans", { rsAvail: "每日供应", rsDial: "拨打", rsOrders: "点餐" });
_x("zh-Hant", { rsAvail: "每日供應", rsDial: "撥打", rsOrders: "點餐" });
_x("ko", { rsAvail: "매일 이용 가능", rsDial: "주문 시 다이얼", rsOrders: "" });
_x("ja", { rsAvail: "毎日ご利用可能", rsDial: "ダイヤル", rsOrders: "でご注文" });


/* =====================================================================
   Español (Spanish). NEEDS REVIEW by a native speaker before launch.
   ===================================================================== */
UI.es = {
  food: "Comida", drinks: "Bebidas", setmenu: "Menú Fijo", search: "Buscar en el menú…", all: "Todo", filters: "Filtros", clear: "Borrar",
  reserve: "Reservar en OpenTable", hours: "Abierto todos los días", vat: "Todos los precios incluyen IVA. Sin cargo por servicio.",
  noResults: "Ningún resultado coincide con tu búsqueda o filtros.", soldOut: "Agotado", tbd: "Precio a consultar", glass: "Copa", bottle: "Botella", shot: "Chupito", glass200: "200 ml",
  pairing: "Marida con", photo: "Foto próximamente", close: "Cerrar", tagline: "Bar y Restaurante", menu: "Menú", visit: "Visítanos", items: "opciones",
  chooseOne: "Elige uno", best: "Más vendidos",
  optTitle: "Ordenar y filtrar", searchBtn: "Buscar en el menú", showResults: "Ver resultados", navBest: "Más vendidos", navStory: "Nuestra historia", navContact: "Contacto",
  reserveShort: "Reservar", viewFull: "Ver el menú completo", sectionLbl: "Sección", sortLbl: "Ordenar por", allSections: "Todas las secciones", sortMenu: "Orden del menú",
  sortDesc: "Precio: de mayor a menor", sortAsc: "Precio: de menor a mayor", done: "Listo", backFull: "← Volver al menú completo", activeFilters: "Mostrando solo",
  fact2t: "Abierto todos los días", bestTitle: "Más vendidos", menuTitle: "Come, bebe, disfruta", filtersN: "Filtros",
  rsAvail: "Disponible todos los días", rsDial: "Marque", rsOrders: "para pedidos"
};
TAG_LABELS.es = { best: "Más vendido", spicy: "Picante", veg: "Vegetariano", pork: "Contiene cerdo", seafood: "Mariscos", peanut: "Contiene cacahuetes", share: "Para compartir", organic: "Orgánico", vegan: "Vegano certificado" };
SECTION_NAMES.es = { starters: "Entrantes", salads: "Ensaladas", especiales: "Especiales", pasta: "Pasta", pizza: "Pizza", "naked-burrito": "Naked Burrito", tacos: "Tacos | Burritos | Sándwiches", dessert: "Postres", sides: "Acompañamientos" };


/* =====================================================================
   Français (French). NEEDS REVIEW by a native speaker before launch.
   ===================================================================== */
UI.fr = {
  food: "Plats", drinks: "Boissons", setmenu: "Menu fixe", search: "Rechercher dans le menu…", all: "Tout", filters: "Filtres", clear: "Effacer",
  reserve: "Réserver sur OpenTable", hours: "Ouvert tous les jours", vat: "Tous les prix sont TTC. Pas de frais de service.",
  noResults: "Aucun résultat ne correspond à votre recherche ou à vos filtres.", soldOut: "Épuisé", tbd: "Prix sur demande", glass: "Verre", bottle: "Bouteille", shot: "Shot", glass200: "200 ml",
  pairing: "Accompagne", photo: "Photo bientôt disponible", close: "Fermer", tagline: "Bar & Restaurant", menu: "Menu", visit: "Venez nous voir", items: "articles",
  chooseOne: "Au choix", best: "Meilleures ventes",
  optTitle: "Trier et filtrer", searchBtn: "Rechercher dans le menu", showResults: "Voir les résultats", navBest: "Meilleures ventes", navStory: "Notre histoire", navContact: "Contact",
  reserveShort: "Réserver", viewFull: "Voir le menu complet", sectionLbl: "Section", sortLbl: "Trier par", allSections: "Toutes les sections", sortMenu: "Ordre du menu",
  sortDesc: "Prix : décroissant", sortAsc: "Prix : croissant", done: "Terminé", backFull: "← Retour au menu complet", activeFilters: "Affichage limité à",
  fact2t: "Ouvert tous les jours", bestTitle: "Meilleures ventes", menuTitle: "Mangez, buvez, savourez", filtersN: "Filtres",
  rsAvail: "Disponible tous les jours", rsDial: "Composez le", rsOrders: "pour commander"
};
TAG_LABELS.fr = { best: "Meilleure vente", spicy: "Épicé", veg: "Végétarien", pork: "Contient du porc", seafood: "Fruits de mer", peanut: "Contient des arachides", share: "À partager", organic: "Bio", vegan: "Certifié végan" };
SECTION_NAMES.fr = { starters: "Entrées", salads: "Salades", especiales: "Spécialités", pasta: "Pâtes", pizza: "Pizza", "naked-burrito": "Naked Burrito", tacos: "Tacos | Burritos | Sandwichs", dessert: "Desserts", sides: "Accompagnements" };
