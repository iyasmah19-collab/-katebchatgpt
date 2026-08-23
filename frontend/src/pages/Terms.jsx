import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { ArrowLeft, FileText } from "lucide-react";

const CONTACT_EMAIL = "accofamd@gmail.com";
const LAST_UPDATED = "2026-06-07";

const CONTENT = {
  ar: {
    dir: "rtl",
    backHome: "الرجوع للرئيسية",
    title: "شروط الخدمة",
    subtitle: "كاتب AI — منصّة توليد المحتوى العربي بالذكاء الاصطناعي",
    lastUpdated: `آخر تحديث: ${LAST_UPDATED}`,
    intro:
      'مرحباً بك في "كاتب AI". باستخدامك للموقع أو التطبيق أو أيّ من خدماتنا فإنك توافق على الالتزام بشروط الخدمة المذكورة أدناه. إن لم توافق على أيٍّ من هذه الشروط، فيرجى عدم استخدام الخدمة.',
    sections: [
      {
        h: "1. تعريفات",
        body: [
          '"الخدمة": موقع وتطبيق "كاتب AI" وكل ما يقدّمه من ميزات توليد محتوى وتحليل خوارزميات ومكتبة ومحادثة وأي ميزات مستقبلية.',
          '"المستخدم" أو "أنت": أي شخص يُنشئ حساباً أو يستخدم الخدمة بأيّ صورة.',
          '"المحتوى المُولَّد": أي نصوص أو كابشنات أو إعلانات أو بوستات أو أيّ ناتج من نماذج الذكاء الاصطناعي عبر الخدمة.',
          '"الكريديت": وحدة الاستهلاك الداخلية لتشغيل عمليات التوليد والتحليل.',
        ],
      },
      {
        h: "2. الأهلية",
        body: [
          "يجب أن لا يقلّ عمرك عن 13 عاماً لاستخدام الخدمة.",
          "إن كنت دون 18 عاماً، فإنك تستخدم الخدمة بإذن وليّ الأمر ومسؤوليته.",
          "تتعهّد بأن جميع المعلومات التي تُقدّمها صحيحة ومحدَّثة وملك لك.",
        ],
      },
      {
        h: "3. الحساب وكلمة المرور",
        body: [
          "أنت المسؤول الوحيد عن حماية بيانات الدخول لحسابك (البريد، كلمة المرور، Google/Meta tokens).",
          "أيّ نشاط يصدر من حسابك يُعدّ صادراً منك ما لم تُبلِّغنا فوراً عن اختراق.",
          "لا يجوز مشاركة حسابك مع شخص آخر، ولا إنشاء أكثر من حساب مجاني واحد للشخص نفسه.",
        ],
      },
      {
        h: "4. الاستخدام المسموح",
        body: [
          "استخدام الخدمة لأغراضك الشخصية أو التجارية المشروعة (كصانع محتوى، شركة، وكالة تسويق).",
          "استخدام الواجهات المتاحة فقط — بدون scraping أو reverse engineering أو محاولة الوصول للـ API بدون إذن.",
          "احترام رصيد الكريديت والاشتراك — كل عملية توليد تستهلك رصيداً وفقاً للجدول المُعلن.",
        ],
      },
      {
        h: "5. الاستخدام المحظور",
        body: [
          "إنشاء محتوى يحرّض على الكراهية أو العنف أو التمييز العنصري أو الديني.",
          "إنشاء محتوى جنسي صريح أو مُستغِلّ للقاصرين بأيّ شكل.",
          "إنشاء محتوى احتيالي أو مضلّل أو ينتحل شخصية فرد/جهة حقيقية.",
          "استخدام الخدمة لنشر برامج ضارّة، spam، روابط تصيّد، أو أيّ نشاط غير قانوني في بلدك.",
          "محاولة كسر الحماية، استغلال ثغرات، أو إساءة استخدام API.",
          "إعادة بيع الخدمة أو إعادة تغليفها أو تقديمها كخدمة منافسة دون اتفاقية مكتوبة.",
        ],
      },
      {
        h: "6. ملكية المحتوى المُولَّد",
        body: [
          'بما هو مسموح قانونياً، فإن "كاتب AI" يتنازل لك عن جميع حقوقه في المحتوى الذي تولّده عبر الخدمة، وأنت تملك حق استخدامه تجارياً.',
          "أنت تتحمّل المسؤولية الكاملة عن مراجعة المحتوى قبل النشر، والتأكّد من ملاءمته، ومن أنه لا يخرق أيّ حقوق ملكية فكرية لطرف ثالث.",
          "لا نضمن أن المحتوى المُولَّد فريد 100% — قد يولّد النموذج عبارات مشابهة لمحتوى موجود مسبقاً.",
          "يحقّ لنا استخدام إحصائيات مجمَّعة ومجهَّلة الهوية (مثل: متوسط طول النصوص، أكثر اللهجات استخداماً) لتحسين الخدمة.",
        ],
      },
      {
        h: "7. الكريديت والاشتراكات",
        body: [
          "يُمنح كل حساب جديد 20 كريديت مجاني عند التسجيل.",
          "يمكن شراء كريديت إضافي عبر الباقات المُعلنة في صفحة /credits.",
          "يمكن الاشتراك في Premium للحصول على رصيد شهري متجدّد ومميزات إضافية في صفحة /premium.",
          "الاشتراك يتجدّد تلقائياً ما لم تقم بإلغائه قبل تاريخ التجديد. الإلغاء يسري في نهاية الفترة الجارية.",
          "الكريديت غير قابل للاسترداد نقداً بعد الاستهلاك. أما الكريديت غير المستهلَك خلال 14 يوماً من الشراء، يمكن طلب استرداده بمراسلة " +
            CONTACT_EMAIL +
            ".",
        ],
      },
      {
        h: "8. الدفع",
        body: [
          "جميع المدفوعات تتم عبر Stripe — نحن لا نُخزّن أيّ بيانات بطاقة.",
          "الأسعار قد تتغيّر، ونلتزم بإبلاغك قبل 14 يوماً من أيّ تغيير على اشتراك قائم.",
          "في حال فشل الدفع، يتم تجميد ميزات Premium حتى استئناف الدفع.",
          "أيّ نزاع على معاملة يجب رفعه إلينا خلال 30 يوماً من تاريخ المعاملة.",
        ],
      },
      {
        h: "9. التكاملات الخارجية",
        body: [
          "ربط Google/YouTube/Instagram اختياري وخاضع لشروط مزوّدي تلك الخدمات (Google ToS, YouTube ToS, Meta Platform Terms).",
          "نحن غير مسؤولين عن أيّ تغيير في سياسات تلك المنصّات قد يُعطّل أو يُعدّل الميزات.",
          "يمكنك سحب الإذن في أيّ وقت من إعدادات حسابك في تلك المنصّات أو من إعدادات كاتب AI.",
        ],
      },
      {
        h: "10. الذكاء الاصطناعي وقيوده",
        body: [
          "النماذج تُولّد محتوى احتمالياً وقد تُنتج أحياناً معلومات غير دقيقة أو منحازة.",
          "لا نضمن دقّة، أو ملاءمة، أو حداثة، أو خلوّ المحتوى من الأخطاء.",
          "المحتوى المُولَّد ليس نصيحة قانونية أو طبية أو مالية. إذا كنت بحاجة لذلك، استشر مختصاً.",
          "نحتفظ بحقّ تعديل أو إيقاف نموذج معيّن أو استبداله بآخر دون إشعار مسبق.",
        ],
      },
      {
        h: "11. التعليق والإنهاء",
        body: [
          "يحقّ لنا تعليق أو إغلاق أيّ حساب يخرق هذه الشروط، دون استرداد للكريديت أو الاشتراك المتبقي إذا كان الخرق جسيماً.",
          "يمكنك أنت إنهاء حسابك في أيّ وقت من إعدادات الحساب — بيانات حسابك تُحذف خلال 30 يوماً.",
          "بعض البيانات الإلزامية قانونياً (سجلات الفواتير) نحتفظ بها لمدّة 7 سنوات.",
        ],
      },
      {
        h: "12. إخلاء المسؤولية",
        body: [
          'الخدمة تُقدَّم "كما هي" و"كما تتوفّر" دون أيّ ضمانات صريحة أو ضمنية.',
          "نحن لا نضمن أن الخدمة ستكون متاحة 24/7 أو خالية من الأعطال أو الأخطاء.",
          'لا نضمن نتائج معيّنة (مثلاً: "ستحصل على X متابع") — النتائج تعتمد على عوامل خارج نطاقنا.',
        ],
      },
      {
        h: "13. حدود المسؤولية",
        body: [
          "بأقصى حدّ يسمح به القانون، لن تتجاوز مسؤوليتنا الإجمالية تجاهك ما دفعته فعلياً خلال آخر 6 أشهر من استخدام الخدمة.",
          "لسنا مسؤولين عن أيّ أضرار غير مباشرة أو تبعيّة أو خاصة، بما في ذلك خسارة الأرباح أو السمعة أو البيانات.",
          "لا نتحمّل مسؤولية المحتوى الذي تنشره خارج منصّتنا حتى لو كان مُولَّداً عبر خدمتنا.",
        ],
      },
      {
        h: "14. التعويض",
        body: [
          'توافق على تعويض "كاتب AI" والقائمين عليها عن أيّ مطالبات أو خسائر أو أضرار ناتجة عن خرقك لهذه الشروط أو سوء استخدامك للخدمة.',
        ],
      },
      {
        h: "15. التعديلات على الشروط",
        body: [
          "نحقّ لنا تعديل هذه الشروط في أيّ وقت. التعديلات الجوهرية ستُبلَّغ بها عبر البريد قبل 14 يوماً من سريانها.",
          "استمرارك في استخدام الخدمة بعد سريان التعديلات يُعدّ موافقة عليها.",
        ],
      },
      {
        h: "16. القانون الحاكم والاختصاص",
        body: [
          "تُحكم هذه الشروط وفق قوانين بلد إقامة المستخدم بقدر ما تكون قابلة للتطبيق، مع احترام حقوقك الإلزامية كمستهلك.",
          "أيّ نزاع يحاول الطرفان حلّه ودّياً أولاً عبر التواصل المباشر خلال 30 يوماً قبل اللجوء إلى أيّ طريق قانوني.",
        ],
      },
      {
        h: "17. التواصل",
        body: [
          "لأيّ سؤال أو ملاحظة أو شكوى حول هذه الشروط: " + CONTACT_EMAIL,
          "نلتزم بالرد خلال 7 أيام عمل.",
        ],
      },
    ],
  },
  en: {
    dir: "ltr",
    backHome: "Back to home",
    title: "Terms of Service",
    subtitle: "Kateb AI — Arabic AI content generation platform",
    lastUpdated: `Last updated: ${LAST_UPDATED}`,
    intro:
      "Welcome to Kateb AI. By using our website, app, or any of our services, you agree to be bound by the Terms of Service below. If you do not agree to any of these terms, please do not use the service.",
    sections: [
      {
        h: "1. Definitions",
        body: [
          '"Service": the Kateb AI website, app, and all features it offers — content generation, algorithm insights, library, chat, and any future features.',
          '"User" or "you": anyone who creates an account or uses the service in any form.',
          '"Generated Content": any text, captions, ads, posts, or output produced by our AI models through the service.',
          '"Credits": the internal usage unit consumed for generation and analytics operations.',
        ],
      },
      {
        h: "2. Eligibility",
        body: [
          "You must be at least 13 years old to use the service.",
          "If you are under 18, you use the service with parental consent and responsibility.",
          "You represent that all information you provide is true, current, and yours.",
        ],
      },
      {
        h: "3. Account & Password",
        body: [
          "You are solely responsible for safeguarding your credentials (email, password, Google/Meta tokens).",
          "Any activity from your account is deemed yours unless you immediately report a breach.",
          "You may not share your account with anyone, nor create more than one free account per person.",
        ],
      },
      {
        h: "4. Permitted Use",
        body: [
          "Use the service for lawful personal or commercial purposes (creator, business, marketing agency).",
          "Use only the interfaces we provide — no scraping, reverse engineering, or unauthorized API access.",
          "Respect your credit balance and subscription — each operation consumes credits per the published schedule.",
        ],
      },
      {
        h: "5. Prohibited Use",
        body: [
          "Generating content that incites hatred, violence, racial or religious discrimination.",
          "Generating sexually explicit content or any content exploiting minors.",
          "Creating fraudulent, misleading content, or impersonating real individuals/entities.",
          "Using the service to distribute malware, spam, phishing links, or any activity illegal in your country.",
          "Attempting to break security, exploit vulnerabilities, or abuse our APIs.",
          "Reselling, repackaging, or offering the service as a competing product without a written agreement.",
        ],
      },
      {
        h: "6. Ownership of Generated Content",
        body: [
          "To the extent permitted by law, Kateb AI assigns to you all its rights in the content you generate through the service, and you may use it commercially.",
          "You bear full responsibility to review content before publishing and to ensure it does not infringe any third-party intellectual property rights.",
          "We do not guarantee that generated content is 100% unique — the model may produce phrases similar to pre-existing content.",
          "We may use aggregated, anonymized statistics (e.g., average text length, most-used dialects) to improve the service.",
        ],
      },
      {
        h: "7. Credits & Subscriptions",
        body: [
          "Each new account receives 20 free credits at signup.",
          "Additional credits are available via packages listed on /credits.",
          "You may subscribe to Premium for monthly recurring credits and extra features on /premium.",
          "Subscriptions auto-renew unless cancelled before the renewal date. Cancellation takes effect at the end of the current period.",
          "Consumed credits are non-refundable. Unused credits may be refunded within 14 days of purchase by emailing " +
            CONTACT_EMAIL +
            ".",
        ],
      },
      {
        h: "8. Payment",
        body: [
          "All payments are processed by Stripe — we never store any card data.",
          "Prices may change; we will notify existing subscribers 14 days before any change takes effect.",
          "If payment fails, Premium features are paused until payment resumes.",
          "Any transaction dispute must be raised with us within 30 days of the transaction date.",
        ],
      },
      {
        h: "9. Third-Party Integrations",
        body: [
          "Google/YouTube/Instagram integrations are optional and subject to those providers' terms (Google ToS, YouTube ToS, Meta Platform Terms).",
          "We are not responsible for any policy changes by those platforms that may disable or modify features.",
          "You can revoke permission anytime from those platforms' settings or from Kateb AI settings.",
        ],
      },
      {
        h: "10. AI & Its Limits",
        body: [
          "Models generate content probabilistically and may sometimes produce inaccurate or biased information.",
          "We do not guarantee accuracy, suitability, freshness, or error-free output.",
          "Generated content is not legal, medical, or financial advice. Consult a professional for such matters.",
          "We reserve the right to change, pause, or replace any AI model without prior notice.",
        ],
      },
      {
        h: "11. Suspension & Termination",
        body: [
          "We may suspend or close any account that violates these terms, without refund of remaining credits/subscription in case of serious breach.",
          "You may close your account anytime from account settings — your data will be deleted within 30 days.",
          "Legally required records (invoicing) are retained for 7 years.",
        ],
      },
      {
        h: "12. Disclaimer",
        body: [
          'The service is provided "as is" and "as available" without any express or implied warranties.',
          "We do not guarantee 24/7 availability or freedom from bugs or errors.",
          'We do not guarantee specific outcomes (e.g., "you will gain X followers") — results depend on factors outside our control.',
        ],
      },
      {
        h: "13. Limitation of Liability",
        body: [
          "To the maximum extent permitted by law, our aggregate liability to you will not exceed what you actually paid us in the last 6 months of using the service.",
          "We are not liable for indirect, consequential, or special damages, including lost profits, reputation, or data.",
          "We are not liable for content you publish outside our platform, even if generated through our service.",
        ],
      },
      {
        h: "14. Indemnity",
        body: [
          "You agree to indemnify Kateb AI and its operators against any claims, losses, or damages arising from your breach of these terms or misuse of the service.",
        ],
      },
      {
        h: "15. Changes to Terms",
        body: [
          "We may modify these terms at any time. Material changes will be emailed 14 days before taking effect.",
          "Your continued use of the service after changes take effect constitutes acceptance.",
        ],
      },
      {
        h: "16. Governing Law & Jurisdiction",
        body: [
          "These terms are governed by the laws of the user's country of residence to the extent applicable, respecting your mandatory consumer rights.",
          "Any dispute will first be attempted to be resolved amicably via direct contact within 30 days before resorting to any legal recourse.",
        ],
      },
      {
        h: "17. Contact",
        body: [
          "For any question, feedback, or complaint about these terms: " + CONTACT_EMAIL,
          "We respond within 7 business days.",
        ],
      },
    ],
  },
};

export default function Terms() {
  const { lang } = useApp();
  const c = CONTENT[lang] || CONTENT.ar;

  return (
    <div className="hero-bg bg-grain min-h-screen" dir={c.dir} data-testid="terms-page">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-24">
        <Link
          to="/"
          data-testid="terms-back-home"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-400 text-sm mb-8 transition"
        >
          <ArrowLeft className={`w-4 h-4 ${c.dir === "rtl" ? "rotate-180" : ""}`} />
          {c.backHome}
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-400" />
          </div>
          <h1
            data-testid="terms-title"
            className="text-3xl sm:text-4xl font-black tracking-tight text-white"
          >
            {c.title}
          </h1>
        </div>
        <p className="text-zinc-400 mb-1">{c.subtitle}</p>
        <p className="text-xs font-mono text-zinc-600 mb-10">{c.lastUpdated}</p>

        <p className="text-zinc-300 leading-relaxed mb-10 text-base">{c.intro}</p>

        <div className="space-y-8">
          {c.sections.map((s, i) => (
            <section key={s.h} data-testid={`terms-section-${i + 1}`}>
              <h2 className="text-lg font-bold text-amber-400 mb-3">{s.h}</h2>
              <ul className="space-y-2 text-zinc-300 text-sm leading-relaxed">
                {s.body.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-amber-500/60 mt-1">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 text-center text-xs text-zinc-600" dir="ltr">
          © 2026 Kateb AI · Made by Ahmad Al-Shamaseen (amd)
        </div>
      </div>
    </div>
  );
}
