# 🪢 RakhiVerse — Virtual Raksha Bandhan Celebration Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Deploy with Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?style=flat&logo=netlify&logoColor=white)](https://www.netlify.com)

**RakhiVerse** is a modern, interactive, and festive web experience designed to celebrate the sacred bond of **Raksha Bandhan** across any distance. Create personalized avatars, perform interactive virtual ceremonies, generate keepsake certificates of bond, and immerse in festive music, golden dust particles, and floral confetti.

---

## ✨ Key Features

### 🎨 1. AI Avatar Generator
- **Customizable Looks**: Choose skin tones, festive outfits (Sherwani, Kurta, Traditional Attire), hairstyles, and accessories (Turbans, Royal Dupattas, Glasses).
- **Personality Badges**: Select distinct traits (e.g., *Protective Brother*, *Secret Keeper*, *Partner-in-Crime*).
- **Instant Generation**: Real-time canvas rendering with personalized preview cards.

### 🪔 2. Interactive 4-Step Virtual Ceremony (Pooja Thali)
Experience the sacred ritual step-by-step with interactive gestures and celebratory sound effects:
1. **🪔 Deep Aarti**: Rotate the sacred brass Diya around brother's avatar to invoke blessings.
2. **🔴 Sacred Tilak**: Apply red kumkum and auspicious Akshat (rice grains) on the forehead.
3. **🪢 Tie Sacred Rakhi**: Drag & tie the decorative rakhi thread onto the brother's wrist.
4. **🍬 Feed Festive Sweets (Mithai)**: Feed delicious Laddoos / Kaju Katli with celebratory blessings and shower of rose petals!

### 📜 3. Lifetime Bond Certificate
- Generate personalized high-resolution **"Best Brother & Sister Bond of Protection"** certificates.
- Features gold-foil seals, custom sister & brother names, issue date, and decorative borders.
- One-click instant **PNG download** and social sharing.

### 🎵 4. Immersive Audio & Ambient Effects
- **Festive Soundtrack**: Seamless background music with a dedicated volume/mute controller.
- **Audio FX**: Realistic bell chimes, Aarti sounds, and celebration horns.
- **Visual FX**: Real-time golden dust starfield and physics-driven marigold/rose petal confetti.

### 🛡️ 5. Admin Intelligence Center & Telemetry
- Protected by security password gate (`rakshyabandhan`).
- Live telemetry dashboard tracking avatar generation metrics, ceremony completions, and system diagnostics.
- Local storage state management with real-time event logs.

---

## 🛠️ Technology Stack

- **Frontend**: Pure Semantic HTML5 & Modern Vanilla CSS3
- **Design System**: Rich Glassmorphism, Festive Gold & Kumkum color palette, Keyframe micro-animations
- **Logic**: Modular Vanilla JavaScript (ES6+ Classes & Event-Driven Architecture)
- **Canvas APIs**: Dual-canvas engine for ambient golden particles and celebration petal bursts
- **Audio Engine**: Web Audio API with synchronized sound effects and background music
- **Hosting / Deployment**: Zero-dependency static site, pre-configured for Netlify (`netlify.toml`, `_redirects`) & GitHub Pages

---

## 🚀 Getting Started

### Prerequisites
RakhiVerse is a zero-dependency static web application. All you need is any modern web browser (Chrome, Edge, Firefox, Safari).

### Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sakamoto-001/rakhi.git
   cd rakhi
   ```

2. **Launch with any local server:**
   - **PowerShell (Built-in script):**
     ```powershell
     .\server.ps1
     ```
   - **Python 3:**
     ```bash
     python -m http.server 8000
     ```
   - **Node / npx:**
     ```bash
     npx serve .
     ```
   - **VS Code:** Right-click `index.html` and select **"Open with Live Server"**.

3. Open your browser and navigate to `http://localhost:8000` (or the port specified by your server).

---

## 📂 Project Structure

```plaintext
rakhi/
├── assets/             # Audio tracks, sound effects, images, and video assets
│   ├── audio/          # Festive music & interactive ritual sound effects
│   └── videos/         # Celebration video clips
├── css/
│   └── style.css       # Full festive design system, glassmorphism & animation styles
├── js/
│   ├── app.js          # Core app controller, navigation & admin password gate
│   ├── audio.js        # Web Audio API music and SFX soundboard engine
│   ├── avatarEngine.js # Avatar customization and rendering engine
│   ├── ceremony.js     # Step-by-step interactive Rakhi ceremony ritual logic
│   ├── certificate.js  # Canvas certificate generator & PNG export
│   ├── dashboard.js    # Telemetry and analytics dashboard
│   ├── database.js     # Local storage data persistence layer
│   ├── notifications.js# Toast notifications & alert banner system
│   └── router.js       # Single Page Application (SPA) client-side hash router
├── _redirects          # SPA routing fallback for Netlify
├── index.html          # Main HTML structure and portal views
├── netlify.toml        # Netlify build and header configuration
├── README.md           # Project documentation
└── server.ps1          # Lightweight local PowerShell web server
```

---

## 🔐 Admin Access

To access the telemetry and diagnostics dashboard:
1. Navigate to **🛡️ Admin Panel** in the top navigation bar.
2. Enter the passkey: `rakshyabandhan`
3. Unlock to view live session metrics, event logs, and memory diagnostics.

---

## 🌐 Deployment

### Deploy to Netlify
1. Connect your repository to [Netlify](https://www.netlify.com).
2. Set Build Command: `(leave blank)`
3. Set Publish Directory: `.`
4. Netlify will automatically detect `netlify.toml` and `_redirects`.

### Deploy to GitHub Pages
1. Go to repository **Settings** > **Pages**.
2. Under **Branch**, select `master` (or `main`) and folder `/ (root)`.
3. Click **Save**.

---

## 💖 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/sakamoto-001/rakhi/issues) if you want to contribute.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — celebrate and share freely with brothers and sisters everywhere!