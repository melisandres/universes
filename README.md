# Universes

Universes is an experimental, universe-centric task and idea management system.
Instead of organizing work as flat task lists, it groups tasks, ideas, and logs
inside evolving “Universes” — areas of focus that shift over time.

## Why this exists

Most productivity tools assume tasks are the primary unit of work.
Universes explores a different model: work is organized around *contexts*,
not tasks.

This project investigates:

- Context-first organization
- Tasks belonging to multiple areas of focus
- The relationship between planning, execution, and reflection (logs)
- How “today” views can surface meaning without overwhelming

## Core concepts

- **Universes**  
  Areas of focus that move through states (next small steps, in focus, in orbit, dormant).

- **Tasks**  
  Actionable items that belong to one or more universes.

- **Ideas**  
  Non-actionable thoughts, grouped into idea pools connected to universes.

- **Logs**  
  Lightweight records of time, notes, or reflections tied to tasks or ideas.

## Project status

This is an active experiment and portfolio project.
The data model and UI are evolving, and parts of the system are intentionally
unfinished or in flux.

The goal is exploration, not production readiness.

## Development approach

Much of this project was built using an AI-assisted, design-led workflow:

- The system was designed first through writing and diagrams
- AI tools were used to scaffold, refactor, and explore implementations
- Architectural decisions were reviewed and adjusted by hand

The focus is on system design, UX reasoning, and iterative refinement.

## Running locally

### Prerequisites

- PHP 8.2 or higher
- Composer
- SQLite (default database, no setup required)

### Setup steps

```bash
git clone https://github.com/melisandres/universes.git
cd universe-organizer
composer install
php artisan key:generate
php artisan migrate
php artisan serve
```

The application will be available at `http://localhost:8000`.

**Note:** This project uses plain CSS files served directly from the `public/css/` directory. No build step or Node.js is required for the frontend assets.

### Database

This project uses SQLite by default. The database file is located at `database/database.sqlite` and will be created automatically when you run migrations.
