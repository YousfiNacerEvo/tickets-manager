"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }) {
  const router = useRouter();
  useEffect(() => {
    const checkToken = () => {
      const hasCookie = document.cookie.includes('sb-mcuufqubztbvmbgtqqya-auth-token=');
      console.log('AuthGuard check, docCookie:',  document.cookie);
      if (!hasCookie) {
        router.replace('/Login');
      }
    };
    checkToken();
    const interval = setInterval(checkToken, 500); // 5 seconds for debug
    return () => clearInterval(interval);
  }, [router]);
  return children;
} 