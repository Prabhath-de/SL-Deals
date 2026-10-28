import { useState } from "react";
import { toast } from "sonner";
import { reportDeal } from "@/lib/api";
import { REPORT_REASONS } from "@/lib/constants";
import { errorMessage } from "@/lib/format";
import Modal from "./Modal";

export default function ReportDialog({ dealId, open, onClose }: { dealId: string; open: boolean; onClose: () => void }) {
  const [reason, setReason] = useState<string>("expired");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      await reportDeal(dealId, reason, details);
      toast.success("Thanks — we'll check this offer");
      setDetails("");
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Report a problem with this offer"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={send} disabled={busy}>
            {busy ? "Sending…" : "Send report"}
          </button>
        </>
      }
    >
      <fieldset className="grid gap-2">
        <legend className="label">What's wrong?</legend>
        {REPORT_REASONS.map((r) => (
          <label key={r.value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent">
            <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="accent-[hsl(var(--primary))]" />
            {r.label}
          </label>
        ))}
      </fieldset>
      <label className="label mt-4" htmlFor="report-details">Details (optional)</label>
      <textarea
        id="report-details"
        className="field"
        rows={3}
        maxLength={1000}
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="For example: the shop said this ended last week"
      />
    </Modal>
  );
}
