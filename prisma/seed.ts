import Database from "better-sqlite3";
import { hashSync } from "bcryptjs";
import { randomBytes } from "crypto";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const db = new Database(dbPath);

function cuid(): string {
  return "c" + randomBytes(12).toString("hex");
}

// SVG placeholder generator — returns a data URI for each asset
function svgIcon(label: string, hue: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="16" fill="hsl(${hue},70%,95%)"/><text x="50" y="56" text-anchor="middle" font-family="system-ui" font-size="14" font-weight="600" fill="hsl(${hue},60%,40%)">${label.slice(0, 8)}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const iconNames = [
  "arrow-up","arrow-down","arrow-left","arrow-right","chevron-up","chevron-down","chevron-left","chevron-right",
  "home","user","users","settings","gear","search","heart","star","bookmark","flag","bell","mail",
  "inbox","send","paperclip","link","external-link","share","upload","download","cloud","folder",
  "file","file-text","image","camera","video","music","headphones","mic","volume","speaker",
  "phone","message","chat","comment","at-sign","hash","tag","calendar","clock","timer",
  "sun","moon","cloud-rain","wind","zap","battery","wifi","bluetooth","monitor","smartphone",
  "tablet","laptop","server","database","hard-drive","cpu","code","terminal","git-branch","git-merge",
  "lock","unlock","key","shield","eye","eye-off","check","x","plus","minus",
  "edit","trash","copy","clipboard","scissors","tool","wrench","hammer","paint","brush",
  "pen","pencil","ruler","compass","grid","layout","layers","box","package","archive",
  "shopping-cart","credit-card","dollar","wallet","gift","percent","truck","map","pin","navigation",
  "globe","flag-2","anchor","compass-2","target","crosshair","activity","bar-chart","pie-chart","trending-up",
  "trending-down","award","trophy","medal","crown","diamond","gem","fire","flame","sparkle",
  "lightning","power","toggle","switch","filter","sort","align-left","align-center","align-right","bold",
  "italic","underline","type","font","heading","list","check-list","table","columns","rows",
  "refresh","rotate","flip","zoom-in","zoom-out","maximize","minimize","expand","shrink","move",
  "drag","grab","pointer","cursor","hand","thumbs-up","thumbs-down","smile","frown","meh",
  "laugh","wink","cool","angry","sad","happy","love","kiss","hug","wave",
  "rocket","plane","car","bus","train","bike","boat","helicopter","ufo","satellite",
  "atom","dna","flask","microscope","telescope","brain","lightbulb","idea","puzzle","game",
  "dice","joystick","gamepad","controller","trophy-2","medal-2","badge","ribbon","certificate","scroll",
  "book","book-open","library","newspaper","magazine","blog","post","article","document","report",
  "chart","graph","diagram","flow","tree","network","hierarchy","org-chart","mind-map","kanban",
  "todo","checklist","progress","milestone","sprint","agile","scrum","task","ticket","bug",
  "debug","test","qa","release","deploy","ci-cd","pipeline","workflow","automation","integration",
  "api","webhook","endpoint","rest","graphql","socket","stream","queue","pub-sub","event",
  "notification-bell","alert","warning","error","info","question","help","support","feedback","survey",
  "poll","vote","like","dislike","rate","review","testimonial","quote","speech","bubble",
  "megaphone","announce","broadcast","radio","podcast","stream-2","live","record","play-circle","pause-circle",
  "stop-circle","skip-forward","skip-back","fast-forward","rewind","shuffle","repeat","playlist","equalizer","slider",
  "knob","dial","gauge","meter","speedometer","dashboard","panel","widget","card","tile",
  "banner","hero","header","footer","sidebar","nav","menu","hamburger","dots","ellipsis",
  "more","options","dropdown","select","input","textarea","checkbox","radio-button","toggle-2","switch-2",
  "form","modal","dialog","popup","toast","snackbar","tooltip","popover","accordion","tab",
  "breadcrumb","pagination","stepper","wizard","carousel","slider-2","gallery","masonry","grid-2","list-2",
  "tree-2","table-2","data-grid","spreadsheet","pivot","chart-2","heatmap","scatter","bubble-2","radar",
  "funnel","waterfall","sankey","chord","sunburst","treemap","map-2","pin-2","marker","route",
  "direction","turn","u-turn","roundabout","highway","bridge","tunnel","parking","gas-station","charging",
  "hospital","pharmacy","school","university","library-2","museum","theater","cinema","restaurant","cafe",
  "bar","hotel","park","beach","mountain","forest","desert","island","lake","river",
  "ocean","wave-2","sunrise","sunset","rainbow","snow","rain","storm","tornado","earthquake",
  "recycle","eco","leaf","tree-3","flower","seed","plant","garden","harvest","farm",
  "animal","cat","dog","bird","fish","butterfly","bee","ant","spider","snake",
  "robot","ai","machine-learning","neural","deep-learning","tensor","model","train-2","predict","classify",
];

const illustrationNames = [
  "working-remotely","team-collaboration","project-launch","success-celebration","data-analysis",
  "creative-thinking","problem-solving","brainstorming","coding-session","design-sprint",
  "user-research","wireframing","prototyping","usability-testing","a-b-testing",
  "onboarding-flow","sign-up-page","login-screen","dashboard-view","settings-panel",
  "notification-center","profile-page","search-results","product-catalog","shopping-experience",
  "checkout-flow","payment-success","order-tracking","delivery-complete","review-submission",
  "customer-support","live-chat","help-center","knowledge-base","faq-section",
  "blog-writing","content-creation","social-media","email-marketing","newsletter",
  "analytics-dashboard","sales-report","revenue-chart","growth-metrics","kpi-tracker",
  "calendar-planning","task-management","project-timeline","gantt-chart","sprint-board",
  "video-conference","screen-sharing","presentation-mode","whiteboard-session","virtual-meeting",
  "file-sharing","cloud-storage","backup-system","sync-devices","version-control",
  "security-shield","two-factor-auth","password-manager","encryption","privacy-settings",
  "mobile-app-design","responsive-layout","dark-mode-toggle","accessibility-check","performance-optimization",
  "api-integration","webhook-setup","database-design","server-config","deployment-pipeline",
  "error-handling","bug-fixing","code-review","pull-request","merge-conflict",
  "testing-automation","unit-test","integration-test","e2e-test","load-test",
  "documentation","readme-file","changelog","release-notes","api-docs",
  "community-forum","open-source","contribution-guide","issue-tracker","feature-request",
  "startup-launch","pitch-deck","investor-meeting","funding-round","growth-strategy",
  "hiring-process","interview-session","team-building","culture-values","remote-work-setup",
  "office-space","coworking","home-office","standing-desk","ergonomic-setup",
  "coffee-break","lunch-time","exercise-break","meditation","mindfulness",
  "morning-routine","evening-wind-down","weekend-plans","vacation-mode","work-life-balance",
  "learning-path","online-course","tutorial-video","workshop","bootcamp",
  "certification","skill-assessment","portfolio-review","career-growth","mentorship",
  "networking-event","conference-talk","meetup-group","hackathon","demo-day",
  "product-hunt-launch","app-store-feature","press-coverage","viral-moment","milestone-reached",
  "anniversary","birthday","graduation","wedding","baby-shower",
  "holiday-season","new-year","valentines","halloween","thanksgiving",
  "spring-cleaning","summer-vibes","autumn-leaves","winter-wonderland","rainy-day",
  "space-exploration","underwater-adventure","mountain-climbing","desert-trek","arctic-expedition",
  "city-skyline","countryside-view","beach-sunset","forest-trail","island-paradise",
  "futuristic-city","retro-computing","vintage-design","minimalist-art","abstract-shapes",
  "geometric-pattern","organic-flow","neon-glow","pastel-dream","monochrome-elegance",
  "hand-drawn-sketch","watercolor-splash","oil-painting","digital-art","pixel-art",
  "3d-rendering","isometric-view","flat-design","material-design","glassmorphism",
  "neumorphism","brutalism","art-deco","bauhaus","swiss-design",
  "japanese-zen","nordic-minimal","tropical-vibrant","industrial-chic","bohemian-free",
];

const lottieNames = [
  "loading-spinner","success-check","error-cross","warning-triangle","info-circle",
  "heart-beat","star-burst","confetti-pop","firework-blast","sparkle-shine",
  "wave-hello","thumbs-up-anim","clap-hands","high-five","fist-bump",
  "walking-person","running-athlete","jumping-joy","dancing-figure","yoga-pose",
  "typing-keyboard","clicking-mouse","swiping-phone","scrolling-page","tapping-screen",
  "uploading-file","downloading-data","syncing-cloud","refreshing-content","buffering-video",
  "sending-email","receiving-message","notification-pop","alert-bell","alarm-clock",
  "calendar-flip","clock-ticking","timer-countdown","stopwatch-running","hourglass-flow",
  "search-scanning","filter-applying","sort-arranging","group-organizing","tag-labeling",
  "bookmark-saving","share-spreading","like-bouncing","comment-typing","rating-stars",
  "cart-adding","payment-processing","order-confirmed","delivery-truck","package-opening",
  "login-unlocking","signup-creating","password-typing","biometric-scanning","2fa-verifying",
  "chart-growing","graph-drawing","pie-filling","bar-rising","line-plotting",
  "map-zooming","pin-dropping","route-tracing","compass-spinning","globe-rotating",
  "robot-waving","ai-thinking","brain-processing","lightbulb-glowing","gear-turning",
  "rocket-launching","plane-flying","car-driving","boat-sailing","bike-pedaling",
  "sun-rising","moon-phasing","cloud-moving","rain-falling","snow-floating",
  "leaf-falling","flower-blooming","tree-growing","wave-crashing","fire-burning",
  "music-playing","video-streaming","podcast-recording","camera-clicking","film-rolling",
  "paint-brushing","pencil-drawing","eraser-cleaning","scissors-cutting","ruler-measuring",
];

const animatedIconNames = [
  "menu-to-close","plus-to-minus","play-to-pause","lock-to-unlock","eye-to-hidden",
  "sun-to-moon","volume-up-down","heart-fill","star-fill","bookmark-fill",
  "check-appear","x-appear","arrow-spin","chevron-flip","expand-collapse",
  "copy-check","send-fly","upload-bounce","download-bounce","refresh-spin",
  "bell-ring","mail-open","chat-bubble","phone-ring","camera-flash",
  "mic-pulse","speaker-wave","music-note","film-frame","paint-stroke",
  "code-bracket","terminal-blink","git-commit","deploy-rocket","bug-squash",
  "shield-check","key-turn","lock-click","unlock-slide","fingerprint-scan",
  "wifi-connect","bluetooth-pair","battery-charge","signal-strength","cloud-sync",
  "folder-open","file-add","trash-delete","edit-write","save-floppy",
  "search-zoom","filter-funnel","sort-arrows","grid-toggle","list-toggle",
  "user-add","user-remove","group-join","group-leave","avatar-change",
  "cart-bounce","credit-swipe","dollar-spin","gift-unwrap","percent-off",
  "calendar-page","clock-hand","timer-ring","alarm-shake","hourglass-flip",
  "map-fold","pin-bounce","compass-needle","flag-wave","globe-spin",
  "rocket-blast","plane-takeoff","car-zoom","bike-ride","boat-rock",
  "sun-ray","moon-glow","cloud-rain","snow-fall","lightning-strike",
  "leaf-flutter","flower-open","tree-sway","wave-roll","fire-flicker",
  "robot-blink","ai-spark","brain-pulse","lightbulb-on","gear-rotate",
  "trophy-shine","medal-flip","badge-pop","ribbon-unfurl","crown-gleam",
];

const stickerNames = [
  "happy-face","sad-face","angry-face","surprised-face","cool-face",
  "love-eyes","thinking-face","sleeping-face","laughing-tears","winking-face",
  "party-hat","birthday-cake","balloon-pop","gift-box","confetti-burst",
  "thumbs-up-big","peace-sign","ok-hand","clapping-hands","raised-fist",
  "waving-hand","pointing-right","crossed-fingers","handshake","pray-hands",
  "heart-eyes-cat","crying-cat","smiling-dog","excited-puppy","sleepy-kitten",
  "dancing-penguin","singing-bird","swimming-fish","flying-butterfly","buzzing-bee",
  "cute-robot","happy-alien","friendly-ghost","magic-unicorn","baby-dragon",
  "pizza-slice","hamburger-bite","taco-dance","sushi-roll","ice-cream-melt",
  "coffee-cup","tea-time","smoothie-sip","juice-splash","water-drop",
  "rainbow-arc","sunshine-beam","moonlight-glow","star-twinkle","cloud-puff",
  "fire-hot","ice-cold","wind-blow","rain-drop","snow-flake",
  "rocket-zoom","airplane-fly","car-vroom","bicycle-pedal","skateboard-trick",
  "surfing-wave","skiing-slope","basketball-dunk","football-goal","tennis-serve",
  "gaming-controller","joystick-move","dice-roll","cards-shuffle","chess-piece",
  "music-note-bounce","guitar-strum","drum-beat","piano-key","trumpet-blast",
  "camera-snap","video-record","microphone-sing","headphone-jam","speaker-boom",
  "book-read","pencil-write","paint-splash","scissors-cut","glue-stick",
  "graduation-cap","trophy-gold","medal-winner","crown-royal","diamond-sparkle",
  "bulb-idea","brain-smart","target-hit","flag-finish","clock-tick",
];

const threeDNames = [
  "3d-cube","3d-sphere","3d-cylinder","3d-cone","3d-torus",
  "3d-arrow","3d-heart","3d-star","3d-diamond","3d-crown",
  "3d-trophy","3d-medal","3d-badge","3d-shield","3d-lock",
  "3d-key","3d-gear","3d-wrench","3d-hammer","3d-brush",
  "3d-pen","3d-pencil","3d-ruler","3d-compass","3d-calculator",
  "3d-laptop","3d-monitor","3d-phone","3d-tablet","3d-watch",
  "3d-camera","3d-headphones","3d-speaker","3d-microphone","3d-controller",
  "3d-rocket","3d-airplane","3d-car","3d-truck","3d-bicycle",
  "3d-house","3d-building","3d-castle","3d-tower","3d-bridge",
  "3d-tree","3d-flower","3d-mushroom","3d-cactus","3d-leaf",
  "3d-sun","3d-moon","3d-cloud","3d-rainbow","3d-lightning",
  "3d-fire","3d-water","3d-earth","3d-planet","3d-satellite",
  "3d-robot","3d-alien","3d-ghost","3d-unicorn","3d-dragon",
  "3d-cat","3d-dog","3d-bird","3d-fish","3d-butterfly",
  "3d-pizza","3d-burger","3d-donut","3d-cake","3d-ice-cream",
  "3d-coffee","3d-wine","3d-beer","3d-juice","3d-smoothie",
  "3d-gift","3d-balloon","3d-confetti","3d-party-hat","3d-firework",
  "3d-book","3d-folder","3d-document","3d-chart","3d-calendar",
  "3d-mail","3d-message","3d-notification","3d-search","3d-settings",
  "3d-user","3d-group","3d-avatar-male","3d-avatar-female","3d-avatar-neutral",
  "3d-hand-wave","3d-hand-point","3d-hand-peace","3d-hand-ok","3d-hand-thumbs",
  "3d-emoji-happy","3d-emoji-sad","3d-emoji-love","3d-emoji-cool","3d-emoji-angry",
  "3d-coin-gold","3d-coin-silver","3d-bill-dollar","3d-credit-card","3d-wallet",
  "3d-shopping-bag","3d-cart","3d-tag","3d-barcode","3d-qr-code",
  "3d-pill","3d-syringe","3d-bandage","3d-stethoscope","3d-thermometer",
  "3d-atom","3d-dna","3d-flask","3d-microscope","3d-telescope",
  "3d-battery","3d-plug","3d-bulb","3d-magnet","3d-crystal",
  "3d-sword","3d-shield-2","3d-bow","3d-wand","3d-potion",
  "3d-chest","3d-map","3d-compass-2","3d-binoculars","3d-flag",
  "3d-hourglass","3d-clock","3d-alarm","3d-timer","3d-stopwatch",
];

const licenses = ["CC0", "MIT", "Apache-2.0", "CC-BY-4.0"];
const tagPool = [
  "ui","ux","web","mobile","app","design","interface","minimal","flat","outline",
  "filled","bold","thin","rounded","sharp","colorful","monochrome","gradient",
  "duotone","line","solid","modern","classic","retro","futuristic","cute",
  "professional","playful","elegant","simple","complex","detailed","abstract",
  "geometric","organic","hand-drawn","digital","vector","pixel","3d",
  "animated","static","responsive","accessible","inclusive","dark","light",
  "social","business","finance","health","education","food","travel","nature",
  "technology","science","sport","music","art","fashion","weather","animal",
];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function seed() {
  console.log("Clearing existing data...");
  db.exec("DELETE FROM Download");
  db.exec("DELETE FROM Bookmark");
  db.exec("DELETE FROM Collection");
  db.exec("DELETE FROM Asset");
  db.exec("DELETE FROM User");

  const now = new Date().toISOString();

  // Create demo user
  console.log("Creating demo user...");
  db.prepare(
    "INSERT INTO User (id, name, email, password, bio, avatar, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    cuid(),
    "Demo User",
    "demo@opens.dev",
    hashSync("password123", 12),
    "Design enthusiast exploring open-source assets",
    null,
    now,
    now
  );

  interface AssetRow {
    title: string;
    description: string;
    previewUrl: string;
    sourceUrl: string;
    downloadUrl: string;
    category: string;
    subcategory: string;
    tags: string;
    license: string;
    fileFormat: string;
    downloads: number;
    views: number;
    featured: number;
    animated: number;
  }

  const allAssets: AssetRow[] = [];

  // Helper to create asset entries
  function createAssets(
    names: string[],
    category: string,
    subcategory: string,
    format: string,
    hueBase: number,
    animated: boolean,
    targetCount: number
  ) {
    for (let i = 0; i < targetCount; i++) {
      const name = names[i % names.length];
      const variant = Math.floor(i / names.length);
      const title = variant > 0 ? `${name}-v${variant + 1}` : name;
      const hue = (hueBase + (i * 7)) % 360;
      const tags = pickRandom(tagPool, 3 + Math.floor(Math.random() * 5));
      tags.push(category, subcategory);

      allAssets.push({
        title: title.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        description: `Free ${category.replace("-", " ")} asset: ${title.replace(/-/g, " ")}`,
        previewUrl: svgIcon(name.slice(0, 6), hue),
        sourceUrl: `https://example.com/source/${category}/${title}`,
        downloadUrl: `https://example.com/download/${category}/${title}.${format.toLowerCase()}`,
        category,
        subcategory,
        tags: JSON.stringify(tags),
        license: licenses[Math.floor(Math.random() * licenses.length)],
        fileFormat: format,
        downloads: Math.floor(Math.random() * 5000),
        views: Math.floor(Math.random() * 15000),
        featured: Math.random() < 0.05 ? 1 : 0,
        animated: animated ? 1 : 0,
      });
    }
  }

  console.log("Generating assets...");

  // Icons: 5000
  createAssets(iconNames, "icons", "line-icons", "SVG", 220, false, 2500);
  createAssets(iconNames, "icons", "filled-icons", "SVG", 240, false, 1500);
  createAssets(iconNames, "icons", "outline-icons", "PNG", 200, false, 1000);

  // Illustrations: 2000
  createAssets(illustrationNames, "illustrations", "flat-illustration", "SVG", 280, false, 1000);
  createAssets(illustrationNames, "illustrations", "hand-drawn", "PNG", 300, false, 500);
  createAssets(illustrationNames, "illustrations", "isometric", "SVG", 320, false, 500);

  // Lottie: 1000
  createAssets(lottieNames, "lottie", "ui-animation", "JSON", 340, true, 500);
  createAssets(lottieNames, "lottie", "loading-animation", "JSON", 350, true, 500);

  // Animated Icons: 500
  createAssets(animatedIconNames, "animated-icons", "micro-interaction", "JSON", 30, true, 500);

  // Stickers: 500
  createAssets(stickerNames, "stickers", "emoji-sticker", "GIF", 60, true, 250);
  createAssets(stickerNames, "stickers", "character-sticker", "GIF", 80, true, 250);

  // 3D Assets: 1000
  createAssets(threeDNames, "3d-assets", "3d-icon", "GLB", 170, false, 400);
  createAssets(threeDNames, "3d-assets", "3d-avatar", "GLB", 190, false, 300);
  createAssets(threeDNames, "3d-assets", "3d-illustration", "GLB", 150, false, 300);

  console.log(`Inserting ${allAssets.length} assets...`);

  const insert = db.prepare(
    `INSERT INTO Asset (id, title, description, previewUrl, sourceUrl, downloadUrl, category, subcategory, tags, license, fileFormat, fileSize, width, height, animated, lottieData, downloads, views, featured, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insertMany = db.transaction((assets: AssetRow[]) => {
    for (const a of assets) {
      insert.run(
        cuid(), a.title, a.description, a.previewUrl, a.sourceUrl, a.downloadUrl,
        a.category, a.subcategory, a.tags, a.license, a.fileFormat,
        null, null, null, a.animated, null, a.downloads, a.views, a.featured,
        now, now
      );
    }
  });

  insertMany(allAssets);

  const count = (db.prepare("SELECT COUNT(*) as c FROM Asset").get() as { c: number }).c;
  console.log(`\nDone! ${count} assets seeded.`);
  console.log("Demo login: demo@opens.dev / password123");
}

seed();
db.close();
