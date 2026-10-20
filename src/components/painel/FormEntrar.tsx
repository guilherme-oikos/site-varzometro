'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { entrar } from '@/app/painel/actions';
import { SpinnerIcon } from '@/components/Icons';

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

      {estado && !estado.ok && estado.dois_fatores ? (
        <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/[0.06] p-4 text-center">
          <p className="font-bold text-white">Autenticação de dois fatores</p>
          <p className="mt-1 text-sm text-red-300">{estado.erro}</p>
          <ul className="mt-4 flex justify-center gap-6">
            {estado.dois_fatores.responsaveis.map((responsavel) => (
              <li key={responsavel.quem}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={responsavel.foto}
                  alt={`Responsável cadastrado: ${responsavel.quem.toLowerCase()}`}
                  className="mx-auto h-24 w-24 rounded-full border-2 border-red-500/50 object-cover sm:h-28 sm:w-28"
                />
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">{responsavel.quem}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-300">
            <SpinnerIcon className="h-4 w-4 animate-spin" />
            Aguardando o pai e a namorada aprovarem o acesso...
          </p>
        </div>
      ) : estado && !estado.ok ? (
        <p role="alert" className="text-sm font-medium text-red-400">
          {estado.erro}
        </p>
      ) : null}

      <BotaoEntrar />
    </form>
  );
}
