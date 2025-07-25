# My-Tasks App

My-Tasks is a simple, yet powerful mobile application designed to help you manage your daily tasks efficiently. Built with modern technologies, it provides a seamless and intuitive user experience for creating, tracking, and organizing your to-do lists.

## ✨ Features

- **Create & Manage Tasks**: Quickly add new tasks, mark them as complete, and delete them when no longer needed.
- **Task Prioritization**: Assign priority levels (high, medium, low) to your tasks to focus on what matters most.
- **Real-time Sync**: Powered by Convex, your tasks are synced in real-time across all your devices.
- **Push Notifications**: Get reminders for your tasks so you never miss a deadline.
- **Cross-Platform**: Built with Expo, the app runs on both Android and iOS devices from a single codebase.

## 🚀 Tech Stack

- **Frontend**: React Native, Expo
- **Backend**: Convex (Real-time database and serverless functions)
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Linting**: ESLint

## 🏁 Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or newer)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/go) app on your mobile device or an Android/iOS emulator.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/13kirat/My-Tasks.git
   cd My-Tasks
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Convex backend:**
   - Go to [Convex](https://www.convex.dev/) and create a new project.
   - In your project dashboard, find your deployment URL.
   - Create a `.env` file in the root of the project and add your Convex deployment URL:
     ```
     CONVEX_URL=https://your-deployment-url.convex.cloud
     ```

4. **Deploy the Convex functions:**
   ```bash
   npx convex deploy
   ```

### Running the App

1. **Start the development server:**
   ```bash
   npx expo start
   ```

2. **Open the app:**
   - **On your mobile device**: Scan the QR code from the terminal with the Expo Go app.
   - **On an emulator**: Press `a` for Android or `i` for iOS in the terminal.

## 📂 Project Structure

The project is organized into the following directories:

```
.
├── app/            # Contains all the screens and navigation logic using Expo Router.
├── assets/         # Static assets like images and fonts.
├── components/     # Reusable UI components.
├── constants/      # Shared constants like color schemes.
├── convex/         # Convex backend functions and schema.
├── hooks/          # Custom React hooks.
├── scripts/        # Utility scripts for the project.
└── ...
```

## 📜 Available Scripts

In the project directory, you can run the following commands:

- `npm start`: Starts the development server.
- `npm run android`: Starts the development server and attempts to open the app on a connected Android device or emulator.
- `npm run ios`: Starts the development server and attempts to open the app on an iOS simulator.
- `npm run web`: Starts the development server and attempts to open the app in a web browser.
- `npm run lint`: Lints the project files using ESLint.
- `npm run reset-project`: Resets the project to a blank state, moving the example files to `app-example`.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue to discuss your ideas.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.