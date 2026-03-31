import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import type { Role } from "@/lib/types";

type SignupPageProps = {
  searchParams?: {
    role?: string;
  };
};

function resolveRole(role?: string): Role {
  return role === "brand" ? "brand" : "creator";
}

export default function SignupPage({ searchParams }: SignupPageProps) {
  const initialRole = resolveRole(searchParams?.role);

  return (
    <AuthShell
      eyebrow="Signup"
      title="Create your creator or brand account"
      description="Choose the role that matches your workflow and unlock the dashboard experience that fits it."
      asideTitle="Set up once, scale the workflow"
      asideText="Signup stores role metadata for Supabase profile provisioning, then hands off to the right dashboard experience after authentication."
    >
      <SignupForm initialRole={initialRole} />
    </AuthShell>
  );
}
