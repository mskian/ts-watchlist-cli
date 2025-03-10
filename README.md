# Movie Watchlist CLI

A simple CLI to add and update your watchlist of favorite movies and series.  

## Data Storage

- Supabase

## Setup and Usage

- Clone or Download Repo

```sh

git clone https://github.com/mskian/ts-watchlist-cli.git

## Open Project Folder
cd ts-watchlist-cli

## install packages
pnpm install

```

- create Supabase database

```sh

- Create a watchlist table with columns:
- id (UUID, primary key, default gen_random_uuid())
- title (Text, required)
- watched (Boolean, default false)
- created_at (Timestamp, default now())

```

- Next create `watchlist.yml` file on Home Dir to add the Supabase project URL and Anon Key

```yml
SUPABASE_URL: "https://your-supabase-url.supabase.co"
SUPABASE_KEY: "your-anon-key"
```

- Link the Project and Use it as Global CLI

```sh

## build CLI
pnpm build

## install via pnpm
pnpm link --global

## CLI
watchlist help

## Remove Package
pnpm uninstall -g ts-watchlist-cli

```

## LICENSE

MIT
