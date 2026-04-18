export default function InboxPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <span className="text-5xl">📥</span>
      <h2 className="font-display text-2xl font-700 text-stone-800 dark:text-stone-100">Recipe Inbox</h2>
      <p className="text-stone-500 dark:text-stone-400 font-body text-sm">
        Paste a URL, let AI extract the recipe. Coming in F9.
      </p>
    </div>
  )
}
