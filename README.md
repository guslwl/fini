# fini

A finance app that respects your data and doesn't make you miserable to use.

**Your data stays on your machine.** fini stores everything in a local SQLite file that you own, control, and can back up anywhere. No accounts, no cloud sync, no third parties.

---

## Why does this app exists?

Most personal finance apps fall into one of two traps: they're either ugly and complex, or they're slick web apps that want your most sensitive data on their servers -- maybe with the best of intentions, but do you trust them?
fini tries to be neither -- a native desktop app that's genuinely pleasant to use and genuinely private.

---

## Current Status

> **Early development.** Core payables and holidays management is functional. The app is usable but not feature-complete.

**What works today:**

- Payables management - create, edit, delete, mark as paid
- Recurring payables - with automatic business day adjustment and holiday awareness
- Holidays management - used to adjust due dates intelligently
- Month-based payables view
- Local SQLite database - you choose where the file lives

**Coming soon:**

- Recurring payables UI (CRUD view)
- Calendar view with daily totals and holiday display
- Receivables (recurring and planned)
- Core finance ledger with accounts
- Business module for freelancers and small teams
- Reports

---

## Tech Stack

- [Electron](https://www.electronjs.org/) - cross-platform desktop shell
- [React 19](https://react.dev/) - UI
- [SQLite](https://www.sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - local database
- [electron-vite](https://electron-vite.org/) - build tooling
- [Vitest](https://vitest.dev/) - testing

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Test

```bash
npm test
```

---

## Project Structure

```
src/
├── main/               # Electron main process
│   ├── handlers/       # IPC request handlers
│   ├── models/         # SQLite data access + domain validation
│   ├── services/       # Business logic
│   ├── utils/          # Shared model/service utilities
│   └── infra/          # Database, migrations, settings, errors
├── preload/            # Context bridge (IPC API exposed to renderer)
└── renderer/           # React frontend
    └── src/
        ├── pages/      # Route-level page components
        └���─ components/ # Reusable UI components
```

---

## Data & Privacy

fini uses a single SQLite `.db` file as its database. On first launch, you choose where to create or open a database file. You can:

- Keep it in a folder synced by your own backup solution
- Move it freely between machines
- Open it directly with any SQLite browser
- Back it up by copying the file

Nothing is sent anywhere.

---

## License

MIT

---

Made in 🇧🇷 with a lot of ☕
