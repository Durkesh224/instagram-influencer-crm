# LLM Conversations & Development Log

## 🤖 LLM Details
- **Model Used**: Gemini 3.6 Flash (Antigravity Senior Full-Stack Developer Agent)
- **Role**: Senior Pair Programming & Architecture Guidance

---

## 🎯 Key Architectural Decisions

1. **Stack Selection**:
   - Switched from Node/Express + plain HTML to **Java 17+ Spring Boot 3** for backend and **React 18 + Vite** for frontend CRM dashboard per user customization request.
   - Used **H2 Database** file storage (`./database/crmdb`) for zero-configuration, instant execution, and automatic JPA schema updates.

2. **Chrome Extension Design (Manifest V3)**:
   - Built a lightweight content script using DOM extraction with multiple fallback strategies for Instagram headers, follower counts, and bios.
   - Enforced single-page application (SPA) route monitoring using a periodic URL watcher so the widget dynamically re-injects when navigating between Instagram profiles.

3. **User Flow & Duplicate Prevention**:
   - Unique constraints on Instagram `@username` at database level with `409 Conflict` HTTP status code.
   - Responsive status updates on floating button: `+ Add to CRM` → `Saving...` → `✓ Influencer added to CRM` / `Already in CRM`.

---

## 📝 Important Prompts Log

```markdown
### Initial Requirement Prompt
Build a simple, clean, and attractive Google Chrome Extension for an Influencer Marketing CRM on Instagram profile pages.
Stack requested: Manifest V3 Extension, Spring Boot Backend, React CRM Dashboard, H2/SQLite Database.

### Development & Customization Prompts
- "front end if possible use react and proceed"
- "for backend use springboot"
```

---

## 🛠️ Debugging & Improvements Made

- **Instagram DOM Variations**: Added multiple selector fallbacks (header tags, meta description parsing, list item text parsing) so profile data capture doesn't break if Instagram changes class names.
- **CORS Configuration**: Enabled `@CrossOrigin(origins = "*")` on Spring Boot REST Controllers to allow fetch requests from Chrome Extension context and React Vite Dev Server (`http://localhost:5173`).
- **Follower Count Formatting & Sorting**: Added custom parser for `K`, `M`, `B` follower notation to enable numerical sorting by "Most Followers" in the React Dashboard.
