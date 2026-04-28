import { fr } from "./fr";
import { en } from "./en";
import type { Locale } from "../config";

export type { Dictionary } from "./fr";

const dictionaries = { fr, en } as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
