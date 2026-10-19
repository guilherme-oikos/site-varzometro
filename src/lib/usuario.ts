/**
 * Login por nome de usuário, não por e-mail.
 *
 * O Supabase Auth só aceita e-mail (ou telefone) como identificador. Por isso
 * cada conta tem por baixo um e-mail interno, `<usuario>@usuarios.varzometro.com.br`,
 * que ninguém digita nem recebe: o cadastro público está fechado, as contas
 * nascem confirmadas pelo admin e a senha esquecida é trocada pelo painel do
 * Supabase. O subdomínio é nosso para nenhum e-mail ir parar em caixa alheia.
 *
 * Sem imports: é usado pela Server Action de login e pelo script de migração.
 */

export const DOMINIO_USUARIOS = 'usuarios.varzometro.com.br';

/** Letras minúsculas, números, ponto, hífen e sublinhado; de 2 a 30 caracteres. */
const FORMATO = /^[a-z0-9._-]{2,30}$/;

export function normalizarUsuario(bruto: string): string {
  return bruto.trim().toLowerCase();
}

export function usuarioValido(usuario: string): boolean {
  return FORMATO.test(usuario);
}

export function emailDoUsuario(usuario: string): string {
  return `${normalizarUsuario(usuario)}@${DOMINIO_USUARIOS}`;
}

/** Caminho de volta, para mostrar o usuário no painel. */
export function usuarioDoEmail(email: string | undefined): string | undefined {
  const sufixo = `@${DOMINIO_USUARIOS}`;
  return email?.endsWith(sufixo) ? email.slice(0, -sufixo.length) : email;
}

/**
 * Cookie de sessão do Supabase: `sb-<projeto>-auth-token`, às vezes partido em
 * `.0`, `.1`... Visitante nunca tem esse cookie. Só no navegador: as páginas
 * públicas usam isto para saber, sem ir ao servidor, se vale carregar a parte
 * de quem está logado.
 */
export function temCookieDeSessao(): boolean {
  return /(?:^|;\s*)sb-[^=]+-auth-token(?:\.\d+)?=/.test(document.cookie);
}
