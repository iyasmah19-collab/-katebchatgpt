import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { ArrowLeft, Shield } from "lucide-react";

const CONTACT_EMAIL = "accofamd@gmail.com";
const LAST_UPDATED = "2026-06-07";

const CONTENT = {
  ar: {
    dir: "rtl",
    backHome: "الرجوع للرئيسية",
    title: "سياسة الخصوصية",
    subtitle: "كاتب AI — منصّة توليد المحتوى العربي بالذكاء الاصطناعي",
    lastUpdated: `آخر تحديث: ${LAST_UPDATED}`,
    intro:
      'نحن في "كاتب AI" نلتزم بحماية خصوصيتك. توضّح هذه السياسة ما البيانات التي نجمعها عند استخدامك للموقع والتطبيق، وكيف نستخدمها ونحميها، وحقوقك تجاهها. باستخدامك للخدمة فإنك توافق على ما هو موضّح أدناه.',
    sections: [
      {
        h: "1. البيانات التي نجمعها",
        body: [
          "بيانات الحساب: الاسم، اسم المستخدم، البريد الإلكتروني، كلمة المرور المُشفَّرة (Hashed)، الصورة الرمزية (إن وجدت)، تاريخ الإنشاء.",
          "بيانات الاستخدام: المحتوى الذي تُولّده (كابشنات، إعلانات، بوستات، خ.)، تاريخ ونوع كل عملية، رصيد الكريديت المستهلك.",
          "بيانات تقنية: عنوان IP، نوع المتصفح، نظام التشغيل، اللغة المفضّلة، الكوكيز اللازمة لتسجيل الدخول والجلسات.",
          "بيانات الدفع: تتم معالجتها بالكامل عبر مزوّد الدفع Stripe — نحن لا نُخزّن أرقام بطاقاتك أبداً. نحفظ فقط معرف الجلسة (session_id) وحالة الاشتراك والكريديت المُضاف.",
        ],
      },
      {
        h: "2. كيف نستخدم بياناتك",
        body: [
          "تشغيل الخدمة: إنشاء حسابك، توليد المحتوى، إدارة رصيدك، تخزين مكتبتك الخاصة.",
          "تحسين الجودة: تحليلات إحصائية مجمَّعة (بدون تعريف شخصي) لتطوير النماذج والميزات.",
          "الأمان: كشف ومنع الاحتيال، إساءة الاستخدام، وانتهاك شروط الخدمة.",
          "التواصل: إرسال إيصالات الدفع، تأكيدات الحساب، تنبيهات أمنية مهمة، وإشعارات تشغيلية فقط عبر Resend.",
        ],
      },
      {
        h: "3. تسجيل الدخول عبر Google (Google OAuth)",
        body: [
          "عند اختيارك تسجيل الدخول بحساب Google، نطلب فقط الصلاحيات التالية: openid, email, profile.",
          "نستلم من Google: عنوان البريد، الاسم الكامل، الصورة الرمزية، ومُعرّف Google الفريد — ولا نستلم كلمة مرورك إطلاقاً.",
          "نستخدم هذه البيانات حصراً لإنشاء حسابك في كاتب AI ولتسجيل الدخول. لا نُشاركها مع أي طرف ثالث ولا نستخدمها للإعلانات.",
          "يمكنك في أي وقت إلغاء الوصول من إعدادات حساب Google: myaccount.google.com/permissions.",
        ],
      },
      {
        h: "4. ربط YouTube (YouTube OAuth)",
        body: [
          "ربط YouTube اختياري بالكامل ويُطلب فقط عند تفعيلك لميزات النشر/التحليل.",
          "نطلب الصلاحية: youtube.readonly — أي قراءة بيانات قناتك فقط (لا تعديل ولا نشر بدون إذنك الصريح في كل عملية).",
          "نخزّن رمز الوصول (Access Token) ورمز التحديث (Refresh Token) مُشفَّرَين في قاعدة بياناتنا، مرتبطَين بحسابك فقط.",
          "استخدام خدمة YouTube عبرنا يخضع لـ شروط خدمة YouTube (https://www.youtube.com/t/terms) وسياسة خصوصية Google (https://policies.google.com/privacy).",
          "يمكنك سحب الإذن في أي وقت من https://security.google.com/settings/security/permissions أو من إعدادات حسابك داخل كاتب AI.",
        ],
      },
      {
        h: "5. ربط Instagram / Meta (Meta Graph API)",
        body: [
          "ربط Instagram اختياري ويتم عبر Facebook Login مع الصلاحيات: instagram_basic, pages_show_list, instagram_manage_insights, business_management, pages_read_engagement.",
          "نستلم من Meta: مُعرّف حسابك التجاري على Instagram، اسم المستخدم، الصورة الرمزية، وبيانات الإحصائيات (impressions, reach) لأغراض التحليل فقط.",
          "نخزّن Access Token طويل المدى (60 يوماً) مرتبط بحسابك حصراً، ولا نستخدمه إلا عند طلبك الصريح للتحليل أو النشر.",
          "نلتزم بـ Meta Platform Terms — لا نبيع البيانات، لا نستخدمها للإعلانات، ولا ننقلها لطرف ثالث.",
          "يمكنك إزالة التطبيق من: إعدادات Facebook → التطبيقات والمواقع → إزالة.",
        ],
      },
      {
        h: "6. الدفع والاشتراكات (Stripe)",
        body: [
          "جميع عمليات الدفع تتم عبر Stripe (https://stripe.com) — حاصل على شهادة PCI-DSS Level 1.",
          "لا نرى ولا نُخزّن: رقم البطاقة، CVV، تاريخ الانتهاء، أو أي بيانات بنكية حسّاسة.",
          "نحفظ فقط: مُعرّف الجلسة (session_id)، حالة الدفع (paid/pending/failed)، المبلغ، تاريخ المعاملة، وعدد الكريديت المضاف.",
          "يمكنك طلب استرداد المبلغ خلال 14 يوماً إذا لم تستهلك الكريديت — راسلنا على " +
            CONTACT_EMAIL +
            ".",
        ],
      },
      {
        h: "7. نماذج الذكاء الاصطناعي",
        body: [
          "نستخدم نماذج طرف ثالث (OpenAI، Anthropic، Google Gemini) عبر بوابة موحَّدة لتوليد المحتوى.",
          "المحتوى الذي تُدخله (الموضوع، اللهجة، النمط) يُرسل لنموذج الذكاء الاصطناعي لمعالجة طلبك فقط.",
          "لا تُستخدم بياناتك في تدريب النماذج (نعتمد API endpoints التي لا تحتفظ بالبيانات حسب اتفاقياتنا).",
        ],
      },
      {
        h: "8. الكوكيز",
        body: [
          "نستخدم كوكيز تقنية فقط (access_token, session_token, lang) — لا كوكيز إعلانية ولا تتبع طرف ثالث.",
          "يمكنك تعطيل الكوكيز من متصفحك، لكن ذلك سيمنعك من تسجيل الدخول.",
        ],
      },
      {
        h: "9. مشاركة البيانات",
        body: [
          "لا نبيع بياناتك ولا نُؤجّرها لأي طرف ثالث.",
          "نُشارك بيانات محدودة فقط مع: مزوّدي البنية التحتية (الاستضافة)، Stripe (الدفع)، Resend (البريد)، ومزوّدي نماذج الذكاء الاصطناعي — وكلٌّ منهم مُلتزم باتفاقية معالجة بيانات صارمة.",
          "قد نُفصح عن البيانات إذا طلبت ذلك جهة قضائية مُختصّة بأمر قانوني صحيح.",
        ],
      },
      {
        h: "10. الاحتفاظ بالبيانات",
        body: [
          "نحتفظ ببيانات حسابك ما دام الحساب نشطاً.",
          "عند حذف حسابك: نحذف بياناتك خلال 30 يوماً، باستثناء سجلات الفواتير القانونية التي يلزمنا الاحتفاظ بها لمدة 7 سنوات.",
        ],
      },
      {
        h: "11. حقوقك",
        body: [
          "الوصول: طلب نسخة من كل بياناتك.",
          "التصحيح: تعديل أي معلومة غير دقيقة.",
          "الحذف: طلب حذف حسابك وبياناتك بالكامل.",
          "السحب: سحب موافقتك على ربط Google/YouTube/Instagram في أي وقت.",
          "الاعتراض: الاعتراض على أي معالجة لبياناتك.",
          "لممارسة أي حق، راسلنا على " + CONTACT_EMAIL + ".",
        ],
      },
      {
        h: "12. أمان البيانات",
        body: [
          "كلمات المرور مُشفّرة باستخدام bcrypt.",
          "الاتصالات كلها عبر HTTPS مع شهادات TLS صالحة.",
          "Access Tokens محفوظة بشكل آمن ومُقيَّدة الصلاحية.",
          "نستخدم JWT مع توقيع HS256 وانتهاء صلاحية تلقائي.",
        ],
      },
      {
        h: "13. الأطفال",
        body: [
          "الخدمة غير مُوجَّهة لمن هم دون 13 عاماً. إذا اكتشفنا أن حساباً يخص قاصراً، نحذفه فوراً.",
        ],
      },
      {
        h: "14. التعديلات",
        body: [
          "قد نُحدّث هذه السياسة من وقت لآخر. التعديلات الجوهرية ستُبلَّغ بها عبر البريد قبل 14 يوماً من سريانها.",
        ],
      },
      {
        h: "15. التواصل",
        body: [
          "لأي سؤال أو شكوى حول الخصوصية: " + CONTACT_EMAIL,
          "نلتزم بالرد خلال 7 أيام عمل.",
        ],
      },
    ],
  },
  en: {
    dir: "ltr",
    backHome: "Back to home",
    title: "Privacy Policy",
    subtitle: "Kateb AI — Arabic AI content generation platform",
    lastUpdated: `Last updated: ${LAST_UPDATED}`,
    intro:
      "Kateb AI is committed to protecting your privacy. This policy explains what data we collect when you use our service, how we use and protect it, and your rights. By using the service, you agree to the terms below.",
    sections: [
      {
        h: "1. Data We Collect",
        body: [
          "Account data: name, username, email, hashed password, avatar (optional), creation date.",
          "Usage data: content you generate (captions, ads, posts, etc.), timestamps, type of each operation, and credit balance consumed.",
          "Technical data: IP address, browser type, OS, preferred language, and cookies required for authentication and sessions.",
          "Payment data: fully processed by Stripe — we never store card numbers. We only retain the session_id, subscription status, and credits added.",
        ],
      },
      {
        h: "2. How We Use Your Data",
        body: [
          "Service delivery: account creation, content generation, credit management, private library storage.",
          "Quality improvement: aggregated anonymous analytics to enhance models and features.",
          "Security: detecting and preventing fraud, abuse, and ToS violations.",
          "Communication: payment receipts, account confirmations, critical security alerts, and operational notifications only — sent via Resend.",
        ],
      },
      {
        h: "3. Google Sign-In (Google OAuth)",
        body: [
          "When you sign in with Google, we only request: openid, email, profile.",
          "We receive from Google: email, full name, avatar, and unique Google ID — we never receive your password.",
          "This data is used exclusively to create your Kateb AI account and authenticate you. It is never shared with third parties or used for advertising.",
          "You may revoke access anytime at: myaccount.google.com/permissions.",
        ],
      },
      {
        h: "4. YouTube Integration (YouTube OAuth)",
        body: [
          "YouTube integration is fully optional and only triggered when you enable publishing/analytics features.",
          "We request: youtube.readonly — read-only access to your channel data (no edits or uploads without your explicit per-action consent).",
          "Access tokens and refresh tokens are encrypted in our database and tied to your account only.",
          "Use of YouTube through our service is subject to the YouTube Terms of Service (https://www.youtube.com/t/terms) and Google Privacy Policy (https://policies.google.com/privacy).",
          "You may revoke permission anytime at https://security.google.com/settings/security/permissions or from your Kateb AI account settings.",
        ],
      },
      {
        h: "5. Instagram / Meta Integration (Meta Graph API)",
        body: [
          "Instagram integration is optional and performed via Facebook Login with scopes: instagram_basic, pages_show_list, instagram_manage_insights, business_management, pages_read_engagement.",
          "We receive from Meta: your Instagram Business account ID, username, avatar, and insights data (impressions, reach) for analytics only.",
          "We store a long-lived Access Token (60 days) tied to your account, used only on your explicit request for analytics or publishing.",
          "We comply with Meta Platform Terms — we do not sell data, use it for advertising, or transfer it to third parties.",
          "You can remove the app at: Facebook Settings → Apps and Websites → Remove.",
        ],
      },
      {
        h: "6. Payments & Subscriptions (Stripe)",
        body: [
          "All payments are processed by Stripe (https://stripe.com) — PCI-DSS Level 1 certified.",
          "We never see or store: card number, CVV, expiry, or any sensitive banking data.",
          "We retain only: session_id, payment status (paid/pending/failed), amount, transaction date, and credits added.",
          "You may request a refund within 14 days if credits are unused — email " +
            CONTACT_EMAIL +
            ".",
        ],
      },
      {
        h: "7. AI Models",
        body: [
          "We use third-party AI models (OpenAI, Anthropic, Google Gemini) via a unified gateway to generate content.",
          "Your input (topic, dialect, style) is sent to the model only to fulfill your request.",
          "Your data is not used to train models (we use API endpoints with zero-retention agreements).",
        ],
      },
      {
        h: "8. Cookies",
        body: [
          "We use only essential cookies (access_token, session_token, lang) — no advertising or third-party tracking cookies.",
          "You may disable cookies in your browser, but this will prevent sign-in.",
        ],
      },
      {
        h: "9. Data Sharing",
        body: [
          "We never sell or rent your data.",
          "We share limited data only with: infrastructure providers (hosting), Stripe (payments), Resend (email), and AI model providers — each bound by strict data-processing agreements.",
          "We may disclose data if compelled by a valid legal order from a competent authority.",
        ],
      },
      {
        h: "10. Data Retention",
        body: [
          "We retain your account data as long as your account is active.",
          "Upon account deletion: data is purged within 30 days, except invoicing records legally required to be retained for 7 years.",
        ],
      },
      {
        h: "11. Your Rights",
        body: [
          "Access: request a copy of all your data.",
          "Rectification: correct inaccurate information.",
          "Erasure: request full deletion of your account and data.",
          "Withdrawal: revoke consent for Google/YouTube/Instagram linkage anytime.",
          "Objection: object to any processing of your data.",
          "To exercise any right, email " + CONTACT_EMAIL + ".",
        ],
      },
      {
        h: "12. Data Security",
        body: [
          "Passwords are hashed with bcrypt.",
          "All traffic is encrypted via HTTPS with valid TLS certificates.",
          "Access Tokens are securely stored and scope-limited.",
          "We use JWT with HS256 signature and automatic expiration.",
        ],
      },
      {
        h: "13. Children",
        body: [
          "The service is not intended for users under 13. If we discover an underage account, we delete it immediately.",
        ],
      },
      {
        h: "14. Changes",
        body: [
          "We may update this policy occasionally. Material changes will be emailed to you 14 days before taking effect.",
        ],
      },
      {
        h: "15. Contact",
        body: [
          "For privacy questions or complaints: " + CONTACT_EMAIL,
          "We respond within 7 business days.",
        ],
      },
    ],
  },
};

export default function Privacy() {
  const { lang } = useApp();
  const c = CONTENT[lang] || CONTENT.ar;

  return (
    <div className="hero-bg bg-grain min-h-screen" dir={c.dir} data-testid="privacy-page">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-24">
        <Link
          to="/"
          data-testid="privacy-back-home"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-400 text-sm mb-8 transition"
        >
          <ArrowLeft className={`w-4 h-4 ${c.dir === "rtl" ? "rotate-180" : ""}`} />
          {c.backHome}
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <h1
            data-testid="privacy-title"
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
            <section key={s.h} data-testid={`privacy-section-${i + 1}`}>
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
