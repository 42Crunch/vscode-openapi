import { ExtensionContext } from "vscode";
import { PlatformContext } from "../types";

export class FavoritesStore {
  constructor(private context: ExtensionContext, private platform: PlatformContext) {}

  key(): string {
    return `openapi-42crunch.favorite-${this.platform.connection.platformUrl}`;
  }

  getFavoriteCollectionIds(): string[] {
    const favorite = this.context.globalState.get<string[]>(this.key());
    if (!favorite) {
      return [];
    }
    return favorite;
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
