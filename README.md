# ideamap sync

Import your Obsidian vault's structure into your [ideamap](https://ideamap-nine.vercel.app) account. ideamap is a platform where Canada's builders go from idea to team.

## How to use

1. Install **ideamap sync** from Community plugins in Obsidian and enable it. Until the listing is approved, install it with [BRAT](https://github.com/TfTHacker/obsidian42-brat) (add `Tooonnnnyyy/ideamap-obsidian`), or copy `main.js` and `manifest.json` from the [latest release](https://github.com/Tooonnnnyyy/ideamap-obsidian/releases/latest) into `.obsidian/plugins/ideamap-sync/`.
2. On [ideamap](https://ideamap-nine.vercel.app), sign in, open **Settings**, and generate an API token. It is only shown once.
3. In Obsidian, open the plugin's settings and paste the token.
4. Select the ribbon icon, or run **ideamap sync: Sync vault to ideamap** from the command palette.
5. On ideamap, **Settings** now shows the last sync time and how many notes and links were imported.
6. From ideamap you can also press **Sync now** (Import, Settings or Your vault): it opens `obsidian://ideamap-sync`, and the plugin asks you to confirm before it syncs. Clicking a note in ideamap's vault graph opens it here (`obsidian://open`). Needs 0.1.2 or later.

Each sync replaces the previous one.

## Requirements and network use

**An ideamap account is required.** Accounts are free.

The plugin connects to one remote service: the ideamap server (`https://ideamap-nine.vercel.app`, or the API URL you set). It connects only when you start a sync, never in the background, so that your vault can be imported into your account.

**Sent on each sync:**

- Each Markdown note's path and name
- Its tags, its link targets, and how many embeds it has
- The links between your notes
- The vault's name (since 0.1.1), so ideamap can link back into this vault

**Never sent:** the contents of your notes, your attachments, or anything outside your vault.

Note names, folder names, and tags can be sensitive on their own, so check them before you sync. The imported data is stored on your ideamap account and is not shown to other people.

The plugin has no ads, no telemetry, and no payments. Your API token is stored in this vault's plugin data (`.obsidian/plugins/ideamap-sync/data.json`), so keep that file out of any public backup of your vault. You can revoke the token at any time on your ideamap **Settings** page. How ideamap stores and handles this data: [privacy policy](https://ideamap-nine.vercel.app/privacy).

## Build from source

```bash
npm install
npm run lint      # Obsidian's own review rules (eslint-plugin-obsidianmd)
npm run build     # type-checks and produces main.js
npm run release   # also copies main.js and manifest.json into release/
```

Releases are built by GitHub Actions: push a tag that matches `manifest.json` (for example `0.1.4`) and the workflow builds, attests and publishes `main.js` and `manifest.json`. Verify a download with `gh attestation verify main.js -R Tooonnnnyyy/ideamap-obsidian`.

```bash
git tag 0.1.4 && git push origin 0.1.4
```

To try a local build, copy `main.js` and `manifest.json` to `.obsidian/plugins/ideamap-sync/` in a test vault.

## License

[MIT](LICENSE)
