import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import decorators from "@babel/plugin-proposal-decorators"
// https://vite.dev/config/
const config = defineConfig({
  plugins: [react(), decorators({ "version": "2023-11" })],
})

export default config
