"use client";
 
import "../common/AmplifyConfig";
import { useEffect, useState } from "react";
import { getCurrentUser, signOut, fetchUserAttributes, fetchAuthSession } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
 
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
    return (
      <span className="text-white/60 text-xs font-bold uppercase tracking-widest">
        Đang tải...
      </span>
    );
  }
 
  if (user) {
    const displayName = user.name || user.email || user.username;
    return (
      <>
        <Link href="/profile" className="flex items-center gap-2 hover:text-[#DF9E47] text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap" style={{ color: 'white' }}>
          <User width="16" height="16" />
          {displayName}
        </Link>
        {(isAdmin || isStaff) && (
          <Link href="/admin" className="flex items-center gap-2 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap" style={{ color: '#DF9E47' }}>
            Quản Trị
          </Link>
        )}
        <button onClick={handleSignOut} className="flex items-center gap-2 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap bg-transparent border-none cursor-pointer" style={{ color: '#DF9E47' }}>
          Đăng Xuất
        </button>
      </>
    );
  }
 
  return (
    <>
      <Link href="/login" className="flex items-center gap-2 hover:text-[#DF9E47] text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap" style={{ color: 'white' }}>
        <User width="16" height="16" />
        ĐĂNG NHẬP
      </Link>
    </>
  );
}
