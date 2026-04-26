import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <div className="glass max-w-lg rounded-[2rem] p-10">
        <p className="text-sm uppercase tracking-[0.35em] text-[var(--gold)]">
          Lost knight
        </p>
        <h1 className="mt-4 font-[var(--font-display)] text-4xl font-bold">
          This square is empty.
        </h1>
        <p className="mt-4 text-slate-300">
          Head back to the arena and start a cleaner attack.
        </p>
        <Button asChild href="/" className="mt-8">
          Back home
        </Button>
      </div>
    </main>
  );
}
