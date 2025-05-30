# Algebro - Your Algebra Practice Companion

Welcome to Algebro! This app is designed to help you practice and master algebra concepts.

## Current Features

As of now, Algebro is a "dummy" application that presents a basic algebra problem. The core UI is in place, featuring:

*   A problem display area.
*   An input field for your answer.
*   A submit button.

This setup serves as the foundation for future development.

## Getting Started (For Stakeholders & Developers)

This app uses Expo development builds instead of Expo Go, which provides a more production-like testing environment.

### Prerequisites

1. **Install Node.js** (v18 or higher recommended)
2. **Install an emulator/simulator:**
   - **iOS**: Install Xcode from the Mac App Store (Mac only)
   - **Android**: Install [Android Studio](https://developer.android.com/studio) and set up an Android Virtual Device

### Step-by-Step Setup

1. **Clone the repository and install dependencies:**
   ```bash
   git clone [repository-url]
   cd algebra-app
   npm install
   ```

2. **Install EAS CLI globally (one-time setup):**
   ```bash
   npm install -g eas-cli
   ```

3. **Install the development build on your emulator:**

   For iOS Simulator (Mac only):
   ```bash
   eas build:run -p ios --latest
   ```

   For Android Emulator:
   ```bash
   eas build:run -p android --latest
   ```

   > Note: This downloads and installs a pre-built development version of the app. You only need to do this once per emulator/device.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   - Press `i` to open on iOS Simulator
   - Press `a` to open on Android Emulator
   - The app should launch automatically in your emulator

### App Variants

We have three versions of the app:

- **Development** (`npm run dev`): For active development with debugging tools
- **Preview**: For testing production-like features before release
- **Production**: The final app store version

### Troubleshooting

**"No development build installed" error:**
- Run `eas build:run -p [platform] --latest` to install the build
- Make sure your emulator is running before installing

**App won't connect to development server:**
- Ensure your computer and device are on the same network
- Try restarting the Metro bundler (`npm run dev`)
- Clear the Metro cache: `npx expo start -c`

**Need to test on a physical device?**
- Scan the QR code shown in the terminal with your device's camera
- You'll be prompted to download the development build first

### Quick Start with Expo Go (Limited Features)

If you just want to quickly view the app without the full development environment:

1. Install Expo Go from [App Store](https://apps.apple.com/app/expo-go/id982107779) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Run `npx expo start`
3. Press `s` to switch to Expo Go mode
4. Scan the QR code with Expo Go app

**⚠️ Limitations with Expo Go:**
- Won't show the correct app name/icon
- Can't test app variants (dev/preview/production)
- Limited to Expo SDK libraries only
- Not suitable for production testing

For full features and production-like testing, use the development build setup above.

## Future Roadmap

Here are some planned features and areas for expansion:

*   **Problem Generation:** Dynamically generate a wide variety of algebra problems.
*   **Answer Validation:** Check user-submitted answers and provide feedback.
*   **Step-by-Step Solutions:** Show detailed solutions for problems.
*   **User Accounts & Progress Tracking:** Allow users to save their progress and track their learning.
*   **Different Topics:** Expand to cover various algebra topics (e.g., linear equations, quadratics, systems of equations).
*   **Customizable Difficulty:** Allow users to select problem difficulty levels.

## Project Structure

This project is built with [Expo](https://expo.dev) and utilizes [Expo Router](https://docs.expo.dev/router/introduction/) for file-based routing. Key directories:

*   `app/`: Contains all the screens and navigation logic.
*   `components/`: Houses reusable UI components.
*   `assets/`: For static assets like images and fonts.
