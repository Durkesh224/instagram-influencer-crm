# Influencer Marketing CRM Chrome Extension

A simple, clean, and modern full-stack CRM solution to discover, capture, and manage Instagram Influencer profiles in one click.

---

## 🌟 Features

- **Automated Instagram Profile Detection**: Automatically identifies Instagram user profiles (`instagram.com/<username>/`).
- **DOM Extraction**: Captures Name, Username, Profile URL, Bio, Followers count, Following count, Posts count, and Profile Picture URL without complex scrapers.
- **Seamless Floating Widget**: Injects a minimal "+ Add to CRM" floating button directly on Instagram profile pages with real-time feedback (`Saving...`, `✓ Influencer added to CRM`, `Already in CRM`).
- **Chrome Extension Popup**: Quick preview card in the browser toolbar for active Instagram profiles.
- **Java Spring Boot Backend**: High-performance RESTful service with JPA persistence and CORS support.
- **Zero-Setup Database**: Embedded/File-backed H2 database with automatic schema generation and H2 console management.
- **React CRM Dashboard**: Modern SaaS UI built with React 18, Vite, and Lucide icons featuring:
  - 3 Statistic Cards (Total Influencers, Total Followers, Recently Added).
  - Search box (filter by name or @username).
  - Sorting (Newest, Oldest, Most Followers).
  - Tag Pills Filter (`Potential`, `Contacted`, `Interested`, `Collaboration`).
  - Inline/Modal Tag & Notes Editor.
  - Delete action with instant sync.
- **Duplicate Prevention**: Enforces unique constraints on Instagram usernames.

---

## 🛠️ Tech Stack

- **Chrome Extension**: Manifest V3, HTML5, CSS3, JavaScript (ES6+).
- **Backend**: Java 17+, Spring Boot 3, Spring Data JPA, Spring Web, Maven.
- **Database**: H2 Database (File-stored at `./database/crmdb`).
- **Frontend Dashboard**: React 18, Vite, CSS Modules / Custom Design Tokens, Lucide Icons.

---

## 📁 Project Structure

```
influencer-crm/
│
├── extension/                 # Manifest V3 Chrome Extension
│   ├── manifest.json
│   ├── content.js             # Instagram DOM reader & floating widget
│   ├── background.js          # Service worker
│   ├── popup.html             # Toolbar popover markup
│   ├── popup.css
│   ├── popup.js               # Popover logic
│   └── icons/                 # Extension icons
│
├── server/                    # Java Spring Boot Backend
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/crm/influencer/
│       │   ├── InfluencerCrmApplication.java
│       │   ├── controller/InfluencerController.java
│       │   ├── model/Influencer.java
│       │   └── repository/InfluencerRepository.java
│       └── resources/
│           └── application.properties
│
├── dashboard/                 # React CRM Web Dashboard
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── index.css
│
├── README.md
└── LLM_CONVERSATIONS.md
```

---

## 🚀 Quick Setup & Running Guide

### 1. Start the Spring Boot Backend
```bash
cd server
mvn spring-boot:run
```
*Backend runs on `http://localhost:8080`*
*H2 Database Web Console available at `http://localhost:8080/h2-console`*

### 2. Start the React CRM Dashboard
```bash
cd dashboard
npm install
npm run dev
```
*Dashboard runs on `http://localhost:5173`*

### 3. Load Chrome Extension in Chrome Browser
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `extension/` folder from this repository.

---

## 🔄 How It Works

```
┌─────────────────────────────┐
│   Instagram Profile Page    │
└──────────────┬──────────────┘
               │ (DOM inspection & event listeners)
               ▼
┌─────────────────────────────┐
│ Chrome Extension (content)  │ ──► [ "+ Add to CRM" Button ]
└──────────────┬──────────────┘
               │ (HTTP POST JSON payload)
               ▼
┌─────────────────────────────┐
│  Spring Boot Backend        │ ──► [ H2 Database Storage ]
└──────────────┬──────────────┘
               │ (REST APIs)
               ▼
┌─────────────────────────────┐
│ React CRM Web Dashboard     │
└─────────────────────────────┘
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/influencers` | Add a new influencer (Returns 409 if duplicate) |
| `GET` | `/api/influencers` | List all influencers (supports `?search=` and `?sort=`) |
| `GET` | `/api/influencers/{id}` | Get single influencer details |
| `PUT` | `/api/influencers/{id}` | Update influencer tag or campaign notes |
| `DELETE` | `/api/influencers/{id}` | Delete influencer from CRM |
| `GET` | `/api/stats` | Fetch aggregate stats (Total count, total followers, recent) |

---

## 🎬 2-Minute Demo Workflow

1. Start Spring Boot (`mvn spring-boot:run`) and React (`npm run dev`).
2. Open Chrome and visit an Instagram profile (e.g. `https://www.instagram.com/cristiano/`).
3. Observe the floating **"+ Add to CRM"** widget on the bottom right.
4. Click **"+ Add to CRM"** -> Button shows **"Saving..."** then changes to **"✓ Influencer added to CRM"**.
5. Click **"+ Add to CRM"** again -> Button gracefully shows **"Already in CRM"**.
6. Open the React CRM Dashboard at `http://localhost:5173`.
7. Notice stats update immediately and the newly added influencer appears in the table.
8. Filter by status tags or search by name. Edit campaign notes or update status to **"Collaboration"**.

---

## ⚠️ Limitations

- The extension relies on publicly visible Instagram profile elements via DOM inspection. If Instagram updates its structural HTML class names, fallback selectors are used to prevent breaking the application.
