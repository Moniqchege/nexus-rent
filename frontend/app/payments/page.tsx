import { redirect } from "next/navigation";

export default function PaymentsRoot() {
  redirect("/payments/overview");
}