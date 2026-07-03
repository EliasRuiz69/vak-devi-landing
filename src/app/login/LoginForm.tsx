"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/app/actions/auth";

const initial: SignInState = { error: null };

export default function LoginForm() {
  const [state, action, isPending] = useActionState(signIn, initial);

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <div className="mb-2 flex flex-col gap-1">
        <h2 className="font-serif text-xl text-ink">Iniciar sesión</h2>
        <p className="text-sm text-ink/50">Introduce tus credenciales para continuar.</p>
      </div>

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink/80">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-ink/20 bg-white px-4 py-3 text-sm text-ink
            transition-colors placeholder:text-ink/30 focus:outline-none focus:ring-2
            focus:ring-purple-1/30 hover:border-purple-3"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-ink/80">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-ink/20 bg-white px-4 py-3 text-sm text-ink
            transition-colors placeholder:text-ink/30 focus:outline-none focus:ring-2
            focus:ring-purple-1/30 hover:border-purple-3"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full rounded-full bg-purple-1 px-8 py-4 text-sm font-medium
          tracking-wide text-white transition-all hover:bg-purple-2
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-1
          focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
