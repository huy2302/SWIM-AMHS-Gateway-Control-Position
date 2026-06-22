import language from "./index";
import { useLanguageStore } from "../store/languageStore";

export function t(path) {
    const lang = useLanguageStore.getState().language;

    const value = path
        .split(".")
        .reduce((obj, key) => obj?.[key], language);

    return value?.[lang] ?? path;
}
