"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/72 transition hover:border-white/25 hover:text-white"
      type="button"
    >
      退出登录
    </button>
  );
}
