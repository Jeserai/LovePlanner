# 💕 Love Planner

A love-filled interactive app designed to help couples better plan and manage their shared life together.

## ✨ Features

### 📅 Smart Calendar Module

* **Multi-view Support**:

  * **Cat’s Personal View 🐱**: Displays all events for the Cat user
  * **Cow’s Personal View 🐄**: Displays all events for the Cow user
  * **Shared Calendar View 💕**: Shows events participated by both users
* **Month Navigation**:

  * Switch between previous/next months
  * Quick return to today
  * Display of current month and year
* **Schedule Management**:

  * Add events: set title, date, time, participants
  * Edit events: modify event details
  * Delete events: remove unneeded events
  * Recurring events: supports daily/weekly/biweekly/monthly/yearly repeats
* **Event Details**:

  * Title and description
  * Date and time (supports all-day events)
  * Participants (Cat/Cow)
  * Repeat settings and end date
  * Permission control (personal events editable only by the owner)
* **Today’s Agenda**:

  * Display of all events for the current day on the right
  * Sorted by time
  * Recurrence indicator
  * Permission status indicator

### 📋 Smart Task Board

* **Urgency Management**: Automatically calculates task urgency (Overdue, Today, Urgent, Upcoming)
* **Deadline Settings**: Optional deadline for tasks
* **Points Rewards**: Earn points by completing tasks
* **Task Status**: Three statuses — To-do, In Progress, Completed
* **Smart Sorting**: Automatically sorted by urgency and deadline

### 🛍️ Personal Shop System

* **Separate Shops**: Each user manages their own shop and items
* **Category Management**: Four categories — Time, Services, Gifts, Experiences
* **Points Transactions**: Use earned points to make purchases
* **Purchase History**: Full transaction tracking

### 🎨 Theme Support

* **Cute Theme**: Pink gradient, frosted-glass effect, modern rounded UI
* **Pixel Theme**: Retro pixel art, neon effects, CRT scanline simulation
* **Theme Switching**: Real-time theme changes with auto-adaptation

### 👥 Dual-User System

* **Roles**: 🐱 Whimsical Cat & 🐄 Whimsical Cow
* **Personalized Views**: Auto display content based on logged-in user
* **Permission Management**: Smart privacy controls
* **User Switching**: Fast identity switching support

## 🛠️ Tech Stack

* **Frontend Framework**: React 18 + Next.js 15
* **Language**: TypeScript
* **Styling**: Tailwind CSS + custom CSS
* **UI Components**: NextUI + Heroicons + Pixel Icon Library
* **Animations**: Framer Motion + CSS animations
* **Fonts**: Nunito + Quicksand + Pixel fonts
* **State Management**: React Context + localStorage

## 🎯 Design Highlights

### Cute Theme 💖

* 🌈 Pink and cyan gradient palette
* ✨ Frosted-glass (backdrop-blur) effects
* 🔮 Soft shadows and rounded design
* 💫 Smooth transition animations
* 📱 Fully responsive layout

### Pixel Theme 🕹️

* 🎮 Retro 8-bit pixel art style
* 💾 Neon glow effects
* 📺 CRT monitor scanline simulation
* 🤖 Pixel fonts and icons
* ⚡ Cyberpunk color scheme

## 🚀 Getting Started

### Requirements

* Node.js 18+
* npm or yarn

### Installation & Run

1. **Clone the repo**

```bash
git clone <repository-url>
cd ccpm
```

2. **Install dependencies**

```bash
npm install
```

3. **Start development server**

```bash
npm run dev
```

4. **Open the app**
   Go to [http://localhost:3000](http://localhost:3000)

### Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
ccpm/
├── src/
│   ├── components/          # React components
│   │   ├── Layout.tsx      # Layout & navigation
│   │   ├── Calendar.tsx    # Smart calendar component
│   │   ├── TaskBoard.tsx   # Task board component
│   │   ├── Shop.tsx        # Shop component
│   │   ├── PixelIcon.tsx   # Pixel icon component
│   │   └── LoginForm.tsx   # Login form
│   ├── contexts/           # React Context
│   │   └── ThemeContext.tsx # Theme manager
│   ├── utils/              # Utility functions
│   │   └── testRouting.js  # Routing test tools
│   └── index.css           # Global styles & themes
├── pages/
│   ├── _app.tsx           # App entry point
│   └── index.tsx          # Home page
├── public/                # Static assets
├── tailwind.config.js     # Tailwind config
├── tsconfig.json          # TypeScript config
└── next.config.js         # Next.js config
```

## 📖 User Guide

### 🔐 Login

* Shows login screen on first visit
* Enter a username containing “cat” or “cow”
* The system auto-detects identity and redirects to corresponding view

### 📅 Calendar Usage

1. **View Events**: Switch between views to see personal or shared schedules
2. **Add Events**: Click “Add Event” to create a new one
3. **Recurring Settings**: Set daily/weekly/monthly/yearly recurrence
4. **Edit Permissions**: Personal events editable only by owner; shared events editable by both
5. **Today’s Agenda**: Right panel shows today’s events

### 📋 Task Management

1. **Create Tasks**: Set title, deadline, point reward
2. **Track Status**: Drag tasks to update status
3. **Urgent Reminders**: System auto-labels overdue/urgent tasks
4. **Earn Points**: Get points when tasks are completed

### 🛍️ Shop & Purchases

1. **Add Items**: Upload services, gifts, or other items
2. **Set Prices**: Use points as currency
3. **Buy Items**: Purchase from the other user's shop
4. **Track History**: View complete purchase history

### 🎨 Theme Switching

* Click the top-right button to toggle themes
* Switch between Cute and Pixel themes
* All UI elements adapt automatically

## 🧪 Developer Tools

### Routing Test Utilities

Available in browser console:

```javascript
// Check current route status
testRouting()

// Test user login
testCatCalendar()  // Cat user test
testCowCalendar()  // Cow user test

// Simulate login/logout
simulateLogin('username')
simulateLogout()

// Clear all data
clearAllData()
```

## 🔧 Customization

### Theme Variables

Modify CSS variables in `src/index.css`:

```css
:root {
  /* Cute theme colors */
  --primary-50: #fef7ff;
  --primary-400: #e879f9;

  /* Pixel theme colors */
  --pixel-bg: #0a0a0f;
  --pixel-accent: #ff0080;
}
```

### Tailwind Config

Add custom colors and animations in `tailwind.config.js`.

## 📝 Changelog

### v1.0.0 (Jan 2024)

* ✨ Implemented core modules (calendar, task board, shop)
* 🎨 Added Cute and Pixel themes
* 👥 Dual-user system
* 📅 Apple-style recurring events
* 🔐 Smart permission system
* 📱 Fully responsive design

## 📄 License

ISC License

---

## Key Features Summary

### 1. Dual Themes

* **Pixel Style**: Fun, retro game-inspired
* **Fantasy Style**: Soft, romantic for a cozy atmosphere

### 2. Points System

* Earn points by completing tasks
* Redeem points for gifts
* Points leaderboard to encourage engagement

### 3. Task System

#### Task Types

* **Daily Tasks**: Everyday to-dos
* **Special Tasks**: Require extra prep
* **Romantic Tasks**: For bonding activities
* **Recurring Tasks**: e.g., weekly dates
* **One-Time Tasks**: Only need to be completed once

#### Task Status

* **Not Started**
* **In Progress**
* **Completed**
* **Abandoned**

#### Task Rules

1. **Task Creation**:

   * Title required
   * Description optional
   * Deadline required
   * Must select task type (Daily/Special/Romantic)
   * Must define nature (One-time/Recurring)
   * Can require proof upload
   * Reward range: 10–200 points

2. **Task Claiming**:

   * See all available tasks
   * Once claimed, task enters "Not Started"
   * Only one task can be active at a time

3. **Task Execution**:

   * From "Not Started": Start or abandon (loses 10 points)
   * From "In Progress": Upload proof (if required), mark as complete
   * In-progress tasks can't be abandoned

4. **Task Proof**:

   * Required if specified
   * Can be image/video/etc.
   * Cannot be edited or deleted once uploaded

5. **Task Completion**:

   * Earn points on completion
   * Recurring tasks can be re-claimed
   * One-time tasks can’t be re-done

6. **Task Abandonment**:

   * Only possible if not started
   * Costs 10 points
   * Moved to “Abandoned” category

### 4. Calendar Integration

* View all tasks and events
* Supports recurring events
* Deadline reminders

### 5. Gift System

* Use points to exchange gifts
* Set redemption requirements
* Surprise gift option supported

## Tech Stack

* Frontend: React + TypeScript
* Styling: Tailwind CSS
* State Management: React Context
* Animation: Framer Motion

## Development Plan

* [x] Basic framework setup
* [x] Theme system
* [x] Basic task system
* [x] Points system
* [ ] Calendar features
* [ ] Gift system
* [ ] Data persistence
* [ ] User authentication
* [ ] Mobile optimization

## License

MIT License