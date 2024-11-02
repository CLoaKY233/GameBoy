# Boostify - Advanced System Power Optimization

<p align="center">
  <img src="src-tauri\icons\Square310x310Logo.png" alt="Boostify Logo" width="200"/>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Made with Tauri](https://img.shields.io/badge/Made%20with-Tauri-purple.svg)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-000000?style=flat&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)

Boostify is a high-performance desktop application built with Tauri and Rust that provides precise control over system power management and processor optimization settings. The application leverages native Windows power management capabilities through direct Rust implementation.

## 🚀 Features

- **Native Power Management**: Pure Rust implementation for system power control
- **Processor Optimization**: Advanced boost mode management
- **Dual Power Profiles**: Seamless AC/DC power mode switching
- **Secure Operations**: Native privilege elevation handling
- **Modern Interface**: React-based UI with real-time feedback
- **Performance Focused**: Low resource footprint with Rust backend

## 🛠️ Technology Stack

- **Backend**: Rust + Tauri
- **Frontend**: React, Vite, TailwindCSS
- **UI Framework**: ShadcnUI
- **Animations**: Framer Motion
- **Styling**: TailwindCSS
- **State Management**: React Hooks

## 📋 Prerequisites

- Node.js (v16 or higher)
- Rust (latest stable)
- Microsoft Visual Studio C++ Build Tools
- Windows 10/11
- Administrative privileges

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/cloaky233/GameBoy.git
   cd GameBoy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run tauri dev
   ```

## 🔨 Building for Production

```bash
npm run tauri build
```

Built artifacts will be available in `src-tauri/target/release/bundle/`.

## 🎯 Roadmap

- [ ] **Enhanced Power Profiles**
  - Custom power scheme creation
  - Temperature-based optimization
  - Automated profile switching

- [ ] **Performance Analytics**
  - Real-time power consumption monitoring
  - System performance metrics
  - Temperature tracking

- [ ] **Advanced Features**
  - Multiple power scheme management
  - Scheduled profile switching
  - Export/Import configurations

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork and Clone**
   ```bash
   git checkout -b feature/NewFeature
   git commit -m 'Add NewFeature'
   git push origin feature/NewFeature
   ```
   Then open a Pull Request

2. **Coding Standards**
   - Follow Rust best practices
   - Maintain consistent code style
   - Include appropriate error handling
   - Add unit tests for new features

3. **Bug Reports**
   - Use GitHub Issues
   - Include system specifications
   - Provide clear reproduction steps

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🛡️ Security Features

- Memory-safe Rust implementation
- Secure privilege elevation
- Protected system calls
- Error boundary handling

## 🔧 Technical Details

### Power Management Features
```rust
pub enum BoostMode {
    Disabled = 0,
    Enabled = 1,
    Aggressive = 2,
    EfficientEnabled = 3,
    EfficientAggressive = 4,
    AggressiveAtGuaranteed = 5,
    EfficientAggressiveAtGuaranteed = 6,
}
```

### System Requirements
- Windows 10/11
- x64 architecture
- 2GB RAM minimum
- Administrative privileges

## 📞 Contact

- GitHub Issues: [Report a bug](https://github.com/cloaky233/GameBoy/issues)
- Discord: [Join our community](#) (coming soon)

---

<p align="center">
Made with ❤️ by CLoaK | Powered by Rust and Tauri
</p>

*Note: This project now uses pure Rust implementation for enhanced performance and security.*
