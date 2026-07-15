export type AppsLocale = "ro" | "hu" | "ru" | "uk";

export type AppsCard = {
  name: string;
  title: string;
  href: string;
  logoText: string;
  logoSrc?: string;
  summary: string;
  advantages: string[];
  drawbacks: string[];
  note: string;
  availabilityNote?: string;
  screenshotSrc?: string;
  screenshotAlt?: string;
  screenshotFit?: "cover" | "contain";
};

export type AppsPageContent = {
  pageTitle: string;
  topDisclaimer: string;
  intro: string;
  officialTitle: string;
  thirdPartyTitle: string;
  officialApps: AppsCard[];
  thirdPartyApps: AppsCard[];
  closingTitle: string;
  closingText: string;
  bottomFootnote: string;
};

const roEmail = "info@cumparatisenzor.ro";
const huEmail = "info@szenzorvasarlas.hu";
const euEmail = "info@kupitsensor.eu";
const whatsapp = "+420 777 577 352";

export const libreAppsContent: Record<AppsLocale, AppsPageContent> = {
  ro: {
    pageTitle: "Aplicații pentru FreeStyle Libre 2 Plus",
    topDisclaimer: "",
    intro:
      "Pe această pagină găsiți o selecție de aplicații și servicii care pot fi folosite împreună cu senzorii FreeStyle Libre 2 Plus. Mai jos prezentăm mai întâi aplicațiile oficiale Abbott, urmate de câteva soluții terțe utilizate frecvent de utilizatori.",
    officialTitle: "Aplicatii oficiale Abbott",
    thirdPartyTitle: "Aplicatii terte",
    officialApps: [
      {
        name: "FreeStyle LibreLink / Libre app",
        title: "FreeStyle LibreLink / Libre app",
        href: "https://www.freestyle.abbott/ro-ro/acasa.html",
        logoText: "Libre",
        logoSrc: "/app-assets/librelink-logo.png",
        summary:
          "Aplicatia oficiala Abbott pentru citirea valorilor glucozei, alerte si vizualizarea tendintelor direct pe telefon.",
        advantages: [
          "aplicatie oficiala Abbott",
          "lucreaza direct cu ecosistemul Libre",
          "alerte si istoric intr-o singura interfata",
        ],
        drawbacks: [
          "functiile si disponibilitatea pot diferi in functie de piata",
          "compatibilitatea depinde de modelul telefonului",
        ],
        note:
          "Abbott indica faptul ca aplicatia functioneaza doar pe anumite dispozitive si sisteme de operare compatibile.",
        availabilityNote: `Disponibilitatea exacta pentru Romania nu am reusit sa o verificam in mod oficial. Daca aveti experienta directa, ne puteti scrie la ${roEmail}.`,
        screenshotSrc: "/app-assets/librelink-home.webp",
        screenshotAlt: "Ecran principal aplicatie Libre",
        screenshotFit: "contain",
      },
      {
        name: "LibreLinkUp",
        title: "LibreLinkUp",
        href: "https://www.librelinkup.com/",
        logoText: "LUP",
        logoSrc: "/app-assets/librelinkup-logo.png",
        summary:
          "Aplicatia oficiala pentru familie, apropiati si ingrijitori, folosita pentru monitorizarea la distanta a valorilor partajate.",
        advantages: [
          "monitorizare de la distanta",
          "utila pentru familie si ingrijitori",
          "face parte din ecosistemul oficial Abbott",
        ],
        drawbacks: [
          "depinde de partajarea datelor din aplicatia principala",
          "disponibilitatea si compatibilitatea pot varia",
        ],
        note:
          "Abbott mentioneaza ca aplicatia poate urmari mai multe persoane dintr-un singur cont.",
        availabilityNote: `Disponibilitatea exacta pentru Romania nu am reusit sa o verificam in mod oficial. Daca aveti experienta directa, ne puteti scrie la ${roEmail}.`,
        screenshotSrc: "/app-assets/librelinkup-notifications.webp",
        screenshotAlt: "Ecran notificari LibreLinkUp",
        screenshotFit: "contain",
      },
      {
        name: "LibreView",
        title: "LibreView",
        href: "https://www.libreview.com/",
        logoText: "LV",
        logoSrc: "/app-assets/libreview-logo.svg",
        summary:
          "Platforma cloud oficiala Abbott pentru stocarea, revizuirea si partajarea istoricului glicemic.",
        advantages: [
          "platforma oficiala",
          "buna pentru istoric si rapoarte",
          "utila pentru colaborarea cu personalul medical",
        ],
        drawbacks: [
          "nu este o aplicatie principala de citire directa",
          "depinde de incarcarea si sincronizarea datelor",
        ],
        note:
          "LibreView este prezentat de Abbott ca sistem cloud de gestionare a datelor pentru utilizatori si profesionisti din domeniul sanatatii.",
        availabilityNote: `Disponibilitatea exacta pentru Romania nu am reusit sa o verificam in mod oficial. Daca aveti experienta directa, ne puteti scrie la ${roEmail}.`,
        screenshotSrc: "/app-assets/libreview-reports.png",
        screenshotAlt: "Captura de ecran LibreView",
      },
    ],
    thirdPartyApps: [
      {
        name: "Juggluco",
        title: "Juggluco",
        href: "https://play.google.com/store/apps/details?id=tk.glucodata",
        logoText: "J",
        logoSrc: "/app-assets/juggluco-screenshot.png",
        summary:
          "Aplicatie Android alternativa care poate lucra direct cu FreeStyle Libre 2 Plus si poate trimite date catre alte servicii.",
        advantages: [
          "compatibilitate directa cu Libre 2 Plus",
          "date aproape in timp real",
          "export si integrare cu Nightscout / LibreView",
        ],
        drawbacks: ["disponibil in principal pentru Android", "interfata mai tehnica"],
        note:
          "Poate trimite date catre Nightscout si, in anumite scenarii, si catre LibreView.",
        screenshotSrc: "/app-assets/juggluco-screenshot.png",
        screenshotAlt: "Captura de ecran Juggluco",
      },
      {
        name: "xDrip+",
        title: "xDrip+",
        href: "https://github.com/NightscoutFoundation/xDrip/releases",
        logoText: "xD",
        logoSrc: "/app-assets/xdrip-logo.png",
        summary:
          "Aplicatie Android foarte configurabila, folosita de utilizatori avansati pentru alarme, afisare, integrare cu ceasuri si servicii cloud.",
        advantages: [
          "foarte multe optiuni de configurare",
          "alarme si integrare extinsa",
          "ecosistem puternic pentru utilizatori avansati",
        ],
        drawbacks: [
          "configurare mai dificila",
          "pentru Libre 2 Plus este potrivit mai ales in scenariile UE",
        ],
        note: "Este un proiect comunitar activ actualizat frecvent.",
        screenshotSrc: "/app-assets/xdrip-wide.png",
        screenshotAlt: "Captura de ecran xDrip+",
      },
      {
        name: "Nightscout",
        title: "Nightscout",
        href: "https://nightscout.github.io/",
        logoText: "NS",
        logoSrc: "/app-assets/nightscout-logo.png",
        summary:
          "Serviciu open-source de vizualizare si partajare in cloud a datelor de glicemie.",
        advantages: ["monitorizare de la distanta", "acces din browser", "util pentru familie si ingrijitori"],
        drawbacks: [
          "nu este o aplicatie de citire directa a senzorului",
          "necesita o sursa de date si configurare suplimentara",
        ],
        note: "Poate fi gazduit de utilizator sau folosit prin servicii administrate.",
        screenshotSrc: "/app-assets/nightscout-screenshot.png",
        screenshotAlt: "Captura de ecran Nightscout",
      },
      {
        name: "GlucoDataHandler",
        title: "GlucoDataHandler",
        href: "https://play.google.com/store/apps/details?id=de.michelinside.glucodatahandler",
        logoText: "GDH",
        logoSrc: "/app-assets/gdh-wear.png",
        summary:
          "Instrument complementar pentru Android, foarte bun pentru ceasuri, widgeturi, notificari si afisare extinsa a valorilor.",
        advantages: [
          "excelent pentru Wear OS",
          "bun pentru widgeturi si notificari",
          "poate prelua date din Juggluco, xDrip+ sau Nightscout",
        ],
        drawbacks: [
          "nu este o aplicatie principala pentru citirea directa a senzorului",
          "are sens mai ales impreuna cu alta aplicatie",
        ],
        note: "Poate afisa valorile si pe smartwatch, si in Android Auto.",
        screenshotSrc: "/app-assets/gdh-screenshot.png",
        screenshotAlt: "Captura de ecran GlucoDataHandler",
      },
    ],
    closingTitle: "O nota la final",
    closingText:
      `Aceasta pagina este rezultatul unei cercetari modeste facute de echipa noastra. Nu avem experienta personala extinsa cu aceste aplicatii, deoarece noua ne-a fost suficienta aplicatia originala LibreLink. Daca aveti recomandari, observatii sau un tip de aplicatie care merita adaugat, ne bucuram daca ne scrieti la ${roEmail} sau pe WhatsApp la ${whatsapp}.`,
    bottomFootnote:
      "Compatibilitatea aplicatiilor se poate modifica in timp. Verificati intotdeauna informatiile oficiale ale dezvoltatorului inainte de instalare.",
  },
  hu: {
    pageTitle: "Alkalmazások FreeStyle Libre 2 Plus szenzorokhoz",
    topDisclaimer: "",
    intro:
      "Ezen az oldalon olyan alkalmazásokat és szolgáltatásokat gyűjtöttünk össze, amelyeket a FreeStyle Libre 2 Plus szenzorokkal lehet használni. Az alábbiakban először az Abbott hivatalos alkalmazásai szerepelnek, ezután pedig néhány gyakran használt külső megoldás következik.",
    officialTitle: "Hivatalos Abbott alkalmazások",
    thirdPartyTitle: "Harmadik féltől származó alkalmazások",
    officialApps: [
      {
        name: "FreeStyle LibreLink / Libre app",
        title: "FreeStyle LibreLink / Libre app",
        href: "https://www.freestyle.abbott/hu-hu/home.html",
        logoText: "Libre",
        logoSrc: "/app-assets/librelink-logo.png",
        summary:
          "Az Abbott hivatalos alkalmazasa a glukozertekek leolvasasahoz, riasztasokhoz es a trendek kozvetlen telefonos megjelenitesehez.",
        advantages: [
          "hivatalos Abbott alkalmazas",
          "kozvetlenul a Libre okoszisztemahoz keszult",
          "riasztasok es elozmenyek egy feluleten",
        ],
        drawbacks: [
          "a funkciok es az elerhetoseg piaconkent elterhetnek",
          "a kompatibilitas a telefon tipusatol is fugg",
        ],
        note:
          "Az Abbott kulon jelzi, hogy az alkalmazas csak bizonyos kompatibilis keszulekeken es operacios rendszereken mukodik.",
        availabilityNote: `A pontos magyarorszagi elerhetoseget hivatalos forrasbol nem tudtuk egyertelmuen megerositeni. Ha van kozvetlen tapasztalata, irjon nekunk a ${huEmail} cimre.`,
        screenshotSrc: "/app-assets/librelink-home.webp",
        screenshotAlt: "Libre alkalmazas fo kepernyo",
        screenshotFit: "contain",
      },
      {
        name: "LibreLinkUp",
        title: "LibreLinkUp",
        href: "https://www.librelinkup.com/",
        logoText: "LUP",
        logoSrc: "/app-assets/librelinkup-logo.png",
        summary:
          "A hozzatartozok es gondozok szamara keszult hivatalos alkalmazas, amely megosztott ertekek tavoli kovetesere szolgal.",
        advantages: [
          "tavkovetes",
          "hasznos csaladtagoknak es gondozoknak",
          "a hivatalos Abbott okoszisztema resze",
        ],
        drawbacks: [
          "a fo alkalmazasbol torteno adatmegosztasra epul",
          "az elerhetoseg es kompatibilitas valtozhat",
        ],
        note:
          "Az Abbott szerint az alkalmazas egy fiokbol tobb szemely koveteset is lehetove teheti.",
        availabilityNote: `A pontos magyarorszagi elerhetoseget hivatalos forrasbol nem tudtuk egyertelmuen megerositeni. Ha van kozvetlen tapasztalata, irjon nekunk a ${huEmail} cimre.`,
        screenshotSrc: "/app-assets/librelinkup-notifications.webp",
        screenshotAlt: "LibreLinkUp ertesitesi kepernyo",
        screenshotFit: "contain",
      },
      {
        name: "LibreView",
        title: "LibreView",
        href: "https://www.libreview.com/",
        logoText: "LV",
        logoSrc: "/app-assets/libreview-logo.svg",
        summary:
          "Az Abbott hivatalos felhos platformja a glukozadatok tarolasara, attekintesere es megosztasara.",
        advantages: [
          "hivatalos platform",
          "jo az elozmenyekhez es jelentesekhez",
          "hasznos lehet az egeszsegugyi csapattal valo egyuttmukodesben",
        ],
        drawbacks: [
          "nem elsodleges, kozvetlen szenzorolvaso alkalmazas",
          "adatfeltoltest es szinkronizalast igenyel",
        ],
        note:
          "Az Abbott a LibreView-t felhos adatkezelo rendszerkent mutatja be felhasznalok es egeszsegugyi szakemberek szamara.",
        availabilityNote: `A pontos magyarorszagi elerhetoseget hivatalos forrasbol nem tudtuk egyertelmuen megerositeni. Ha van kozvetlen tapasztalata, irjon nekunk a ${huEmail} cimre.`,
        screenshotSrc: "/app-assets/libreview-reports.png",
        screenshotAlt: "LibreView kepernyokep",
      },
    ],
    thirdPartyApps: [
      {
        name: "Juggluco",
        title: "Juggluco",
        href: "https://play.google.com/store/apps/details?id=tk.glucodata",
        logoText: "J",
        logoSrc: "/app-assets/juggluco-screenshot.png",
        summary:
          "Alternativ Android-alkalmazas, amely kozvetlenul egyutt tud mukodni a FreeStyle Libre 2 Plus szenzorral, es adatokat tud tovabbitani mas szolgaltatasok fele.",
        advantages: [
          "kozvetlen Libre 2 Plus kompatibilitas",
          "kozel valos ideju adatok",
          "export es Nightscout / LibreView integracio",
        ],
        drawbacks: ["elsosorban Androidon hasznalhato", "technikasabb kezelofelulet"],
        note:
          "Adatexportot tud kuldeni Nightscout fele, es bizonyos esetekben LibreView fele is.",
        screenshotSrc: "/app-assets/juggluco-screenshot.png",
        screenshotAlt: "Juggluco kepernyokep",
      },
      {
        name: "xDrip+",
        title: "xDrip+",
        href: "https://github.com/NightscoutFoundation/xDrip/releases",
        logoText: "xD",
        logoSrc: "/app-assets/xdrip-logo.png",
        summary:
          "Nagyon jol testreszabhato Android-alkalmazas, amelyet halado felhasznalok riasztasokhoz, megjeleniteshez, oras integraciohoz es felhos szolgaltatasokhoz hasznalnak.",
        advantages: [
          "rengeteg beallitasi lehetoseg",
          "kiterjedt riasztasi es integracios funkciok",
          "eros okoszisztema halado felhasznaloknak",
        ],
        drawbacks: ["bonyolultabb beallitas", "Libre 2 Plus eseten foleg EU-s hasznalati forgatokonyvekhez ajanlott"],
        note: "Aktivan karbantartott kozossegi projekt, gyakori frissitesekkel.",
        screenshotSrc: "/app-assets/xdrip-wide.png",
        screenshotAlt: "xDrip+ kepernyokep",
      },
      {
        name: "Nightscout",
        title: "Nightscout",
        href: "https://nightscout.github.io/",
        logoText: "NS",
        logoSrc: "/app-assets/nightscout-logo.png",
        summary:
          "Nyilt forraskodu felhos megoldas a glukozadatok megjelenitesere es megosztasara.",
        advantages: ["tavkovetes", "bongeszobol is elerheto", "hasznos csaladtagoknak es gondozoknak"],
        drawbacks: [
          "nem kozvetlen szenzorolvaso alkalmazas",
          "kulon adatforrast es tovabbi beallitast igenyel",
        ],
        note:
          "Sajat tarhelyen is futtathato, de menedzselt szolgaltataskent is hasznalhato.",
        screenshotSrc: "/app-assets/nightscout-screenshot.png",
        screenshotAlt: "Nightscout kepernyokep",
      },
      {
        name: "GlucoDataHandler",
        title: "GlucoDataHandler",
        href: "https://play.google.com/store/apps/details?id=de.michelinside.glucodatahandler",
        logoText: "GDH",
        logoSrc: "/app-assets/gdh-wear.png",
        summary:
          "Androidos kiegeszito eszkoz, amely kulonosen jo orakhoz, widgetekhez, ertesitesekhez es kibovitett megjeleniteshez.",
        advantages: [
          "kivalo Wear OS tamogatas",
          "eros widget es ertesitesi funkciok",
          "Juggluco, xDrip+ vagy Nightscout adatforrast is tud hasznalni",
        ],
        drawbacks: [
          "nem elsodleges, kozvetlen szenzorolvaso alkalmazas",
          "inkabb mas alkalmazassal egyutt igazan hasznos",
        ],
        note:
          "Az ertekeket okosoran es Android Auto feluleten is meg tudja jeleniteni.",
        screenshotSrc: "/app-assets/gdh-tablet.png",
        screenshotAlt: "GlucoDataHandler kepernyokep",
      },
    ],
    closingTitle: "Záró megjegyzés",
    closingText:
      `Ez az oldal a csapatunk szereny kutatasanak eredmenye. Ezekkel az alkalmazasokkal nincs szeles koru szemelyes tapasztalatunk, mert szamunkra a LibreLink eredeti alkalmazas mindig elegendo volt. Ha van ajanlasa, tapasztalata vagy olyan alkalmazas, amely szerint erdemes lenne ide felvenni, orommel vesszuk, ha ir nekunk a ${huEmail} cimre vagy WhatsAppon: ${whatsapp}.`,
    bottomFootnote:
      "Az alkalmazasok kompatibilitasa idovel valtozhat. Telepites elott mindig ellenorizze a fejleszto hivatalos tajekoztatasat.",
  },
  ru: {
    pageTitle: "Приложения для FreeStyle Libre 2 Plus",
    topDisclaimer: "",
    intro:
      "На этой странице собрали приложения и сервисы, которые можно использовать вместе с сенсором FreeStyle Libre 2 Plus. Сначала — официальные приложения Abbott, затем несколько сторонних решений, которыми часто пользуются.",
    officialTitle: "Официальные приложения Abbott",
    thirdPartyTitle: "Сторонние приложения",
    officialApps: [
      {
        name: "FreeStyle LibreLink / Libre app",
        title: "FreeStyle LibreLink / Libre app",
        href: "https://www.freestyle.abbott/",
        logoText: "Libre",
        logoSrc: "/app-assets/librelink-logo.png",
        summary:
          "Официальное приложение Abbott для считывания значений глюкозы, уведомлений и отображения трендов прямо на телефоне.",
        advantages: [
          "официальное приложение Abbott",
          "работает напрямую с экосистемой Libre",
          "уведомления и история в одном интерфейсе",
        ],
        drawbacks: [
          "функции и доступность могут отличаться по рынкам",
          "совместимость зависит от модели телефона",
        ],
        note: "Abbott указывает, что приложение работает только на определённых совместимых устройствах и операционных системах.",
        availabilityNote: `Точную доступность именно для вашей страны официально проверить не удалось. Если у вас есть личный опыт, напишите нам на ${euEmail}.`,
        screenshotSrc: "/app-assets/librelink-home.webp",
        screenshotAlt: "Главный экран приложения Libre",
        screenshotFit: "contain",
      },
      {
        name: "LibreLinkUp",
        title: "LibreLinkUp",
        href: "https://www.librelinkup.com/",
        logoText: "LUP",
        logoSrc: "/app-assets/librelinkup-logo.png",
        summary: "Официальное приложение для родных и близких — удалённый просмотр значений, которыми с ними поделились.",
        advantages: [
          "удалённое наблюдение",
          "полезно для семьи и опекунов",
          "часть официальной экосистемы Abbott",
        ],
        drawbacks: [
          "зависит от передачи данных из основного приложения",
          "доступность и совместимость могут меняться",
        ],
        note: "По данным Abbott, приложение может отслеживать нескольких человек из одного аккаунта.",
        availabilityNote: `Точную доступность именно для вашей страны официально проверить не удалось. Если у вас есть личный опыт, напишите нам на ${euEmail}.`,
        screenshotSrc: "/app-assets/librelinkup-notifications.webp",
        screenshotAlt: "Экран уведомлений LibreLinkUp",
        screenshotFit: "contain",
      },
      {
        name: "LibreView",
        title: "LibreView",
        href: "https://www.libreview.com/",
        logoText: "LV",
        logoSrc: "/app-assets/libreview-logo.svg",
        summary: "Официальная облачная платформа Abbott для хранения, просмотра и передачи истории показаний глюкозы.",
        advantages: [
          "официальная платформа",
          "удобна для истории и отчётов",
          "полезна для взаимодействия с врачом",
        ],
        drawbacks: [
          "не основное приложение для прямого считывания",
          "зависит от загрузки и синхронизации данных",
        ],
        note: "Abbott представляет LibreView как облачную систему управления данными для пользователей и специалистов здравоохранения.",
        availabilityNote: `Точную доступность именно для вашей страны официально проверить не удалось. Если у вас есть личный опыт, напишите нам на ${euEmail}.`,
        screenshotSrc: "/app-assets/libreview-reports.png",
        screenshotAlt: "Скриншот LibreView",
      },
    ],
    thirdPartyApps: [
      {
        name: "Juggluco",
        title: "Juggluco",
        href: "https://play.google.com/store/apps/details?id=tk.glucodata",
        logoText: "J",
        logoSrc: "/app-assets/juggluco-screenshot.png",
        summary: "Альтернативное Android-приложение, которое умеет напрямую работать с FreeStyle Libre 2 Plus и передавать данные в другие сервисы.",
        advantages: [
          "прямая совместимость с Libre 2 Plus",
          "данные почти в реальном времени",
          "экспорт и интеграция с Nightscout / LibreView",
        ],
        drawbacks: ["доступно в основном для Android", "более техничный интерфейс"],
        note: "Может отправлять данные в Nightscout, а в некоторых сценариях — и в LibreView.",
        screenshotSrc: "/app-assets/juggluco-screenshot.png",
        screenshotAlt: "Скриншот Juggluco",
      },
      {
        name: "xDrip+",
        title: "xDrip+",
        href: "https://github.com/NightscoutFoundation/xDrip/releases",
        logoText: "xD",
        logoSrc: "/app-assets/xdrip-logo.png",
        summary: "Очень гибко настраиваемое Android-приложение для продвинутых пользователей: уведомления, отображение, интеграция с часами и облачными сервисами.",
        advantages: [
          "множество вариантов настройки",
          "расширенные уведомления и интеграции",
          "сильная экосистема для опытных пользователей",
        ],
        drawbacks: ["более сложная настройка", "для Libre 2 Plus подходит в основном для сценариев в ЕС"],
        note: "Активно поддерживаемый community-проект с частыми обновлениями.",
        screenshotSrc: "/app-assets/xdrip-wide.png",
        screenshotAlt: "Скриншот xDrip+",
      },
      {
        name: "Nightscout",
        title: "Nightscout",
        href: "https://nightscout.github.io/",
        logoText: "NS",
        logoSrc: "/app-assets/nightscout-logo.png",
        summary: "Open-source сервис для отображения и передачи данных о глюкозе через облако.",
        advantages: ["удалённое наблюдение", "доступ из браузера", "полезно для семьи и опекунов"],
        drawbacks: ["не приложение для прямого считывания сенсора", "требует источник данных и дополнительную настройку"],
        note: "Может размещаться пользователем самостоятельно или использоваться через управляемые сервисы.",
        screenshotSrc: "/app-assets/nightscout-screenshot.png",
        screenshotAlt: "Скриншот Nightscout",
      },
      {
        name: "GlucoDataHandler",
        title: "GlucoDataHandler",
        href: "https://play.google.com/store/apps/details?id=de.michelinside.glucodatahandler",
        logoText: "GDH",
        logoSrc: "/app-assets/gdh-wear.png",
        summary: "Дополнительный инструмент для Android — особенно хорош для часов, виджетов, уведомлений и расширенного отображения значений.",
        advantages: [
          "отличная поддержка Wear OS",
          "хорошие виджеты и уведомления",
          "может брать данные из Juggluco, xDrip+ или Nightscout",
        ],
        drawbacks: [
          "не основное приложение для прямого считывания сенсора",
          "имеет смысл в основном вместе с другим приложением",
        ],
        note: "Может показывать значения на смарт-часах и в Android Auto.",
        screenshotSrc: "/app-assets/gdh-screenshot.png",
        screenshotAlt: "Скриншот GlucoDataHandler",
      },
    ],
    closingTitle: "Заключительная заметка",
    closingText: `Эта страница — результат скромного исследования нашей команды. У нас нет широкого личного опыта работы с этими приложениями, потому что нам всегда хватало оригинального LibreLink. Если у вас есть рекомендации, замечания или приложение, которое стоило бы добавить — напишите нам на ${euEmail} или в WhatsApp: ${whatsapp}.`,
    bottomFootnote: "Совместимость приложений может со временем меняться. Перед установкой всегда проверяйте официальную информацию разработчика.",
  },
  uk: {
    pageTitle: "Додатки для FreeStyle Libre 2 Plus",
    topDisclaimer: "",
    intro:
      "На цій сторінці зібрали додатки та сервіси, які можна використовувати разом із сенсором FreeStyle Libre 2 Plus. Спочатку — офіційні додатки Abbott, потім кілька сторонніх рішень, якими часто користуються.",
    officialTitle: "Офіційні додатки Abbott",
    thirdPartyTitle: "Сторонні додатки",
    officialApps: [
      {
        name: "FreeStyle LibreLink / Libre app",
        title: "FreeStyle LibreLink / Libre app",
        href: "https://www.freestyle.abbott/",
        logoText: "Libre",
        logoSrc: "/app-assets/librelink-logo.png",
        summary: "Офіційний застосунок Abbott для зчитування значень глюкози, сповіщень і відображення трендів прямо на телефоні.",
        advantages: [
          "офіційний застосунок Abbott",
          "працює безпосередньо з екосистемою Libre",
          "сповіщення та історія в одному інтерфейсі",
        ],
        drawbacks: [
          "функції та доступність можуть відрізнятися за ринками",
          "сумісність залежить від моделі телефону",
        ],
        note: "Abbott зазначає, що застосунок працює лише на певних сумісних пристроях та операційних системах.",
        availabilityNote: `Точну доступність саме для вашої країни офіційно перевірити не вдалося. Якщо у вас є особистий досвід, напишіть нам на ${euEmail}.`,
        screenshotSrc: "/app-assets/librelink-home.webp",
        screenshotAlt: "Головний екран застосунку Libre",
        screenshotFit: "contain",
      },
      {
        name: "LibreLinkUp",
        title: "LibreLinkUp",
        href: "https://www.librelinkup.com/",
        logoText: "LUP",
        logoSrc: "/app-assets/librelinkup-logo.png",
        summary: "Офіційний застосунок для рідних і близьких — віддалений перегляд значень, якими з ними поділилися.",
        advantages: [
          "віддалене спостереження",
          "корисно для сім'ї та опікунів",
          "частина офіційної екосистеми Abbott",
        ],
        drawbacks: [
          "залежить від передачі даних з основного застосунку",
          "доступність і сумісність можуть змінюватися",
        ],
        note: "За даними Abbott, застосунок може відстежувати кількох людей з одного облікового запису.",
        availabilityNote: `Точну доступність саме для вашої країни офіційно перевірити не вдалося. Якщо у вас є особистий досвід, напишіть нам на ${euEmail}.`,
        screenshotSrc: "/app-assets/librelinkup-notifications.webp",
        screenshotAlt: "Екран сповіщень LibreLinkUp",
        screenshotFit: "contain",
      },
      {
        name: "LibreView",
        title: "LibreView",
        href: "https://www.libreview.com/",
        logoText: "LV",
        logoSrc: "/app-assets/libreview-logo.svg",
        summary: "Офіційна хмарна платформа Abbott для зберігання, перегляду та передавання історії показників глюкози.",
        advantages: ["офіційна платформа", "зручна для історії та звітів", "корисна для взаємодії з лікарем"],
        drawbacks: [
          "не основний застосунок для прямого зчитування",
          "залежить від завантаження та синхронізації даних",
        ],
        note: "Abbott представляє LibreView як хмарну систему керування даними для користувачів і фахівців охорони здоров'я.",
        availabilityNote: `Точну доступність саме для вашої країни офіційно перевірити не вдалося. Якщо у вас є особистий досвід, напишіть нам на ${euEmail}.`,
        screenshotSrc: "/app-assets/libreview-reports.png",
        screenshotAlt: "Скріншот LibreView",
      },
    ],
    thirdPartyApps: [
      {
        name: "Juggluco",
        title: "Juggluco",
        href: "https://play.google.com/store/apps/details?id=tk.glucodata",
        logoText: "J",
        logoSrc: "/app-assets/juggluco-screenshot.png",
        summary: "Альтернативний застосунок для Android, який уміє напряму працювати з FreeStyle Libre 2 Plus і передавати дані в інші сервіси.",
        advantages: [
          "пряма сумісність з Libre 2 Plus",
          "дані майже в реальному часі",
          "експорт та інтеграція з Nightscout / LibreView",
        ],
        drawbacks: ["доступний переважно для Android", "більш технічний інтерфейс"],
        note: "Може надсилати дані до Nightscout, а в деяких сценаріях — і до LibreView.",
        screenshotSrc: "/app-assets/juggluco-screenshot.png",
        screenshotAlt: "Скріншот Juggluco",
      },
      {
        name: "xDrip+",
        title: "xDrip+",
        href: "https://github.com/NightscoutFoundation/xDrip/releases",
        logoText: "xD",
        logoSrc: "/app-assets/xdrip-logo.png",
        summary: "Дуже гнучко налаштовуваний застосунок для Android, яким користуються досвідчені користувачі для сповіщень, відображення, інтеграції з годинниками та хмарними сервісами.",
        advantages: [
          "багато варіантів налаштування",
          "розширені сповіщення та інтеграції",
          "потужна екосистема для досвідчених користувачів",
        ],
        drawbacks: ["складніше налаштування", "для Libre 2 Plus підходить переважно для сценаріїв у ЄС"],
        note: "Активно підтримуваний спільнотою проєкт із частими оновленнями.",
        screenshotSrc: "/app-assets/xdrip-wide.png",
        screenshotAlt: "Скріншот xDrip+",
      },
      {
        name: "Nightscout",
        title: "Nightscout",
        href: "https://nightscout.github.io/",
        logoText: "NS",
        logoSrc: "/app-assets/nightscout-logo.png",
        summary: "Open-source сервіс для відображення та передавання даних про глюкозу через хмару.",
        advantages: ["віддалене спостереження", "доступ із браузера", "корисно для сім'ї та опікунів"],
        drawbacks: ["не застосунок для прямого зчитування сенсора", "потребує джерела даних і додаткового налаштування"],
        note: "Може розміщуватися користувачем самостійно або використовуватися через керовані сервіси.",
        screenshotSrc: "/app-assets/nightscout-screenshot.png",
        screenshotAlt: "Скріншот Nightscout",
      },
      {
        name: "GlucoDataHandler",
        title: "GlucoDataHandler",
        href: "https://play.google.com/store/apps/details?id=de.michelinside.glucodatahandler",
        logoText: "GDH",
        logoSrc: "/app-assets/gdh-wear.png",
        summary: "Додатковий інструмент для Android — особливо добрий для годинників, віджетів, сповіщень і розширеного відображення значень.",
        advantages: [
          "відмінна підтримка Wear OS",
          "хороші віджети та сповіщення",
          "може брати дані з Juggluco, xDrip+ або Nightscout",
        ],
        drawbacks: [
          "не основний застосунок для прямого зчитування сенсора",
          "має сенс переважно разом з іншим застосунком",
        ],
        note: "Може показувати значення на смарт-годиннику та в Android Auto.",
        screenshotSrc: "/app-assets/gdh-screenshot.png",
        screenshotAlt: "Скріншот GlucoDataHandler",
      },
    ],
    closingTitle: "Заключна примітка",
    closingText: `Ця сторінка — результат скромного дослідження нашої команди. У нас немає широкого особистого досвіду роботи із цими застосунками, бо нам завжди вистачало оригінального LibreLink. Якщо у вас є рекомендації, зауваження або застосунок, який варто було б додати — напишіть нам на ${euEmail} або у WhatsApp: ${whatsapp}.`,
    bottomFootnote: "Сумісність застосунків може з часом змінюватися. Перед встановленням завжди перевіряйте офіційну інформацію розробника.",
  },
};

