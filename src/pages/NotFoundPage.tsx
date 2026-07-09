import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="container-page py-24 text-center">
      <p className="text-sm font-semibold tracking-[0.18em] text-sage uppercase">
        404
      </p>
      <h1 className="mt-2 font-display text-4xl">Page not found</h1>
      <p className="mx-auto mt-3 max-w-md text-ink-muted">
        The page you are looking for may have moved. Let us guide you back to
        the light.
      </p>
      <Link to="/" className="btn-primary mt-8 inline-flex no-underline">
        Back home
      </Link>
    </div>
  )
}
