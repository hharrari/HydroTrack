# HydroTrack

This is a Next.js application to track daily water intake, built with Firebase.

## Setup##

1.  Create a Firebase project at [firebase.google.com](https://firebase.google.com).
2.  In your project, go to "Build" > "Authentication" and enable the "Email/Password" sign-in provider.
3.  Go to "Build" > "Firestore Database" and create a database. Start in test mode for easy setup, but be sure to secure your database with security rules for production.
4.  Navigate to your Project Settings (gear icon) > General tab. Under "Your apps", create a new Web app.
5.  Copy your Firebase project configuration credentials (`firebaseConfig` object).
6.  Create a file named `.env.local` in the root of this project.
7.  Add your Firebase credentials to `.env.local`, adding the `NEXT_PUBLIC_` prefix to each key:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

8.  Install dependencies and run the app:
    ```bash
    npm install
    npm run dev
    ```
The app will be running at `http://localhost:9002`.

## Design Pivot: From Single Tap to Quick-Add Options

The initial MVP request was for a single-tap logging mechanism. While simple, this is inflexible for real-world use where people drink from various container sizes.

**The Pivot:** To enhance usability, the single "Log Water" button was replaced with a more versatile system. The new design features:
- **Quick-Add Buttons:** Buttons for common drink sizes (e.g., 250ml Glass, 500ml Bottle) allow for rapid, single-tap logging of frequent intake amounts.
- **Custom Entry:** A "Custom" option opens a simple dialog to log any specific amount, providing flexibility without cluttering the main interface.

This pivot provides the best of both worlds: the speed of single-tap for common scenarios and the precision of custom entry when needed, leading to a much more practical and user-friendly experience.

## AI Development Process

### 1. What was straightforward for AI generation?

- **Boilerplate and Scaffolding:** Generating the basic file structure, Next.js pages (`/login`, `/`), and standard components (like headers, buttons, inputs) was very fast. The AI understood the component-based architecture and created the necessary files with correct initial content.
- **Component Implementation from Description:** Creating individual UI components like `HydroProgress` or `SettingsDialog` from a high-level description was highly effective. For example, a prompt like "Create a React component for an animated circular progress bar using SVG and Tailwind CSS" yielded a functionally correct and stylable component immediately.
- **Styling and Theming:** Applying the specified color scheme and fonts across the application by modifying `globals.css` and `tailwind.config.ts` was a simple, direct task. The AI correctly translated hex color codes to the HSL format required by the project's theme setup.
- **Basic Firebase Integration:** Setting up the initial Firebase client configuration and writing simple Firestore read/write functions (e.g., fetching a user profile) was generated correctly based on standard documentation patterns.

### 2. What required clarification, iteration, or manual fixes?

- **Complex Client-Side State Management:** The initial versions of the main dashboard component had scattered state management. It required refinement to co-locate related state and effects, ensuring that data fetched from Firestore correctly propagated to all child components and that the UI updated reactively. The logic for optimistic updates when logging water also required careful iteration.
- **Authentication Flow:** Implementing a robust, client-side authentication flow in the Next.js App Router with Firebase is nuanced. The AI's first pass was too simple and didn't properly handle loading states or protect routes. The solution was iterated to use a client-side Auth Context Provider, a common and reliable pattern. This required an explicit prompt: "Create an AuthProvider using React Context and Firebase's onAuthStateChanged method to manage global user state."
- **Firestore Transactions:** The initial data-logging function was a simple `setDoc`. This is prone to race conditions if the user taps a log button quickly. I had to specifically prompt: "Refactor the water logging function to use a Firestore Transaction to ensure the daily summary is updated atomically." This is a critical detail for data integrity that requires specific instruction.
- **The Usability Pivot:** The core idea for the design pivot required human insight. The AI generated the initial MVP as requested, but the idea to improve it by replacing the single "log" button with multiple quick-add options came from analyzing the user experience. Once the pivot was described, the AI was effective at implementing it ("Replace the single log button with a component that shows buttons for 250ml, 500ml, and a custom amount").

### 3. AI Prompts Used

1.  **Initial Setup:** "Scaffold a Next.js app named HydroTrack. The primary color is #00BFFF, background is #E0FFFF, and accent is #40E0D0. Use the 'PT Sans' font for both body and headlines."
2.  **Auth:** "Create a Firebase email/password login page at `/login` using shadcn/ui components." -> "Implement an authentication provider using React Context and Firebase's `onAuthStateChanged`." -> "Create a hook `useAuth` to consume the auth context."
3.  **Core UI:** "Build the main page to be a dashboard that displays water intake progress." -> "Create an animated circular progress bar component named `HydroProgress` that accepts a `value` and `goal` prop." -> "Create a settings dialog using shadcn/ui Dialog that contains a form to update a user's daily hydration goal."
4.  **Data Layer:** "Define Firestore service functions to get a user profile, get or create a daily summary document for today's date, and update the user's goal."
5.  **Pivot & Refinement:** "Change the water logging feature. Instead of one button, create a component with quick-add buttons for 250ml, 500ml, and 750ml. Also include a button that opens a Dialog for custom amount entry." -> "Rewrite the `logWater` Firestore function to use a transaction to safely increment the daily total and add a new log entry simultaneously."
6.  **Finishing Touches:** "Add a subtle transition animation to the progress circle when the intake amount changes." -> "Create a header component with the app title and a user dropdown menu containing 'Settings' and 'Logout' options."
