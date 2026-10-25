import { useSearchParams } from 'react-router-dom';
import { Catalog } from '../components/Catalog';
import { DemoNote } from '../components/ui';
import { FAMILY_LABEL, PRODUCTS } from '../data/products';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { filtersFromParams } from '../lib/catalog';
import './Shop.css';

/** "iPhone 18 Pro, 18 Pro Max e 17 Pro" — nomes do catálogo, sem repetir "iPhone". */
function listNames(names: string[]): string {
  const short = names.map((n, i) => (i === 0 ? n : n.replace('iPhone ', '')));
  return short.length > 1 ? `${short.slice(0, -1).join(', ')} e ${short.at(-1)}` : (short[0] ?? '');
}

function titleFor(params: URLSearchParams): { title: string; lead: string } {
  const f = filtersFromParams(params);
  if (f.q) return { title: `Busca: “${f.q}”`, lead: 'Modelos que combinam com a sua busca.' };
  if (f.generations.length === 1 && !f.families.length) {
    const g = f.generations[0];
    const models = PRODUCTS.filter((p) => p.generation === g);
    const chip = models[0]?.keySpecs.chip;
    return {
      title: `iPhone ${g} Pro`,
      lead: `${listNames(models.map((p) => p.name))}${chip ? `, com chip ${chip}` : ''}.`,
    };
  }
  if (f.families.length)
    return { title: f.families.map((x) => FAMILY_LABEL[x]).join(' e '), lead: 'Modelos da linha selecionada.' };
  return {
    title: 'Todos os iPhones',
    lead: `${listNames(PRODUCTS.map((p) => p.name))}, com preço de referência e estoque por cor.`,
  };
}

export function Shop() {
  const [params] = useSearchParams();
  const { title, lead } = titleFor(params);
  useDocumentTitle(title);
  return (
    <div className="shop">
      <header className="shop__head wrap">
        <h1 className="t-display">{title}</h1>
        <div>
          <p className="t-sub t-muted">{lead}</p>
          <DemoNote />
        </div>
      </header>
      <div className="wrap">
        <Catalog />
      </div>
    </div>
  );
}
