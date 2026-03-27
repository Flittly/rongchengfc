import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/app/register/register-form";

export const metadata: Metadata = {
  title: "注册",
  description: "注册成都蓉城球迷账号，完成邮箱验证后可登录。",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-6 pb-20 pt-14 lg:pt-20">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">
        <h1 className="text-3xl font-semibold text-white">会员注册</h1>
        <p className="mt-3 text-sm text-white/70">
          通过邮箱和密码创建账号。注册成功后，请通过验证链接激活账号。
        </p>
        <div className="mt-6">
          <RegisterForm />
        </div>
        <p className="mt-5 text-sm text-white/65">
          已有账号？
          <Link href="/login" className="ml-2 text-[color:var(--color-accent)] hover:underline">
            去登录
          </Link>
        </p>
      </div>
    </div>
  );
}
