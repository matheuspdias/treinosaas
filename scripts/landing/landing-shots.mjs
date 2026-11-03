// Prints reais do painel e do app para a landing (backend/public/landing/img). Ver README.md.
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const panel = 'http://localhost:8010'
const app = 'http://localhost:5174/academia-demo'
const OUT = '/out' // backend/public/landing/img
const browser = await chromium.launch()
const errors = []
const watch = (page, tag) => {
  page.on('pageerror', (e) => errors.push(`${tag}: ${e.message}`))
}

// Converte um PNG (buffer) em WebP nas larguras pedidas, no próprio Chromium.
const conv = await browser.newPage()
await conv.setContent('<html></html>')
async function save(png, name, widths) {
  const data = 'data:image/png;base64,' + png.toString('base64')
  for (const w of widths) {
    const url = await conv.evaluate(async ({ data, w }) => {
      const img = new Image(); img.src = data; await img.decode()
      const h = Math.round(img.naturalHeight * (w / img.naturalWidth))
      const c = document.createElement('canvas'); c.width = w; c.height = h
      const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, w, h)
      return c.toDataURL('image/webp', 0.8)
    }, { data, w })
    writeFileSync(`${OUT}/${name}-${w}.webp`, Buffer.from(url.split(',')[1], 'base64'))
  }
  console.log('ok', name)
}
const phoneShot = async (page, name) => save(await page.screenshot(), name, [390, 520, 780])

async function loginPanel(ctx) {
  const p = await ctx.newPage()
  watch(p, 'painel')
  await p.goto(`${panel}/login`)
  await p.getByLabel('E-mail').fill('dono@demo.test')
  await p.getByLabel('Senha', { exact: true }).fill('password')
  await p.getByRole('button', { name: 'Entrar' }).click()
  await p.waitForURL('**/dashboard')
  return p
}

// 1) Marca da academia de demonstração: amarelo anilha + logo genérico.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' })
  const p = await loginPanel(ctx)
  await p.goto(`${panel}/settings/app`)
  await p.getByLabel('Nome do app').fill('Academia Demo')
  await p.locator('input[type=color]').fill('#ffd100')
  await p.locator('input[type=file]').setInputFiles('/work/logo-demo.svg')
  await p.getByRole('radio', { name: 'Preto' }).click()
  await p.waitForTimeout(500)
  await p.getByRole('button', { name: 'Salvar' }).click()
  await p.getByText('App do aluno atualizado').waitFor()
  await ctx.close()
}

// 2) Painel: computador (claro) e celular (escuro).
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'light', locale: 'pt-BR' })
  const p = await loginPanel(ctx)
  await p.goto(`${panel}/dashboard`)
  await p.waitForTimeout(900)
  await save(await p.screenshot(), 'painel-inicio', [640, 1280])
  await ctx.close()
}
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark', locale: 'pt-BR' })
  const p = await loginPanel(ctx)
  await p.goto(`${panel}/alunos/novo`)
  await p.getByLabel('Nome').fill('Marina Costa')
  await p.getByLabel('Celular com DDD').fill('(11) 91234-5678')
  await p.waitForTimeout(300)
  await phoneShot(p, 'painel-cadastro')
  await p.goto(`${panel}/treinos`)
  await p.getByRole('link', { name: 'Editar Hipertrofia ABC' }).click()
  await p.waitForURL('**/editar')
  await p.waitForTimeout(800)
  await phoneShot(p, 'painel-treino')
  await ctx.close()
}

// 3) App do aluno (escuro, com a marca).
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark', locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' })
  const s = await ctx.newPage()
  watch(s, 'app')
  await s.goto(`${app}/`)
  await s.getByRole('heading', { name: 'Academia Demo' }).waitFor()
  await s.waitForTimeout(800)
  await phoneShot(s, 'app-entrar')

  await s.getByLabel('Celular com DDD').fill('11987654321')
  await s.getByRole('button', { name: 'Continuar' }).click()
  await s.getByLabel('PIN').fill('2580')
  await s.getByRole('button', { name: 'Entrar', exact: true }).click()
  await s.waitForURL((u) => !u.pathname.includes('/academia/entrar'))
  await s.waitForTimeout(4000) // sincroniza os treinos da academia

  // Histórico de exemplo no aparelho (o app guarda os treinos feitos localmente): 8 treinos A em 4 semanas.
  await s.evaluate(async () => {
    const open = indexedDB.open('treinoapp-academia-demo')
    const db = await new Promise((r, j) => { open.onsuccess = () => r(open.result); open.onerror = j })
    const all = (store) => new Promise((r) => { const q = db.transaction(store).objectStore(store).getAll(); q.onsuccess = () => r(q.result) })
    const plans = await all('plans')
    const planA = plans.find((p) => p.origin === 'academy' && !p.archivedAt && /A$/.test(p.name)) ?? plans[0]
    const tx = db.transaction('sessions', 'readwrite')
    const DAY = 86400000
    for (let i = 0; i < 8; i++) {
      const start = new Date(Date.now() - (29 - i * 3.6) * DAY)
      start.setHours(18, 30, 0, 0)
      const end = new Date(start.getTime() + 55 * 60000)
      const iso = start.toISOString()
      tx.objectStore('sessions').put({
        id: crypto.randomUUID(), createdAt: iso, updatedAt: end.toISOString(),
        planId: planA.id, planName: planA.name, planColor: planA.color, status: 'completed',
        startedAt: iso, finishedAt: end.toISOString(), currentExerciseIndex: 0, rest: null,
        exercises: planA.exercises.map((e, k) => {
          const base = e.loadKg || 10
          const kg = Math.round((base * (0.8 + i * 0.035)) / 2.5) * 2.5
          return {
            id: crypto.randomUUID(), planExerciseId: e.id, exercise: e.exercise, exerciseName: e.exerciseName ?? '',
            target: { sets: e.sets, repMin: e.repMin, repMax: e.repMax, loadKg: e.loadKg, restSec: e.restSec, incrementKg: e.incrementKg },
            notes: '',
            sets: Array.from({ length: e.sets }, (_, n) => ({
              id: crypto.randomUUID(), weightKg: kg, reps: Math.max(e.repMin, e.repMax - (n > 1 ? 1 : 0) - (i % 3 === 0 ? 1 : 0)), isWarmup: false,
              completedAt: new Date(start.getTime() + (k * 8 + n * 2) * 60000).toISOString(),
            })),
          }
        }),
      })
    }
    await new Promise((r) => { tx.oncomplete = r })
  })

  await s.goto(`${app}/`)
  await s.waitForTimeout(1500)
  await phoneShot(s, 'app-inicio')

  await s.goto(`${app}/exercicios/catalog/Barbell_Bench_Press_-_Medium_Grip`)
  await s.locator('h1', { hasText: 'Supino reto com barra' }).waitFor({ timeout: 60000 })
  await s.waitForTimeout(2500)
  await phoneShot(s, 'app-exercicio')

  await s.goto(`${app}/exercicios/catalog/Barbell_Bench_Press_-_Medium_Grip/historico`)
  await s.waitForTimeout(1500)
  await phoneShot(s, 'app-historico')

  await s.goto(`${app}/fichas`)
  await s.waitForTimeout(1200)
  await phoneShot(s, 'app-fichas')

  // Modo treino: primeira série concluída, descanso correndo.
  await s.goto(`${app}/`)
  await s.getByRole('button', { name: /Iniciar treino/ }).first().click()
  await s.waitForURL('**/treino')
  await s.waitForTimeout(800)
  await s.getByRole('button', { name: /^Concluir/ }).first().click()
  await s.waitForTimeout(1200)
  await phoneShot(s, 'app-treino')
  await ctx.close()
}

console.log('errors', JSON.stringify(errors))
await browser.close()
