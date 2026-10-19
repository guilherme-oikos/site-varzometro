'use client';

import { BUCKET_IMAGENS } from '@/lib/supabase/config';
import { supabaseNavegador } from '@/lib/supabase/navegador';

/** Lado maior da imagem depois de reduzida. Sobra para capa em tela retina. */
const LADO_MAXIMO = 2000;

/**
 * Reduz e converte para JPG antes de enviar.
 *
 * Foto de celular sai com 4 a 10 MB e passaria do limite de 5 MB do bucket. E
 * JPG é o formato que WhatsApp e Facebook mostram na prévia do link — PNG
 * grande às vezes sai sem imagem.
 */
async function reduzir(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('O navegador não deixou processar a imagem.');

  // Fundo escuro do site para PNG com transparência não virar preto chapado.
  ctx.fillStyle = '#0F0F12';
  ctx.fillRect(0, 0, largura, altura);
  ctx.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Não deu para converter a imagem.'))),
      'image/jpeg',
      0.85,
    ),
  );
}

/**
 * Envia para `imagens/<id do usuário>/<pasta>/...` e devolve a URL pública.
 * A pasta com o ID é exigida pela política do Storage: ninguém escreve na pasta
 * de outro.
 */
export async function enviarImagem(arquivo: File, usuarioId: string, pasta: string): Promise<string> {
  if (!arquivo.type.startsWith('image/')) throw new Error('Isso não é uma imagem.');

  const blob = await reduzir(arquivo);
  const nome = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const caminho = `${usuarioId}/${pasta}/${nome}`;

  const supabase = supabaseNavegador();
  const { error } = await supabase.storage
    .from(BUCKET_IMAGENS)
    .upload(caminho, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });

  if (error) throw new Error(`Falha no envio: ${error.message}`);

  return supabase.storage.from(BUCKET_IMAGENS).getPublicUrl(caminho).data.publicUrl;
}
