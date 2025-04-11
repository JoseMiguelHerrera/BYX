'use client'

import { useLogin } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

function AuthPage() {
  const router = useRouter();
  const { login } = useLogin({
    onComplete: () => router.push("/dashboard"),
  });

  return <div>AuthPage</div>;
}

export default AuthPage;
