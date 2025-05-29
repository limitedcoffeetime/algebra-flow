# Algebro - Your Algebra Practice Companion

Welcome to Algebro! This app is designed to help you practice and master algebra concepts.

## Current Features

As of now, Algebro is a "dummy" application that presents a basic algebra problem. The core UI is in place, featuring:

*   A problem display area.
*   An input field for your answer.
*   A submit button.

This setup serves as the foundation for future development.

## Getting Started (Development)

To get the app running on your local machine for development or testing, follow these steps:

1.  **Install Dependencies:**
    Make sure you have Node.js and npm (or Yarn) installed. Then, in the project directory, run:
    ```bash
    npm install
    # or
    # yarn install
    ```

2.  **Start the Development Server:**
    Once the dependencies are installed, you can start the Expo development server:
    ```bash
    npx expo start
    ```

    This command will output a QR code and server information. You can then:
    *   Scan the QR code with the Expo Go app on your Android or iOS device.
    *   Open the app in an Android emulator or iOS simulator.
    *   Open the app in your web browser.

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
