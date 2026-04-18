export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <span className="text-5xl">🍳</span>
      <h2 className="font-display text-2xl font-700 text-stone-800 dark:text-stone-100">What should I cook?</h2>
      <p className="text-stone-500 dark:text-stone-400 font-body text-sm">
        Your AI chef is warming up. Coming in F4.
      </p>
    </div>
  )
}
