"use client";

import { useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useRouter } from "next/navigation";

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.idToken?.payload["cognito:groups"] as string[] | undefined;
        if (groups && (groups.includes("Admin") || groups.includes("Staff"))) {
          router.push("/admin");
        }
      } catch (err) {
        // Not logged in, ignore
      }
    };
    checkRedirect();
  }, [router]);

  return null;
}
