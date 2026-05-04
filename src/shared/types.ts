export type SiteKey = "youtube" | "facebook" | "tiktok";

export type BlockingState = Record<SiteKey, boolean>;

export const DEFAULT_STATE: BlockingState = {
  youtube: true,
  facebook: true,
  tiktok: true,
};

export const STORAGE_KEY = "blocking";
