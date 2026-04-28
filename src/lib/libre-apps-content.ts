export type AppsLocale = "ro" | "hu";

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
        screenshotSrc: "/app-assets/libre-app-usage.webp",
        screenshotAlt: "Captura de ecran din utilizarea aplicatiei Libre",
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
        screenshotSrc: "/app-assets/librelinkup-hero.png",
        screenshotAlt: "Captura de ecran LibreLinkUp",
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
        screenshotSrc: "/app-assets/xdrip-screenshot.png",
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
        screenshotSrc: "/app-assets/libre-app-usage.webp",
        screenshotAlt: "Libre alkalmazas hasznalati kepernyokep",
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
        screenshotSrc: "/app-assets/librelinkup-hero.png",
        screenshotAlt: "LibreLinkUp kepernyokep",
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
};

