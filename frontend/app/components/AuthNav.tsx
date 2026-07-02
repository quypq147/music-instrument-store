"use client";
 
import "./AmplifyConfig";
import { useEffect, useState } from "react";
import { getCurrentUser, signOut, fetchUserAttributes, fetchAuthSession } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
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
 
        try {
          const session = await fetchAuthSession();
          const groups = session.tokens?.idToken?.payload["cognito:groups"] as string[] | undefined;
          setIsAdmin(!!(groups && groups.includes("Admin")));
          setIsStaff(!!(groups && groups.includes("Staff")));
        } catch (sessionError) {
          console.warn("Could not fetch auth session:", sessionError);
        }
 
        setUser({
          username: currentUser.username,
          userId: currentUser.userId,
          email,
          name,
        });
      } catch {
        setUser(null);
        setIsAdmin(false);
        setIsStaff(false);
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
          setIsAdmin(false);
          setIsStaff(false);
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
        <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {displayName}
        </Link>
        {(isAdmin || isStaff) && (
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
            Quản Trị
          </Link>
        )}
        <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: '#DF9E47', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Đăng Xuất
        </button>
      </>
    );
  }
 
  return (
    <>
      <Link href="/login" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        ĐĂNG NHẬP
      </Link>
    </>
  );
}
