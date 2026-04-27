export interface Env {
  FORWARD_TO: string;
  ADD_SUBJECT_PREFIX?: string;
  SUBJECT_PREFIX_MODE?: "alias" | "full" | string;
  ALLOW_RECIPIENTS?: string;
  DENY_RECIPIENTS?: string;
  ALLOWED_SENDER_DOMAINS?: string;
  DENIED_SENDER_DOMAINS?: string;
  MAX_MESSAGE_SIZE_BYTES?: string;
}

type PrefixMode = "alias" | "full";

const parseList = (value?: string): string[] =>
  (value ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

const asBool = (value: string | undefined, defaultValue = false): boolean => {
  if (value == null || value === "") return defaultValue;
  return value.toLowerCase() === "true";
};

const lc = (value?: string | null): string => (value ?? "").trim().toLowerCase();

export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    const config = {
      forwardTo: parseList(env.FORWARD_TO),
      allowRecipients: parseList(env.ALLOW_RECIPIENTS),
      denyRecipients: parseList(env.DENY_RECIPIENTS),
      allowedSenderDomains: parseList(env.ALLOWED_SENDER_DOMAINS),
      deniedSenderDomains: parseList(env.DENIED_SENDER_DOMAINS),
      addSubjectPrefix: asBool(env.ADD_SUBJECT_PREFIX, true),
      subjectPrefixMode: (env.SUBJECT_PREFIX_MODE === "full" ? "full" : "alias") as PrefixMode,
      maxMessageSizeBytes: env.MAX_MESSAGE_SIZE_BYTES ? Number(env.MAX_MESSAGE_SIZE_BYTES) : 20 * 1024 * 1024
    };

    const to = lc(message.to);
    const from = lc(message.from);
    const senderDomain = from.includes("@") ? from.split("@").pop() ?? "" : "";
    const originalSubject = message.headers.get("subject") ?? "";
    const aliasLocal = to.split("@")[0] || "alias";

    if (!to || !from) {
      message.setReject("Missing sender or recipient");
      return;
    }

    if (config.allowRecipients.length > 0 && !config.allowRecipients.includes(to)) {
      message.setReject("Recipient not allowed");
      return;
    }

    if (config.denyRecipients.includes(to)) {
      message.setReject("Recipient denied");
      return;
    }

    if (config.allowedSenderDomains.length > 0 && !config.allowedSenderDomains.includes(senderDomain)) {
      message.setReject("Sender domain not allowed");
      return;
    }

    if (config.deniedSenderDomains.includes(senderDomain)) {
      message.setReject("Sender domain denied");
      return;
    }

    const loopHeaders = ["x-forwarded-for", "x-forwarded-to", "x-loop", "x-autoforwarded"];
    for (const header of loopHeaders) {
      if (message.headers.get(header)) {
        message.setReject("Possible mail loop detected");
        return;
      }
    }

    const rawSize = message.rawSize;
    if (config.maxMessageSizeBytes && rawSize > config.maxMessageSizeBytes) {
      message.setReject("Message too large");
      return;
    }

    if (config.forwardTo.length === 0) {
      message.setReject("No forwarding destinations configured");
      return;
    }

    const subjectTag = config.subjectPrefixMode === "full" ? `[${to}]` : `[${aliasLocal}]`;

    const headers = new Headers();
    headers.set("X-Original-Rcpt-To", to);
    headers.set("X-Original-Mail-From", from);

    if (config.addSubjectPrefix) {
      headers.set("Subject", `${subjectTag} ${originalSubject}`.trim());
    }

    const uniqueRecipients = [...new Set(config.forwardTo)];

    const results = await Promise.allSettled(
      uniqueRecipients.map((recipient) => message.forward(recipient, headers))
    );

    const successCount = results.filter((result) => result.status === "fulfilled").length;
    const failureCount = results.length - successCount;

    console.log(
      JSON.stringify({
        event: "email_forward",
        to,
        from,
        subject: originalSubject,
        recipients: uniqueRecipients,
        successCount,
        failureCount
      })
    );

    if (successCount === 0) {
      message.setReject("Forwarding failed for all destinations");
    }
  }
};
