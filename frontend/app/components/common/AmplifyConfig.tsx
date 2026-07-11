"use client";

import React from "react";
import { Amplify } from "aws-amplify";
import "aws-amplify/auth/enable-oauth-listener";
import { initAuthStorageFromPreference } from "../../lib/authStorage";


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
  return <>{children}</>;
}
