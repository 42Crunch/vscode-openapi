import { ExtensionContext } from "vscode";

const FAVORITE_KEY = "openapi-42crunch.favorite";

export class FavoritesStore {
  constructor(private context: ExtensionContext) {}

  getFavoriteCollectionIds(): string[] {
    const favorite = this.context.globalState.get<string[]>(FAVORITE_KEY);
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
    this.context.globalState.update(FAVORITE_KEY, favorite);
  }

  removeFavoriteCollection(id: string): void {
    const favorite = this.getFavoriteCollectionIds().filter((existng) => existng !== id);
    this.context.globalState.update(FAVORITE_KEY, favorite);
  }
}
