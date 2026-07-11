import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import type { SmsProvider } from "../../../domain/ports";
import type { SmsMessage } from "../../../domain/notification.entity";
import AWSXRay from "aws-xray-sdk-core";

// Ghi chú: publish trực tiếp tới số điện thoại (không qua Topic). Với số VN, AWS SNS có thể bị nhà mạng
// lọc do Sender ID chung — interface này cho phép thay bằng gateway nội địa (eSMS/SpeedSMS...) sau này
// mà không cần đổi use-case gọi nó.
export class SnsSmsProvider implements SmsProvider {
  constructor(
    private readonly client: SNSClient = AWSXRay.captureAWSv3Client(new SNSClient({}))
  ) {}

  async send(message: SmsMessage): Promise<void> {
    await this.client.send(
      new PublishCommand({
        PhoneNumber: message.to,
        Message: message.body,
        MessageAttributes: {
          "AWS.SNS.SMS.SMSType": {
            DataType: "String",
            StringValue: "Transactional",
          },
        },
      })
    );
  }
}
