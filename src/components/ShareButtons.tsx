import { useState } from "react";
import { Check, Facebook, Link2, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";

export default function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const text = `${title} — ${url}`;
  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Long-press the address bar to copy the link.");
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <a
        className="btn btn-outline btn-sm"
        href={`https://wa.me/?text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </a>
      <a
        className="btn btn-outline btn-sm"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Facebook className="h-4 w-4" /> Facebook
      </a>
      <button className="btn btn-outline btn-sm" onClick={copy}>
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} {copied ? "Copied" : "Copy link"}
      </button>
      {canNativeShare && (
        <button
          className="btn btn-outline btn-sm sm:hidden"
          onClick={() => navigator.share({ title, url }).catch(() => undefined)}
        >
          <Share2 className="h-4 w-4" /> More
        </button>
      )}
    </div>
  );
}
