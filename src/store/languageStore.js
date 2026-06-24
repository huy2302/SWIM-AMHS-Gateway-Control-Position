import { create } from "zustand";

export const useLanguageStore = create((set) => ({
    language: localStorage.getItem("language") || "en",

    setLanguage: (language) => {
        localStorage.setItem("language", language);

        set({ language });
    },
}));
