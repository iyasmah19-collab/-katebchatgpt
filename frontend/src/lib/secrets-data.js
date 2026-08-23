// Platform algorithm secrets — 2 free + 48 premium per platform = 50 total per platform
// Sources: Meta Creators, TikTok Creative Center, YouTube Creator Insider,
//          Buffer / Hootsuite / Later / TrueFuture / Orange MonkE / Dataslayer 2025-2026
// Premium secrets are rotated weekly by ISO week number (see Vault.jsx)
//
// Schema:  s(titleAr, bodyAr, titleEn, bodyEn, ...cat)
//          cat is a 2-element array [catAr, catEn] (use spread).

const s = (titleAr, bodyAr, titleEn, bodyEn, catAr = "", catEn = "") => ({
  ar: { title: titleAr, body: bodyAr, category: catAr },
  en: { title: titleEn, body: bodyEn, category: catEn },
});

/* ============================================================
   INSTAGRAM CATEGORIES
   ============================================================ */
const IG = {
  reels:    ["🎯 أسرار الـ Reels",         "🎯 Reels Secrets"],
  save:     ["💾 الحفظ والتعليقات",         "💾 Saves & Comments"],
  carousel: ["📊 الكاروسيل",                 "📊 Carousel"],
  seo:      ["🔍 SEO والاكتشاف",             "🔍 SEO & Discovery"],
  timing:   ["⏰ التوقيت والثبات",           "⏰ Timing & Consistency"],
  stories:  ["📖 الستوري",                   "📖 Stories"],
  global:   ["🌍 الترجمة والوصول العالمي",   "🌍 Translation & Global Reach"],
  yourAlgo: ["🎛️ خوارزميتك (Your Algorithm)", "🎛️ Your Algorithm"],
  reach:    ["📈 الوصول المتصل وغير المتصل",  "📈 Connected vs Unconnected Reach"],
  collab:   ["🤝 التعاون والكولاب",          "🤝 Collab"],
  reset:    ["🔄 إعادة الضبط والإصلاح",      "🔄 Reset & Fix"],
  misc:     ["📱 أسرار متنوعة مهمة",         "📱 Misc Important"],
};

/* ============================================================
   TIKTOK CATEGORIES
   ============================================================ */
const TT = {
  algo:    ["🧠 الخوارزمية والمنطق الأساسي",  "🧠 Algorithm Basics"],
  hook:    ["🎣 الهوك (الثواني الأولى)",     "🎣 Hook (First Seconds)"],
  caption: ["📝 الكابشن والنص",              "📝 Caption & Text"],
  seo:     ["🔑 الكلمات المفتاحية والـ SEO",  "🔑 Keywords & SEO"],
  tags:    ["#️⃣ الهاشتاغ",                  "#️⃣ Hashtags"],
  sound:   ["🎵 الصوت والموسيقى",            "🎵 Sound & Music"],
  timing:  ["⏰ التوقيت والنشر",             "⏰ Timing & Publishing"],
  quality: ["🎬 جودة المحتوى",               "🎬 Content Quality"],
  comm:    ["👥 التفاعل والمجتمع",           "👥 Engagement & Community"],
  ana:     ["📊 التحليل والتحسين",           "📊 Analytics & Optimization"],
  strat:   ["🔍 الاستراتيجية والنيش",        "🔍 Strategy & Niche"],
  extra:   ["✍️ تحسينات إضافية",             "✍️ Extra Improvements"],
};

/* ============================================================
   YOUTUBE SHORTS CATEGORIES
   ============================================================ */
const YT = {
  algo:    ["🧠 فهم الخوارزمية",              "🧠 Understanding the Algorithm"],
  hook:    ["🎣 الهوك (الثواني الأولى)",     "🎣 Hook (First Seconds)"],
  rewatch: ["🔁 قابلية الإعادة",             "🔁 Rewatchability"],
  reten:   ["📊 المشاهدة والاستبقاء",        "📊 Views & Retention"],
  title:   ["✍️ العنوان والـ SEO",            "✍️ Title & SEO"],
  visual:  ["🖼️ التصميم البصري والثمبنيل",   "🖼️ Visuals & Thumbnail"],
  sound:   ["🎵 الصوت والموسيقى",            "🎵 Audio & Music"],
  timing:  ["⏰ التوقيت والاتساق",           "⏰ Timing & Consistency"],
  comm:    ["💬 التفاعل والمجتمع",           "💬 Engagement & Community"],
  ana:     ["📈 التحليل والتحسين",           "📈 Analytics & Optimization"],
  strat:   ["🔗 الاستراتيجية طويلة المدى",   "🔗 Long-term Strategy"],
  ideas:   ["🎯 المحتوى والأفكار",           "🎯 Content & Ideas"],
  advSeo:  ["🔍 SEO المتقدم للشورتس",         "🔍 Advanced Shorts SEO"],
  errors:  ["⚙️ أخطاء قاتلة",                 "⚙️ Critical Mistakes"],
};

export const SECRETS = {
  /* ════════════════════════════════════════════════════════════
     INSTAGRAM — 2 FREE + 48 PREMIUM
     ════════════════════════════════════════════════════════════ */
  instagram: {
    free: [
      s(
        "الثلاث ثوان الأولى تحدد مصير الريل",
        "نصف المشاهدين يغادرون قبل الثانية الثالثة. لو تجاوزت هاي النقطة بنجاح، إنستغرام يبدأ يوزّع الريل على جمهور أوسع. الخوارزمية تراقب كم شخص تجاوز الثانية الثالثة — لو الرقم منخفض، التوزيع يتوقف فوراً. الحل: ابدأ بجملة صادمة أو سؤال أو معلومة غير متوقعة في أول ثانية ونصف.",
        "First 3 seconds decide everything",
        "Half of viewers leave before the 3-second mark. Pass that, and Instagram starts pushing your Reel to a wider audience. The algorithm tracks the 3-second pass rate live — if it dips, distribution halts. Fix: open with a shocking statement, a question, or an unexpected fact within the first 1.5 seconds.",
        ...IG.reels
      ),
      s(
        "وقت المشاهدة هو الملك",
        "وقت المشاهدة هو العامل الأول في الترتيب — أكّده آدم موسيري رسمياً في يناير 2025. إنستغرام يتتبّع كم ثانية شاهدها الناس، وهل أعادوا المشاهدة. ريل 15 ثانية يشاهده الناس مرتين أقوى من ريل دقيقة يشاهدون نصفه.",
        "Watch time is king",
        "Watch time is the #1 ranking factor, officially confirmed by Adam Mosseri in Jan 2025. Instagram tracks seconds watched and replays. A 15-sec Reel watched twice beats a 60-sec Reel watched half through.",
        ...IG.reels
      ),
    ],
    premium: [
      // 🎯 Reels (remaining 8)
      s("مشاركة الـ DM = الإشارة الأقوى", "مشاركات الـ DM تحمل وزناً أعلى بـ 3-5 أضعاف الإعجابات للوصول لجمهور جديد. الحل: اصنع محتوى \"ابعت هذا لـ فلان\" — محتوى يخلي الشخص يفكر بصديق معيّن فوراً.", "DM Shares = strongest signal", "DM shares carry 3-5× more weight than likes for reaching new audiences. Hack: create \"send this to ___\" content that triggers a specific friend in the viewer's mind.", ...IG.reels),
      s("إعادة المشاهدة الفورية = إشارة ذهبية", "لما يشاهد شخص ريلك مرتين متتاليتين، إنستغرام يفهم إنّ المحتوى استثنائي ويوزّعه أكثر. الحل: ريلات تحتاج مشاهدة ثانية لفهمها كاملاً، أو فيها معلومات كثيرة في وقت قصير.", "Instant replay = golden signal", "Back-to-back replays tell Instagram your content is exceptional. Strategy: build Reels that NEED a second watch, or pack heavy info into short runtime.", ...IG.reels),
      s("معدّل الإعجاب أهم من العدد", "منشور 50 إعجاب من 500 مشاهدة يتفوّق على منشور 200 إعجاب من 10,000 مشاهدة. الخوارزمية تحسب النسبة لا العدد. الحساب الصغير النشيط يتفوّق على الكبير الخامل.", "Like-rate beats like-count", "50 likes / 500 views beats 200 likes / 10,000 views. The algo scores ratio, not raw count. Small + active accounts outperform large + passive ones.", ...IG.reels),
      s("الريلات أطول من دقيقة الآن تصل لغير المتابعين", "الريلات حتى 3 دقائق صارت تُرشَّح لغير المتابعين. إنستغرام يدعم المحتوى الأطول الذي يحافظ على الانتباه.", "Long Reels now reach non-followers", "Reels up to 3 minutes are now recommended to non-followers. Instagram is actively pushing longer attention-holding content.", ...IG.reels),
      s("المحتوى الأصيل +40-60% وصول", "المحتوى الأصلي يحصل على توزيع أعلى بـ 40-60% من المنقول. الحسابات التي تنشر 10 ريبوستات أو أكثر خلال 30 يوم تُستبعد من التوصيات.", "Original content +40-60% reach", "Original posts get 40-60% more reach than reposts. Accounts with 10+ reposts in 30 days get removed from recommendations entirely.", ...IG.reels),
      s("علامة المياه تقتل الوصول", "أي شعار لـ TikTok أو CapCut على فيديوك = إنستغرام يقلّل التوزيع. الحل: احذف العلامات قبل النشر دائماً.", "Watermarks kill reach", "Any TikTok / CapCut watermark on your video = Instagram throttles distribution. Always strip them before upload.", ...IG.reels),
      s("Trial Reels — اختبار بلا مخاطرة", "Trial Reels تتيح اختبار الفيديو على جمهور من غير المتابعين أولاً. لو نجح انشره للجميع. لو فشل عدّله بدون ما يضر بترتيب حسابك.", "Trial Reels — risk-free testing", "Trial Reels lets you A/B-test on non-followers first. Winners go public, losers get tweaked without hurting account score.", ...IG.reels),
      s("الهوك لازم يظهر قبل ثانية ونصف", "النص التوضيحي يجب أن يكون قصيراً ومقروءاً على الموبايل، ويظهر في أول ثانية ونصف قبل أي نص آخر. الناس يقرّرون في أجزاء من الثانية.", "Hook must show before 1.5 sec", "On-screen hook text must be short, mobile-legible, and appear within 1.5 seconds. Viewers decide in fractions of a second.", ...IG.reels),

      // 💾 Saves & Comments (3)
      s("الحفظ أقوى من الإعجاب", "الحفظ يخبر إنستغرام إنّ المحتوى يستحق العودة إليه. المنشورات التعليمية والمرجعية والعملية تحصل على حفظ أكثر — وهذا يحمل وزناً أعلى بكثير من الإعجابات.", "Saves beat likes", "Saves tell Instagram your content is worth returning to. Educational / how-to / reference posts get the most saves — they're algorithmically weighted far above likes.", ...IG.save),
      s("عمق التعليق أهم من عدده", "تعليق \"رائع 👏\" لا يفيدك بقدر تعليق فيه رأي بجملتين. التعليقات القصيرة الحشو تحمل وزناً ضئيلاً. عمق المحادثة وردود الفعل المفصلة هي ما يهم.", "Comment depth > comment count", "\"Nice 👏\" carries almost zero weight. A 2-sentence opinion comment carries massive weight. Algorithm scores conversation depth, not volume.", ...IG.save),
      s("ردّ على التعليقات خلال 48 ساعة", "موسيري أكّد أهمية الرد خلال يوم أو يومين للحفاظ على زخم المحادثة وإشعار الخوارزمية بأن المحتوى يولّد نقاشاً حقيقياً.", "Reply to comments within 48h", "Mosseri confirmed reply-within-48h preserves conversation momentum and signals real discussion to the algorithm.", ...IG.save),

      // 📊 Carousel (3)
      s("الكاروسيل يُعاد عرضه تلقائياً", "لمّا لا يتمرّر أحد عبر كامل الكاروسيل، إنستغرام يعيد عرض المنشور لاحقاً بالشرائح غير المشاهدة. كل كاروسيل = فرصة ثانية تلقائية للوصول.", "Carousels get auto-re-shown", "When viewers don't swipe through a carousel, Instagram re-shows it later with the un-viewed slides on top. Each carousel = a free second-chance ad.", ...IG.carousel),
      s("الكاروسيل يدعم 20 شريحة الآن", "الحد الأقصى صار 20 شريحة. استخدم هذي المساحة لدليل متكامل أو قصة كاملة تخلي الناس يتمرّون حتى النهاية = signal خرافي.", "Carousels now support 20 slides", "Max is now 20 slides. Use it for full guides or stories that pull viewers all the way through — monster engagement signal.", ...IG.carousel),
      s("الكاروسيل للتفاعل، الريل للنمو", "الريلات للوصول والاكتشاف، الكاروسيل للتفاعل والحفظ. المزيج الأمثل: 3-4 ريلات أسبوعياً + 2-3 كاروسيل.", "Carousel for engagement, Reel for growth", "Reels = discovery. Carousels = engagement + saves. Best mix: 3-4 Reels/wk + 2-3 carousels.", ...IG.carousel),

      // 🔍 SEO & Discovery (4)
      s("الكلمات المفتاحية > الهاشتاق", "الكلمات في الكابشن والبروفايل صارت أكثر فعالية من الهاشتاقات اللي ما عاد تدعم المتابعة. اكتب الكابشن بالكلمات اللي يبحث عنها جمهورك بشكل طبيعي.", "Keywords > hashtags", "Keywords in captions + bio now outperform hashtags (which lost the follow feature). Write captions in your audience's natural search language.", ...IG.seo),
      s("الهاشتاق إشارة موضوعية لا قناة اكتشاف", "الهاشتاقات تعمل الآن كإشارات للذكاء الاصطناعي عن موضوع منشورك، لا كقنوات اكتشاف. 3-5 هاشتاقات محدّدة كافية. لا تضع 30 هاشتاق — ما عاد يفيد.", "Hashtags = topic signals, not discovery", "Hashtags now act as topic hints for AI, not discovery channels. 3-5 focused tags is enough. 30-tag walls no longer help.", ...IG.seo),
      s("AI يفهم محتوى الفيديو نفسه", "الذكاء الاصطناعي يحلّل الصورة والنص على الشاشة والصوت ومقاطع الفيديو، لا فقط الكابشن. حتى لو كتبت كابشن عن موضوع مختلف، AI يعرف المحتوى الحقيقي.", "AI reads the actual video", "AI analyzes imagery, on-screen text, voice-over, and clips — not just captions. Mismatched caption + video gets caught.", ...IG.seo),
      s("وضوح الموضوع شرط للبقاء", "ثبات المجال صار شرطاً للبقاء، لا مجرّد استراتيجية نمو. لو محتواك لا يناسب موضوعاً واضحاً، يصبح غير مرئي فور إزالة المستخدم له من تفضيلاته.", "Topic clarity = survival requirement", "Niche consistency is now a survival requirement, not just a growth strategy. Vague topic = invisible once a user removes it from their preferences.", ...IG.seo),

      // ⏰ Timing & Consistency (4)
      s("الصباح الباكر = ذهب", "دراسة Later 2025 على 6+ ملايين منشور: الساعة 5 صباحاً بالتوقيت المحلي تحقّق تفاعل قوي. لكن الأفضل افحص إنسايتس حسابك لتعرف وقت جمهورك أنت.", "Early morning = gold", "Later's 2025 study (6M+ posts): 5 AM local time hits peak engagement. Best practice: check your own insights for your audience's window.", ...IG.timing),
      s("الثبات يبني ثقة الخوارزمية", "نشر كل يوم اثنين الساعة 9 صباحاً لـ 4 أسابيع متتالية مع تفاعل عالٍ = الخوارزمية تتعرّف عليك كحساب موثوق وتوزّع محتواك لناس أكثر.", "Consistency builds algorithmic trust", "Posting Mon 9am for 4 straight weeks with high engagement = algorithm flags you as trusted, expands distribution.", ...IG.timing),
      s("انشر بعد المنشور الناجح مباشرة", "موسيري ينصح بالاستفادة من زخم المنشور الفيروسي بنشر محتوى جديد خلال يوم أو يومين لاستغلال الاهتمام المتزايد بحسابك.", "Ride the viral wave", "Mosseri's advice: post fresh content within 1-2 days of a viral hit to capitalize on heightened account interest.", ...IG.timing),
      s("3-5 منشورات أسبوعياً هي الذهبية", "تحليل Buffer لـ 2+ مليون منشور: 3-5 منشورات/أسبوع تحقّق نمو 2×، و 6-9 منشورات يمكن أن تحقّق 3.7×. لكن الثبات والجودة أهم من الكمية.", "3-5 posts/wk is the sweet spot", "Buffer's 2M+ post analysis: 3-5/wk = 2× growth, 6-9/wk can hit 3.7×. But consistency + quality beat raw frequency.", ...IG.timing),

      // 📖 Stories (3)
      s("الستوري يحافظ على المتابعين لا يجلب جدد", "الستوري لا يساهم مباشرة بجلب متابعين جدد، لكن يلعب دوراً محورياً في الحفاظ على الجمهور. موسيري: المبدعون اللي ينشرون ستوري بانتظام يفقدون متابعين أقل.", "Stories retain, don't acquire", "Stories don't bring new followers directly, but they're critical for retention. Mosseri: creators posting Stories regularly lose fewer followers.", ...IG.stories),
      s("6-13 ستوري = المزيج الأمثل", "الحسابات تحت 10K متابع شهدت زيادة 35% في وصول الستوري عام 2025. المزيج الأمثل: 6 إلى 13 شريحة. تحت 6 = ضعيف. فوق 13 = تشبّع.", "6-13 Stories = sweet spot", "Accounts under 10K saw +35% Story reach in 2025. Optimal: 6-13 slides. Below 6 = weak, above 13 = saturation.", ...IG.stories),
      s("الستوري يُرتّب حسب قوة العلاقة", "خوارزمية الستوري تُرتّب المحتوى بناءً على قوة العلاقة. الحسابات اللي تتفاعل معها أكثر تظهر أولاً. اطلب الردّ على الستوري لبناء العلاقة.", "Stories ranked by relationship strength", "Story ranking is purely relationship-based. Accounts you interact with most appear first. Ask for replies to build the signal.", ...IG.stories),

      // 🌍 Translation & Global Reach (2)
      s("الترجمة التلقائية تضاعف الوصول", "أواخر 2025 أطلق إنستغرام ترجمة AI للريلات تترجم النص والصوت إلى الهندية والبرتغالية والإنجليزية والإسبانية. موسيري نصح المبدعين باستخدامها كتكتيك للوصول.", "Auto-translation doubles reach", "Late 2025 Instagram launched AI Reel translation (Hindi/Portuguese/English/Spanish for text + audio). Mosseri publicly named it a growth tactic.", ...IG.global),
      s("الـ Captions تساعد الخوارزمية", "معظم الناس يشاهدون بدون صوت. الـ Captions تساعد AI على تصنيف محتواك بشكل صحيح للتوصيات. موسيري ذكرها علناً كعامل ترتيب في الريلات.", "Captions help the algorithm", "Most viewers watch muted. Captions help AI categorize your content correctly for recommendations. Mosseri named it a Reels ranking factor.", ...IG.global),

      // 🎛️ Your Algorithm (2)
      s("المستخدمون يتحكمون بما يرونه", "ميزة \"Your Algorithm\" أُطلقت ديسمبر 2025 وانتشرت 2026. كل مستخدم له لوحة تحكم تعرض الموضوعات اللي إنستغرام يعتقد إنه مهتم بها — يقدر يضيف أو يحذف. لو جمهورك حذف موضوعك = محتواك يختفي عنهم.", "Users now control what they see", "\"Your Algorithm\" launched Dec 2025, global in 2026. Every user has a dashboard showing their inferred topics + can add/remove them. If your audience removes your topic = your content vanishes for them.", ...IG.yourAlgo),
      s("استفد من الميزة كصاحب حساب", "ادخل إعدادات الريلات → اضغط \"Your Algorithm\" → شوف تحت أيش موضوعات يصنّفك إنستغرام. عدّلها لإعادة توجيه نوع الجمهور اللي يصل لمحتواك.", "Use it as a creator", "Reels Settings → \"Your Algorithm\" → see which topics Instagram has classified you under. Adjust them to redirect the audience your content reaches.", ...IG.yourAlgo),

      // 📈 Connected/Unconnected Reach (2)
      s("وصولان مختلفان = استراتيجيتان مختلفتان", "إنستغرام يميّز بين الوصول المتصل (متابعينك) والوصول غير المتصل (غير المتابعين). كل نوع له إشارات مختلفة — حلّلهم منفصلاً في Insights.", "Two reaches, two strategies", "Instagram splits Connected (followers) and Unconnected (non-followers) reach with different signals. Analyze them separately in Insights.", ...IG.reach),
      s("الحسابات الجديدة 70% لغير المتابعين", "الحسابات الجديدة ينبغي أن تصرف 70% من جهودها على تكتيكات الوصول غير المتصل: المشاركة، الهوكس، نسب المشاهدة — حتى تبني جمهوراً أولاً.", "New accounts: 70% unconnected", "Brand-new accounts should spend 70% of effort on unconnected-reach tactics: shares, hooks, watch-rates — to build audience from scratch.", ...IG.reach),

      // 🤝 Collab (2)
      s("Collab Posts تضاعف الوصول", "منشورات Collab بتأليف مشترك تظهر في فيد الحسابين معاً، فتفتح وصولاً لجمهور جديد بدون مجهود إضافي. تكتيك نمو قوي ومجاني.", "Collab posts double reach", "Co-authored Collab posts appear in both accounts' feeds simultaneously, unlocking new-audience reach for free. Powerful growth lever.", ...IG.collab),
      s("التعاون مع مبدعين في نفس المجال", "التعاون الحقيقي مع مبدعين في نيشك يعطي إشارة مصداقية للخوارزمية. ابحث عن مبدعين بحجم مشابه لك (لا أكبر بكثير) للحصول على نتائج عادلة.", "Collab with same-niche creators", "Genuine collabs with niche peers send credibility signals to the algorithm. Target creators of similar size — not 10× bigger — for fair results.", ...IG.collab),

      // 🔄 Reset & Fix (2)
      s("تقدر تعيد ضبط خوارزميتك", "ميزة \"Reset Suggested Content\" أُطلقت أواخر 2024 وتمسح تاريخ التوصيات وتبدأ من جديد. مفيدة لو فيد الاستكشاف عندك مشوّه.", "You can reset the algorithm", "\"Reset Suggested Content\" (late 2024) wipes recommendation history and starts fresh. Useful when your Explore feed is messed up.", ...IG.reset),
      s("لا تُعيد الضبط إلا عند الضرورة", "إعادة الضبط تمسح تاريخك الخوارزمي — مما قد يضرّك لو كنت دربته جيداً. للتعديلات البسيطة استخدم ضوابط الموضوعات بدلاً من الإعادة الكاملة.", "Reset sparingly", "Resetting wipes your trained algo history — risky if you'd trained it well. For small tweaks, use topic controls instead of full reset.", ...IG.reset),

      // 📱 Misc Important (13)
      s("نوع الحساب لا يؤثر على الترتيب", "إنستغرام أكّد مراراً: نوع الحساب (تجاري/مبدع/شخصي) لا يؤثر مباشرة على الترتيب. كلها تُقيَّم بنفس الإشارات.", "Account type doesn't affect ranking", "Instagram confirmed repeatedly: account type (Business/Creator/Personal) has no direct ranking effect. All scored by same signals.", ...IG.misc),
      s("جدولة المنشورات لا تضر بالوصول", "موسيري دحض هذه الأسطورة عدّة مرّات. الجدولة (Buffer / Later / Meta Native) لا تضرّ الوصول إطلاقاً.", "Scheduling doesn't hurt reach", "Mosseri debunked this repeatedly. Scheduling tools (Buffer/Later/Meta native) carry zero penalty.", ...IG.misc),
      s("Shadow Ban غير موجود رسمياً", "إنستغرام أكّد رسمياً أن \"الحظر الخفي\" بمعنى تقليل سرّي للمحتوى دون إشعار — غير موجود. ما يُسمّى بذلك هو تخفيض خوارزمي بسبب جودة محتوى أو خرق إرشادات.", "Shadow ban doesn't exist officially", "Instagram officially confirmed: secret silent throttling = doesn't exist. What people call \"shadow ban\" is algorithmic demotion for low quality or policy violations.", ...IG.misc),
      s("المحتوى الراهن يحظى بأولوية", "إنستغرام يعطي اهتماماً متزايداً للمحتوى المرتبط بالأحداث الجارية. كونك من أوائل من يغطّون خبراً عاجلاً في مجالك = دفعة وصول حقيقية.", "Topical content gets priority", "Instagram increasingly favors current-event content. Being early on breaking news in your niche = real reach boost.", ...IG.misc),
      s("المصداقية الإنسانية لا يقلّدها AI", "موسيري: \"المحتوى المتميّز غالباً أكثر إنسانية وأقل اصطناعية. الأصالة هي الشيء الوحيد الذي لا يستطيع AI تزويره موسّعاً.\"", "Human authenticity beats AI", "Mosseri: \"Standout content is often more human, less artificial. Authenticity is the one thing AI cannot fake at scale.\"", ...IG.misc),
      s("إنستغرام يكافئ النيّة لا الإعجابات", "في 2026، إنستغرام لا يكافئ الإعجابات بل النية: حفظ، مشاركة، إعادة مشاهدة. لو محتواك لا يستحق أحدها، النمو يصبح صعباً.", "Algo rewards intent, not likes", "In 2026, Instagram rewards INTENT (save/share/replay) not likes. If your content doesn't earn one of those, growth is uphill.", ...IG.misc),
      s("المشاركة عبر Meta تؤثر", "إنستغرام يأخذ بعين الاعتبار إشارات التفاعل من بقية منصات Meta (فيسبوك، Threads، WhatsApp) لا فقط داخل إنستغرام.", "Cross-Meta engagement counts", "Instagram now uses cross-Meta signals (Facebook, Threads, WhatsApp) — not just in-app behavior.", ...IG.misc),
      s("الحسابات الصغيرة لها أفضلية", "تحت 50K متابع = النقطة المثلى للنمو العضوي. لا تحاول تقليد استراتيجيات حسابات تفوقك بمئة ضعف. ركّز على محتوى أصيل ومتخصّص.", "Small accounts have an edge", "Under 50K = organic-growth sweet spot. Don't copy 100× larger accounts' tactics. Stay authentic + niche.", ...IG.misc),
      s("\"Friends\" يستبدل \"Followers\"", "إنستغرام يختبر استبدال عدد \"المتابَعين\" بعدد \"الأصدقاء\" (Mutual Follows) في الملفات الشخصية — مما يقلّل من قيمة شراء المتابعين.", "\"Friends\" replaces \"Followers\"", "Instagram testing: replace \"Following\" count with \"Friends\" count (mutual follows) — devaluing bought followers.", ...IG.misc),
      s("Views هي المقياس الرئيسي", "إنستغرام أعلن رسمياً 2026: المشاهدات هي المقياس العام الرئيسي عبر جميع التنسيقات (ريلات / ستوري / كاروسيل / صور). كل ظهور للمحتوى = مشاهدة (تشمل إعادة التشغيل).", "Views = the new primary metric", "Instagram officially declared 2026: Views are the primary public metric across all formats. Every appearance counts (replays included).", ...IG.misc),
      s("الريلات هي محرك النمو الوحيد", "الريلات هي التنسيق الوحيد الذي يعرضه إنستغرام بشكل استباقي لغير المتابعين. الكاروسيل والستوري والمنشورات الثابتة تخدم جمهورك الحالي فقط.", "Reels = the only growth engine", "Reels are the ONLY format Instagram proactively shows to non-followers. Carousels/Stories/static = existing audience only.", ...IG.misc),
      s("المتابعون النشيطون > المتابعون الكثيرون", "الخوارزمية لا تنبهر بكم متابع لديك، بل بكم منهم نشيط مع محتواك. حساب صغير بتفاعل عالٍ يمكنه التفوق على حساب كبير بمتابعين خاملين.", "Active followers > many followers", "Algo isn't impressed by follower count — only by how active they are. A small high-engagement account beats a large passive one.", ...IG.misc),
      s("البساطة تتفوّق على التعقيد", "اصنع محتوى واضحاً ومختصراً يقدر المشاهد يحدّده فوراً كـ: مثير، مسلٍ، أو مفيد. الريلات يمكن أن تصل لـ 3 دقائق لكن الخبراء يوصون بدقيقة ونصف أو أقل.", "Simple beats complex", "Make content viewers can instantly classify as: intriguing / fun / useful. Reels can be 3 min but experts recommend 90 sec or less.", ...IG.misc),
    ],
  },

  /* ════════════════════════════════════════════════════════════
     TIKTOK — 2 FREE + 48 PREMIUM
     ════════════════════════════════════════════════════════════ */
  tiktok: {
    free: [
      s(
        "نسبة المشاهدة الكاملة = الملك",
        "الخوارزمية تعمل على 3 إشارات أساسية: وقت المشاهدة، نسبة الإكمال، وسرعة التفاعل. كل فيديو يُختبر على جمهور صغير أولاً، فإن نجح تُوسَّع دائرته تدريجياً.",
        "Completion rate = king",
        "TikTok's algorithm runs on 3 core signals: watch time, completion rate, and engagement velocity. Every video is tested on a small audience first — if it wins, the circle expands.",
        ...TT.algo
      ),
      s(
        "3 ثوانٍ تقرر كل شي",
        "نشر هوك قوي في الثلاث ثوانٍ الأولى أمر بالغ الأهمية. وقت المشاهدة في الثوانٍ الأولى هو الأكثر تأثيراً على التوزيع — لو فقدت نصف المشاهدين هنا، الفيديو يموت.",
        "3 seconds decide everything",
        "A strong hook in the first 3 seconds is critical. Early watch time has the heaviest weight in distribution — lose half the viewers here and the video is dead.",
        ...TT.hook
      ),
    ],
    premium: [
      // 🧠 Algorithm (4)
      s("الإعادة أهم من الإعجاب", "إعادة تشغيل الفيديو والتعليقات السريعة خلال الساعة الأولى هي المحفّزات الجديدة للانتشار — تفوق الإعجابات بكثير.", "Replays > likes", "Video replays + fast comments in the first hour are the new virality triggers — far outweighing likes.", ...TT.algo),
      s("الحفظ والمشاركة > الإعجاب", "حفظ الفيديو أو مشاركته يُعطي إشارة عالية القيمة للخوارزمية، كأنه ختم موافقة رقمي.", "Save & Share > Like", "Saves and shares are TikTok's highest-value signal — a digital seal of approval.", ...TT.algo),
      s("الخوارزمية تقرأ وتسمع فيديوهاتك", "الخوارزمية لا تراقب الفيديو فقط — تقرأ النص المرئي وتسمع الكلام أيضاً. لو قلت الكلمة المفتاحية بصوت عالٍ أو عرضتها نصياً، أنت تخبر AI بموضوع محتواك.", "Algo reads AND listens", "TikTok doesn't just watch your video — it reads on-screen text and transcribes speech. Saying or showing your keyword tells the AI exactly what your content is about.", ...TT.algo),
      s("المجتمعات لا الانتشار العشوائي", "خوارزمية تيك توك 2025 مبنية على المجتمعات لا الانتشار العشوائي. بدل مطاردة الفيروسية الواسعة، ركّز على محتوى يتردد صداه بعمق داخل مجتمع نيشك.", "Communities, not random virality", "TikTok 2025 is community-based, not viral-spread-based. Stop chasing broad virality — make content that deeply resonates inside your niche community.", ...TT.algo),

      // 🎣 Hook (2)
      s("معادلة الهوك الذهبية", "استخدم \"مشكلة ← وعد ← نتيجة\" في الجملة الأولى. مثال: \"طقطقة الفرامل؟ جرّب هذا الاختبار 60 ثانية قبل أن تشتري قطع جديدة.\" يتوافق مع نية البحث ويضع نتيجة واضحة.", "The golden hook formula", "Use \"Problem ← Promise ← Outcome\" in sentence one. Ex: \"Brake squeak? Try this 60-second test before you buy new pads.\" Matches search intent + delivers clear outcome.", ...TT.hook),
      s("ابدأ بالمحتوى مباشرة", "ابدأ بلقطات أو جمل تثير الفضول وتجعل المشاهدين لا يستطيعون الابتعاد. لا تقديم، لا شعار قناة، لا \"أهلاً بكم\" — هذي كلها تقتل الـ retention.", "Start with the content itself", "Open with shots or lines that ignite curiosity and lock attention. No intros, no channel logo, no \"welcome back\" — they all kill retention.", ...TT.hook),

      // 📝 Caption (4)
      s("الكلمة المفتاحية في أول 100 حرف", "تيك توك يعرض فقط أول 100-150 حرف من الكابشن قبل الاقتطاع. الجملة الأولى تحمل أعلى أولوية — خوارزمياً وللقارئ.", "Keyword in first 100 chars", "TikTok shows only the first 100-150 chars before truncation. The first sentence has top priority — both algorithmically and for the reader.", ...TT.caption),
      s("الكابشن = محرك بحث", "اكتب الكابشن بالعبارات اللي يبحث عنها الناس فعلاً. فكّر في تيك توك كمحرك بحث: بدل \"هذا أنقذ بشرتي\"، اكتب \"روتين العناية الصباحية للبشرة الحساسة\".", "Caption = search engine", "Write captions in the words people actually search. Think of TikTok as a search engine: \"morning skincare routine for sensitive skin\" beats \"this saved my skin\".", ...TT.caption),
      s("زيادة الوصول 20-40% بالكلمات المفتاحية", "إدراج الكلمات المفتاحية في الكابشن والوصف يمكن أن يزيد الوصول بنسبة 20-40%، لأن تيك توك يعطي أولوية لمطابقة النص عند فهرسة المحتوى.", "Keywords boost reach 20-40%", "Adding keywords to caption + description can lift reach 20-40% — TikTok prioritizes text-matching when indexing.", ...TT.caption),
      s("لا تحشُ الكلمات المفتاحية", "الكابشن المُفرط في التحسين يضرّ بالاستبقاء ويقلّل الوضوح، مما يضرّ بمعدّل التفاعل. استهدف كلمة مفتاحية رئيسية واحدة لكل فيديو.", "Don't keyword-stuff", "Over-optimized captions hurt retention and clarity, which tanks engagement. One primary keyword per video — that's it.", ...TT.caption),

      // 🔑 Keywords & SEO (5)
      s("تيك توك = محرك بحث الجيل القادم", "بيانات جوجل: ~40% من الجيل Z يفضّلون البحث على تيك توك أو إنستغرام بدلاً من جوجل. جمهورك لا يتصفّح فقط، بل يبحث بنشاط.", "TikTok = Gen-Z search engine", "Google's own data: ~40% of Gen Z prefers searching TikTok/Instagram over Google. Your audience isn't just browsing — they're actively searching.", ...TT.seo),
      s("الكلمة المفتاحية في 3 أماكن", "استخدم الكلمة المفتاحية في ثلاثة أماكن: نص الهوك على الشاشة، التعليق الصوتي، والكابشن. تكرارها يضاعف فرصة الفهرسة الصحيحة.", "Keyword in 3 places", "Place your keyword in all 3: on-screen hook text, voice-over, and caption. Triple-redundancy = correct indexing.", ...TT.seo),
      s("TikTok Creative Center سلاح مهمل", "ابحث عن كلمات مفتاحية رائجة تناسب محتواك عبر TikTok Creative Center، أو استخدم المواضيع الرائجة كمصدر إلهام لمحتوى لاحق.", "TikTok Creative Center is gold", "Search trending keywords matching your niche via TikTok Creative Center — or use trending topics as content inspiration.", ...TT.seo),
      s("اقتراحات شريط البحث", "ابدأ بكتابة عبارات في شريط بحث تيك توك ولاحظ الاقتراحات التلقائية — هذي استفسارات حقيقية بحجم بحث عالٍ من جمهورك.", "Use search bar autocomplete", "Start typing your niche term in TikTok's search bar and watch autocomplete — those are real high-volume queries from your audience.", ...TT.seo),
      s("التعليق المثبّت سلاح سرّي", "بعد نشر الفيديو، انشر تعليقاً يوسّع الموضوع بكلمات مفتاحية إضافية وثبّته. يضيف محتوى قابل للفهرسة ويعزّز التفاعل.", "Pinned comment = secret weapon", "Post a follow-up comment expanding your topic with extra keywords and pin it. Adds indexable content + boosts engagement.", ...TT.seo),

      // #️⃣ Hashtags (4)
      s("2-4 هاشتاغات فقط", "أضف 2-4 هاشتاغات وصفية وتجنّب حشو الهاشتاغات العامة. الإفراط فيها يخفّض التفاعل.", "2-4 hashtags only", "Add 2-4 descriptive tags. Generic hashtag spam tanks engagement.", ...TT.tags),
      s("الهاشتاغات داعم لا محور", "الهاشتاغات تلعب دوراً داعماً لا محورياً. الاعتماد المفرط عليها بدون توافق قوي مع الكلمات المفتاحية = أداء أضعف.", "Hashtags support, don't lead", "Hashtags are supporting actors, not the lead. Over-reliance without keyword alignment = weak performance.", ...TT.tags),
      s("الهاشتاغات النيش تبني جمهوراً", "#BookTok يضمّ 50+ مليون منشور — دليل على أن الهاشتاغات المتخصصة تولّد حركة بحث هائلة لمن يتقن استخدامها.", "Niche hashtags build audiences", "#BookTok has 50M+ posts — proof that specialized hashtags drive massive search traffic for those who use them right.", ...TT.tags),
      s("الهاشتاغ المناسب +30% تفاعل", "المنشورات ذات الهاشتاغات المتوافقة موضوعياً مع المحتوى ترى زيادة تصل إلى 30% في التفاعل مقارنة بالعامة.", "Right hashtags = +30% engagement", "Posts with topically-aligned hashtags see up to 30% more engagement than generic-tag posts.", ...TT.tags),

      // 🎵 Sound (2)
      s("الأصوات الرائجة = اكتشاف أوسع", "استخدام الأصوات الرائجة يمكن أن يضاعف فرص الاكتشاف. تحقّق من قسم \"أبرز الأصوات\" في TikTok Creative Center.", "Trending sounds = wider discovery", "Using trending audio can double your discovery odds. Check the \"Trending Sounds\" section in TikTok Creative Center.", ...TT.sound),
      s("حيلة الصوت الرائج", "أضف الصوت الرائج، اخفض مستواه للحدّ الأدنى في المحرّر، ثم ضع مساراً صوتياً رئيسياً فوقه. تستفيد من التوزيع دون تشويش على رسالتك.", "Trending sound hack", "Add a trending sound, drop its volume to minimum in the editor, then layer your own voice-over on top. You get the distribution boost without losing your message.", ...TT.sound),

      // ⏰ Timing (4)
      s("الثلاثاء والخميس والسبت = ذهب", "هذي الأيام الثلاثة الأفضل، مع ذروة تفاعل أعلى بنسبة 35% وفق بيانات تيك توك 2025.", "Tue/Thu/Sat = gold", "These 3 days are top-performers — 35% higher peak engagement per TikTok 2025 data.", ...TT.timing),
      s("3 مرات أسبوعياً = الحد الأدنى", "الحد الأدنى 3 مرات أسبوعياً لبدء النمو — مناسب للمبتدئين. الانتظام أهم من العدد العالي.", "3x/wk = minimum", "3 posts/wk is the bare minimum for growth — beginner-appropriate. Consistency matters more than volume.", ...TT.timing),
      s("الانقطاع يخفّض الوصول 83%", "حين توقّف أحد المنشئين عن النشر لفترة، انخفض وصوله بنسبة 83%. تيك توك يكافئ المنشئين المتسقين اللي يحضرون بانتظام.", "Skipping = -83% reach", "When a creator paused posting, their reach dropped 83%. TikTok rewards consistent creators who show up regularly.", ...TT.timing),
      s("قاعدة الـ 80%", "لو الفيديو جيد بنسبة 80%، انشره. الفيديو \"الجيد بما يكفي\" اللي يُنشر يتفوّق دائماً على الفيديو المثالي اللي يظلّ في المسودات.", "The 80% rule", "If the video is 80% good, publish it. The \"good enough\" video that ships always beats the perfect video stuck in drafts.", ...TT.timing),

      // 🎬 Content Quality (5)
      s("الجودة = 40× نمو", "بيانات تيك توك: الفيديوهات عالية الجودة تحصل على نمو متابعين أعلى بـ 40 ضعفاً مقارنة بمنخفضة الجودة. الإضاءة والصوت أولاً.", "Quality = 40× growth", "TikTok data: high-quality videos get 40× more follower growth than low-quality. Lighting + audio come first.", ...TT.quality),
      s("المحتوى الموجَّه لتيك توك أولاً", "المحتوى الأصيل الموجّه لتيك توك أولاً يتفوّق على المحتوى المُعاد نشره من منصات أخرى — حتى لو كان نفس الفيديو.", "TikTok-first content wins", "Original TikTok-first content outperforms cross-posted material — even the exact same video.", ...TT.quality),
      s("60-180 ثانية = الأفضل", "المقاطع القصيرة لا تزال تنتشر، لكن الفيديوهات بين 60-180 ثانية تتيح وقت مشاهدة أطول وتعليقات أغنى = إشارات قوية للخوارزمية.", "60-180 seconds = best", "Short clips still go viral, but 60-180-second videos enable more watch time + richer comments = stronger algo signals.", ...TT.quality),
      s("لا للعلامات المائية", "المحتوى الذي يحمل علامات مائية من منصات أخرى (كـ CapCut أو IG) يتعرّض لخفض التوصية به مباشرة من تيك توك.", "No external watermarks", "Content with watermarks from other platforms (CapCut, IG, etc.) gets directly demoted by TikTok recommendations.", ...TT.quality),
      s("استخدم أدوات تيك توك النيتف", "تيك توك يفضّل المحتوى المنشأ باستخدام أدواته الأصلية (مؤثرات، فلاتر، نصوص داخلية) على الفيديوهات المستوردة.", "Use TikTok native tools", "TikTok favors content built with its own tools (effects, filters, native text) over imported videos.", ...TT.quality),

      // 👥 Community (4)
      s("ردّ على التعليقات في البداية", "في الأيام الأولى، ردّ على من يعلّقون، واسألهم أسئلة، واجعلهم يعودون للفيديو. الخوارزمية ستلاحظهم يشاهدونه مرة ثانية وثالثة.", "Reply to comments early", "In early days, reply to commenters, ask them questions, get them to revisit. Algo notices their second + third watch.", ...TT.comm),
      s("استغل الطلب الموضوعي", "حين ينتشر فيديو واحد، تيك توك يبحث فوراً عن فيديو مماثل لإشباع الطلب. لو نشرت سلسلة محتوى، رح تستفيد من الموجة كاملة.", "Exploit topic demand", "When one video goes viral, TikTok immediately seeks similar content to satisfy demand. Post a series — ride the whole wave.", ...TT.comm),
      s("التعاون مع المؤثرين", "التعاون مع مؤثرين شعبيين استراتيجية نمو قوية — جمهورهم يمكن أن يصبح جمهورك بسرعة. ابحث عن مؤثرين بحجم مشابه.", "Collab with creators", "Collaborating with popular creators is a strong growth move — their audience can become yours fast. Target similar-size peers.", ...TT.comm),
      s("ميزة الـ Duet", "ميزة Duet مثالية للمنشئين الراغبين في دمج الجماهير وتحقيق تعرّض أكبر — وتعتبرها الخوارزمية إشارة تفاعل قوية.", "The Duet feature", "Duet is ideal for merging audiences and gaining reach — and the algorithm treats it as a strong engagement signal.", ...TT.comm),

      // 📊 Analytics (4)
      s("راقب منحنى الساعة الأولى", "راقب منحنى الساعة الأولى على FYP. لو انخفض الاستبقاء في أول 5 ثوانٍ، أعد تصوير الهوك أو قدّم الكشف مبكراً.", "Watch the first-hour curve", "Monitor the first-hour retention curve on FYP. Drop in the first 5 sec? Re-shoot the hook or surface the payoff sooner.", ...TT.ana),
      s("حفظ عالٍ + مشاهدات منخفضة؟", "لو معدّل الحفظ مرتفع لكن المشاهدات منخفضة، حسّن صورة المعاينة وتفاصيل الفيديو لتحسين الوصول الأوّلي.", "High saves + low views?", "If save-rate is high but views are low, optimize the cover image + video details to lift initial reach.", ...TT.ana),
      s("80% ثابت + 20% تجريبي", "احتفظ بـ 80% من الأشكال المجرّبة الناجحة، خصّص 20% للتجربة. اختبر متغيراً واحداً في كل مرة: الهوك، أو طول الفيديو، أو الكابشن.", "80% proven + 20% experimental", "Keep 80% of your content on proven formats, allocate 20% to experiments. Test one variable at a time: hook, length, or caption.", ...TT.ana),
      s("التحليلات المدمجة كنز", "تيك توك يخبرك بالضبط ما الذي ينجح: رسوم بيانية الاستبقاء، مصادر الحركة، ديموغرافيا الجمهور — كلها موجودة. استخدمها أسبوعياً.", "Built-in analytics = treasure", "TikTok tells you exactly what works: retention graphs, traffic sources, audience demographics — all built-in. Review weekly.", ...TT.ana),

      // 🔍 Strategy & Niche (3)
      s("تحدّث لغة جمهورك", "اكتشف ما يهتم به جمهورك فعلاً وعكسه بكلماتهم هم. ابنِ الاستراتيجية حول هذا — لأن الوصول سهل، لكن التأثير العميق هو ما يضعك على FYP.", "Speak your audience's language", "Find what your audience actually cares about and mirror it in their words. Build strategy around that — reach is easy, deep impact is what lands you on FYP.", ...TT.strat),
      s("سلطة النيش تُبنى تراكمياً", "الخوارزمية تكافئ وقت المشاهدة الأطول والتفاعلات الأعمق، وتعزّز سلطة النيش المتسقة — مما يعني إعادة التفكير في الهوكات والأطوال ونوافذ النشر.", "Niche authority compounds", "Algo rewards longer watch time and deeper engagement, reinforcing consistent niche authority — meaning you must rethink hooks, lengths, and posting windows.", ...TT.strat),
      s("استراتيجية المجتمع الدقيق", "تقرير Hootsuite 2025 يسمّيها \"الفيروسية الدقيقة\" — وهي تغيّر الطريقة التي تنمو بها العلامات التجارية على تيك توك. ابنِ مجتمعاً مخلصاً صغيراً قبل التوسع.", "Micro-virality strategy", "Hootsuite 2025 calls it \"micro-virality\" — it's transforming how brands grow on TikTok. Build a loyal small community before scaling.", ...TT.strat),

      // ✍️ Extras (7)
      s("OCR يفهرس النص على الشاشة", "أحدث تحديثات تيك توك تشمل OCR (التعرّف الضوئي على الحروف) لفهرسة النص المرئي على الشاشة. المحتوى ذو الكلمات المفتاحية المرئية يؤدّي أفضل بكثير.", "OCR indexes on-screen text", "TikTok's latest updates include OCR for on-screen text indexing. Content with visible keyword text dramatically outperforms.", ...TT.extra),
      s("البروفايل = صفحة هبوط", "حسّن بروفايلك: اسم مستخدم لافظ للكلمات المفتاحية، صورة واضحة تعبّر عن هويتك، وبيو موجز محسّن للبحث.", "Profile = landing page", "Optimize your profile: keyword-rich username, clear identity image, search-friendly bio.", ...TT.extra),
      s("النشر عبر المنصات بذكاء", "انشر على إنستغرام بهاشتاغاتها الخاصة، وتجنّب علامة تيك توك المائية. لمحتوى B2B، انشره على LinkedIn مع كابشن يعيد الصياغة للجمهور المهني.", "Smart cross-posting", "Cross-post to Instagram with its own hashtags (no TikTok watermark). For B2B content, post on LinkedIn with a re-framed caption.", ...TT.extra),
      s("تيك توك يظهر في نتائج جوجل", "فيديوهات تيك توك تظهر بشكل متزايد في نتائج جوجل، خاصة للمواضيع الرائجة واستفسارات \"كيف\" ومراجعات المنتجات. كلمات مفتاحية محسّنة = SEO مزدوج.", "TikTok appears in Google results", "TikTok videos increasingly appear in Google SERPs — especially for trending topics, \"how-to\" queries, and product reviews. Good keywords = double SEO.", ...TT.extra),
      s("Creator Search Insights مهمل", "تيك توك أطلق Creator Search Insights لاكتشاف الكلمات المفتاحية بشكل أفضل — كثير من المنشئين لا يستخدمونه. فرصة ذهبية.", "Creator Search Insights = hidden gem", "TikTok launched Creator Search Insights for better keyword discovery — most creators don't use it. Hidden goldmine.", ...TT.extra),
      s("الكلمات المفتاحية في ردود التعليقات", "لا تتوقّف عن الكلمات المفتاحية بعد النشر — يمكنك الحصول على SEO جيد عند الرد على التعليقات أيضاً.", "Keywords in comment replies", "Don't stop with keywords at publishing — replies to comments give additional SEO juice too.", ...TT.extra),
      s("تتبّع أداء الكلمات أسبوعياً", "تتبّع أداء الكلمات المفتاحية أسبوعياً واحفظ أفضل العبارات أداءً في جدول بيانات لإعادة استخدامها لاحقاً.", "Track keyword performance weekly", "Track keyword performance weekly and save top-performing phrases in a spreadsheet for future reuse.", ...TT.extra),
    ],
  },

  /* ════════════════════════════════════════════════════════════
     YOUTUBE SHORTS — 2 FREE + 48 PREMIUM
     ════════════════════════════════════════════════════════════ */
  shorts: {
    free: [
      s(
        "الشورتس لها خوارزمية مستقلة تماماً",
        "خوارزمية يوتيوب شورتس تعمل بشكل منفصل عن يوتيوب العادي. تختبر المحتوى الجديد على جمهور صغير أولاً، فإن نجح توسّعت دائرته تدريجياً.",
        "Shorts has its own algorithm",
        "YouTube Shorts runs on a completely separate algorithm from regular YouTube. Tests new content on a small audience first, then expands if it wins.",
        ...YT.algo
      ),
      s(
        "2-3 ثوانٍ تقرّر مصير الفيديو",
        "الهوك في الثانيتين أو الثلاث الأولى هو سلاحك السري لإيقاف التمرير. مدد الانتباه انخفضت 25% منذ عام 2000، والتوقف المبكر يقضي على التوزيع الخوارزمي.",
        "2-3 seconds decide the fate",
        "The first 2-3 seconds are your scroll-stopping weapon. Attention spans dropped 25% since 2000 — early dropoff kills algorithmic distribution instantly.",
        ...YT.hook
      ),
    ],
    premium: [
      // 🧠 Algorithm (3 more)
      s("70 مليار مشاهدة يومياً — منافسة شرسة", "يوتيوب شورتس يحقّق أكثر من 70 مليار مشاهدة يومياً، وعدد القنوات اللي ترفع شورتس ارتفع 50% سنة بعد سنة. المنافسة لا ترحم.", "70B daily views = brutal competition", "YouTube Shorts hits 70B+ daily views, with channels uploading Shorts up 50% YoY. Competition is unforgiving.", ...YT.algo),
      s("الخوارزمية تتبع الجمهور", "لا تتلاعب بعناوين مضلّلة أو مشاهدات مشتراة — يوتيوب 2025 يحلّل سلوك المشاهد. لو انصرفوا بسبب توقعات غير محققة، التوزيع ينهار فوراً.", "Algo follows the audience", "Don't game it with clickbait or bought views — YouTube 2025 analyzes viewer behavior. Unmet expectations = instant distribution collapse.", ...YT.algo),
      s("الشورت ينتشر بعد أسابيع أو أشهر", "يوتيوب لا يصنّف الشورتس بناءً على حداثته. الفيديو يمكن أن ينتشر بعد أسابيع أو حتى أشهر من النشر — استثمر في المحتوى دائم الصلاحية.", "Shorts can blow up months later", "YouTube doesn't rank Shorts by recency. Videos can go viral weeks or months after publishing — invest in evergreen content.", ...YT.algo),
      s("الخوارزمية تكافئ التحوّل العاطفي", "خوارزمية الشورتس تفضّل المحتوى الذي يخاطب الجوهر العاطفي للمشاهدين بأسلوب مكثّف. ركّز على تحوّل عاطفي واحد واضح بدون حشو.", "Algo rewards emotional shift", "Shorts algo favors content that hits viewers' emotional core with intensity. Deliver one clear emotional shift — no filler.", ...YT.algo),

      // 🎣 Hook (4 more)
      s("أمثلة هوكات مجرّبة", "\"قبل أن تمرر...\" يوقف الإبهام بإلحاح. \"99% لا يعرفون هذه الحيلة\" يشعل الفضول. \"انظر ما سيحدث في النهاية...\" يرفع الاستبقاء بوعد.", "Proven hook examples", "\"Before you scroll...\" stops the thumb with urgency. \"99% don't know this trick\" ignites curiosity. \"Watch what happens at the end...\" lifts retention with a promise.", ...YT.hook),
      s("الإطار الأول يحكم عليك", "لو بدأ شورتسك بصورة ممتعة، انتهيت. الإطار الأول هو ما يوقف التمرير. اجعله غريباً أو عالي التباين.", "Frame 1 decides your fate", "If frame one is boring, you're done. The first frame is what stops the scroll. Make it weird or high-contrast.", ...YT.hook),
      s("بنية القصة العاطفية في 5 خطوات", "هوك عاجل ← توتر عاطفي يعالج خوفاً شائعاً ← تحوّل في القناعة ← مشغّل هوية يتحدّى مناطق الراحة ← دعوة للعمل عاطفية.", "5-step emotional story structure", "Urgent hook → emotional tension addressing common fear → conviction shift → identity trigger challenging comfort → emotional CTA.", ...YT.hook),
      s("أنشئ فضولاً معلّقاً (Cliffhanger)", "\"ارتكبت هذا الخطأ لـ 3 سنوات...\" أو \"ربما كنت تفعل هذا بشكل خاطئ...\" — حيلة صحفية معاد توظيفها لاقتصاد الانتباه.", "Create a cliffhanger", "\"I made this mistake for 3 years...\" or \"You might be doing this wrong...\" — old journalism trick repurposed for the attention economy.", ...YT.hook),

      // 🔁 Rewatchability (4)
      s("الإعادة أقوى إشارة في الشورتس", "قابلية الإعادة — كم مرة يعيد المستخدم مشاهدة الشورت — معيار أساسي في خوارزمية 2025. الفيديو الذي يُعاد مشاهدته يحصل على دفعة توزيع ضخمة.", "Replays = strongest signal", "Rewatchability — how often viewers replay — is a core 2025 ranking metric. Rewatched videos get massive distribution boosts.", ...YT.rewatch),
      s("تقنية الـ Loop السحرية", "اللوب يخلق تأثيراً مغنطيسياً حيث تمتزج النهاية والبداية بسلاسة. المشاهدون كثيراً ما يعيدون المشاهدة دون أن يدركوا = مضاعفة وقت المشاهدة بلا جهد.", "The magic loop", "A seamless loop makes the end blend into the beginning. Viewers often replay without realizing = double watch time, zero extra effort.", ...YT.rewatch),
      s("أنواع محتوى تحفّز اللوب", "العروض التعليمية اللي تعود لنقطة البداية، النكات الدائرية، المشاهد البصرية المُرضية (تنظيف، رسم، تحولات) — كلها تستدرج الإعادة طبيعياً.", "Content types that trigger loops", "Tutorials that loop to the start, circular jokes, satisfying visuals (cleaning, painting, transformations) — all pull replays naturally.", ...YT.rewatch),
      s("انتهِ بمفاجأة أو رد فعل", "كثير من الشورتس تنتهي فقط... بدون إطار نهائي أو مفاجأة. أنهِ بلمسة مميّزة أو لقطة رد فعل أو استدعاء بصري. هذا ما يجعل الفيديو عالقاً في الذاكرة.", "End with a surprise or reaction", "Most Shorts just... end. Cap yours with a signature beat, reaction shot, or callback. That's what makes it stick in memory.", ...YT.rewatch),

      // 📊 Retention (4)
      s("هدف الإكمال: 70%+", "الشورتس اللي تتجاوز نسبة إكمالها 70% تحظى بترويج أكبر. شورت 15 ثانية بنسبة 80% يكتسب زخماً بفضل المقدمة الحيوية والتحرير النظيف.", "Completion target: 70%+", "Shorts above 70% completion get more promotion. A 15-sec Short at 80% gains momentum from a punchy open + clean cuts.", ...YT.reten),
      s("مدّة المشاهدة بالنسبة لا بالثواني", "مدّة المشاهدة النسبية أهم من إجمالي وقت المشاهدة. شورت 30 ثانية بنسبة 85% غالباً يصنَّف أعلى من شورت 60 ثانية بنسبة 50%.", "Relative watch time > total seconds", "Relative watch time outweighs total. A 30-sec Short at 85% often outranks a 60-sec Short at 50%.", ...YT.reten),
      s("معدّل التمرير = إشارة جودة", "كلما قلّ عدد من يمرّرون بمحتواك وبدلاً من ذلك يشاهدون حتى النهاية، يفسّر الخوارزمي ذلك كمحتوى عالي الجودة.", "Swipe-through = quality signal", "The fewer viewers swipe past — and the more watch through — the more YouTube interprets it as high quality.", ...YT.reten),
      s("التفاعل المبكر +40% توزيع", "التفاعل المبكر خلال الساعة الأولى يرفع التصنيف بنسبة 40%. الإعجابات والإعادة تفوق التمرير بنسبة 2:1.", "Early engagement = +40% distribution", "Engagement in the first hour lifts ranking by 40%. Likes + replays outweigh swipes 2:1.", ...YT.reten),

      // ✍️ Title & SEO (5)
      s("العنوان أقل من 50 حرفاً", "العناوين أقل من 50 حرف مع هوكات الفضول تحصل على نسب نقر أعلى بـ 25% من المنشورات المثقلة بالهاشتاغات (بيانات يوتيوب 2025).", "Title under 50 chars", "Titles under 50 chars with curiosity hooks get 25% higher CTR than hashtag-loaded ones (YouTube 2025 data).", ...YT.title),
      s("الكلمة المفتاحية في أول 60 حرفاً", "اكتب العنوان المُقنع مع وضع كلمتك المفتاحية الرئيسية في أول 60 حرفاً. هذا أهم مكان لـ SEO يوتيوب.", "Keyword in first 60 chars", "Write a compelling title with your primary keyword in the first 60 characters. Most important SEO slot on YouTube.", ...YT.title),
      s("عناوين تحت 10 كلمات تتصدّر", "دراسات تظهر أن العناوين أقل من 10 كلمات تحقّق أفضل أداء في نتائج بحث يوتيوب، مع 81% من أعلى الفيديوهات تصنيفاً تحت هذا الحدّ.", "Titles under 10 words rank top", "Studies show titles under 10 words perform best in YouTube search — 81% of top-ranking videos are below this threshold.", ...YT.title),
      s("كلمات العنوان القوية تضاعف النقرات", "\"مجنون\"، \"سرّ\"، \"خفي\"، \"حيلة\"، \"هاك\"، \"لا تفعل هذا\" — ليست تضليلاً لو قدّم محتواك ما يعد به. استخدامها بحكمة يضاعف CTR.", "Power words double CTR", "\"Crazy\", \"secret\", \"hidden\", \"trick\", \"hack\", \"don't do this\" — not clickbait if delivered. Used wisely, they double CTR.", ...YT.title),
      s("أضف #Shorts للعنوان", "استخدام هاشتاغ #Shorts في العنوان يساعد على ضمان ترويج يوتيوب لمحتواك عبر المنصة، ويعزّز قابلية البحث.", "Add #Shorts to title", "Using #Shorts in the title helps ensure YouTube promotes it across the platform + boosts searchability.", ...YT.title),

      // 🖼️ Visual Design (4)
      s("كل إطار قد يصبح ثمبنيل", "عامل كل إطار في فيديوك كثمبنيل محتمل وكل عنوان كأداة اكتشاف قوية. أنت تنشئ فيديو \"جاهزاً للثمبنيل\" في أي لحظة.", "Every frame = potential thumbnail", "Treat every frame as a potential thumbnail and every title as a discovery tool. You're making a \"thumbnail-ready\" video at all times.", ...YT.visual),
      s("الوجه في الثمبنيل +45% نقرات", "الفيديوهات اللي تظهر فيها وجوه في ثمبنيلاتها تحصل على نسبة نقر أعلى بـ 45% (أبحاث Hootsuite 2025). التعبيرات مهمة أيضاً.", "Face in thumbnail = +45% CTR", "Videos with faces in thumbnails get 45% higher CTR (Hootsuite 2025). Expression matters too — exaggerate.", ...YT.visual),
      s("اختبر 3 ثمبنيلات مختلفة", "ميزة Test & Compare 2025 تتيح رفع 3 ثمبنيلات مختلفة لفيديو واحد. يوتيوب يختبرها مع جمهورك ويبلغك الفائز.", "A/B-test 3 thumbnails", "YouTube's 2025 Test & Compare feature lets you upload 3 thumbnails per video. YouTube tests them with your audience and reports the winner.", ...YT.visual),
      s("نص الثمبنيل: 3-5 كلمات فقط", "النص على الثمبنيل لا يتجاوز 3-5 كلمات قوية تثير الفضول. العنوان للتفاصيل، نص الثمبنيل للتأثير الفوري. خط كبير يُقرأ بوضوح حتى عند التصغير.", "Thumbnail text: 3-5 words max", "Thumbnail text should be 3-5 high-curiosity words max. Title carries details, thumbnail delivers instant impact. Use bold font readable when shrunk.", ...YT.visual),

      // 🎵 Audio (2)
      s("الأصوات الرائجة تعزّز الاكتشاف", "الأصوات الرائجة والتحديات تعزّز قابلية الاكتشاف. ابحث عنها عبر زر \"إضافة صوت\" عند إنشاء شورت جديد — تحقّق من قسم \"أبرز الأصوات\".", "Trending sounds boost discovery", "Trending sounds and challenges boost discoverability. Find them via the \"Add Sound\" button when creating a new Short — check the \"Top Sounds\" section.", ...YT.sound),
      s("مزامنة التحرير مع الإيقاع", "طابق تحريرك ومحتواك مع إيقاع الموسيقى لأقصى تأثير بصري. القطعات على الـ beat تشعر المشاهد بأن الفيديو \"مصنوع جيداً\".", "Sync edits to the beat", "Match your cuts and content to the music beat for max impact. On-beat editing makes viewers feel the video is \"well crafted\".", ...YT.sound),

      // ⏰ Timing (3)
      s("3-5 شورتس أسبوعياً = المعيار", "نشر الشورتس 3-5 مرات أسبوعياً يزيد الظهور ويمنح الخوارزمية بيانات أكثر لتتعلّم ما يستجيب له جمهورك.", "3-5 Shorts/wk is the standard", "Posting 3-5 Shorts per week boosts visibility + gives the algorithm more data to learn what your audience responds to.", ...YT.timing),
      s("دفعة المحتوى (Batch Content)", "صوّر عدة شورتس في جلسة واحدة بحيث ما تضطر للتدافع يومياً. خطّط لتنويع الأشكال: شورتس ترند، شورتس دائمة، وشورتس تجريبية.", "Batch your content", "Shoot multiple Shorts in one session so you don't scramble daily. Plan a mix: trend-based, evergreen, and experimental.", ...YT.timing),
      s("شارك وانشر في أول 24 ساعة", "شارك الفيديو وضمّنه في مواضع أخرى (مجتمعك، Stories، تويتر) خلال أول 24 ساعة لبداية خوارزمية قوية.", "Promote within first 24h", "Share + embed the video in other places (community tab, Stories, X) within the first 24 hours for a strong algorithmic launch.", ...YT.timing),

      // 💬 Community (3)
      s("ردّ على التعليقات في أول 60 دقيقة", "المنشئون اللي يردّون على التعليقات خلال الساعة الأولى يحصلون على توزيع أعلى قابل للقياس. كل رد يُحتسب كتفاعل إضافي.", "Reply within 60 minutes", "Creators who reply in the first hour see measurably higher distribution. Every reply counts as extra engagement.", ...YT.comm),
      s("اطرح سؤالاً في النهاية", "أنهِ كل شورت بسؤال أو دعوة تشجّع المشاهدين على التعليق، مثل: \"أي نصيحة ستجرّب أولاً؟ علّق أدناه\".", "End with a question", "End every Short with a question or invitation: \"Which tip will you try first? Comment below.\"", ...YT.comm),
      s("التعليق المثبّت = استمرار المحتوى", "التعليقات ليست مجرّد قناة تغذية راجعة — إنها امتداد للمحتوى. انشر تعليقاً مثبتاً: \"تريد الجزء 2؟\" — يوتيوب يرى النشاط الإضافي، وكذلك مشاهدك القادم.", "Pinned comment = content extension", "Comments aren't just feedback — they're a content extension. Post a pinned: \"Want a Part 2?\" — YouTube sees extra activity, and so does your next viewer.", ...YT.comm),

      // 📈 Analytics (3)
      s("ابحث في منحنى الاستبقاء أسبوعياً", "حلّل منحنى الاستبقاء في يوتيوب ستوديو كل أسبوع. لو تركك المشاهدون في الدقيقة الثانية، جرّب مقدّمة أقصر أو تحريراً ديناميكياً أكثر.", "Analyze retention curve weekly", "Review the retention curve in YouTube Studio every week. Viewers leaving at minute 2? Try a shorter intro or more dynamic cuts.", ...YT.ana),
      s("كرّر ما نجح — لكن أفضل", "حدّث الهوك، حسّن الإيقاع، استخدم صوراً جديدة. ترندات شورتس 2025 كثيراً ما تتضمّن أفكاراً معاد تدويرها. الجماهير تتغيّر، التوقيت يتغيّر — دع الماضي يُغذّي الحاضر.", "Repeat what worked — but better", "Update the hook, tighten the pacing, use new visuals. 2025 Shorts trends often recycle ideas. Audiences shift, timing shifts — let the past fuel the present.", ...YT.ana),
      s("أعد توزيع الفيديوهات الناجحة", "اكتشف لماذا نجح الفيديو الفيروسي الأول وكرّر خطواته. مع Metricool تقدر تشوف المشاهدات ووقت المشاهدة وبيانات التفاعل لفيديوهات متعدّدة جنباً إلى جنب.", "Redistribute your hits", "Figure out why your first viral video worked, then repeat its steps. Tools like Metricool let you compare views, watch time, and engagement side-by-side.", ...YT.ana),

      // 🔗 Long-term Strategy (4)
      s("الشورتس بوابة للمحتوى الطويل", "استخدم شورتسك لتلميح محتواك الطويل أو ربطه في التعليقات أو الوصف. حتى لو تركيزك الرئيسي على الطويل، الشورتس أداة اكتشاف قوية خاصة للقنوات الجديدة.", "Shorts = gateway to long-form", "Use Shorts to tease long-form content, linking it in comments or description. Even if long-form is your focus, Shorts is a strong discovery engine — especially for new channels.", ...YT.strat),
      s("ابنِ سلاسل لا فيديوهات منفردة", "أفضل منشئي الشورتس يفكّرون في سلسلة فيديوهات. لو علم المشاهد أن الجزء الأول يقود لجزء ثانٍ، فهو أكثر احتمالاً بكثير للاشتراك.", "Build series, not single videos", "Top Shorts creators think in series. When viewers know Part 1 leads to Part 2, subscription rate skyrockets.", ...YT.strat),
      s("استفد من موجة الترند", "متابعة ما ينتشر الآن في نيشك تمنحك أفكاراً وفيرة وعيوناً أكثر على فيديوهاتك. الترندات تفتح أبواب جمهور جديد بدون مجهود تسويقي.", "Ride the trend wave", "Following what's trending in your niche right now gives you endless ideas + more eyeballs. Trends open new-audience doors without ad spend.", ...YT.strat),
      s("الفيديوهات دائمة الصلاحية (Evergreen)", "يوتيوب يعيد إظهار المحتوى القديم لمّا يصبح ذا صلة. مواضيع كاللياقة في يناير أو وصفات الأعياد في ديسمبر تشهد ارتفاعاً موسمياً.", "Evergreen content compounds", "YouTube resurfaces old content when it becomes relevant again. Topics like fitness in January or holiday recipes in December see seasonal spikes.", ...YT.strat),

      // 🎯 Ideas (3)
      s("بدء البحث العكسي", "اذهب لشريط بحث يوتيوب، اكتب كلمة نيشك المفتاحية + كلمات محفّزة (\"كيف\"، \"لماذا\"، \"أفضل\"، \"خطأ\"). تحقّق من نتائج الإكمال التلقائي — هذي استفسارات حقيقية عالية الحجم.", "Reverse-search ideation", "In YouTube search, type your niche keyword + trigger words (\"how\", \"why\", \"best\", \"mistake\"). The autocomplete = real high-volume queries.", ...YT.ideas),
      s("الصراعات المفيدة لا تُخفق", "الخوف، الفرح، الانزعاج، الدهشة — هذي تدفع الانتشار الفيروسي. اسأل نفسك: ماذا يُشعر شورتسك؟ شورت تعليمي يُضحك أيضاً يتفوّق على شرح جاف.", "Productive friction wins", "Fear, joy, frustration, awe — these drive virality. Ask: what does your Short MAKE someone feel? A tutorial that also amuses beats a dry explainer.", ...YT.ideas),
      s("الأفقي يتميّز في بحر الرأسي", "منشئ شاب استخدم تنسيقاً أفقياً بدل الرأسي السائد في الشورتس، فتميّز لأنه أوحى بأنه ليس مجرّد جرعة دوبامين — وصل لمليون مشاهدة.", "Horizontal stands out in a vertical sea", "A young creator used a horizontal format instead of the standard vertical for Shorts — and stood out, signaling \"not just a dopamine hit\". Hit 1M views.", ...YT.ideas),

      // 🔍 Advanced SEO (3)
      s("الوصف: 200-500 كلمة مع كلمات مفتاحية", "اكتب وصفاً مفصلاً من 200-500 كلمة مع توزيع استراتيجي للكلمات المفتاحية. يوتيوب يستخدم الوصف لفهم الموضوع وتطابق التوصيات.", "Description: 200-500 keyword-rich words", "Write a detailed 200-500-word description with strategic keyword placement. YouTube uses it to understand topic + match recommendations.", ...YT.advSeo),
      s("الترجمات تُفهرس", "أضف ترجمات نصية دقيقة وانطق الكلمات المفتاحية بشكل طبيعي — يوتيوب يقرأ ما تقوله ليفهم موضوع الفيديو ويصنّفه بدقّة.", "Captions get indexed", "Add accurate captions and speak keywords naturally — YouTube reads transcripts to understand and classify your video.", ...YT.advSeo),
      s("الاتساق في النيش يبني سلطة", "تأكد إن وصف قناتك واستراتيجية محتواك تتوافق مع ترندات الفيديو الشائعة وسلوك البحث في مجالك. هذا يبني سلطة البحث على المدى الطويل.", "Niche consistency builds SEO authority", "Make sure your channel description + content strategy align with trending video topics and search behavior in your niche. Builds long-term search authority.", ...YT.advSeo),

      // ⚙️ Critical Mistakes (2)
      s("لا تنشر وتختفي", "أفضل أوقات النشر مهمّة، لكن المنشئين يفوتون حقيقة واحدة: التفاعل المبكر يعتمد على تواجدك. ردّ على التعليقات. شارك. راقب أين يتوقّف المشاهدون. أنت تختبر الفيديو مباشرة.", "Don't post and disappear", "Posting time matters, but creators miss the key truth: early engagement depends on YOU being present. Reply, share, watch where viewers drop off — you're live-testing the video.", ...YT.errors),
      s("اتساق وبيانات لا أسرار مختصرة", "الحقيقة غير المثيرة وراء نجاح الشورتس هي الاتساق والالتزام والتحسين المستمر بناءً على البيانات. النمو البطيء لا يعني محتواك ضعيف — الشورتس يعمل على منحنى أطول.", "Consistency + data, no shortcuts", "The unglamorous truth: Shorts success = consistency + commitment + data-driven optimization. Slow growth doesn't mean weak content — Shorts plays the long game.", ...YT.errors),
    ],
  },
};

// Backwards-compat default export (used by some legacy components)
export default SECRETS;

/**
 * Flatten one platform's secrets into a stable numbered list (1..50).
 * Order: free secrets first (1..N), then premium (N+1..50) — matches Vault.jsx display.
 *
 *   getNumberedSecrets("instagram", "ar")
 *     → [{ number: 1, title: "...", body: "...", isFree: true }, ...]
 */
export function getNumberedSecrets(platform, lang = "ar") {
  const data = SECRETS[platform];
  if (!data) return [];
  const out = [];
  data.free.forEach((s, i) => {
    const meta = s[lang] || s.ar;
    out.push({ number: i + 1, title: meta.title, body: meta.body, isFree: true });
  });
  data.premium.forEach((s, i) => {
    const meta = s[lang] || s.ar;
    out.push({
      number: data.free.length + i + 1,
      title: meta.title,
      body: meta.body,
      isFree: false,
    });
  });
  return out;
}
