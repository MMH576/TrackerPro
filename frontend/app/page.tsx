import { redirect } from "next/navigation"

export default function Home() {
  // Redirect to login page to ensure authentication flow
  redirect("/auth/login")
}

