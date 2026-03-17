import { redirect } from "next/navigation";

/** /admin now redirects to the tokens management page */
export default function AdminPage() {
  redirect("/admin/tokens");
}
