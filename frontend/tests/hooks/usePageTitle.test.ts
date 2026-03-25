import { render } from '@testing-library/react';
import { usePageTitle } from '../../src/hooks/usePageTitle';

describe('usePageTitle', () => {
  it('imposta correttamente document.title', () => {
    const TestComponent = ({ title }: { title: string }) => {
      usePageTitle(title);
      return null;
    };

    render(<TestComponent title="Login" />);
    expect(document.title).toBe('Login - SmartOrder');

    render(<TestComponent title="Registrazione" />);
    expect(document.title).toBe('Registrazione - SmartOrder');
  });
});