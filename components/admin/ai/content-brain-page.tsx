"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Brain, RefreshCw } from "lucide-react";
import { AdminButton, Banner, Field, Input, Panel, Select } from "@/components/admin/ui";
import {
  getAiSettings,
  getContentBrain,
  refreshContentBrain,
  saveAiSettings,
  type AiSettings,
  type ProviderStatus,
  type SourceCounts,
  type StoredProfile,
} from "@/lib/admin/ai-api";
import { formatInZone } from "@/lib/admin/timezone";
import type { ContentProfile } from "@/lib/ai/types";

function Rows({ entries }: { entries: [string, string | number][] }) {
  return (
    <dl className="flex flex-col gap-2 text-sm">
      {entries
        .filter(([, value]) => value !== "" && value !== undefined && value !== null)
        .map(([label, value]) => (
          <div key={label} className="grid gap-0.5 sm:grid-cols-[11rem_1fr] sm:gap-3">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
            <dd className="leading-relaxed text-navy-900">{value}</dd>
          </div>
        ))}
    </dl>
  );
}

function SourceStat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-medium text-navy-900">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p>
    </div>
  );
}

function Tags({ items, tone = "slate" }: { items: string[]; tone?: "slate" | "amber" | "emerald" }) {
  if (!items.length) return <p className="text-sm text-muted">None recorded.</p>;
  const styles = {
    slate: "bg-slate-100 text-slate-700",
    amber: "bg-amber-50 text-amber-800",
    emerald: "bg-emerald-50 text-emerald-800",
  } as const;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item} className={`rounded-full px-2.5 py-1 text-xs ${styles[tone]}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ContentBrainPage() {
  const [stored, setStored] = useState<StoredProfile | null>(null);
  const [sources, setSources] = useState<SourceCounts | null>(null);
  const [setupRequired, setSetupRequired] = useState<string | null>(null);
  const [provider, setProvider] = useState<ProviderStatus | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getContentBrain(), getAiSettings()])
      .then(([brain, config]) => {
        setStored(brain.profile);
        setSources(brain.sources ?? null);
        setSetupRequired(brain.setupRequired ? (brain.error ?? "Setup required.") : null);
        setProvider(brain.provider ?? null);
        setProviderError(brain.providerError ?? null);
        setSettings(config);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load the content brain."))
      .finally(() => setLoading(false));
  }, []);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await refreshContentBrain();
      setStored(result.profile);
      setSetupRequired(null);
      setNotice(
        `Analysed a ${result.sampled}-article sample of ${result.total} — ` +
          `${result.profile.markdown_posts} from content/*.md, ${result.profile.supabase_posts} from the CMS.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "The analysis failed.");
    } finally {
      setBusy(false);
    }
  }, []);

  const save = useCallback(
    async (patch: Partial<AiSettings>) => {
      if (!settings) return;
      const next = { ...settings, ...patch };
      setSettings(next);
      try {
        await saveAiSettings(patch);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save settings.");
        setSettings(settings);
      }
    },
    [settings],
  );

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  const profile: ContentProfile | null = stored?.profile ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-medium text-navy-900">
            <Brain className="h-5 w-5" aria-hidden /> Content brain
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {stored ? `Built · last refreshed ${formatInZone(stored.created_at)}` : "Not built yet."}
          </p>
        </div>
        <AdminButton variant="primary" onClick={() => void refresh()} disabled={busy}>
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
          {busy ? "Analysing…" : "Refresh content brain"}
        </AdminButton>
      </header>

      {error && <div className="mt-4"><Banner tone="error">{error}</Banner></div>}
      {notice && <div className="mt-4"><Banner tone="success">{notice}</Banner></div>}
      {providerError && <div className="mt-4"><Banner tone="warn">{providerError}</Banner></div>}

      {provider && !provider.live && (
        <div className="mt-4">
          <Banner tone="warn">
            The mock provider is active — no model is being called. Set <code>BAZAARLINK_API_KEY</code>{" "}
            (or <code>SARVAM_API_KEY</code> / <code>GEMINI_API_KEY</code>) to use a real model.
          </Banner>
        </div>
      )}

      {setupRequired && (
        <div className="mt-4">
          <Banner tone="warn">
            {setupRequired}
            <br />
            <span className="text-xs">
              The migration only adds the AI tables. It does not touch <code>blogs</code>,
              and it does not move anything out of <code>content/*.md</code>.
            </span>
          </Banner>
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <SourceStat
          label="Historical markdown"
          value={sources?.markdown ?? stored?.markdown_posts ?? 0}
          hint="content/*.md — migrated WordPress articles, read from disk"
        />
        <SourceStat
          label="Supabase articles"
          value={sources?.supabase ?? stored?.supabase_posts ?? 0}
          hint="Created in the CMS. Zero is normal at first."
        />
        <SourceStat
          label="Total corpus"
          value={sources?.total ?? (stored ? stored.markdown_posts + stored.supabase_posts : 0)}
          hint={
            stored
              ? `Analysed ${stored.markdown_posts + stored.supabase_posts} at the last refresh`
              : "Refresh to analyse"
          }
        />
      </div>

      {stored &&
        sources &&
        sources.total !== stored.markdown_posts + stored.supabase_posts && (
          <div className="mt-4">
            <Banner tone="info">
              The corpus has changed since the last refresh ({stored.markdown_posts + stored.supabase_posts} analysed,
              {" "}
              {sources.total} now). Refresh when you want the new articles taken into account —
              it is not automatic, because a rebuild is the one expensive call here.
            </Banner>
          </div>
        )}

      {!profile ? (
        <div className="mt-5">
          <Panel>
            <p className="text-sm leading-relaxed text-muted">
              The content brain is one analysis over two separate sources: the migrated
              WordPress articles in <code>content/*.md</code>, which stay on disk, and the posts
              created in the CMS, which live in Supabase. They are read together and summarised
              into a single profile — the articles themselves are never copied anywhere.
            </p>
            <p className="mt-3 text-sm text-muted">
              That profile is what each generation is handed, instead of the articles — which is
              what stops one blog costing a full corpus read. Refresh it after a batch of new
              posts, or whenever the writing has moved on. Nothing reaches a model until you
              press the button.
            </p>
          </Panel>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Panel title="Writing style">
            <Rows
              entries={[
                ["Tone", profile.writingStyle.tone],
                ["Vocabulary", profile.writingStyle.vocabulary],
                ["Sentences", profile.writingStyle.sentenceStructure],
                ["Paragraphs", profile.writingStyle.paragraphStructure],
                ["Headings", profile.writingStyle.headingPatterns],
                ["Introductions", profile.writingStyle.introductionStyle],
                ["Conclusions", profile.writingStyle.conclusionStyle],
                ["FAQ style", profile.writingStyle.faqStyle],
                ["CTA style", profile.writingStyle.ctaStyle],
                ["Terminology", profile.writingStyle.medicalTerminology],
                ["Plain language", profile.writingStyle.patientFriendlyLanguage],
                ["Typical length", `${profile.writingStyle.typicalWordCount} words`],
              ]}
            />
          </Panel>

          <Panel title="SEO intelligence">
            <Rows
              entries={[
                ["Title patterns", profile.seoPatterns.titlePatterns.join(" · ")],
                ["Meta patterns", profile.seoPatterns.metaDescriptionPatterns.join(" · ")],
                ["Keyword usage", profile.seoPatterns.keywordUsage],
                ["Slug patterns", profile.seoPatterns.slugPatterns],
                ["Heading structure", profile.seoPatterns.headingStructure],
                ["Internal linking", profile.seoPatterns.internalLinking],
              ]}
            />
            <p className="mt-3 text-xs text-muted">
              Descriptive only. The rule-based score in the editor is what actually judges a
              post&apos;s on-page SEO.
            </p>
          </Panel>

          <Panel title="Topic intelligence" className="lg:col-span-2">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-navy-900">Clusters</h3>
                <div className="mt-2 flex flex-col gap-3">
                  {profile.topicIntelligence.clusters.map((cluster) => (
                    <div key={cluster.name}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                        {cluster.name}
                      </p>
                      <Tags items={cluster.topics} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-navy-900">Content gaps</h3>
                  <div className="mt-2"><Tags items={profile.topicIntelligence.contentGaps} tone="emerald" /></div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-navy-900">Topics to avoid</h3>
                  <div className="mt-2"><Tags items={profile.topicIntelligence.topicsToAvoid} tone="amber" /></div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-navy-900">Recently published</h3>
                  <div className="mt-2"><Tags items={profile.topicIntelligence.recentTopics} /></div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Image intelligence" className="lg:col-span-2">
            <Rows
              entries={[
                ["Style", profile.imagePatterns.style],
                ["Composition", profile.imagePatterns.composition],
                ["Subject", profile.imagePatterns.subject],
                ["Realism", profile.imagePatterns.realism],
                ["Aspect ratio", profile.imagePatterns.aspectRatio],
                ["Text in images", profile.imagePatterns.textPolicy],
                ["Featured images", profile.imagePatterns.featuredImageStyle],
              ]}
            />
          </Panel>
        </div>
      )}

      {settings && (
        <div className="mt-5">
          <Panel title="Monthly AI blog generation">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex items-center gap-2 text-sm text-navy-900">
                <input
                  type="checkbox"
                  checked={settings.monthly_enabled}
                  onChange={(e) => void save({ monthly_enabled: e.target.checked })}
                />
                Enabled
              </label>
              <Field label="Blogs per month" htmlFor="ai-count">
                <Input
                  id="ai-count"
                  type="number"
                  min={1}
                  max={20}
                  value={settings.blogs_per_month}
                  onChange={(e) => void save({ blogs_per_month: Number(e.target.value) })}
                />
              </Field>
              <Field label="Generation day" htmlFor="ai-day">
                <Select
                  id="ai-day"
                  value={settings.generation_day}
                  onChange={(e) => void save({ generation_day: Number(e.target.value) })}
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </Select>
              </Field>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-navy-900">
                  <input
                    type="checkbox"
                    checked={settings.approval_required}
                    onChange={(e) => void save({ approval_required: e.target.checked })}
                  />
                  Approval required
                </label>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={settings.auto_publish}
                    disabled={settings.approval_required}
                    onChange={(e) => void save({ auto_publish: e.target.checked })}
                  />
                  Auto publish
                </label>
              </div>
            </div>

            <div className="mt-4">
              <Banner tone="info">
                The monthly run is started by hand from{" "}
                <Link href="/admin/generate/" className="font-semibold underline">Generate blog → Monthly topics</Link>.
                This CMS makes every write as the signed-in admin and holds no service-role
                key, so there is no identity an unattended job could write as. The settings
                above record the plan and the schedule;{" "}
                {settings.last_run_at
                  ? `the last run was ${formatInZone(settings.last_run_at)}.`
                  : "no run has happened yet."}
              </Banner>
            </div>

            <p className="mt-3 text-xs text-muted">
              Auto publish cannot be switched on while approval is required — the database
              rejects it. Generated drafts reach the public only when a person publishes or
              schedules them.
            </p>
          </Panel>
        </div>
      )}
    </div>
  );
}
