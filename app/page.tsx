"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SplashScreen, useApp } from "@/components/AppProvider";

export default function Home() {
  const { ready, user } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (ready) router.replace(user ? "/matchs" : "/connexion");
  }, [ready, user, router]);
  return <SplashScreen />;
}
