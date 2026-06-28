"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, signOut, fetchUserAttributes } from "@aws-amplify/auth";
import { Hub } from "@aws-amplify/core";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthNav() {
  const router = useRouter();
  const [user, setUser] = useState<{
    username: string;
    userId: string;
    email?: string;
    name?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await getCurrentUser();
        let email: string | undefined;
        let name: string | undefined;

        try {
          const attributes = await fetchUserAttributes();
          email = attributes.email;
          name = attributes.name;
        } catch (attrError) {
          console.warn("Could not fetch user attributes:", attrError);
        }

        setUser({
          username: currentUser.username,
          userId: currentUser.userId,
          email,
          name,
        });
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();

    // Listen for auth events in Amplify v6
    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      switch (payload.event) {
        case "signedIn":
          init();
          break;
        case "signedOut":
          setUser(null);
          break;
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.refresh();
      window.location.href = "/";
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  };

  if (loading) {
    return <span className="auth-loading" style={{ color: "var(--color-on-surface-variant)", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>Đang tải...</span>;
  }

  if (user) {
    const displayName = user.name || user.email || user.username;
    return (
      <>
        <span className="user-welcome">Xin chào, {displayName}</span>
        <button onClick={handleSignOut} className="signout-btn">
          Đăng Xuất
        </button>
      </>
    );
  }

  return (
    <>
      <Link href="/login">Đăng Nhập</Link>
      <Link href="/register">Đăng Ký</Link>
    </>
  );
}
