import { redirect } from "next/navigation";

export default function AdminLoginRedirect() {
  redirect("/sign-in?redirect_url=" + encodeURIComponent("/admin"));
}
