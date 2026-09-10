import fs from 'fs';
import path from 'path';

/**
 * Verifica, em tempo de build, se um arquivo existe em /public.
 * Evita imagem quebrada quando a foto do integrante ainda não foi enviada:
 * o componente cai no avatar com iniciais.
 */
export function publicFileExists(publicPath?: string): boolean {
  if (!publicPath) return false;
  if (/^https?:\/\//.test(publicPath)) return true;

  const relative = publicPath.replace(/^\//, '');
  return fs.existsSync(path.join(process.cwd(), 'public', relative));
}
