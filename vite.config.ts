import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` produit des chemins relatifs : l'application fonctionne aussi bien
// à la racine d'un domaine que dans un sous-dossier (GitHub Pages : /<depot>/).
export default defineConfig({
  base: './',
  plugins: [react()],
});
