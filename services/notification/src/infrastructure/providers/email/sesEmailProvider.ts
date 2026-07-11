import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import type { EmailDeliveryStatus, EmailProvider } from "../../../domain/ports";
import type { EmailMessage } from "../../../domain/notification.entity";
import AWSXRay from "aws-xray-sdk-core";

export class SesEmailProvider implements EmailProvider {
  constructor(
    private readonly fromEmail: string,
    private readonly client: SESv2Client = AWSXRay.captureAWSv3Client(new SESv2Client({}))
  ) {}

  async send(message: EmailMessage): Promise<EmailDeliveryStatus> {
    const isMockMode = !this.fromEmail || this.fromEmail.includes("example.com");

    if (isMockMode) {
      console.warn(`[SES MOCK MODE] SES_FROM_EMAIL is set to default unverified domain: "${this.fromEmail}". Skipping SES send.`);
      console.log(`[MOCK EMAIL LOG]
=========================================
TO: ${message.to}
FROM: ${this.fromEmail}
SUBJECT: ${message.subject}
TEXT: ${message.text}
HTML: ${message.html}
=========================================`);
      return "SKIPPED";
    }

    try {
      await this.client.send(
        new SendEmailCommand({
          FromEmailAddress: this.fromEmail,
          Destination: { ToAddresses: [message.to] },
          Content: {
            Simple: {
              Subject: { Data: message.subject, Charset: "UTF-8" },
              Body: {
                Html: { Data: message.html, Charset: "UTF-8" },
                Text: { Data: message.text, Charset: "UTF-8" },
              },
            },
          },
        })
      );
      return "SENT";
    } catch (err: any) {
      const isVerificationError =
        err.name === "MessageRejected" ||
        err.message?.includes("Email address is not verified") ||
        err.message?.includes("not verified");

      if (isVerificationError) {
        console.error(
          `[SES SANDBOX WARNING] Failed to send email to ${message.to} from ${this.fromEmail} because of AWS SES Sandbox email verification restrictions:`,
          err
        );
        console.log(`[MOCK EMAIL FALLBACK LOG]
=========================================
TO: ${message.to}
FROM: ${this.fromEmail}
SUBJECT: ${message.subject}
TEXT: ${message.text}
=========================================`);
        return "SKIPPED"; // Don't throw to prevent crashing the caller workflow (e.g. login/checkout) in sandbox/dev envs
      }
      throw err; // Re-throw other errors (like credentials, network issues)
    }
  }
}
