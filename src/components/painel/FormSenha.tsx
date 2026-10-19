'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { trocarSenha } from '@/app/painel/actions';

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-ghost" disabled={pending}>
      {pending ? 'Trocando...' : 'Trocar senha'}
    </button>
  );
}

export default function FormSenha() {
  const [estado, acao] = useFormState(trocarSenha, null);

  return (
    <form action={acao} className="grid max-w-xl gap-5 sm:grid-cols-2">
      <label className="block">
        <span className="rotulo">Nova senha</span>
        <input name="senha" type="password" autoComplete="new-password" minLength={8} required className="campo" />
      </label>
      <label className="block">
        <span className="rotulo">Repita a senha</span>
        <input name="confirmacao" type="password" autoComplete="new-password" minLength={8} required className="campo" />
      </label>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Botao />
        {estado ? (
          <p role={estado.ok ? 'status' : 'alert'} className={`text-sm font-medium ${estado.ok ? 'text-emerald-400' : 'text-red-400'}`}>
            {estado.ok ? estado.mensagem : estado.erro}
          </p>
        ) : null}
      </div>
    </form>
  );
}
