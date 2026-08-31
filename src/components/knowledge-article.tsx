import { ArrowRight, CheckCircle2 } from "lucide-react";

import { PublicMarketingShell } from "@/components/public-marketing-shell";
import { Button } from "@/components/ui/button";
import { useCampaignSource } from "@/lib/campaign-source";

export type KnowledgeSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type KnowledgeFaq = {
  question: string;
  answer: string;
};

type KnowledgeArticleProps = {
  kicker: string;
  title: string;
  intro: string;
  readingTime: string;
  source: string;
  sections: KnowledgeSection[];
  faq: KnowledgeFaq[];
};

export function KnowledgeArticle({
  kicker,
  title,
  intro,
  readingTime,
  source,
  sections,
  faq,
}: KnowledgeArticleProps) {
  const campaignSource = useCampaignSource(source);

  return (
    <PublicMarketingShell source={source}>
      <main>
        <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,#dff3ff_0,transparent_38%),linear-gradient(145deg,#f8fbff_0%,#fffaf3_100%)]">
          <div className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
            <a
              href={`/wissen?source=${encodeURIComponent(campaignSource)}`}
              className="text-sm font-semibold text-primary hover:underline"
            >
              ZunftEcho Wissen
            </a>
            <p className="mt-8 text-sm font-semibold tracking-[0.16em] text-primary uppercase">
              {kicker}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              {title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{intro}</p>
            <p className="mt-5 text-sm text-slate-500">Praxisleitfaden · {readingTime}</p>
          </div>
        </section>

        <article className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:px-10">
          <div className="space-y-12">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {section.title}
                </h2>
                <div className="mt-5 space-y-4 text-base leading-7 text-slate-700">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets ? (
                  <ul className="mt-6 grid gap-3">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                      >
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            <section className="border-t border-slate-200 pt-10">
              <h2 className="text-2xl font-semibold tracking-tight">Häufige Fragen</h2>
              <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 px-5 sm:px-7">
                {faq.map((item) => (
                  <div key={item.question} className="py-6">
                    <h3 className="font-semibold text-slate-950">{item.question}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-xl">
              <p className="text-sm font-semibold text-sky-300">In zwei Minuten ansehen</p>
              <h2 className="mt-2 text-xl font-semibold">Vom Chat bis zum fertigen Lead</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Die interaktive Demo benötigt keine Anmeldung und schreibt keine Produktionsdaten.
              </p>
              <Button asChild className="mt-5 w-full" variant="secondary">
                <a href={`/demo?source=${encodeURIComponent(campaignSource)}`}>
                  Live-Demo öffnen <ArrowRight />
                </a>
              </Button>
            </div>
          </aside>
        </article>
      </main>
    </PublicMarketingShell>
  );
}
