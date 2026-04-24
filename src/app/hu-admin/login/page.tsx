import { redirect } from "next/navigation";
import {
  clearHuAdminSessionCookie,
  hasHuAdminSession,
  isHuAdminPasswordValid,
  setHuAdminSessionCookie,
} from "@/lib/auth";
import { clearLoginFailures, isLoginLocked, recordFailedLogin } from "@/lib/login-guard";

async function loginAction(formData: FormData) {
  "use server";
  const lockState = await isLoginLocked("HU");
  if (lockState.locked) {
    redirect(`/hu-admin/login?locked=1&retry=${lockState.retryAfterSec || 0}`);
  }
  const password = String(formData.get("password") || "");
  if (!isHuAdminPasswordValid(password)) {
    const failed = await recordFailedLogin("HU");
    if (failed.locked) {
      redirect(`/hu-admin/login?locked=1&retry=${failed.retryAfterSec || 0}`);
    }
    redirect("/hu-admin/login?error=1");
  }
  await clearLoginFailures("HU");
  setHuAdminSessionCookie();
  redirect("/hu-admin");
}

async function logoutAction() {
  "use server";
  clearHuAdminSessionCookie();
  redirect("/hu-admin/login");
}

export default function HuAdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string; locked?: string; retry?: string };
}) {
  if (hasHuAdminSession()) {
    return (
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-2xl font-bold">Mar bejelentkeztel</h1>
        <p className="mt-2 text-slate-600">A HU admin session aktiv.</p>
        <form action={logoutAction} className="mt-6">
          <button className="rounded-lg border border-slate-300 px-4 py-2">Kijelentkezes</button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold">HU admin belepes</h1>
      <p className="mt-2 text-slate-600">Kulon admin a szenzorvasarlas.hu piachoz.</p>
      <form action={loginAction} className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <label className="block text-sm font-medium text-slate-700" htmlFor="password">
          HU admin jelszo
        </label>
        <input id="password" name="password" type="password" required className="w-full rounded-lg border border-slate-300 p-2.5" />
        <button className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white">Belepes</button>
      </form>
      {searchParams.error ? <p className="mt-3 text-sm text-red-600">Hibas jelszo.</p> : null}
      {searchParams.locked ? (
        <p className="mt-3 text-sm text-red-700">
          Tul sok sikertelen probalkozas. Probald ujra kb. {searchParams.retry || "1800"} masodperc mulva.
        </p>
      ) : null}
    </main>
  );
}
