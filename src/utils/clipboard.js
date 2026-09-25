import toast from "react-hot-toast";
import { t } from "@/i18n/translator";

/**
 * Universal copy to clipboard that works in both secure contexts (HTTPS / localhost)
 * and non-secure LAN contexts (HTTP with IP like http://192.168.22.163:3000).
 *
 * @param {string|number} text - Text to copy
 * @param {object} [options]
 * @param {boolean} [options.showToast=true] - Whether to show a toast alert
 * @param {string} [options.successMessage] - Custom success message
 * @param {number} [options.duration=1500] - Toast duration in ms (default: 1500ms matching CP_CT07)
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text, options = {}) {
  const { showToast = true, successMessage, duration = 1500 } = options;

  if (text === null || text === undefined || text === "") {
    return false;
  }

  const str = String(text);
  let success = false;

  // 1. Try modern navigator.clipboard if available
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(str);
      success = true;
    } catch (err) {
      console.warn("navigator.clipboard.writeText failed, falling back to execCommand:", err);
      success = false;
    }
  }

  // 2. Fallback to execCommand('copy') for HTTP/LAN or restricted browser contexts
  if (!success) {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = str;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      textArea.style.opacity = "0";
      textArea.setAttribute("readonly", "");

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, str.length);

      success = document.execCommand("copy");
      document.body.removeChild(textArea);
    } catch (fallbackErr) {
      console.error("execCommand fallback failed:", fallbackErr);
      success = false;
    }
  }

  if (showToast) {
    const msg = successMessage || t("global.copied") || "Đã sao chép";
    if (success) {
      toast.success(msg, { id: "clipboard-toast", duration });
    } else {
      toast.error("Không thể sao chép / Copy failed", { id: "clipboard-toast" });
    }
  }

  return success;
}

export default copyToClipboard;
