# text-diff-version

I want a textbox and a "version history" on the left, see screenshot

I want to show the diff compared to the last version inline, with red for "removed" characters and green for added characters.

I think we need the diff npm package.

When user clicks "accept", a new version will be created, and comparison will switch to latest version

Use localstorage for versions for now

## Collaborate with GPT Engineer

This is a [gptengineer.app](https://gptengineer.app)-synced repository 🌟🤖

Changes made via gptengineer.app will be committed to this repo.

If you clone this repo and push changes, you will have them reflected in the GPT Engineer UI.

## Tech stack

This project is built with React and Chakra UI.

- Vite
- React
- Chakra UI

## Setup

```sh
git clone https://github.com/GPT-Engineer-App/text-diff-version.git
cd text-diff-version
npm i
```

```sh
npm run dev
```

This will run a dev server with auto reloading and an instant preview.

## Requirements

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
