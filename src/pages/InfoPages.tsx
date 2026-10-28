import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { SITE } from "@/lib/site";
import { usePageMeta } from "@/hooks/usePageMeta";

function Page({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  usePageMeta(title);
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      {intro && <p className="mt-3 text-lg text-muted-foreground">{intro}</p>}
      <div className="mt-8 space-y-5 leading-relaxed text-foreground/90 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}

const contact = SITE.contactEmail ? <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> : <Link to="/contact">our contact page</Link>;

export function About() {
  return (
    <Page title="About DealFinder LK" intro={`${SITE.name} collects offers from across Sri Lanka so you don't have to scroll through dozens of pages to find them.`}>
      <p>
        Banks, supermarkets, restaurants and online stores run new promotions every week, but they're spread across SMS messages,
        Facebook posts and websites. We bring them into one place, sorted by category, bank card and city.
      </p>
      <h2>How offers get here</h2>
      <ul>
        <li>Our team adds offers from official sources.</li>
        <li>Anyone with an account can share an offer they've found. We check every submission before it goes live.</li>
        <li>When an offer passes its end date, it disappears from the listings automatically.</li>
      </ul>
      <h2>We're not the seller</h2>
      <p>
        Offers are run by the businesses and banks listed. Always check the terms with them before you buy. If something is wrong,
        use “Report a problem” on the offer page and we'll fix it.
      </p>
    </Page>
  );
}

export function Contact() {
  return (
    <Page title="Contact us" intro="Questions, corrections, or want your business's offers listed? Get in touch.">
      {SITE.contactEmail ? (
        <a href={`mailto:${SITE.contactEmail}`} className="btn btn-primary !no-underline !text-primary-foreground">
          <Mail className="h-4 w-4" /> {SITE.contactEmail}
        </a>
      ) : (
        <p>Email contact will be available soon.</p>
      )}
      <h2>For businesses</h2>
      <p>
        You can share your own offers using <Link to="/submit">Share a deal</Link>. To have a featured spot on the home page, email us
        with the offer details and dates.
      </p>
      <h2>Wrong or expired offer?</h2>
      <p>Open the offer and choose “Report a problem”. It reaches our team straight away.</p>
    </Page>
  );
}

export function Terms() {
  return (
    <Page title="Terms of use" intro="By using this website you agree to these terms.">
      <h2>Offers</h2>
      <p>
        Offers are provided by third-party businesses and banks. We try to keep them accurate, but we can't guarantee that an offer
        is still available or that its details haven't changed. Check with the business before you rely on it.
      </p>
      <h2>Sharing deals</h2>
      <ul>
        <li>Only share real offers that are open to the public.</li>
        <li>Don't upload images you don't have the right to share, or anything offensive or misleading.</li>
        <li>We may edit, reject or remove any submission.</li>
        <li>Accounts used for spam may be removed.</li>
      </ul>
      <h2>Trademarks</h2>
      <p>Brand names, logos and images belong to their owners and are used only to identify the offer.</p>
      <h2>Questions</h2>
      <p>Contact us at {contact}.</p>
    </Page>
  );
}

export function Privacy() {
  return (
    <Page title="Privacy policy" intro="What we collect, and why.">
      <h2>What we collect</h2>
      <ul>
        <li>Your name and email address when you create an account.</li>
        <li>The offers you save and the deals you share.</li>
        <li>Reports you send about offers.</li>
        <li>Anonymous counts of how many times an offer is viewed and opened.</li>
      </ul>
      <h2>How we use it</h2>
      <p>
        To run your account, show your saved offers, review the deals you share and keep the listings accurate. We don't sell your
        data. Your email address is never shown publicly.
      </p>
      <h2>Where it's stored</h2>
      <p>Data is stored with our hosting provider, Supabase. Passwords are stored encrypted and we can't see them.</p>
      <h2>Deleting your account</h2>
      <p>Email us at {contact} and we'll delete your account and the data linked to it.</p>
    </Page>
  );
}
