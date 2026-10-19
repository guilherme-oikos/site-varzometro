import EditorPerfil from '@/components/painel/EditorPerfil';
import FormSenha from '@/components/painel/FormSenha';
import { exigirSessao } from '@/lib/painel';

export default async function PerfilPage() {
  const { user, perfil } = await exigirSessao();
  if (!perfil) return null;

  return (
    <>
      <h1 className="t-headline text-white">Meu perfil</h1>
      <p className="mt-2 text-sm text-muted">Salvou, mudou no site: card da bancada e assinatura dos artigos.</p>

      <div className="mt-8">
        <EditorPerfil
          usuarioId={user.id}
          inicial={{
            nome: perfil.nome,
            iniciais: perfil.iniciais,
            clube: perfil.clube,
            papel: perfil.papel,
            funcao: perfil.funcao,
            bio: perfil.bio,
            foto_url: perfil.foto_url,
            foto_blog_url: perfil.foto_blog_url,
          }}
        />
      </div>

      <div className="mt-14 border-t border-ink-line pt-8">
        <h2 className="t-title text-white">Senha</h2>
        <p className="mb-6 mt-2 text-sm text-muted">Troque a senha provisória que você recebeu.</p>
        <FormSenha />
      </div>
    </>
  );
}
