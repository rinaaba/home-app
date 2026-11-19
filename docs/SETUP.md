# Setup guide

Do these one at a time. Each step says where to click. Use a laptop; it's easiest.

The app starts on Firebase's **free plan**. Everything works except, most likely, the AI "clean pictures"
(your own photos are shown instead). See **Upgrade later** at the bottom when you're ready.

---

## Part A — GitHub (where the code lives) ✅ done

1. Create the repository `home-app` (public) on github.com.
2. Connect GitHub to Claude at https://claude.ai/connect-github.
3. Install the Claude GitHub app on `home-app`. Claude uploads the code.

---

## Part B — Firebase (free plan)

### Step 4. Create a Firebase project ✅
console.firebase.google.com → **Create a project** → name it → Analytics **off** → **Create project**.

### Step 5. Turn on Google sign-in
1. Left menu: **Build → Authentication → Get started**.
2. Under **Sign-in method**, click **Google**, switch **Enable** on, pick your email as the support email, **Save**.

### Step 6. Register the web app and copy its settings
1. Click the **gear icon** (top left, next to "Project overview") → **Project settings**.
2. Scroll to **Your apps** and click the **`</>`** (web) icon.
3. Nickname: `home-app`. Leave "Firebase Hosting" **unchecked**. Click **Register app**.
4. You'll see code with `const firebaseConfig = { apiKey: "...", authDomain: "...", ... }`.
   **Keep this tab open** — you'll paste these values in Step 10.

### Step 7. Create the database
1. Left menu: **Build → Firestore Database → Create database**.
2. Location: **eur3 (Europe)** — closest to Israel and Greece. (Can't be changed later.)
3. Choose **Start in production mode** → **Create**.
4. Open the **Rules** tab. Delete everything, paste the contents of [`firestore.rules`](../firestore.rules), click **Publish**.
5. Open the **Data** tab and create the family list:
   - **+ Start collection** → Collection ID `config` → **Next**
   - Document ID: `access`
   - Field `emails`, type **array**, with two **string** values: your Gmail and Or's Gmail, **all lowercase**
   - **Save**

   ➜ Only emails on this list can open the app.

### Step 8. Turn on the AI
1. Left menu: **Build → AI Logic** (sometimes under "AI") → **Get started**.
2. Choose **Gemini Developer API** and follow the prompts. Skip any "add the SDK" instructions — it's already in the code.

Note: on the free plan, Google may use what's sent to the AI (your item photos) to improve its products.
On the paid plan it doesn't.

---

## Part C — Put the website online

### Step 9. Turn on GitHub Pages
github.com/rinaaba/home-app → **Settings → Pages** → under **Source**, choose **GitHub Actions**.

### Step 10. Paste your Firebase settings
1. In the repository, open `src/core/firebase/config.ts` and click the **pencil icon** (Edit).
2. Replace each `PASTE_...` with the matching value from Step 6 (keep the quotes).
3. **Commit changes** → **Commit changes**.
4. Open the **Actions** tab and wait for a green check (1–2 minutes).
   The app is then at **https://rinaaba.github.io/home-app/**

### Step 11. Allow sign-in from the website
Firebase → **Authentication → Settings → Authorized domains → Add domain** → `rinaaba.github.io` → **Add**.

Open the website and sign in. The three homes are created automatically.

### Step 12. Install on your devices
- **Android phone or wall tablet (Chrome):** menu **⋮** → **Install app** (or **Add to home screen**).
- **iPhone (Safari):** **Share** → **Add to Home Screen**.
- **Laptop (Chrome/Edge):** the install icon in the address bar.
- Wall tablet: in Android **Settings → Display**, set a long screen timeout.

---

## Upgrade later (pay-as-you-go "Blaze" plan)

Do this when you've decided the app is worth keeping. It unlocks AI clean pictures, full-size photos,
and keeps your photos out of Google's AI training. Expected cost: about 4 US cents per AI picture,
pennies per month for storage.

1. **Upgrade:** bottom-left **Spark → Upgrade → Blaze**, add a billing account, set a **$5 budget alert**.
2. **Photo storage:** **Build → Storage → Get started** → production mode → **Done**.
   Then **Rules** tab → paste [`storage.rules`](../storage.rules) → **Publish**
   (if asked to let Storage access Firestore, click **Allow**).
3. **Switch the app to it:** in `src/core/firebase/config.ts` change `photoStorage` from `'database'` to `'storage'` and commit.
   Photos you already added keep working.
4. **Allow "Make a new clean image"** for photos in Storage: open console.cloud.google.com (your project selected),
   click the Cloud Shell icon `>_`, and paste (replace `YOUR-BUCKET` with `storageBucket` from Step 6):
   ```
   echo '[{"origin":["*"],"method":["GET"],"maxAgeSeconds":3600}]' > cors.json && gcloud storage buckets update gs://YOUR-BUCKET --cors-file=cors.json
   ```
5. For items added on the free plan, open each one and tap **Make clean image**.

### Optional: protect the AI quota (App Check)
Ask Claude to walk you through it when you're ready.
