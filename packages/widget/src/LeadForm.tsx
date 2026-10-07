import { useState } from "preact/hooks";
import { sendLead } from "./api";
import type { LeadReceipt } from "./types";

export function LeadForm(props: { apiUrl: string; botKey: string; sessionId: string; onSent: (receipt: LeadReceipt) => void }) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: Event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget as HTMLFormElement).entries()) as Record<string, string>;
    if (!data.phone?.trim() && !data.email?.trim()) {
      setError("Add a phone number or email so the team can reach you.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const reference = await sendLead(props.apiUrl, props.botKey, { ...data, source: "chat_form", sessionId: props.sessionId });
      props.onSent({ reference, name: data.name ?? "", preferredTime: data.preferredTime || undefined, reason: data.reason || undefined });
    } catch (err) {
      setError(err instanceof TypeError ? "We couldn't reach the server." : (err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <form class="form" onSubmit={submit} aria-label="Send a request">
      <input class="field" name="name" required minLength={2} maxLength={80} placeholder="Your name" autoComplete="name" aria-label="Your name" />
      <div class="two">
        <input class="field" name="phone" type="tel" maxLength={30} placeholder="Phone" autoComplete="tel" aria-label="Phone" />
        <input class="field" name="email" type="email" maxLength={160} placeholder="Email" autoComplete="email" aria-label="Email" />
      </div>
      <input class="field" name="reason" maxLength={500} placeholder="What do you need?" aria-label="What do you need?" />
      <input class="field" name="preferredTime" maxLength={160} placeholder="Best days / times (optional)" aria-label="Best days or times" />
      {error ? (
        <p class="note error-text" role="alert">
          {error}
        </p>
      ) : null}
      <button class="primary" type="submit" disabled={sending}>
        {sending ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}

export function LeadCard({ receipt }: { receipt: LeadReceipt }) {
  return (
    <div class="card success" role="status">
      <strong>Request sent · {receipt.reference}</strong>
      {receipt.name}
      {receipt.preferredTime ? ` · ${receipt.preferredTime}` : ""}
      <br />
      The team will get back to you. Nothing is booked until they confirm.
    </div>
  );
}
