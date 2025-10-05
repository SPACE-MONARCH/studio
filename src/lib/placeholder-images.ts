import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

// This is now empty, as scenarios will be loaded from Firestore.
// The file is kept for other potential placeholder uses.
export const PlaceHolderImages: ImagePlaceholder[] = [];
