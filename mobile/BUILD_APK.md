# 📦 بناء ملف APK — خطوة بخطوة (≤ 25 دقيقة)

> هذه طريقة بناء APK جاهز للتثبيت على هاتف Android.
> البناء يحدث على **خوادم EAS السحابية المجانية** (لا تحتاج أي SDK محلي).

---

## ✅ المتطلبات (مرة واحدة فقط)

1. **حساب Expo مجاني** → [expo.dev/signup](https://expo.dev/signup)
2. **Node.js 18+** على جهازك → [nodejs.org](https://nodejs.org)
3. **EAS CLI** → ثبّته عبر:
   ```bash
   npm install -g eas-cli
   ```

---

## 🚀 خطوات البناء (نسخ ولصق)

```bash
# 1) ادخل مجلد التطبيق
cd /app/mobile

# 2) ثبّت المكتبات
npm install

# 3) سجّل دخول EAS بإيميل/كلمة سر Expo
eas login

# 4) اربط المشروع بـ EAS (أول مرة فقط)
eas init --non-interactive --force

# 5) ابدأ بناء APK (preview profile) — يستغرق ~15-25 دقيقة
eas build --platform android --profile preview --non-interactive

# 6) بعد انتهاء البناء، EAS رح يطبع رابط تحميل ملف .apk
#    اضغط الرابط من المتصفح أو حمّله مباشرة على هاتفك:
#    https://expo.dev/accounts/[your-username]/projects/kateb-mobile/builds
```

---

## 📲 تثبيت APK على هاتفك

1. حمّل ملف `.apk` على هاتفك (واتساب/إيميل/Drive).
2. اضغط الملف → اسمح بـ "تثبيت من مصادر غير معروفة".
3. التطبيق يفتح بشعار "كاتب" الذهبي + قائمة Tabs السفلية + زر تسجيل الدخول بأعلى اليمين 🎉

---

## ⚠️ ملاحظات مهمة

- **هذا APK للاختبار فقط** — للنشر على Google Play استخدم profile `production`:
  ```bash
  eas build --platform android --profile production
  ```
  هذا يولّد ملف `.aab` بدلاً من `.apk` (متطلّب Google Play).
- **AdMob ID** الحالي حقيقي (`ca-app-pub-1908291820966789~...`) — في النسخة الـ Dev تظهر إعلانات اختبار.
- إذا فشل البناء، شغّل:
  ```bash
  eas build --platform android --profile preview --clear-cache
  ```

---

## 🆘 مشاكل شائعة

| المشكلة | الحل |
|---|---|
| `eas: command not found` | `npm install -g eas-cli` |
| `Project not configured` | `eas init` ثم أعد المحاولة |
| `Keystore prompt` | اضغط **Y** ليولّد EAS keystore جديد ويحفظه على حسابك |
| `Build queued for too long` | الحساب المجاني يدخل طابور — انتظر أو ترقّى لـ priority |

---

✅ **بعد ما ينجح البناء، ارجعلي بالـ link وأنا أتأكد إنه شغّال.**
