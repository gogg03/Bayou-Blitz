import { SceneManager } from './rendering/SceneManager';

if (import.meta.env.DEV) {
  console.log('WS_URL:', import.meta.env.VITE_WS_URL);
  console.log('API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
}

const app = document.getElementById('app')!;
const sceneManager = new SceneManager(app);

function animate(): void {
  sceneManager.render();
  requestAnimationFrame(animate);
}
animate();
