# 💕 LovePlanner

A cute and interactive couple planning application that helps couples better organize and manage their shared life.

## ✨ Features

### 📋 Advanced Task Management System

#### Task Types
- **Daily Tasks**: Regular daily life activities
- **Special Tasks**: Tasks requiring special preparation or effort
- **Romantic Tasks**: Activities designed to enhance relationship intimacy
- **Repeatable Tasks**: Tasks that can be completed multiple times (e.g., weekly date nights)
- **One-time Tasks**: Tasks that can only be completed once

#### Task Status Flow
1. **Recruiting** → Tasks available for acceptance
2. **Assigned** → Tasks accepted by a user but not yet started
3. **In Progress** → Tasks currently being worked on
4. **Pending Review** → Tasks completed and awaiting partner verification
5. **Completed** → Successfully finished tasks
6. **Abandoned** → Tasks that were given up (with penalty)

#### Task Management Rules

**1. Task Creation**
- Title is required
- Description is optional
- Deadline is mandatory
- Task type must be selected (Daily/Special/Romantic)
- Task nature must be defined (One-time/Repeatable)
- Proof requirement can be set (upload evidence when completing)
- Point reward range: 10-200 points

**2. Task Acceptance**
- Users can browse all available recruiting tasks
- Once accepted, task status changes to "Assigned"
- Only one task can be accepted at a time per user

**3. Task Execution**
- **Assigned tasks** can be:
  - Started (moves to "In Progress")
  - Abandoned (10-point penalty applied)
- **In Progress tasks** can be:
  - Upload proof (if required)
  - Mark as complete (moves to "Pending Review")
- In Progress tasks cannot be abandoned

**4. Task Proof System**
- If task requires proof, evidence must be uploaded before completion
- Proof can be images, videos, or other files
- Once uploaded, proof cannot be deleted or modified

**5. Task Completion**
- Completed tasks award the designated points
- Repeatable tasks can be accepted again after completion
- One-time tasks cannot be re-accepted once completed

**6. Task Abandonment**
- Only "Assigned" tasks can be abandoned
- Abandoning a task deducts 10 points
- Abandoned tasks move to "Abandoned" category

#### Task Time Management
- **Overdue Detection**: Automatic detection of tasks past their deadline
- **Today's Tasks**: Special highlighting for tasks due today
- **Time Range Tasks**: Support for tasks with specific start and end times
- **Smart Sorting**: Automatic sorting by urgency and deadline

### 📅 Smart Calendar System
- **Multi-view Support**: Individual views for each partner and shared calendar
- **Event Management**: Create, edit, and delete events with full details
- **Repeat Events**: Support for daily/weekly/monthly/yearly recurring events
- **Today's Agenda**: Right sidebar showing all events for the current day
- **Permission Control**: Personal events can only be edited by the owner

### 🛍️ Personal Shop System
- **Dual Shops**: Separate personal shops for each partner
- **Category Management**: Four main categories - Time, Service, Gifts, Experience
- **Point Trading**: Use task-earned points for purchases
- **Purchase History**: Complete transaction history tracking

### 🎨 Dual Theme Support
- **Cute Theme**: Pink gradients, glass morphism effects, modern rounded design
- **Pixel Theme**: Retro pixel art style, neon glow effects, CRT scanlines
- **Real-time Switching**: Instant theme changes with automatic component adaptation

### 👥 Dual User System
- **Role Assignment**: 🐱 Whimsical Cat and 🐄 Whimsical Cow
- **Personalized Views**: Automatic display of relevant content after login
- **Permission Management**: Smart permission control protecting personal privacy
- **User Switching**: Support for quick user identity switching

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation & Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd LovePlanner
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open the application**
Visit [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
# Build static files
npm run export

# The output will be in the 'out' directory
```

## 📁 Project Structure

```
LovePlanner/
├── src/
│   ├── components/          # React components
│   │   ├── Layout.tsx      # Main layout and navigation
│   │   ├── Calendar.tsx    # Smart calendar component
│   │   ├── TaskBoard.tsx   # Task management board
│   │   ├── Shop.tsx        # Personal shop component
│   │   ├── Settings.tsx    # Settings and theme management
│   │   ├── PixelIcon.tsx   # Pixel art icon component
│   │   └── LoginForm.tsx   # User login form
│   ├── contexts/           # React Context
│   │   └── ThemeContext.tsx # Theme management context
│   └── utils/              # Utility functions
│       # testRouting.js已移除（清理调试信息）
│       └── themeInit.js    # Theme initialization
├── pages/
│   ├── _app.tsx           # Next.js app entry point
│   └── index.tsx          # Application main page
├── public/                # Static assets
├── .github/workflows/     # GitHub Actions for deployment
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
├── next.config.js         # Next.js configuration
└── DEPLOYMENT.md          # Deployment guide
``` 