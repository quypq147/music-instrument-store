"use client";

import React, { useEffect } from "react";
import { Amplify } from "aws-amplify";
import "aws-amplify/auth/enable-oauth-listener";
import { signInWithRedirect } from "aws-amplify/auth";
import { initAuthStorageFromPreference, takeOAuthRetryProvider } from "../../lib/authStorage";

// Chụp lại query string NGAY khi module load, trước khi oauth listener của Amplify kịp xử
// lý/dọn URL — cần đọc error_description mà Cognito gắn vào redirect khi PreSignUp trigger
// chặn lần federated sign-up đầu tiên sau khi tự liên kết tài khoản (services/auth-pre-signup).
const initialOAuthError =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("error_description") || ""
    : "";


if (!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || !process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID) {
  console.warn(
    "AmplifyConfig: NEXT_PUBLIC_COGNITO_USER_POOL_ID or NEXT_PUBLIC_COGNITO_CLIENT_ID is missing. " +
    "If you just deployed the stack, please restart your Next.js development server to load the new env variables."
  );
}

// true khi Cognito Hosted UI domain đã được cấu hình — dùng để ẩn nút đăng nhập Google/Facebook
// thay vì hiện nút rồi báo lỗi "Chưa cấu hình OAuth" sau khi người dùng bấm.
export const isOAuthConfigured = !!process.env.NEXT_PUBLIC_COGNITO_DOMAIN;

// Không set cứng "http://localhost:3000/" — trên môi trường đã deploy (Amplify, v.v.) mà quên khai
// báo NEXT_PUBLIC_OAUTH_REDIRECT_SIGN_IN/OUT thì tự suy ra theo domain thực tế đang chạy. Lưu ý:
// domain suy ra được vẫn phải nằm trong callbackUrls/logoutUrls đã đăng ký ở Cognito App Client
// (cấu hình lúc `cdk deploy` AuthStack), nếu không Cognito sẽ báo redirect_mismatch.
const defaultRedirectUrl = typeof window !== "undefined" ? `${window.location.origin}/` : "http://localhost:3000/";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "",
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "",
      ...(isOAuthConfigured ? {
        loginWith: {
          oauth: {
            domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN!,
            scopes: ["email", "openid", "profile", "aws.cognito.signin.user.admin"],
            redirectSignIn: [process.env.NEXT_PUBLIC_OAUTH_REDIRECT_SIGN_IN || defaultRedirectUrl],
            redirectSignOut: [process.env.NEXT_PUBLIC_OAUTH_REDIRECT_SIGN_OUT || defaultRedirectUrl],
            responseType: "code",
          }
        }
      } : {})
    },
  },
});

initAuthStorageFromPreference();

export default function AmplifyConfig({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Lần đăng nhập Google/Facebook đầu tiên của một email đã có tài khoản sẽ bị Cognito
    // trả về lỗi chứa marker AUTO_LINKED (sau khi backend đã liên kết xong) — tự động thử
    // đăng nhập lại đúng 1 lần, lần này sẽ vào thẳng tài khoản đã liên kết.
    if (!initialOAuthError.includes("AUTO_LINKED")) return;

    const provider = takeOAuthRetryProvider();
    // Dọn query lỗi khỏi URL để refresh/back không kích hoạt lại luồng này.
    window.history.replaceState({}, "", window.location.pathname);
    if (provider) {
      signInWithRedirect({ provider }).catch((error) => {
        console.error("Auto retry sign-in after account linking failed:", error);
      });
    }
  }, []);

  return <>{children}</>;
}
