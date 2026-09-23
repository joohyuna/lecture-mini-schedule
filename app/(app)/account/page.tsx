import { auth } from "../../lib/auth";
import AccountForm from "../../components/AccountForm";

export default async function AccountPage() {
  const session = await auth();

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="mb-5 text-lg font-bold tracking-tight sm:text-xl">개인정보 관리</h1>
      <AccountForm email={session?.user?.email ?? ""} nickname={session?.user?.name ?? ""} />
    </main>
  );
}
