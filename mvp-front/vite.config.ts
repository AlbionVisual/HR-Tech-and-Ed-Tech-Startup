import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  server: {
    // Windows Hyper-V часто резервирует 5141–5240 → EACCES на :5173
    host: true,
    port: 5273,
    strictPort: false,
  },
})

