import { render } from '@testing-library/react'
import { test } from 'vitest'
import App from '../src/App'

test('non crasha', () => {
  render(<App />)
})