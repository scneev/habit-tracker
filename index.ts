import { registerRootComponent } from 'expo';
import App from './App';

// Catch any unhandled JS promise rejections in production so they show as
// the ErrorBoundary "RENDER ERROR" screen instead of silently killing the app.
const handler = (ErrorUtils as any).getGlobalHandler?.();
(ErrorUtils as any).setGlobalHandler?.((error: Error, isFatal: boolean) => {
  console.error('[global]', error?.message, error?.stack);
  if (handler) handler(error, isFatal);
});

registerRootComponent(App);
