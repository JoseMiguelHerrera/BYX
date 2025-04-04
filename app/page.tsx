import { cookies } from "next/headers";
import { PrivyClient } from "@privy-io/server-auth";
import { redirect } from "next/navigation";
import LoginClient from "@/components/containers/Login";
// 👇 Move this part to the top-level of the server component
export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("privy-token")?.value;

  if (token) {
    const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;
    const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET!;
    const client = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

    try {
      const claims = await client.verifyAuthToken(token);
      console.log({ claims });
      redirect("/dashboard"); // Server redirect if already authenticated
    } catch (err) {
      // Token was invalid — do nothing and show login page
    }
  }

  // This part is a Client Component — rendered only if user not authenticated
  return <LoginClient />;
}