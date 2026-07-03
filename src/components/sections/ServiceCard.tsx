import type { Service } from "@/content/services";

export default function ServiceCard({ service }: { service: Service }) {
  const { name, description, premium, tools } = service;

  return (
    <article
      className={`group relative flex h-full flex-col rounded-2xl border p-8 transition-all duration-300 ${
        premium
          ? "border-purple-1 bg-white shadow-[0_0_0_1px_rgba(139,30,160,0.15)]"
          : "border-purple-3/20 bg-white hover:border-purple-3/50 hover:shadow-lg"
      }`}
    >
      {premium && (
        <span className="absolute -top-3 left-8 rounded-full bg-purple-1 px-3 py-1 text-xs font-medium tracking-wide text-white">
          Destacado
        </span>
      )}

      <h3 className="font-serif text-xl text-purple-2 sm:text-2xl">{name}</h3>
      <p className="mt-4 flex-1 text-base leading-relaxed text-ink/80">
        {description}
      </p>

      {tools && (
        <div className="mt-6 flex flex-wrap gap-2">
          {tools.map((tool) => (
            <span
              key={tool}
              className="rounded-full bg-lavender px-3 py-1 text-xs text-purple-2"
            >
              {tool}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
