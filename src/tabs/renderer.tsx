import '@src/app/globals.css';
import IndependentRenderer from '@src/app/(extension)/independent/components';

const RendererPage = () => (
  <main className="relative min-h-screen w-full bg-white pt-12">
    <IndependentRenderer />
  </main>
);

export default RendererPage;
