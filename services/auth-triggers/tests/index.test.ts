import type { CustomMessageTriggerEvent, Context } from "aws-lambda";
import { handler } from "../index";

function buildEvent(
  triggerSource: string,
  userAttributes: Record<string, string> = {}
): CustomMessageTriggerEvent {
  return {
    triggerSource,
    userName: "user-1",
    request: {
      codeParameter: "{####}",
      userAttributes,
      linkParameter: "",
      usernameParameter: null,
    },
    response: { smsMessage: null, emailMessage: null, emailSubject: null },
  } as unknown as CustomMessageTriggerEvent;
}

async function invoke(event: CustomMessageTriggerEvent) {
  return (await handler(event, {} as Context, () => undefined)) as CustomMessageTriggerEvent;
}

describe("auth-triggers CustomMessage (AUTH-01/04)", () => {
  it("SignUp: đặt tiêu đề + nội dung email chứa mã và tên người dùng", async () => {
    const result = await invoke(
      buildEvent("CustomMessage_SignUp", { name: "Nguyễn Văn A" })
    );

    expect(result.response.emailSubject).toContain("Xác nhận đăng ký");
    expect(result.response.emailMessage).toContain("Nguyễn Văn A");
    expect(result.response.emailMessage).toContain("{####}");
  });

  it("ForgotPassword: nội dung nhắc bỏ qua nếu không yêu cầu", async () => {
    const result = await invoke(buildEvent("CustomMessage_ForgotPassword"));

    expect(result.response.emailSubject).toContain("đặt lại mật khẩu");
    expect(result.response.emailMessage).toContain("bỏ qua email này");
  });

  it("ResendCode: gửi mã mới", async () => {
    const result = await invoke(buildEvent("CustomMessage_ResendCode"));

    expect(result.response.emailSubject).toContain("Mã xác nhận mới");
    expect(result.response.emailMessage).toContain("{####}");
  });

  it("không có name thì dùng userName làm tên hiển thị", async () => {
    const result = await invoke(buildEvent("CustomMessage_SignUp"));

    expect(result.response.emailMessage).toContain("user-1");
  });

  it("trigger khác không đụng vào response (Cognito dùng template mặc định)", async () => {
    const result = await invoke(buildEvent("CustomMessage_AdminCreateUser"));

    expect(result.response.emailSubject).toBeNull();
    expect(result.response.emailMessage).toBeNull();
  });
});
