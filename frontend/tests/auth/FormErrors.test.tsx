import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import FormErrors from '../../src/auth/FormErrors';

describe('FormErrors', () => {
  //TU-F_32
  it('errors vuoto: non renderizza nulla', () => {
    const { container } = render(<FormErrors errors={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  //TU-F_33
  it('errors non vuoto: renderizza un paragrafo per errore', () => {
    render(<FormErrors errors={['Errore A', 'Errore B']} />);
    expect(screen.getByText('Errore A')).toBeInTheDocument();
    expect(screen.getByText('Errore B')).toBeInTheDocument();
  });
});
