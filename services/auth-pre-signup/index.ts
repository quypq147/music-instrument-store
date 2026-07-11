import type { PreSignUpTriggerHandler } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminLinkProviderForUserCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  type UserType,
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomBytes, randomUUID } from "node:crypto";
import type { UserProfile } from "@music-store/shared-types";
import AWSXRay from "aws-xray-sdk-core";

AWSXRay.setContextMissingStrategy("LOG_ERROR");

const cognitoClient = AWSXRay.captureAWSv3Client(
  new CognitoIdentityProviderClient({})
);
const ddbDocClient = DynamoDBDocumentClient.from(
  AWSXRay.captureAWSv3Client(new DynamoDBClient({}))
);
const tableName = process.env.TABLE_NAME || "";

// Marker được nhúng vào message lỗi trả về Hosted UI sau khi liên kết thành công.
// Frontend (AmplifyConfig) nhận diện marker này trong error_description của redirect
// và tự động gọi lại signInWithRedirect — lần thứ hai sẽ đăng nhập thẳng vào tài
// khoản đã liên kết. Đây là hành vi bắt buộc của pattern AdminLinkProviderForUser:
// lần federated sign-up đầu tiên phải bị chặn để Cognito không tạo user trùng lặp.
export const AUTO_LINKED_MARKER = "AUTO_LINKED_RETRY";

// Mật khẩu ngẫu nhiên cho tài khoản native được tạo hộ user Google/Facebook-first.
// User không cần biết mật khẩu này — muốn đăng nhập bằng email thì dùng "Quên mật khẩu"
// để tự đặt mật khẩu mới. Chuỗi cố định phía sau đảm bảo thoả password policy
// (hoa/thường/số/ký tự đặc biệt) dù phần ngẫu nhiên có thiếu nhóm ký tự nào.
const generateRandomPassword = () =>
  `${randomBytes(24).toString("base64url")}aZ2!`;

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

// Username của user federated có dạng "<provider>_<id trên provider>",
// vd. "google_115443..." / "facebook_10223...". Provider name khi gọi
// AdminLinkProviderForUser phải khớp đúng tên IdP đã khai báo trong User Pool
// ("Google"/"Facebook") nên cần chuẩn hoá chữ hoa đầu.
const parseFederatedUserName = (
  userName: string
): { providerName: string; providerUserId: string } | null => {
  const separatorIndex = userName.indexOf("_");
  if (separatorIndex <= 0 || separatorIndex === userName.length - 1) {
    return null;
  }
  return {
    providerName: capitalize(userName.slice(0, separatorIndex)),
    providerUserId: userName.slice(separatorIndex + 1),
  };
};

const findUsersByEmail = async (
  userPoolId: string,
  email: string
): Promise<UserType[]> => {
  const result = await cognitoClient.send(
    new ListUsersCommand({
      UserPoolId: userPoolId,
      Filter: `email = "${email.replace(/"/g, "")}"`,
    })
  );
  return result.Users ?? [];
};

const linkProviderToUser = async (
  userPoolId: string,
  destinationUsername: string,
  providerName: string,
  providerUserId: string
) => {
  await cognitoClient.send(
    new AdminLinkProviderForUserCommand({
      UserPoolId: userPoolId,
      DestinationUser: {
        ProviderName: "Cognito",
        ProviderAttributeValue: destinationUsername,
      },
      SourceUser: {
        ProviderName: providerName,
        ProviderAttributeName: "Cognito_Subject",
        ProviderAttributeValue: providerUserId,
      },
    })
  );
};

// Tạo sẵn bản ghi PROFILE giống services/auth-post-confirmation — user native được tạo
// bằng AdminCreateUser không đi qua luồng ConfirmSignUp nên PostConfirmation không chạy.
const createProfileRecord = async (userAttributes: Record<string, string>) => {
  const userId = userAttributes.sub;
  if (!userId || !tableName) return;

  const email = userAttributes.email || "";
  const name = userAttributes.name || email.split("@")[0] || "";

  const profile: UserProfile = {
    userId,
    email,
    name,
    phone: "",
    address: "",
    updatedAt: new Date().toISOString(),
  };

  try {
    await ddbDocClient.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          PK: `USER#${userId}`,
          SK: "PROFILE",
          ...profile,
        },
        ConditionExpression: "attribute_not_exists(PK)",
      })
    );
  } catch (error) {
    // Profile chỉ là tiện ích (GET /users/profile tự trả default nếu thiếu),
    // không được vì nó mà chặn cả luồng đăng nhập.
    console.error("Failed to create profile record on pre-signup:", error);
  }
};

// Cognito Pre-SignUp trigger: hợp nhất đăng nhập Google/Facebook với tài khoản email
// cùng địa chỉ, để một người dùng chỉ có đúng một tài khoản (một `sub`) dù đăng nhập
// bằng cách nào. Nếu chưa có tài khoản email, tự tạo tài khoản native "gốc" rồi liên
// kết identity federated vào — nhờ đó user đăng ký bằng Google vẫn có thể đăng nhập
// bằng email sau này (qua "Quên mật khẩu" để tự đặt mật khẩu).
export const handler: PreSignUpTriggerHandler = async (event) => {
  if (event.triggerSource !== "PreSignUp_ExternalProvider") {
    return event;
  }

  const email = event.request.userAttributes.email;
  const federated = parseFederatedUserName(event.userName);
  if (!email || !federated) {
    return event;
  }

  let existingUsers: UserType[];
  try {
    existingUsers = await findUsersByEmail(event.userPoolId, email);
  } catch (error) {
    // Không tra cứu được thì giữ hành vi cũ (tạo user federated riêng) thay vì
    // chặn đăng nhập — việc liên kết có thể xử lý bù về sau.
    console.error("Pre-signup ListUsers failed, skipping auto-link:", error);
    return event;
  }

  // Chỉ liên kết vào user native (đăng ký email/password hoặc do admin tạo) đã xác
  // nhận. User EXTERNAL_PROVIDER là identity federated khác — không thể làm đích liên
  // kết; user UNCONFIRMED chưa chứng minh sở hữu email nên không được tự gộp vào.
  const nativeUser = existingUsers.find(
    (user) =>
      user.UserStatus !== "EXTERNAL_PROVIDER" && user.UserStatus !== "UNCONFIRMED"
  );

  try {
    if (nativeUser?.Username) {
      await linkProviderToUser(
        event.userPoolId,
        nativeUser.Username,
        federated.providerName,
        federated.providerUserId
      );
    } else if (existingUsers.length === 0) {
      const created = await cognitoClient.send(
        new AdminCreateUserCommand({
          UserPoolId: event.userPoolId,
          // Không dùng email làm Username: pool bật email-alias nên Cognito từ chối
          // username trùng định dạng email. Đăng nhập bằng email vẫn hoạt động qua alias.
          Username: randomUUID(),
          MessageAction: "SUPPRESS",
          UserAttributes: [
            { Name: "email", Value: email },
            { Name: "email_verified", Value: "true" },
            ...(event.request.userAttributes.name
              ? [{ Name: "name", Value: event.request.userAttributes.name }]
              : []),
          ],
        })
      );

      const createdUsername = created.User?.Username;
      if (!createdUsername) {
        console.error("AdminCreateUser returned no username, skipping auto-link");
        return event;
      }

      // Đặt mật khẩu ngẫu nhiên vĩnh viễn để user thoát trạng thái FORCE_CHANGE_PASSWORD
      // và có thể dùng "Quên mật khẩu" đặt mật khẩu của riêng mình.
      await cognitoClient.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: event.userPoolId,
          Username: createdUsername,
          Password: generateRandomPassword(),
          Permanent: true,
        })
      );

      const createdSub = created.User?.Attributes?.find(
        (attr) => attr.Name === "sub"
      )?.Value;
      await createProfileRecord({
        sub: createdSub || "",
        email,
        name: event.request.userAttributes.name || "",
      });

      await linkProviderToUser(
        event.userPoolId,
        createdUsername,
        federated.providerName,
        federated.providerUserId
      );
    } else {
      // Email chỉ tồn tại dưới dạng identity federated khác (dữ liệu cũ trước khi có
      // auto-link) hoặc user chưa xác nhận — không có đích an toàn để gộp, giữ hành vi cũ.
      console.warn(
        `Pre-signup: no linkable native user for ${federated.providerName} sign-in, keeping separate federated user`
      );
      return event;
    }
  } catch (error) {
    console.error("Pre-signup auto-link failed, keeping default behavior:", error);
    return event;
  }

  // Đã liên kết xong: chặn việc tạo user federated trùng lặp. Frontend nhận diện
  // marker trong error_description và tự đăng nhập lại — lần sau vào thẳng tài
  // khoản đã liên kết (không qua Pre-SignUp nữa).
  throw new Error(AUTO_LINKED_MARKER);
};
