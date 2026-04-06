import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('main.tsx bootstrap', () => {
  beforeEach(() => {
    vi.resetModules()
    document.body.innerHTML = '<div id="root"></div>'
  })

  it('mounts the React app without crashing', async () => {
    const renderMock = vi.fn()
    const createRootMock = vi.fn(() => ({ render: renderMock }))

    vi.doMock('react-dom/client', () => ({
      createRoot: createRootMock,
    }))

    await import('../src/main')

    expect(createRootMock).toHaveBeenCalled()
  })
})