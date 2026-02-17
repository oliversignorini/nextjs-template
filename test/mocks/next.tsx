import { vi } from 'vitest'

// ---------------------------------------------------------------------------
// next/image → plain <img>
// ---------------------------------------------------------------------------

vi.mock('next/image', () => ({
  default: ({ priority, fill, ...props }: Record<string, unknown>) => {
    void priority
    void fill
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />
  },
}))

// ---------------------------------------------------------------------------
// next/link → plain <a>
// ---------------------------------------------------------------------------

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

// ---------------------------------------------------------------------------
// next/navigation → controllable usePathname + stub useRouter
// ---------------------------------------------------------------------------

let _mockPathname = '/'

export function setMockPathname(pathname: string) {
  _mockPathname = pathname
}

vi.mock('next/navigation', () => ({
  usePathname: () => _mockPathname,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
}))
