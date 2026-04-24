import { redirect } from "next/navigation";
import { clearAdminSessionCookie, hasAdminSession, isAdminPasswordValid, setAdminSessionCookie } from "@/lib/auth";
import { clearLoginFailures, isLoginLocked, recordFailedLogin } from "@/lib/login-guard";

async function loginAction(formData: FormData) {
  "use server";
  const lockState = await isLoginLocked("RO");
  if (lockState.locked) {
    redirect(`/admin/login?locked=1&retry=${lockState.retryAfterSec || 0}`);
  }
  const password = String(formData.get("password") || "");
  if (!isAdminPasswordValid(password)) {
    const failed = await recordFailedLogin("RO");
    if (failed.locked) {
      redirect(`/admin/login?locked=1&retry=${failed.retryAfterSec || 0}`);
    }
    redirect("/admin/login?error=1");
  }
  await clearLoginFailures("RO");
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
  searchParams: { error?: string; locked?: string; retry?: string };
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
      {searchParams.locked ? (
        <p className="mt-3 text-sm text-red-700">
          Prea multe incercari esuate. Reincercati peste aproximativ {searchParams.retry || "1800"} secunde.
        </p>
      ) : null}
    </main>
  );
}
