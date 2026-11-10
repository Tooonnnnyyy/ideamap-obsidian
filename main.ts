import { App, Notice, Plugin, PluginSettingTab, Setting, getAllTags, requestUrl } from "obsidian";

interface IdeamapSettings {
  apiUrl: string;
  apiToken: string;
}

const DEFAULT_API_URL = "https://ideamap-nine.vercel.app";

const DEFAULT_SETTINGS: IdeamapSettings = {
  apiUrl: DEFAULT_API_URL,
  apiToken: "",
};

// The token travels with every sync, so only https (or a local dev server) is allowed.
function resolveApiUrl(raw: string): string | null {
  const value = raw.trim().replace(/\/+$/, "") || DEFAULT_API_URL;
  try {
    const { protocol, hostname } = new URL(value);
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
    return protocol === "https:" || (protocol === "http:" && isLocal) ? value : null;
  } catch {
    return null;
  }
}

export default class IdeamapSyncPlugin extends Plugin {
  settings!: IdeamapSettings;

  async onload() {
    await this.loadSettings();
    this.addRibbonIcon("refresh-cw", "Sync vault to ideamap", () => this.sync());
    this.addCommand({ id: "sync", name: "Sync vault to ideamap", callback: () => this.sync() });
    // ideamap's "Sync now" button opens obsidian://ideamap-sync (?vault=<name> picks the vault).
    this.registerObsidianProtocolHandler("ideamap-sync", () => this.sync());
    this.addSettingTab(new IdeamapSettingTab(this.app, this));
  }

  // Note names, paths, tags and link targets only. Note contents are never read.
  private buildSnapshot() {
    const { metadataCache, vault } = this.app;
    const files = vault.getMarkdownFiles();
    const paths = new Set(files.map((f) => f.path));

    const notes = files.map((f) => {
      const cache = metadataCache.getFileCache(f);
      const tags = cache ? (getAllTags(cache) ?? []) : [];
      return {
        path: f.path,
        name: f.basename,
        links: (cache?.links ?? []).map((l) => l.link),
        embeds: (cache?.embeds ?? []).length,
        tags: [...new Set(tags.map((t) => t.replace(/^#/, "")))],
      };
    });

    // Obsidian's own link resolution: the same edges as its graph view.
    const links: { source: string; target: string }[] = [];
    for (const [source, targets] of Object.entries(metadataCache.resolvedLinks)) {
      if (!paths.has(source)) continue;
      for (const target of Object.keys(targets)) {
        if (target !== source && paths.has(target)) links.push({ source, target });
      }
    }

    return { notes, links };
  }

  async sync() {
    const token = this.settings.apiToken.trim();
    if (!token) {
      new Notice("Add your ideamap API token in the plugin settings first.");
      return;
    }
    const apiUrl = resolveApiUrl(this.settings.apiUrl);
    if (!apiUrl) {
      new Notice("The API URL must be a valid HTTPS address.");
      return;
    }

    const { notes, links } = this.buildSnapshot();
    if (notes.length === 0) {
      new Notice("No notes to sync yet.");
      return;
    }

    try {
      const res = await requestUrl({
        url: `${apiUrl}/api/obsidian/sync`,
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Token": token },
        // The vault's name lets ideamap link back here (obsidian://open?vault=…); it is not note content.
        body: JSON.stringify({ notes, links, vault: this.app.vault.getName() }),
        throw: false,
      });
      if (res.status === 200) {
        new Notice(`Synced ${notes.length} notes and ${links.length} links to ideamap.`);
      } else if (res.status === 401) {
        new Notice("The server rejected the API token. Generate a new one on your ideamap settings page.");
      } else if (res.status === 413) {
        new Notice("This vault is too large to sync to ideamap.");
      } else {
        new Notice(`Sync failed (error ${res.status}).`);
      }
    } catch {
      new Notice("Could not reach ideamap. Check your connection and the API URL.");
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<IdeamapSettings> | null);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class IdeamapSettingTab extends PluginSettingTab {
  plugin: IdeamapSyncPlugin;

  constructor(app: App, plugin: IdeamapSyncPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl)
      .setName("API token")
      .setDesc("Generate a token on your ideamap settings page. It is only shown once.")
      .addText((t) => {
        t.inputEl.type = "password";
        t.setValue(this.plugin.settings.apiToken).onChange(async (v) => {
          this.plugin.settings.apiToken = v.trim();
          await this.plugin.saveSettings();
        });
      });
    new Setting(containerEl)
      .setName("API URL")
      .setDesc("Change this only if you run your own ideamap server.")
      .addText((t) =>
        t
          .setPlaceholder(DEFAULT_API_URL)
          .setValue(this.plugin.settings.apiUrl)
          .onChange(async (v) => {
            this.plugin.settings.apiUrl = v.trim();
            await this.plugin.saveSettings();
          })
      );
  }
}
