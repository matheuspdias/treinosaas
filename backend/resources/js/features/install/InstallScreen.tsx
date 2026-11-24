import { Head } from '@inertiajs/react'
import { Copy, Download, EllipsisVertical, Share, SquarePlus } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { promptInstall, skipInstall } from '@/lib/install'
import { Button } from '@/ui/components/Button'
import { Card } from '@/ui/components/Card'
import { useInstall } from './useInstall'

function Step({ n, icon, children }: { n: number; icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft font-bold text-accent"
        aria-hidden
      >
        {n}
      </span>
      <p className="pt-1">
        {children} <span className="inline-block align-[-0.2em] text-fg-muted">{icon}</span>
      </p>
    </li>
  )
}

/**
 * Depois do login, no celular e fora do app instalado: sugere instalar o painel na tela de
 * início, como o app do aluno. "Continuar no navegador" esconde a tela por uma semana.
 */
export function InstallScreen() {
  const { platform, canPrompt, installed } = useInstall()
  const [copied, setCopied] = useState(false)
  const iconClass = 'size-5'

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(location.origin + '/dashboard')
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  let body: ReactNode
  if (installed) {
    body = (
      <Card className="p-5" role="status">
        <p className="font-semibold">Pronto, o painel foi instalado.</p>
        <p className="mt-1 text-fg-muted">
          Abra pelo ícone <strong>TreinoBox</strong> na tela inicial do celular.
        </p>
      </Card>
    )
  } else if (platform === 'in_app') {
    body = (
      <>
        <Card className="p-5">
          <p className="font-semibold">Abra este link no navegador</p>
          <p className="mt-1 text-fg-muted">
            Dentro deste app não dá para instalar. Toque no menu (<span aria-hidden>⋯</span>) e
            escolha <strong>Abrir no navegador</strong>, ou copie o link e cole no Safari ou no
            Chrome.
          </p>
        </Card>
        <Button
          size="lg"
          block
          className="mt-5"
          icon={<Copy className="size-5" />}
          onClick={() => void copyLink()}
        >
          {copied ? 'Link copiado' : 'Copiar link'}
        </Button>
      </>
    )
  } else if (platform === 'android' && canPrompt) {
    body = (
      <Button
        size="lg"
        block
        icon={<Download className="size-5" />}
        onClick={() => void promptInstall()}
      >
        Instalar app
      </Button>
    )
  } else if (platform === 'android') {
    body = (
      <Card className="p-5">
        <ol className="grid gap-4">
          <Step n={1} icon={<EllipsisVertical className={iconClass} />}>
            Toque no menu do navegador, no canto de cima.
          </Step>
          <Step n={2} icon={<Download className={iconClass} />}>
            Escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>. Se
            aparecer <strong>Abrir no Chrome</strong>, toque nele antes.
          </Step>
          <Step n={3} icon={null}>
            Abra o painel pelo ícone na tela inicial. Se já instalou, é só abrir por lá.
          </Step>
        </ol>
      </Card>
    )
  } else {
    body = (
      <Card className="p-5">
        <ol className="grid gap-4">
          <Step n={1} icon={<Share className={iconClass} />}>
            Toque em <strong>Compartilhar</strong>, na barra do navegador. Se não aparecer, toque
            antes em <strong>Abrir no Safari</strong>.
          </Step>
          <Step n={2} icon={<SquarePlus className={iconClass} />}>
            Role e escolha <strong>Adicionar à Tela de Início</strong>.
          </Step>
          <Step n={3} icon={null}>
            Abra o painel pelo ícone na tela de início. No primeiro acesso, entre de novo com seu
            e-mail e senha.
          </Step>
        </ol>
      </Card>
    )
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 safe-top safe-bottom">
      <Head title="Instale o painel" />
      <div className="flex flex-1 flex-col justify-center py-8">
        <div className="flex flex-col items-center text-center">
          <img
            src="/painel/icon-192.png"
            alt=""
            width={80}
            height={80}
            className="size-20 rounded-[22%] shadow-card"
          />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
            Instale o painel no celular
          </h1>
          <p className="mt-1 text-fg-muted">
            Fica na tela do celular como um app, abre em tela cheia e sem a barra do navegador.
          </p>
        </div>
        <div className="mt-6">{body}</div>
      </div>
      <button
        type="button"
        onClick={skipInstall}
        className="mx-auto mb-4 min-h-12 px-4 text-sm text-fg-subtle underline underline-offset-4 focus-visible:text-fg active:text-fg"
      >
        Continuar no navegador
      </button>
    </main>
  )
}
