import { ExtensionContext } from "vscode";
import { PlatformStore } from "./platform-store";

export class FavoritesStore {
  constructor(private context: ExtensionContext, private store: PlatformStore) {}

  key(): string {
    return `openapi-42crunch.favorite-${this.store.getConnection().platformUrl}`;
  }

  getFavoriteCollectionIds(): string[] {
    if (this.store.isConnected()) {
      const favorite = this.context.globalState.get<string[]>(this.key());
      if (!favorite) {
        return [];
      }
      return favorite;
    }
    return [];
  }

  addFavoriteCollection(id: string): void {
    const favorite = this.getFavoriteCollectionIds();
    if (!favorite.includes(id)) {
      favorite.push(id);
    }
    this.context.globalState.update(this.key(), favorite);
  }

  removeFavoriteCollection(id: string): void {
    const favorite = this.getFavoriteCollectionIds().filter((existng) => existng !== id);
    this.context.globalState.update(this.key(), favorite);
  }
}
