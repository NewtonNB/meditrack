import { Head } from '@inertiajs/react';

export default function Placeholder({ title }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Head title={title} />
      <h1 className="text-3xl font-bold text-gray-700 mb-4">{title}</h1>
      <p className="text-gray-500">
        This is a placeholder page for <b>{title}</b>.
      </p>
    </div>
  );
}
