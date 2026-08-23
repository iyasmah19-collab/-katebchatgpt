# 📱 دليل تشغيل ونشر تطبيق كاتب على Google Play

> هذا دليل عملي خطوة بخطوة — كل ما عليك فعله بالترتيب.

---

## ✅ ما تم بناؤه

**تطبيق Android كامل بكل الميزات** (نفس الموقع):

| الميزة | الوصف |
|---|---|
| 🎯 مولّد المحتوى | 6 أنواع × 5 أساليب × 4 لهجات |
| ⚡ مولّد الهوكس | 9 أنواع، 5 مجاناً / 15 Premium |
| 🔐 خزنة الأسرار | 50 سر لكل منصة، تدوير أسبوعي |
| 💎 Premium PayPal | $5/شهر، $30/سنة (PayPal NCP) |
| 👤 حساب المستخدم | تسجيل، دخول، Owner unlock |
| 📺 إعلانات AdMob | تُعرض للمجانيين، تختفي للمشتركين |
| 🌍 RTL عربي | محسّن للقراءة من اليمين |

---

## 🛠️ المرحلة 1: التشغيل على جهازك (15 دقيقة)

### المتطلبات
- Node.js 18+ — حمّله من https://nodejs.org
- هاتف Android (للاختبار) — حمّل تطبيق **Expo Go** من Play Store

### الخطوات

```bash
# 1. نزّل المجلد /app/mobile لجهازك (مثلاً من Emergent → Code → Download)

# 2. افتح Terminal في مجلد mobile
cd mobile

# 3. ثبّت المكتبات
npm install

# 4. شغّل التطبيق
npx expo start
```

سيظهر **QR Code** في الـ Terminal:
- 📲 **افتح Expo Go على هاتفك** → امسح الـ QR
- التطبيق يفتح فوراً على هاتفك ✓

---

## 💰 المرحلة 2: إعداد AdMob (لجلب المال)

### الخطوة 2.1: حساب AdMob
1. ادخل: **https://admob.google.com**
2. اضغط "Sign Up" → استخدم حساب Google
3. اقبل الشروط، اختر بلد الدفع (الأردن/السعودية/إلخ)

### الخطوة 2.2: ربط حساب بنك (للحصول على المال)
1. **Payments → Payment methods → Add**
2. أضف **بطاقة بنكية** أو **حساب IBAN**
3. لازم يكون متطابق مع اسم صاحب حساب AdMob

### الخطوة 2.3: أضف تطبيقك
1. **Apps → Add App**
2. Platform: **Android**
3. هل التطبيق منشور على Play Store؟ **No**
4. اسم التطبيق: **كاتب — Kateb**
5. ✅ تحصل على **App ID** بشكل:
   ```
   ca-app-pub-1234567890123456~1234567890
   ```
   انسخه واحفظه.

### الخطوة 2.4: أنشئ إعلان Banner
1. اضغط على التطبيق → **Ad units → Add ad unit**
2. اختر **Banner**
3. اسم الإعلان: `Main Banner`
4. ✅ تحصل على **Ad Unit ID** بشكل:
   ```
   ca-app-pub-1234567890123456/9876543210
   ```
   انسخه واحفظه.

### الخطوة 2.5: ضع الـ IDs في الكود

**في `/app/mobile/app.json`** — السطر 26:
```json
"androidAppId": "ضع App ID هنا (ca-app-pub-...~...)"
```

**في `/app/mobile/src/components/AdBanner.js`** — السطر 21:
```js
: "ضع Ad Unit ID هنا (ca-app-pub-.../...)"
```

⚠️ **مهم:** الـ IDs الحالية اختبار من Google — تعرض إعلانات اختبار **بدون أي ربح**.

---

## 🏗️ المرحلة 3: بناء ملف APK (للاختبار)

### الخطوة 3.1: حساب Expo
1. ادخل: **https://expo.dev** → Sign up مجاناً
2. ثبّت EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

### الخطوة 3.2: سجّل دخول من Terminal
```bash
cd mobile
eas login
# أدخل إيميل وكلمة سر Expo
```

### الخطوة 3.3: بناء APK تجريبي
```bash
eas build:configure
eas build --platform android --profile preview
```

- يأخذ **15-25 دقيقة** (Expo cloud build)
- في النهاية تحصل على **رابط لتنزيل ملف .apk**
- ثبّته على هاتفك يدوياً للاختبار

---

## 📤 المرحلة 4: النشر على Google Play

### الخطوة 4.1: حساب Google Play Developer ($25 لمرة واحدة)
1. ادخل: **https://play.google.com/console**
2. اضغط "Get Started"
3. ادفع **$25** بـ Visa/MasterCard
4. أكمل بياناتك (مهم: استخدم اسمك الحقيقي + ID)
5. انتظر 1-3 أيام لتفعيل الحساب

### الخطوة 4.2: بناء AAB للنشر
```bash
cd mobile
eas build --platform android --profile production
```
تحصل على ملف **`.aab`** (Android App Bundle).

### الخطوة 4.3: أنشئ التطبيق في Play Console
1. **Create app**
2. App name: **كاتب**
3. Default language: **العربية**
4. App or game: **App**
5. Free or paid: **Free**

### الخطوة 4.4: أكمل بيانات Store Listing
- **Short description** (80 حرف): "أداة AI لكتابة المحتوى العربي بالكابشنات والهوكس وأسرار الخوارزمية"
- **Full description**: استخدم نسخة موسّعة بـ500-1000 حرف
- **App icon** (512×512): استخرج من المحاكي أو صمّمها
- **Feature graphic** (1024×500): صورة ترويجية
- **Screenshots**: 4-8 صور من التطبيق
- **Privacy policy URL**: لازم تنشر سياسة خصوصية (مولّد جاهز: https://app-privacy-policy-generator.firebaseapp.com)

### الخطوة 4.5: Content Rating
- أكمل الاستبيان (محتوى عام، لا يحتوي عنف)
- النتيجة المتوقعة: **Everyone (3+)**

### الخطوة 4.6: ارفع الـ AAB
1. **Release → Production → Create new release**
2. Upload ملف `.aab`
3. Release notes (عربي): "الإصدار الأول 🎉"
4. **Review release → Start rollout to Production**

### الخطوة 4.7: انتظر مراجعة Google
- مدة المراجعة: **1-7 أيام**
- بعد الموافقة: التطبيق **حي على Google Play** للعالم كله

---

## 💰 كم تجلب لك إعلانات AdMob من المال؟

| المؤشر | المعدل |
|---|---|
| CPM (كل 1000 مشاهدة) | $0.50 - $2.00 |
| CPC (كل ضغطة) | $0.01 - $0.30 |
| 10,000 مستخدم/شهر | ~$50-300 |
| 100,000 مستخدم/شهر | ~$500-3000 |

**العوامل اللي تزيد الدخل:**
- مستخدمين من دول الخليج/أمريكا/أوروبا (CPM أعلى)
- إعلانات Interstitial (ملء الشاشة) — يمكن إضافتها لاحقاً
- محتوى متجدد يخلي المستخدمين يرجعون يومياً

---

## 🎯 قائمة تحقّق نهائية قبل النشر

- [ ] استبدلت Test IDs بـ AdMob IDs الحقيقية
- [ ] حسابي AdMob متّصل بحساب بنك
- [ ] حسابي Google Play Developer مفعّل
- [ ] جرّبت التطبيق على هاتف حقيقي (ليس محاكي فقط)
- [ ] صمّمت أيقونة + screenshots احترافية
- [ ] كتبت سياسة خصوصية ورفعتها على رابط
- [ ] PayPal subscription يفتح بشكل صحيح
- [ ] تسجيل الدخول والمحتوى يولّد بسلاسة

---

## 🚨 إذا واجهت مشكلة

| المشكلة | الحل |
|---|---|
| Expo Go ما يفتح | تأكد أن الهاتف والـ PC على نفس الـ WiFi |
| Build fails | جرّب `eas build --clear-cache` |
| الإعلانات ما تظهر | تأكد أن Test ID موجود + ثبّت `react-native-google-mobile-ads@latest` |
| API ما يشتغل | تأكد من `EXPO_PUBLIC_BACKEND_URL` في `.env` |
| Google Play يرفض | راجع رسالتهم بالضبط — عادة Privacy Policy أو Content Rating |

---

## 📞 احتجت مساعدة؟

ارجع لي بأي خطوة محددة وأشرحها لك تفصيلياً. كل الكود جاهز ومُختبر.

**التطبيق ينتظر إعداد AdMob فقط ثم بناء الـ APK!**
