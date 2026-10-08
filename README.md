# Blouse Work Planner & Prioritization Assistant ✂️

A mobile-first productivity tool and personal work assistant built for an older mother running a blouse tailoring business. It prevents physical strain, avoids last-minute workloads, and answers the core daily question:

> **“What blouse should I work on first?”**

---

## 🌟 Key Highlights & Design Principles

* **English-Only & Senior-Friendly**:
  - Clear, calm, simple English with zero confusing jargon or raw mathematical scores.
  - Large readable text and large touch targets (52px+ height, no tiny buttons).
  - No loud gradients or flashing animations.
* **Calm, Mature Color System**:
  - Warm off-white neutral background (`#faf9f6`).
  - Dark charcoal typography (`#1c1917`).
  - Muted deep teal primary accent (`#0f766e`).
  - Soft amber for **Plan Soon** (`#d97706`).
  - Muted red used sparingly only for genuine **Do First** / deadline risk (`#b91c1c`).
  - Soft green for completed and on-track work (`#047857`).
* **First-Launch Onboarding (No Fake Data)**:
  - New users are never presented with pre-loaded fake customer data.
  - A friendly 3-step setup guides the user:
    1. Set comfortable daily working hours (default: 3 hours).
    2. Add the first real customer blouse.
    3. View the "You're ready" summary card and launch into the Home screen.
  - Returning users go directly to the Home screen.
* **Radically Simple Home Screen**:
  - Warm time-based greeting (*Good morning / Good afternoon*).
  - **WHAT TO WORK ON FIRST**: Highlights ONE primary recommended blouse order with customer name, remaining blouses, delivery status, time remaining, and a large **`+1 Completed`** button.
  - **TODAY**: Summary of planned hours vs comfortable capacity.
  - **Other work**: Shows only the next 2–3 relevant jobs.
* **Cumulative Workload Priority Engine**:
  - Considers total outstanding workload across all active jobs against daily capacity.
  - An 8-hour heavy design job due in 2 days is prioritized ahead of a 30-minute simple job due tomorrow so that both can be finished on time without rush.
* **Strict Daily Capacity Protection**:
  - The daily plan will **never** intentionally exceed comfortable capacity.
  - If capacity is 2 hours, the planned schedule targets $\le$ 2 hours. If a job is large, it assigns what fits and notes *"Comfortable limit reached — continue tomorrow"*.
* **Empty State**:
  - When no blouses are pending, displays: *"You're all caught up. Add a blouse when a new order comes in."* with a large `+ Add Blouse` button.

---

## 🚀 Running the App Locally

```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Run unit tests to verify priority math & capacity protection
npm test

# 3. Start development server
npm run dev
```

Visit `http://localhost:3000` in the browser or mobile device. On Android Chrome or iOS Safari, tap **"Add to Home Screen"** to install it as a standalone app.

---

## 🧪 Acceptance Test Scenarios

- **Scenario A (New User First Launch)**: Fresh user sees the 3-step onboarding flow and sets up their capacity and first blouse.
- **Scenario B (Home Screen in 5 Seconds)**: Answers *"What should I work on first?"* with ONE clear hero card and one-tap `+1 Completed`.
- **Scenario C (Capacity Protection)**: If capacity is 2 hours, Today's plan targets $\le$ 2 hours and notes when the comfortable limit is reached.
- **Scenario D (All Caught Up)**: When all work is done, shows a clean, calm empty state without clutter.
