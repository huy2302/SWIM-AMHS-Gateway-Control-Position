import language from "./index";
import { useLanguageStore } from "../store/languageStore";

export function t(path) {
    let lang = useLanguageStore.getState().language || "en";
    lang = lang.split("-")[0]; // Normalize regional variants (e.g., vi-VN -> vi, en-US -> en)

    const value = path
        .split(".")
        .reduce((obj, key) => obj?.[key], language);

    return value?.[lang] ?? path;
}
