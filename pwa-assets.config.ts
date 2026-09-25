import {
  createAppleSplashScreens,
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config'

/*
 * Ícones e splash screens do PWA, gerados a partir de public/logo.svg.
 * Uso: npm run assets  (gera em public/ e imprime as tags <link> para o index.html)
 */
const BG = '#0b0d10'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[48, 'favicon.ico']],
      padding: 0.12,
      resizeOptions: { background: BG, fit: 'contain' },
    },
    maskable: { sizes: [512], padding: 0.32, resizeOptions: { background: BG } },
    apple: { sizes: [180], padding: 0.2, resizeOptions: { background: BG } },
    appleSplashScreens: createAppleSplashScreens(
      {
        padding: 0.35,
        resizeOptions: { background: BG, fit: 'contain' },
        linkMediaOptions: { log: true, addMediaScreen: true, basePath: '/', xhtml: false },
        png: { compressionLevel: 9, quality: 70 },
        name: (landscape, size) =>
          `splash/apple-splash-${landscape ? 'landscape' : 'portrait'}-${size.width}x${size.height}.png`,
      },
      [
        'iPhone 17 Pro Max',
        'iPhone 17 Pro',
        'iPhone Air',
        'iPhone 16 Plus',
        'iPhone 16',
        'iPhone 16e',
        'iPhone 13 mini',
        'iPhone 11',
        'iPhone 11 Pro Max',
        'iPhone 8 Plus',
        'iPhone 8',
        'iPhone SE 4"',
      ],
    ),
  },
  images: ['public/logo.svg'],
})
