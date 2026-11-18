# Setup guide

Do these one at a time. Each step says exactly where to click. It takes about 30–45 minutes in total.
You'll need a computer (a laptop is easiest) and your Google account.

---

## Part A — Firebase (login, database, photos, AI)

### Step 1. Create a Firebase project
1. Go to **https://console.firebase.google.com** and sign in with your Google account.
2. Click **Create a project** (or **Add project**).
3. Name it, for example `our-home`. Click **Continue**.
4. When asked about Google Analytics, turn it **off** (not needed). Click **Create project**, then **Continue**.

### Step 2. Switch to the pay-as-you-go plan (Blaze)
Photo storage and AI image generation need this plan. For a family app the cost is very small
(roughly 4 US cents per generated item picture, storage is pennies per month), but a card is required.
1. In the bottom-left corner, click **Spark plan → Upgrade**, choose **Blaze**, and add a billing account.
2. When it offers a **budget alert**, set it to **$5**. You'll get an email if spending ever gets near that.

### Step 3. Turn on Google sign-in
1. Left menu: **Build → Authentication → Get started**.
2. Under **Sign-in method**, click **Google**, switch **Enable** on, pick your email as the support email, **Save**.

### Step 4. Register the web app and copy its settings
1. Click the **gear icon** (top left, next to "Project overview") → **Project settings**.
2. Scroll to **Your apps** and click the **`</>`** (web) icon.
3. Nickname: `home-app`. Leave "Firebase Hosting" **unchecked**. Click **Register app**.
4. You'll see a block of code with `const firebaseConfig = { apiKey: ..., authDomain: ... }`.
   **Keep this tab open** — you'll paste these values in Part B.

### Step 5. Create the database
1. Left menu: **Build → Firestore Database → Create database**.
2. Location: pick **eur3 (Europe)** — closest to Israel and Greece. (This can't be changed later.)
3. Choose **Start in production mode** → **Create**.
4. Open the **Rules** tab. Delete everything there, paste the contents of the file
   [`firestore.rules`](../firestore.rules) from this project, and click **Publish**.
5. Open the **Data** tab and create the family list:
   - Click **+ Start collection**. Collection ID: `config` → **Next**.
   - Document ID: `access`
   - Field: `emails`, Type: **array**
   - Add two values (type **string**): your Gmail address and Or's Gmail address, **all lowercase**.
   - Click **Save**.

   ➜ Only emails on this list can open the app. To add someone later, add their email here.

### Step 6. Turn on photo storage
1. Left menu: **Build → Storage → Get started**.
2. Choose **Start in production mode**, keep the suggested location, **Done**.
3. Open the **Rules** tab, replace everything with the contents of [`storage.rules`](../storage.rules), click **Publish**.
4. If it asks to **allow Storage to access Firestore** (needed to check the family list), click **Grant / Allow**.

### Step 7. Turn on the AI
1. Left menu: **Build → AI Logic** (may be under "AI") → **Get started**.
2. Choose **Gemini Developer API** and follow the prompts to enable it.
3. When it asks about adding the SDK to your app, you can skip it — it's already in the code.

---

## Part B — GitHub (where the code lives and the website is hosted)

### Step 8. Create the GitHub repository
1. Go to **https://github.com** and sign in (or create a free account).
2. Click **+** (top right) → **New repository**.
3. Name: `home-app`. Set it to **Public** (free GitHub Pages needs public; your data stays private in Firebase).
4. Don't add a README. Click **Create repository**.
5. Tell Claude the repository name (for example `your-username/home-app`) and it will upload the code.

### Step 9. Paste your Firebase settings
1. In your repository on github.com, open `src/core/firebase/config.ts`.
2. Click the **pencil icon** (Edit).
3. Replace each `PASTE_...` value with the matching value from Step 4 (keep the quotes).
4. Click **Commit changes** → **Commit changes**.

### Step 10. Turn on the website
1. In the repository: **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Go to the **Actions** tab. You should see "Deploy to GitHub Pages" running. When it shows a green check (1–2 minutes),
   your app is live at **https://YOUR-USERNAME.github.io/home-app/**
   (if it didn't start, click the workflow → **Run workflow**).

### Step 11. Allow sign-in from your website
1. Back in Firebase: **Authentication → Settings → Authorized domains → Add domain**.
2. Add `YOUR-USERNAME.github.io` (no `https://`, no `/home-app`). **Add**.

Open the website and sign in. 🎉 The three homes are created automatically the first time.

---

## Part C — Finishing touches

### Step 12. Allow "Make a new clean image" (one copy-paste)
Regenerating a picture later needs the browser to read the stored photo. This one-time setting allows it.
1. Open **https://console.cloud.google.com**, make sure your Firebase project is selected at the top.
2. Click the **Cloud Shell** icon (`>_`, top right). A terminal opens at the bottom.
3. Paste this, replacing `YOUR-BUCKET` with the `storageBucket` value from Step 4 (e.g. `our-home.firebasestorage.app`), and press Enter:
   ```
   echo '[{"origin":["*"],"method":["GET"],"maxAgeSeconds":3600}]' > cors.json && gcloud storage buckets update gs://YOUR-BUCKET --cors-file=cors.json
   ```

### Step 13. Install on your devices
- **Android phone or the wall tablet (Chrome):** open the website → menu **⋮** → **Install app** (or **Add to home screen**).
- **iPhone (Safari):** open the website → **Share** → **Add to Home Screen**.
- **Laptop (Chrome/Edge):** click the install icon in the address bar.
- Wall tablet tip: in Android **Settings → Display**, set a long screen timeout, or use a "keep screen on" app.

### Optional later: protect the AI quota (App Check)
Right now anyone who finds the website could, in theory, send AI requests that count against your quota
(they still can't see or change your data). Your $5 budget alert covers this risk for now. Ask Claude to walk you through turning on App Check when you're ready.
