import { useEffect } from 'react';

export function usePageTitle(title: string) {
  /**
   * @brief Brief imposta il title alla pagina HTML
   * @param Type il title della pagina
   */
  useEffect(() => {
    document.title = `${title} - SmartOrder`;
  }, [title]);
}