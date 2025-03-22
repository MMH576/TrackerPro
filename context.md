### 1. Project Breakdown

**App Name:** HabitHero  
**Platform:** Web  
**Summary:** HabitHero is a web-based habit-tracking application designed to help users build and maintain positive daily routines. The app allows users to create custom habits, set goals, track progress with visual charts, and receive reminders. It also includes gamification features like streaks and friendly competitions to keep users motivated. The app syncs with Google Calendar for seamless integration into users' schedules and offers a dark mode for comfortable usage. HabitHero aims to empower users to achieve their personal goals through consistent habit formation.

**Primary Use Case:**

- Users sign up and log in to create a personalized habit-tracking dashboard.
- They can add habits, set daily/weekly goals, and track progress over time.
- The app sends reminders for pending habits and provides analytics to visualize progress.
- Users can compete with friends to stay motivated and maintain streaks.

**Authentication Requirements:**

- Email/password authentication using Supabase Auth.
- Optional Google OAuth for seamless sign-in.
- User profiles stored in Supabase with habit data and progress history.

---

### 2. Tech Stack Overview

- **Frontend Framework:** React + Next.js
- **UI Library:** Tailwind CSS + ShadCN (for pre-built, customizable components)
- **Backend (BaaS):** Supabase (for data storage, real-time updates, and authentication)
- **Deployment:** Vercel

---

### 3. Core Features

1. **Habit Creation and Management:**

   - Users can add, edit, or delete habits.
   - Each habit includes a name, goal (e.g., "Drink 8 glasses of water daily"), and frequency (daily/weekly).

2. **Progress Tracking:**

   - Visual progress charts (line/bar graphs) using a charting library like Chart.js.
   - Streaks displayed for each habit to encourage consistency.

3. **Dark Mode:**

   - Toggleable dark/light theme using Tailwind CSS.

5. **Analytics Dashboard:**
   - Overview of habit completion rates, streaks, and historical data.

---

### 4. User Flow

1. **Sign-Up/Login:**

   - New users sign up using email/password or Google OAuth.
   - Existing users log in and are redirected to their dashboard.

2. **Dashboard:**

   - Users see a list of their habits, progress charts, and streaks.
   - Options to add new habits or edit existing ones.

3. **Habit Tracking:**

   - Users mark habits as completed daily.
   - Progress is updated in real-time using Supabase.

4. **Reminders:**

   - Users receive notifications for pending habits.

5. **Settings:**
   - Users can toggle dark mode, manage notifications, and sync with Google Calendar.

---

### 5. Design and UI/UX Guidelines

- **Color Palette:**

  - Light mode: White background with soft pastel accents (e.g., #F3F4F6, #60A5FA).
  - Dark mode: Dark gray background with vibrant accents (e.g., #1F2937, #3B82F6).

- **Typography:**

  - Use a clean, sans-serif font (e.g., Inter) with consistent font sizes for headings and body text.

- **Layout:**

  - Dashboard: Grid layout with habit cards, progress charts, and streaks.
  - Habit creation: Modal or sidebar for adding/editing habits.

- **Accessibility:**
  - Ensure high contrast for text and buttons.
  - Use ARIA labels for interactive elements.

---

### 6. Technical Implementation Approach

1. **Frontend (React + Next.js):**

   - Use Next.js for server-side rendering and routing.
   - Create reusable components (e.g., HabitCard, ProgressChart) with ShadCN.
   - Implement dark mode using Tailwind CSS's dark mode utility.

2. **Backend (Supabase):**

   - Store user data, habits, and progress in Supabase tables.
   - Use Supabase Auth for authentication and real-time updates for habit tracking.
   - Set up triggers for reminders and notifications.

4. **Deployment (Vercel):**
   - Deploy the Next.js app to Vercel with environment variables for Supabase credentials.
   - Set up a custom domain and enable automatic deployments from GitHub.

---

### 7. Required Development Tools and Setup Instructions

1. **Development Environment:**

   - Install Node.js and npm.
   - Set up a Next.js project: `npx create-next-app habithero`.

2. **Supabase Setup:**

   - Create a Supabase project and enable Auth, Database, and Realtime features.
   - Generate API keys and add them to `.env.local`.

3. **UI Setup:**

   - Install Tailwind CSS: `npm install -D tailwindcss postcss autoprefixer`.
   - Add ShadCN components: `npx shadcn-ui@latest add button`.

5. **Deployment:**
   - Push the project to a GitHub repository.
   - Connect the repository to Vercel and deploy.

By following this blueprint, HabitHero can be developed into a robust, user-friendly habit-tracking web application using the specified tech stack.
