import { and, eq } from "drizzle-orm";
import { integrationSettings, users } from "../../drizzle/schema";
import { getDb } from "../db";

export class EmailIntegrationNotConfiguredError extends Error {
  constructor() {
    super("Brevo není nakonfigurováno. Připojte jej v Nastavení > Integrace.");
    this.name = "EmailIntegrationNotConfiguredError";
  }
}

export class EmailDeliveryError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

interface EmailRecipient {
  email: string;
  name?: string;
}

interface SendTransactionalEmailInput {
  userId: number;
  to: string | Array<string | EmailRecipient>;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  senderName?: string;
  senderEmail?: string;
}

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput
): Promise<{ messageId: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [setting] = await db
    .select()
    .from(integrationSettings)
    .where(
      and(
        eq(integrationSettings.userId, input.userId),
        eq(integrationSettings.integrationId, "brevo")
      )
    )
    .limit(1);

  const apiKey = setting?.apiKey || process.env.BREVO_API_KEY;
  if (!apiKey) throw new EmailIntegrationNotConfiguredError();

  const [user] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);

  const config = (setting?.config ?? {}) as Record<string, unknown>;
  const senderEmail =
    input.senderEmail ||
    (typeof config.senderEmail === "string" ? config.senderEmail : undefined) ||
    process.env.BREVO_SENDER_EMAIL ||
    user?.email;

  if (!senderEmail) {
    throw new EmailDeliveryError(
      "Brevo odesílatel nemá nastavenou e-mailovou adresu.",
      422
    );
  }

  const recipients =
    typeof input.to === "string"
      ? [{ email: input.to }]
      : input.to.map(recipient =>
          typeof recipient === "string" ? { email: recipient } : recipient
        );
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: {
        name:
          input.senderName ||
          (typeof config.senderName === "string"
            ? config.senderName
            : undefined) ||
          user?.name ||
          "ONYX OS",
        email: senderEmail,
      },
      to: recipients,
      subject: input.subject,
      htmlContent: input.htmlContent,
      textContent: input.textContent,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new EmailDeliveryError(
      `Brevo odmítlo odeslání (${response.status}): ${details.slice(0, 500)}`,
      response.status
    );
  }

  const result = (await response.json()) as { messageId?: string };
  if (!result.messageId) {
    throw new EmailDeliveryError("Brevo nevrátilo ID zprávy.", 502);
  }

  return { messageId: result.messageId };
}
