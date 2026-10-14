import { redirect } from "next/navigation";

// Every account starts on the Free plan, so there is no subscription gate
// anymore; old links land on the plan list.
export default function NewSubscriptionPage() {
  redirect("/subscription");
}
