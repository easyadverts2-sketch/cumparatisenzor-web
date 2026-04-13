import { redirect } from "next/navigation";
import { clearAdminSessionCookie, hasAdminSession, isAdminPasswordValid, setAdminSessionCookie } from "@/lib/auth";

async function loginAction(formData: FormData) {
  "use server";
  const password = String(formData.get("password") || "");
  if (!isAdminPasswordValid(password)) {
    redirect("/admin/login?error=1");
  }
  setAdminSessionCookie();
  redirect("/admin");
}

async function logoutAction() {
  "use server";
  clearAdminSessionCookie();
  redirect("/admin/login");
}

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  if (hasAdminSession()) {
    return (
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-2xl font-bold">Deja autentificat</h1>
        <p className="mt-2 text-slate-600">Sesiunea de admin este activa.</p>
        <form action={logoutAction} className="mt-6">
          <button className="rounded-lg border border-slate-300 px-4 py-2">Logout</button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold">Admin login</h1>
      <p className="mt-2 text-slate-600">Acces doar pentru personal autorizat.</p>
      <form action={loginAction} className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <label className="block text-sm font-medium text-slate-700" htmlFor="password">
          Parola admin
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded-lg border border-slate-300 p-2.5"
        />
        <button className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white">
          Autentificare
        </button>
      </form>
      {searchParams.error ? <p className="mt-3 text-sm text-red-600">Parola incorecta.</p> : null}
    </main>
  );
}
