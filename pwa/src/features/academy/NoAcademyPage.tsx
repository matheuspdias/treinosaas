import { Building2 } from 'lucide-react'

/** Raiz do site ou endereço de academia que não existe: o app só abre pelo link da academia. */
export function NoAcademyPage({ notFound = false }: { notFound?: boolean }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-8 safe-top safe-bottom text-center">
      <span
        className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent"
        aria-hidden
      >
        <Building2 className="size-8" />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight">
        {notFound ? 'Academia não encontrada' : 'Abra pelo link da sua academia'}
      </h1>
      <p className="mt-2 text-fg-muted">
        {notFound
          ? 'Confira o link com a recepção da sua academia.'
          : 'Cada academia tem o próprio app. Peça o link na recepção e entre com o celular cadastrado.'}
      </p>
    </main>
  )
}
