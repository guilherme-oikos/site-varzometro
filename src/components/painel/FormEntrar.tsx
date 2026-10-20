'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { entrar } from '@/app/painel/actions';

function BotaoEntrar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? 'Entrando...' : 'Entrar'}
    </button>
  );
}

export default function FormEntrar() {
  const [estado, acao] = useFormState(entrar, null);

  return (
    <form action={acao} className="card mt-8 space-y-5 p-6 sm:p-8">
      <label className="block">
        <span className="rotulo">Usuário</span>
        <input
          name="usuario"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          className="campo"
        />
      </label>

      <label className="block">
        <span className="rotulo">Senha</span>
        <input name="senha" type="password" autoComplete="current-password" required className="campo" />
      </label>

      {estado && !estado.ok ? (
        <p role="alert" className="text-sm font-medium text-red-400">
          {estado.erro}
        </p>
      ) : null}

      <BotaoEntrar />
    </form>
  );
}
