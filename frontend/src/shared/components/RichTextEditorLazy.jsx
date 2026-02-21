import { lazy, Suspense } from 'react';

const RichTextEditor = lazy(() => import('./RichTextEditor'));

function RichTextEditorSkeleton() {
  return (
    <div className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center">
      <div className="text-gray-400">Caricamento editor...</div>
    </div>
  );
}

export default function RichTextEditorLazy(props) {
  return (
    <Suspense fallback={<RichTextEditorSkeleton />}>
      <RichTextEditor {...props} />
    </Suspense>
  );
}
