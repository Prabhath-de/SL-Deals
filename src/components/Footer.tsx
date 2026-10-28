import { Link } from "react-router-dom";
import { CATEGORIES } from "@/lib/constants";
import { SITE } from "@/lib/site";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="container grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm text-muted-foreground">
            Offers from shops, banks, restaurants and online stores across Sri Lanka — checked by our team before they go live.
          </p>
          <Link to="/submit" className="btn btn-outline btn-sm mt-5">
            Share a deal you found
          </Link>
        </div>

        <FooterCol title="Popular categories">
          {CATEGORIES.slice(0, 6).map((c) => (
            <Link key={c.slug} to={`/category/${c.slug}`}>
              {c.name}
            </Link>
          ))}
        </FooterCol>

        <FooterCol title="Browse">
          <Link to="/deals">All offers</Link>
          <Link to="/deals?bank=any">Bank card offers</Link>
          <Link to="/deals?sort=ending">Ending soon</Link>
          <Link to="/deals?sort=discount">Biggest discounts</Link>
          <Link to="/categories">All categories</Link>
        </FooterCol>

        <FooterCol title="DealFinder LK">
          <Link to="/about">About us</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/terms">Terms of use</Link>
          <Link to="/privacy">Privacy policy</Link>
          {SITE.facebook && <a href={SITE.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>}
          {SITE.whatsappChannel && <a href={SITE.whatsappChannel} target="_blank" rel="noopener noreferrer">WhatsApp channel</a>}
        </FooterCol>
      </div>
      <div className="border-t border-border">
        <div className="container flex flex-col gap-2 py-5 text-xs text-muted-foreground md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} {SITE.name}. Offers are provided by the businesses listed; always check the terms before you buy.</p>
          <p>Brand names and logos belong to their owners.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="grid gap-2 text-sm text-muted-foreground [&_a:hover]:text-foreground">{children}</div>
    </div>
  );
}
