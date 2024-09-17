export type TagResponseEntry = {
  tagId: string;
  tagName: string;
  tagDescription: string;
  color: string;
  dependencies: any;
  isExclusive: boolean;
  isFreeForm: boolean;
  isProtected: boolean;
  categoryDescription: string;
  categoryId: string;
  categoryName: string;
};

export type CategoryResponseEntry = {
  id: string;
  name: string;
  color: string;
  description: string;
  isExclusive: boolean;
  isFreeForm: boolean;
  isProtected: boolean;
  onlyAdminCanTag: boolean;
};

export type Tag = {
  tagId: string;
  tagName: string;
  tagDescription: string;
  onlyAdminCanTag: boolean;
};

export type Category = {
  categoryId: string;
  categoryName: string;
  categoryDescription: string;
  onlyAdminCanTag: boolean;
  multipleChoicesAllowed: boolean;
  tags: Tag[];
};
