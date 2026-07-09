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

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "",
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "",
      ...(process.env.NEXT_PUBLIC_COGNITO_DOMAIN ? {
        loginWith: {
          oauth: {
            domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
            scopes: ["email", "openid", "profile", "aws.cognito.signin.user.admin"],
            redirectSignIn: [process.env.NEXT_PUBLIC_OAUTH_REDIRECT_SIGN_IN || "http://localhost:3000/"],
            redirectSignOut: [process.env.NEXT_PUBLIC_OAUTH_REDIRECT_SIGN_OUT || "http://localhost:3000/"],
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
