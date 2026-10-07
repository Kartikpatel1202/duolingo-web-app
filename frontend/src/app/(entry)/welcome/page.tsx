import type { Metadata } from "next";

import { SignupView } from "@/features/entry/SignupView";

export const metadata: Metadata = { title: "Sign up" };

/** Reached from GET STARTED: create an account, then straight into the learning path. */
export default function SignupPage() {
  return <SignupView />;
}
