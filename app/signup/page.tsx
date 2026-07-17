import AuthCard from "@/components/auth/AuthCard";
import SignUpForm from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Start building and practicing your question banks."
    >
      <SignUpForm />
    </AuthCard>
  );
}
