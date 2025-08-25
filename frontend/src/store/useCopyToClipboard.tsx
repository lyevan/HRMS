// hooks/useCopyToClipboard.ts
import { useState } from "react";
import { toast } from "sonner";

export const useCopyToClipboard = () => {
  const [isCopying, setIsCopying] = useState(false);

  const copyToClipboard = async (text: string, successMessage?: string) => {
    if (isCopying) return;

    setIsCopying(true);

    try {
      // Check if clipboard API is available
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or non-HTTPS
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (!successful) {
          throw new Error("Copy command failed");
        }
      }

      toast.success(successMessage || "Copied to clipboard!", {
        duration: 2000,
      });
    } catch (err) {
      console.error("Copy failed:", err);
      toast.error("Failed to copy to clipboard");
    } finally {
      setIsCopying(false);
    }
  };

  return { copyToClipboard, isCopying };
};
