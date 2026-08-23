# 🔑 إعداد Google Play Service Account — دليل عربي شامل

> الهدف: الحصول على ملف JSON يستخدمه الـ backend للتحقق من اشتراكات Play Store تلقائياً.

---

## 📋 المتطلبات قبل البدء

- ✅ حساب **Google Play Console** نشط (تم دفع رسوم الـ$25)
- ✅ تطبيقك مرفوع على Play Console باسم package: **`com.kateb.mobile`**
- ✅ حساب **Google Cloud** (نفس إيميل Play Console أو إيميل ثانٍ — كلاهما يعمل)

---

## 🛠️ المرحلة 1 — Google Cloud (مدتها ~5 دقائق)

### الخطوة 1.1 — أنشئ/اختر مشروع Cloud
1. ادخل: **[console.cloud.google.com](https://console.cloud.google.com)**
2. من شريط القائمة العلوي، اضغط **اختيار المشروع** (Select a project)
3. اضغط **NEW PROJECT** (مشروع جديد)
4. اسم المشروع: `Kateb` (أو أي اسم)
5. اضغط **Create** وانتظر 30 ثانية حتى يُنشأ المشروع
6. تأكد أن المشروع الجديد محدد في الشريط العلوي

### الخطوة 1.2 — فعّل Google Play Android Developer API
1. ادخل: **[console.cloud.google.com/apis/library](https://console.cloud.google.com/apis/library)**
2. ابحث عن: `Google Play Android Developer API`
3. اضغطه → اضغط **ENABLE** (تفعيل)
4. انتظر حتى تظهر صفحة Dashboard الخاصة بالـ API

### الخطوة 1.3 — أنشئ Service Account
1. ادخل: **[console.cloud.google.com/iam-admin/serviceaccounts](https://console.cloud.google.com/iam-admin/serviceaccounts)**
2. اضغط **+ CREATE SERVICE ACCOUNT** (إنشاء حساب خدمة)
3. املأ البيانات:
   - **Service account name**: `kateb-play-billing`
   - **Service account ID**: `kateb-play-billing` (تلقائي)
   - **Description**: `Verify Play Store subscriptions for Kateb app`
4. اضغط **CREATE AND CONTINUE**
5. **في الخطوة "Grant this service account access to project"** → اتركها فاضية واضغط **CONTINUE**
6. اضغط **DONE**

### الخطوة 1.4 — حمّل ملف الـ JSON 🔑
1. في قائمة Service Accounts، اضغط الحساب اللي عملته (`kateb-play-billing@...`)
2. روح لتبويب **KEYS**
3. اضغط **ADD KEY** → **Create new key**
4. اختر **JSON** → اضغط **CREATE**
5. ✅ سيتم تحميل ملف `.json` تلقائياً على جهازك
6. **افتح الملف بمحرر نصوص** ← هذا هو المحتوى اللي ستلصقه لي

⚠️ **حافظ على الملف بمكان آمن — لا ترفعه على GitHub العام أبداً**

---

## 🛠️ المرحلة 2 — Google Play Console (مدتها ~3 دقائق)

### الخطوة 2.1 — ادعُ الـ Service Account
1. ادخل: **[play.google.com/console](https://play.google.com/console)**
2. من القائمة الجانبية اليسرى: **Users and permissions** (المستخدمون والصلاحيات)
3. اضغط **Invite new users** (دعوة مستخدم جديد)
4. **Email address**: الصق الإيميل تبع الـ Service Account
   - الإيميل بصيغة: `kateb-play-billing@<project-id>.iam.gserviceaccount.com`
   - تجده داخل ملف JSON (مفتاح `client_email`)
5. **Account permissions** → فعّل الصلاحيات التالية فقط:
   - ✅ **View app information and download bulk reports (read-only)**
   - ✅ **View financial data, orders, and cancellation survey responses**
   - ✅ **Manage orders and subscriptions**
6. اضغط **Invite user** → **Save changes**

✅ بعد كم دقيقة، الـ Service Account يصبح جاهز للاستخدام.

---

## 🛠️ المرحلة 3 — أنشئ منتجات الاشتراك (إن لم تكن موجودة)

### الخطوة 3.1
1. في Play Console → **Monetize** → **Products** → **Subscriptions**
2. اضغط **Create subscription**:
   - **Product ID**: `kateb_premium_monthly`
   - Name: `كاتب Premium — شهري`
   - Description: مزايا Premium لكاتب
   - Base plan: `monthly-auto` — Billing period: **Monthly** — Price: **$5 USD**
3. كرّر للمنتج السنوي:
   - **Product ID**: `kateb_premium_yearly`
   - Base plan: `yearly-auto` — Billing period: **Yearly** — Price: **$30 USD**
4. فعّل كل منتج بـ **Activate**

---

## 🛠️ المرحلة 4 — أعطني محتوى ملف JSON

افتح ملف الـ JSON اللي حمّلته في الخطوة 1.4، والصق محتواه كاملاً في الشات. الشكل يكون هكذا:

```json
{
  "type": "service_account",
  "project_id": "kateb-xxxxx",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n",
  "client_email": "kateb-play-billing@kateb-xxxxx.iam.gserviceaccount.com",
  "client_id": "10325...",
  "auth_uri": "...",
  "token_uri": "...",
  ...
}
```

أنا حاضيفها كمتغيّر `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` في `/app/backend/.env` ثم أعيد تشغيل الـ backend.

---

## ✅ التحقق بعد الإعداد

سأشغّل التالي بعد إضافة المفتاح:

```bash
curl https://YOUR-BACKEND-DOMAIN/api/billing/google/health
```

ويجب أن يعيد:
```json
{ "configured": true, "package_name": "com.kateb.mobile" }
```

---

## 🆘 مشاكل شائعة

| المشكلة | الحل |
|---|---|
| `403 Permission Denied` عند التحقق | تأكد أن الإيميل تبع SA مدعو في Play Console + مفعّل **View financial data** |
| `API not enabled` | عد للخطوة 1.2 وفعّل Google Play Android Developer API |
| `Invalid grant` | الـ private_key في الـ JSON تالف — حمّل JSON جديد من Keys |
| لا أرى الـ SA في Play Console بعد دعوته | انتظر 5-10 دقائق ثم refresh — التزامن يأخذ وقت |

---

## 🔐 الأمان

- ❌ **لا تضع** هذا الـ JSON في الكود مباشرة
- ❌ **لا ترفع** الـ JSON على GitHub (الـ `.gitignore` يحميه عبر `*.json` في مجلد credentials)
- ✅ **خزّنه** فقط في:
  1. `backend/.env` كمتغيّر بيئة (سأضيفه لك)
  2. مدير كلمات سر آمن (1Password / Bitwarden) كنسخة احتياطية
