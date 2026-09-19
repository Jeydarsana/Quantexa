export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="card h-96 flex flex-col items-center justify-center text-center">
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-textMuted max-w-md">
        This module is scheduled for development in the upcoming QuantLens implementation phases.
      </p>
    </div>
  );
}
