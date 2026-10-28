import { useStore } from './store';
import { Choose } from './components/Choose';
import { CapsuleScreen } from './components/CapsuleScreen';
import { Toast } from './components/ui';

export function App() {
  const screen = useStore((s) => s.screen);
  const hasCap = useStore((s) => Object.keys(s.capsules).length > 0);
  return (
    <>
      {screen === 'capsule' && hasCap ? <CapsuleScreen /> : <Choose />}
      <Toast />
    </>
  );
}
