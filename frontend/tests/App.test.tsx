import { render } from '@testing-library/react'
import { test } from 'vitest'
import App from '../src/App'

//TU-F_01
test('non crasha', () => {
  render(<App />)
})