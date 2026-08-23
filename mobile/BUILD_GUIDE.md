# 🚀 EAS Build — دليل النشر على Google Play

## ✅ ما تم تجهيزه

- ✅ `assets/icon.png` (1024×1024) — أيقونة "كاتب" الذهبية
- ✅ `assets/adaptive-icon.png` (1024×1024) — أيقونة Android Adaptive مع padding آمن
- ✅ `assets/splash.png` (1408×3040) — شاشة البداية
- ✅ `assets/favicon.png` + `assets/notification-icon.png`
- ✅ `app.json` — AdMob App ID حقيقي، versionCode=1، scheme="kateb"
- ✅ `eas.json` — 3 profiles (development / preview / production) مع EXPO_PUBLIC_BACKEND_URL
- ✅ `.env` — متغيرات البيئة
- ✅ `AdBanner.js` — Banner Unit ID حقيقي للأندرويد

---

## 📋 خطوات البناء (شغّلها أنت من جهازك)

### 1) ثبّت EAS CLI (أول مرة بس)

```bash
npm install -g eas-cli
```

### 2) سجّل دخول إلى Expo

```bash
eas login
```
أدخل username/password تبع حسابك على [expo.dev](https://expo.dev) (مجاني — أنشئ حساب إذا ما عندك).

### 3) ادخل مجلد التطبيق وثبّت الـ dependencies

```bash
cd mobile
npm install
```

### 4) اربط المشروع بـ EAS (أول مرة بس)

```bash
eas init
```
هذا الأمر رح:
- ينشئ EAS project جديد على حسابك
- يستبدل `REPLACE_WITH_YOUR_EAS_PROJECT_ID` في `app.json` بالـ projectId الحقيقي
- يسأل عن owner — اختر حسابك

### 5) (اختياري) أنشئ Preview APK أولاً للاختبار

```bash
eas build -p android --profile preview
```
هذا بيولّد ملف `.apk` تقدر تنزّله مباشرة على هاتفك للاختبار قبل النشر.
يستغرق **15-25 دقيقة**.

### 6) أنشئ Production AAB للـ Play Store

```bash
eas build -p android --profile production
```

أول مرة EAS رح يسألك:
> `Generate a new Android Keystore? (Y/n)`

**اضغط Y** — رح يولّد keystore تلقائياً ويحفظه على حسابك (لا تفقده! هذا مفتاح توقيع تطبيقك للأبد).

يستغرق **15-25 دقيقة**. بعد الانتهاء، تحصل على رابط تحميل ملف `.aab`.

### 7) احفظ معلومات الـ Keystore (مهم جداً)

```bash
eas credentials -p android
```
- اختر `production`
- اختر "Keystore: Manage everything needed to build your project"
- اختر "Download credentials" — احفظ ملف الـ keystore ومعلوماته في مكان آمن
- **هون رح تشوف SHA-1 fingerprint** — احفظه! (تحتاجه لـ Google Sign-In لاحقاً)

---

## 📤 رفع AAB على Google Play

### 1) أنشئ حساب Google Play Developer
- ادخل [play.google.com/console](https://play.google.com/console)
- ادفع **$25 رسوم تسجيل** (مرة واحدة فقط)
- أكمل بياناتك

### 2) أنشئ تطبيق جديد
- اضغط "Create app"
- App name: **كاتب**
- Default language: **Arabic**
- App or game: **App**
- Free or paid: **Free**
- وافق على الشروط

### 3) املأ المعلومات الأساسية
- **Privacy Policy URL** ⚠️ مطلوب
- **App access** — إذا فيه login، حدّد بيانات حساب test
- **Ads** — نعم، التطبيق يحتوي إعلانات
- **Content rating** — املأ الاستبيان
- **Target audience** — اختر الفئة العمرية
- **Data safety** — وضّح أي بيانات تجمعها

### 4) ارفع AAB
- في Release → Production → Create new release
- ارفع ملف `.aab` اللي حملته من EAS
- اكتب release notes:
  ```
  الإصدار 1.0.0
  • مولّد محتوى ذكي بالعربية
  • مولّد هوكس قوية للتسويق
  • خزنة الأسرار — 50 سر لكل منصة
  • دعم RTL كامل
  ```
- اضغط Save → Review → Start rollout

⏱️ **مراجعة Google**: عادةً 1-7 أيام للإصدار الأول.

---

## 🔐 إضافة Google Sign-In (Build #2)

بعد ما تطلع SHA-1 من الخطوة 7 أعلاه:

1. ادخل [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create OAuth Client ID → **Android**:
   - Package name: `com.kateb.mobile`
   - SHA-1: الصق الـ SHA-1 من EAS
3. احفظ Android Client ID
4. ارجعلي وأنا بضيف Google Sign-In للكود
5. اعمل `eas build -p android --profile production` تاني → versionCode رح يزيد تلقائياً (autoIncrement)
6. ارفع AAB الجديد لـ Play Store

---

## ⚠️ ملاحظات مهمة

- **EXPO_PUBLIC_BACKEND_URL** الحالي يشير لـ preview URL. إذا نشرت backend على domain ثابت، حدّث القيمة في `eas.json` و `.env` ثم ابن مرة ثانية.
- **AdMob لـ iOS** ما زال يستخدم Test ID. إذا بدك تنشر على App Store، أنشئ iOS Banner Unit وحدّث `AdBanner.js`.
- **لا تشارك ملف keystore أبداً** — إذا فقدته ما تقدر تحدّث التطبيق على Play Store أبداً.

---

## 🆘 مشاكل شائعة

| المشكلة | الحل |
|---|---|
| `eas: command not found` | `npm install -g eas-cli` |
| `Build failed: keystore` | شغّل `eas credentials` وأعد إنشاء keystore |
| `versionCode already used` | EAS رح يزيده تلقائياً مع `autoIncrement: true` |
| `Module not found: expo-auth-session` | شغّل `npm install` داخل `mobile/` |
| `Google Play rejected: target SDK` | حدّث `expo` لأحدث إصدار: `npx expo install --fix` |

🎉 **بالتوفيق! إذا تعلّقت بأي خطوة قلّي والحلّها لك.**
