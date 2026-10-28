import { useEffect } from "react";
import { SITE } from "@/lib/site";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Sets the page title and description (and their social-share equivalents). */
export function usePageMeta(title?: string, description?: string, image?: string | null) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE.name}` : `${SITE.name} – ${SITE.tagline}`;
    const desc = description || SITE.description;
    document.title = fullTitle;
    setMeta("name", "description", desc);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", desc);
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", desc);
    if (image) {
      setMeta("property", "og:image", image);
      setMeta("name", "twitter:image", image);
    }
  }, [title, description, image]);
}
