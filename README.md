# Cơn Mưa Tình Yêu

A beautiful, interactive 3D experience featuring falling Vietnamese love words and hearts, with background music. Built with Three.js, Parcel, and modern web technologies.

## 🎯 Key Features

### Visual Experience

- **3D Text Rain**: Animated Vietnamese love words with beautiful neon typography
- **Heart Sprites**: Animated heart emojis mixed with text
- **Sparkle Effects**: Dynamic sparkle particles with glow effects
- **Smooth Animations**: 60fps, optimized for performance

### Audio Experience

- **Background Music**: "The Moon Represents My Heart" (looped)
- **Interactive Controls**: Play/pause, seek, and volume
- **Keyboard Shortcuts**: Full keyboard navigation (Space, Enter, ←, →)
- **Auto-replay**: Seamless looping when music ends

### User Experience

- **Responsive Design**: Works on all device sizes
- **Accessibility**: ARIA labels, screen reader, and keyboard support
- **Performance**: Object pooling, optimized rendering
- **Cross-browser**: Chrome, Firefox, Safari, Edge (latest versions)

## 🛠 Technical Stack

- **Three.js**: 3D graphics and animation
- **Parcel**: Development server and bundler
- **ES6+ Modules**: Modern JavaScript
- **CSS3**: Advanced styling with custom properties
- **HTML5**: Semantic markup and accessibility
- **Web Audio API**: Audio playback and controls

## 📦 Installation & Development

1. **Clone the repository**

   ```sh
   git clone <repo-url>
   cd words-rain
   ```

2. **Install dependencies**

   ```sh
   npm install
   ```

3. **Start the development server**

   ```sh
   npm start
   ```

   Parcel will print a local server URL (e.g., <http://localhost:1234>). Open it in your browser.

## 🚀 Building for Production

- **Build the app**

  ```sh
  npm run build
  ```

  The optimized output will be in the `dist/` directory.
- **Deploy to GitHub Pages**

  ```sh
  npm run deploy
  ```

## 🎨 Customization

Easily customize the look and feel via CSS custom properties in `assets/style.css`:

```css
:root {
  --primary-color: #ffffff;
  --secondary-color: #e255a3;
  --accent-color: #ff69b4;
  --background-color: #000000;
  /* ... more variables ... */
}
```

## 📁 Project Structure

- `index.html` — Main HTML entry
- `assets/script.js` — Main app logic (Three.js, animation)
- `assets/audio-controller.js` — Audio controls and accessibility
- `assets/style.css` — Styles and theming
- `assets/the-moon-represents-my-heart.mp3` — Background music

## ♿ Accessibility & Controls

- Full keyboard navigation for audio (Space, Enter, ←, →)
- ARIA roles and labels for all controls
- Responsive and screen reader friendly

## 📄 License

This project is licensed under the ISC License and is free for personal and educational use.

## 💝 Special Thanks

Created as a romantic gesture, featuring Vietnamese love words and beautiful 3D effects. Every optimization was implemented with love and attention to detail.

---

*Made with ❤️, Three.js, and modern web technologies*
