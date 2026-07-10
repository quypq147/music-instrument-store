"use client";
 
import "../common/AmplifyConfig";
import { useEffect, useState } from "react";
import { getCurrentUser, signOut, fetchUserAttributes, fetchAuthSession } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, ChevronDown, LogOut } from "lucide-react";
import { getProfile } from "../../../lib/api/profile";
 
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const closeDropdown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".profile-dropdown-container")) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, [isDropdownOpen]);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen((prev) => !prev);
  };
 
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
 
        let profileName: string | undefined;
        try {
          const session = await fetchAuthSession();
          const token = session.tokens?.idToken?.toString();
          if (token) {
            const profileResult = await getProfile(token);
            if (profileResult.ok) {
              const { profile } = profileResult.data;
              if (profile?.name) {
                profileName = profile.name;
              }
            }
          }
        } catch (profileError) {
          console.warn("Could not fetch user profile for nav:", profileError);
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
          name: profileName || name,
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
        case "signInWithRedirect":
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
      <div className="flex items-center gap-4 lg:gap-6">
        {(isAdmin || isStaff) && (
          <Link href="/admin" className="flex items-center gap-2 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap" style={{ color: '#DF9E47' }}>
            Quản Trị
          </Link>
        )}
        <div className="relative profile-dropdown-container">
          <button
            onClick={toggleDropdown}
            className="flex items-center gap-2 hover:text-[#DF9E47] text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap bg-transparent border-none cursor-pointer text-white outline-none"
          >
            <User width="16" height="16" />
            <span>{displayName}</span>
            <ChevronDown
              width="12"
              height="12"
              className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isDropdownOpen && (
            <div
              className="absolute right-0 mt-3 w-48 rounded-xl border border-[#DF9E47]/20 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-md"
              style={{ backgroundColor: "rgba(0, 26, 18, 0.95)" }}
            >
              <Link
                href="/profile"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#002B1F] hover:text-[#DF9E47] transition-colors no-underline"
              >
                <User width="14" height="14" />
                Hồ sơ
              </Link>
              <div className="border-t border-[#DF9E47]/10 my-1"></div>
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  handleSignOut();
                }}
                className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-500 hover:bg-[#002B1F] hover:text-rose-455 bg-transparent border-none cursor-pointer transition-colors"
              >
                <LogOut width="14" height="14" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
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
