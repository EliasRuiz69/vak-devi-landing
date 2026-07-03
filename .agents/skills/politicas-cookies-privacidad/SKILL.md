---
name: vite-static-routes
description: Solución al problema de páginas HTML estáticas (en /public) que no se sirven correctamente en proyectos Vite + React SPA. Se usa cuando una ruta como /politica-de-privacidad o /politica-de-cookies redirige al index.html de React en lugar de mostrar el HTML estático. También aplica a cualquier ruta sin extensión que deba servirse como archivo HTML independiente desde /public en un proyecto Vite.
metadata:
  version: 1.0.0
  created: 2026-06-14
  project: ERVIA Landing (ervia.tech)
---

# Vite SPA — Servir páginas HTML estáticas desde /public

## Problema

En proyectos **Vite + React SPA** (sin `react-router-dom`), cuando se añaden archivos HTML independientes en `/public` (por ejemplo `public/politica-de-privacidad/index.html`), al navegar a esa ruta en el navegador **Vite intercepta la petición** y devuelve el `index.html` de React en lugar del HTML estático.

Esto ocurre porque Vite activa un **SPA fallback** (similar a `historyApiFallback` de webpack) que redirige todas las rutas sin extensión conocida al `index.html` raíz, ignorando los archivos estáticos de `/public`.

## Solución

Añadir un **middleware personalizado** en `vite.config.js` que intercepte las rutas estáticas **antes** que el SPA fallback de Vite.

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// IMPORTANTE: usar fileURLToPath en lugar de __dirname (el proyecto usa "type": "module")
const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-static-policies',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Listar aquí todas las rutas estáticas que deben servirse desde /public
          const staticRoutes = [
            '/politica-de-privacidad',
            '/politica-de-cookies',
          ]
          const matched = staticRoutes.find(
            r => req.url === r || req.url === r + '/'
          )
          if (matched) {
            const filePath = path.resolve(
              __dirname,
              'public',
              matched.slice(1),
              'index.html'
            )
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'text/html; charset=utf-8')
              res.end(fs.readFileSync(filePath))
              return
            }
          }
          next()
        })
      },
    },
  ],
})
```

## Estructura de archivos requerida

```
public/
├── politica-de-privacidad/
│   └── index.html      ← página HTML autónoma (con sus propios <style>)
└── politica-de-cookies/
    └── index.html      ← página HTML autónoma (con sus propios <style>)
```

## Notas importantes

- **ESM**: Si el `package.json` tiene `"type": "module"`, `__dirname` no está disponible. Usar `fileURLToPath(new URL('.', import.meta.url))` como sustituto.
- **Solo dev**: Este middleware solo actúa en `vite dev`. En producción (`vite build`), los archivos en `/public` se copian al output y el servidor web (Nginx, Vercel, Netlify, etc.) los sirve directamente — no se necesita configuración adicional.
- **Añadir rutas**: Para nuevas páginas estáticas, solo hay que añadir la ruta al array `staticRoutes` y colocar el `index.html` correspondiente en `public/<nombre-ruta>/`.
- **Alternativa con router**: Si el proyecto crece y necesita múltiples rutas, valorar instalar `react-router-dom` y usar componentes React en lugar de HTML estáticos.

## Cuándo usar esta solución

- Páginas legales (Política de Privacidad, Política de Cookies, Aviso Legal)
- Páginas de error personalizadas
- Cualquier HTML autónomo que deba vivir en una ruta limpia dentro de una SPA Vite
