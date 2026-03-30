# Ticket System

A clean, open ticketing system built with Next.js 14, Supabase, and Tailwind CSS.

## Features

- **No email required** — users register with just username + password
- **MD-based templates** — create ticket templates as `.md` files with frontmatter
- **Field validation** — regex patterns, required fields, type checking (url, email, etc.)
- **Public ticket list** — open tickets visible to everyone, searchable
- **Per-ticket chat** — threaded messages between user and staff
- **Stoat integration** — DM users on Discord when staff replies
- **File uploads** — optional attachments via Supabase Storage
- **Identicons** — auto-generated avatars for users (GitHub-style)
- **Owner dashboard** — create/edit templates, set Discord ID for notifications

## Quick Setup

### 1. Create Supabase Project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Run Database Schema

In the Supabase SQL Editor, run `supabase/schema.sql` — this creates all tables, RLS policies, triggers, and storage buckets.

### 3. Set Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in your values:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project settings
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings (keep secret!)
- `NEXT_PUBLIC_SITE_URL` — your deployment URL (e.g. `https://tickets.vercel.app`)
- `STOAT_WEBHOOK_URL` — your Stoat Discord webhook URL (optional, for DM notifications)

### 4. Create Your First Owner Account

1. Register a new user via `/register` on your deployed app
2. In Supabase Dashboard → Table Editor → `profiles` → find your user and change `role` from `user` to `owner`

### 5. Deploy to Vercel

```bash
npm i
npm run build
vercel deploy
```

Or connect your GitHub repo to Vercel for automatic deploys.

## Template Files

Templates live in `/templates/*.md`. Edit existing ones or add new ones:

```md
---
name: Bug Report
description: Report a bug
fields:
  - name: title
    label: Title
    type: text
    required: true
    maxLength: 100
  - name: mclo_gs_link
    label: McLogs Link
    type: url
    required: true
    pattern: "^https?://(www\\.)?mclo\\.gs\\/.+"
    patternMessage: Must be a valid mclo.gs link
  - name: description
    label: Description
    type: textarea
    required: true
  - name: log_file
    label: Log File
    type: file
    required: false
---

## Bug Report Template
Fill out the form above.
```

### Field Types

| Type | Description |
|------|-------------|
| `text` | Single line text input |
| `textarea` | Multi-line text area |
| `url` | URL input (validated) |
| `email` | Email input (validated) |
| `number` | Number input |
| `select` | Dropdown — also set `options: [Opt1, Opt2, ...]` |
| `file` | File upload (stored in Supabase) |
| `checkbox` | Toggle checkbox |

### Validation Options

- `required: true` — field must be filled
- `pattern: "regex"` — must match regex
- `patternMessage: "..."` — error shown when pattern fails
- `maxLength: 100` — character limit
- `placeholder: "..."` — placeholder text

## Stoat Setup (Discord DM Notifications)

1. Set up Stoat at [stoat.app](https://stoat.app)
2. Create a Discord webhook through Stoat
3. Add `STOAT_WEBHOOK_URL` to your env
4. Users add their Discord ID in their profile settings
5. When staff replies to a ticket, Stoat DMs the user

## File Structure

```
ticket-system/
├── app/
│   ├── page.tsx                    # Public ticket list (homepage)
│   ├── register/page.tsx           # Registration
│   ├── login/page.tsx              # Login
│   ├── tickets/
│   │   ├── new/page.tsx            # Create ticket
│   │   └── [id]/page.tsx           # Ticket detail + chat
│   ├── dashboard/
│   │   ├── page.tsx                # Dashboard (my tickets, profile)
│   │   └── templates/              # Template CRUD
│   └── api/                        # API routes
├── components/                     # React components
├── lib/
│   ├── supabase/                   # Supabase client wrappers
│   ├── templates.ts                # MD template parser
│   ├── validation.ts               # Field validation
│   ├── avatars.ts                  # Identicon helpers
│   └── stoat.ts                    # Stoat integration
├── templates/                     # .md ticket templates
├── supabase/schema.sql             # Database schema
└── middleware.ts                   # Auth protection
```
