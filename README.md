# Shelter of Hope

React (Vite + Tailwind v4) frontend · Express + MongoDB backend · Firebase Authentication/Storage.

## গুরুত্বপূর্ণ: ডেটাবেস/লগইন/আপলোড চালাতে যা অবশ্যই লাগবে

এই ZIP-এর মধ্যে MongoDB connection string, Firebase Admin service-account private key বা production backend URL নেই। এগুলো ছাড়া শুধু frontend deploy করলেই database, admin login বা upload সচল হবে না। Secret কখনো source code-এ বসাবেন না।

### 1. MongoDB + Backend API

1. `backend/.env.example` কপি করে `backend/.env` বানান।
2. MongoDB Atlas-এ database user তৈরি করে Network Access-এ backend host-এর IP অনুমোদন করুন।
3. `MONGODB_URI`-তে Atlas connection string দিন; password ও database name ঠিকভাবে বসান।
4. Firebase Console → Project settings → Service accounts থেকে private key তৈরি করুন। `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` পূরণ করুন। বিকল্পভাবে backend host-এ `FIREBASE_SERVICE_ACCOUNT_JSON` secret হিসেবে দিন। Private key কখনো frontend `.env`, GitHub বা ZIP-এ দেবেন না।
5. `FIREBASE_STORAGE_BUCKET`-এ Firebase Storage bucket-এর সঠিক নাম দিন।
6. API চালান:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
7. `http://localhost:5000/api/health` খুলুন। `ok: true`, `database: "connected"` এবং `firebaseConfigured: true` প্রত্যাশিত।

Production-এ backend-টি Render/Railway/অন্য Node.js host-এ deploy করুন। সেখানে environment variables সেট করুন এবং `CLIENT_ORIGIN`-এ frontend-এর সম্পূর্ণ origin দিন, যেমন `https://your-site.surge.sh`। একাধিক origin কমা দিয়ে আলাদা করুন।

### 2. Frontend API URL

Project root-এ `.env.example` কপি করে `.env` বানান এবং deployed backend URL বসান:
```env
VITE_API_URL=https://your-backend.example.com
```
URL-এর শেষে `/` দেবেন না। এরপর নতুন করে build/deploy করুন:
```bash
npm install
npm run build
```
`VITE_*` মান build-এর সময় frontend-এ বসে; URL পরিবর্তন করলে আবার build করতে হবে।

### 3. Firebase Google Login

Firebase Console → Authentication → Sign-in method-এ **Google** এবং **Email/Password** provider enable করুন। Authentication → Settings → **Authorized domains**-এ `localhost` এবং deployed frontend hostname যোগ করুন। Firebase project ID, `authDomain` ও hosting domain ঠিক আছে কি না যাচাই করুন। Google provider বন্ধ থাকলে বা domain অনুমোদিত না হলে কোড থেকে login সফল হবে না।

### 4. Admin account তৈরি

Backend env values সেট করার পর terminal-এ:
```bash
cd backend
ADMIN_EMAIL=your-admin@example.com ADMIN_PASSWORD='A-strong-password' npm run seed:admin
```
PowerShell-এ:
```powershell
$env:ADMIN_EMAIL="your-admin@example.com"
$env:ADMIN_PASSWORD="A-strong-password"
npm run seed:admin
```
Script Firebase account তৈরি করে (প্রয়োজন হলে) এবং MongoDB-তে ওই Firebase UID-কে `administrator` role দেয়। বিদ্যমান Firebase account-এর password এটি বদলায় না। এরপর `/admin/login`-এ সেই ইমেইল/পাসওয়ার্ড ব্যবহার করুন। শুধু Google দিয়ে প্রথমবার লগইন করলে সাধারণ `user` role হবে; admin access পেতে seed script চালাতে হবে।

### 5. Image upload

Donor image upload-এর জন্য user sign-in, backend API, Firebase Admin credentials ও Storage bucket সঠিক থাকতে হবে। `FIREBASE_STORAGE_BUCKET`-এ সঠিক bucket name দিন। Donor image upload user-authenticated; hero/missing-child media upload editor/administrator-দের জন্য সীমিত। Upload backend দিয়ে হয়, তাই client Storage rules-এ write permission খোলার দরকার নেই।

### 6. Admin dashboard

Admin routes include donor management, homepage hero/media, about content, missing children, emergency/complaint/contact submissions, staff accounts, and contact/footer settings. Staff account management ও settings শুধু administrator-দের জন্য। সব feature backend/MongoDB/Firebase সচল থাকা সাপেক্ষে কাজ করবে।

### Troubleshooting

- `/api/health` unreachable → backend deployment/URL সমস্যা।
- `database: disconnected` → `MONGODB_URI`, Atlas IP allowlist, DB user/password পরীক্ষা করুন।
- `firebaseConfigured: false` বা token errors → Firebase Admin env values পরীক্ষা করুন।
- Google `auth/unauthorized-domain` → Authorized domains-এ frontend hostname যোগ করুন।
- API 404 → frontend `.env`-এর `VITE_API_URL` পরীক্ষা করে আবার build করুন।
- Upload 500 → backend logs, Storage bucket name, Firebase service-account permissions পরীক্ষা করুন।

**Security:** `.env`, service-account JSON/private key, MongoDB URI বা admin password প্রকাশ্যে পাঠাবেন না। সাহায্যের জন্য error message/log দিন, secret values বাদ দিয়ে।
