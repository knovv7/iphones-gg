import { useEffect } from 'react';
import { STORE } from '../config/store';

/** `null` usa o título padrão da loja. */
export function useDocumentTitle(title: string | null) {
  useEffect(() => {
    document.title = title ? `${title} — ${STORE.name}` : `${STORE.name} — iPhone`;
  }, [title]);
}
