import Markdown from 'react-markdown';
import remarkUnwrapImages from 'remark-unwrap-images';
import { mdxComponents } from '@/components/MdxComponents';

/**
 * O corpo do artigo, de Markdown para HTML. É o mesmo componente na página
 * publicada e na prévia do painel, para a prévia não mentir.
 *
 * `react-markdown` em vez de MDX porque o texto agora vem do banco, escrito por
 * quem tem login: MDX executa JavaScript embutido no texto, e Markdown puro não.
 * HTML cru colado no texto sai escapado, como texto.
 *
 * remarkUnwrapImages tira o <p> que o Markdown coloca em volta de uma imagem
 * sozinha. Sem isso o <figure> ficaria dentro de <p>, que é HTML inválido e
 * quebra a hidratação do React.
 */
export default function CorpoDoArtigo({ conteudo }: { conteudo: string }) {
  return (
    <Markdown remarkPlugins={[remarkUnwrapImages]} components={mdxComponents}>
      {conteudo}
    </Markdown>
  );
}
