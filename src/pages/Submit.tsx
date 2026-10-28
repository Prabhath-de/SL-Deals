import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CircleCheck } from "lucide-react";
import { submitDeal } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { usePageMeta } from "@/hooks/usePageMeta";
import DealForm from "@/components/DealForm";

export default function Submit() {
  usePageMeta("Share a deal", "Found a good offer in Sri Lanka? Share it on DealFinder LK.");
  const { user } = useAuth();
  const qc = useQueryClient();
  const [done, setDone] = useState(false);
  const [formKey, setFormKey] = useState(0);

  if (done) {
    return (
      <div className="container max-w-xl py-20 text-center">
        <CircleCheck className="mx-auto h-14 w-14 text-success" />
        <h1 className="mt-5 text-3xl font-bold">Thanks — your deal was sent</h1>
        <p className="mt-3 text-muted-foreground">
          Our team checks every offer before it goes live, usually within a day. You can follow its status in My submissions.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/account?tab=submissions" className="btn btn-primary">See my submissions</Link>
          <button
            className="btn btn-outline"
            onClick={() => {
              setDone(false);
              setFormKey((k) => k + 1);
            }}
          >
            Share another deal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">Share a deal</h1>
      <p className="mt-2 text-muted-foreground">
        Tell us about an offer you've seen. We check it before it's published, so please add a link or a photo of the poster.
      </p>
      <div className="panel mt-8 p-5 sm:p-8">
        <DealForm
          key={formKey}
          userId={user!.id}
          submitLabel="Send for review"
          onSubmit={async (input) => {
            await submitDeal(input);
            qc.invalidateQueries({ queryKey: ["my-submissions"] });
            setDone(true);
            window.scrollTo(0, 0);
          }}
        />
      </div>
    </div>
  );
}
