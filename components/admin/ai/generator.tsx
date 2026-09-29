"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, CalendarRange, Sparkles, Wand2 } from "lucide-react";
import { AdminButton, Banner, Field, Input, Panel, Select, Textarea } from "@/components/admin/ui";
import { AiEstimate, DuplicateWarning, FindingList, ImageSuggestionCard, JobProgress } from "./ai-ui";
import {
  checkDuplicates,
  createDraftFromGeneration,
  generateBlog,
  generateTopics,
  getContentBrain,
  researchKeywords,
  runMonthlyBatch,
  type ProviderStatus,
} from "@/lib/admin/ai-api";
import { BLOG_STEPS, type GenerationOutcome, type JobStep } from "@/lib/ai/pipeline";
import { AI_ESTIMATE_DISCLAIMER } from "@/lib/ai/labels";
import { PROMPT_VERSION } from "@/lib/ai/version";
import type { CategoryRow } from "@/lib/cms/types";
import type { DuplicateMatch, GenerationSettings, ScoredTopic } from "@/lib/ai/types";
import { listCategories } from "@/lib/admin/api";

const DEFAULT_SETTINGS: GenerationSettings = {
  targetWordCount: 1200,
  tone: "Clear, calm and patient-friendly",
  language: "English (India)",
  includeFaq: true,
  includeCta: true,
  includeInternalLinks: true,
  includeExternalSources: false,
  includeImageSuggestions: true,
  followHouseStyle: true,
};

type Tab = "single" | "monthly";

export function Generator({ defaultAuthor }: { defaultAuthor: string }) {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("single");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [provider, setProvider] = useState<ProviderStatus | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("");
  const [audience, setAudience] = useState("Adults / working professionals");
  const [instructions, setInstructions] = useState("");

  const [focusKeyword, setFocusKeyword] = useState("");
  const [secondary, setSecondary] = useState("");
  const [researchKeywordsOn, setResearchKeywordsOn] = useState(true);
  const [researching, setResearching] = useState(false);

  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);

  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [dismissedDuplicates, setDismissedDuplicates] = useState(false);

  const [steps, setSteps] = useState<JobStep[]>(BLOG_STEPS.map((s) => ({ ...s, state: "pending" })));
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<GenerationOutcome | null>(null);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);

  const [perMonth, setPerMonth] = useState(4);
  const [candidates, setCandidates] = useState<ScoredTopic[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchBusy, setBatchBusy] = useState(false);
  const [topicsBusy, setTopicsBusy] = useState(false);
  const [batchLog, setBatchLog] = useState<string[]>([]);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => setCategories([]));
    getContentBrain()
      .then((data) => {
        setProvider(data.provider);
        setHasProfile(Boolean(data.profile));
      })
      .catch(() => setHasProfile(false));
  }, []);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    const tooShort = topic.trim().length < 8;
    debounce.current = setTimeout(() => {
      if (tooShort) {
        setDuplicates([]);
        return;
      }
      checkDuplicates(topic, focusKeyword)
        .then((r) => {
          setDuplicates(r.duplicates);
          setDismissedDuplicates(false);
        })
        .catch(() => setDuplicates([]));
    }, 600);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [topic, focusKeyword]);

  const set = <K extends keyof GenerationSettings>(key: K, value: GenerationSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const secondaryList = useMemo(
    () => secondary.split(",").map((s) => s.trim()).filter(Boolean),
    [secondary],
  );

  const doResearch = useCallback(async () => {
    setError(null);
    setResearching(true);
    try {
      const result = await researchKeywords({ topic, focusKeyword, category });
      if (!focusKeyword) setFocusKeyword(result.focusKeyword);
      if (!secondary) setSecondary(result.secondaryKeywords.join(", "));
      setDuplicates(result.duplicates);
      setNotice(result.disclaimer);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Keyword research failed.");
    } finally {
      setResearching(false);
    }
  }, [topic, focusKeyword, secondary, category]);

  const doGenerate = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;

    setError(null);
    setNotice(null);
    setOutcome(null);
    setBusy(true);
    setSteps(BLOG_STEPS.map((s, i) => ({ ...s, state: i === 0 ? "running" : "pending" })));

    try {
      const result = await generateBlog({
        topic,
        category,
        audience,
        instructions,
        focusKeyword,
        secondaryKeywords: secondaryList,
        settings,
      });

      setSteps(result.steps);
      setOutcome(result);
      if (result.status === "partial") {
        setNotice(`${result.error} The article itself was written and can be saved.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
      setSteps((prev) => prev.map((s) => (s.state === "running" ? { ...s, state: "failed" } : s)));
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }, [topic, category, audience, instructions, focusKeyword, secondaryList, settings]);

  const saveDraft = useCallback(async () => {
    if (!outcome?.blog) return;
    setSaving(true);
    setError(null);
    try {
      const row = await createDraftFromGeneration(outcome, {
        author: defaultAuthor,
        generationType: "single",
        promptVersion: PROMPT_VERSION,
      });
      router.push(`/admin/blogs/${row.id}/`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the draft.");
      setSaving(false);
    }
  }, [outcome, defaultAuthor, router]);

  const topicsInFlight = useRef(false);
  const doTopics = useCallback(async () => {
    if (topicsInFlight.current) return;
    topicsInFlight.current = true;
    setError(null);
    setBatchBusy(true);
    setTopicsBusy(true);
    setCandidates([]);
    try {
      const result = await generateTopics({ count: perMonth, instructions });
      setCandidates(result.candidates);
      setSelected(new Set(result.shortlist));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Topic research failed.");
    } finally {
      topicsInFlight.current = false;
      setTopicsBusy(false);
      setBatchBusy(false);
    }
  }, [perMonth, instructions]);

  const doBatch = useCallback(async () => {
    const chosen = candidates.filter((c) => selected.has(c.topic));
    if (!chosen.length) {
      setError("Select at least one topic.");
      return;
    }

    setError(null);
    setBatchBusy(true);
    setBatchLog([`Generating ${chosen.length} article(s)…`]);

    try {
      const result = await runMonthlyBatch({
        topics: chosen.map((c) => ({
          topic: c.topic,
          focusKeyword: c.focusKeyword,
          secondaryKeywords: c.secondaryKeywords,
          category: c.category,
        })),
        settings,
        audience,
        instructions,
      });

      const log: string[] = [];
      for (const item of result.results) {
        if (!item.blog) {
          log.push(`✕ ${item.topic} — ${item.error}`);
          continue;
        }
        try {
          const row = await createDraftFromGeneration(item, {
            author: defaultAuthor,
            generationType: "monthly",
            promptVersion: PROMPT_VERSION,
          });
          log.push(`✓ ${row.title} — saved as a draft`);
        } catch (e) {
          log.push(`✕ ${item.topic} — generated but not saved: ${e instanceof Error ? e.message : "unknown error"}`);
        }
        setBatchLog([...log]);
      }

      setBatchLog([...log, "Drafts are in Posts, awaiting review and scheduling."]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The batch failed.");
    } finally {
      setBatchBusy(false);
    }
  }, [candidates, selected, settings, audience, instructions, defaultAuthor]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium text-navy-900">Generate blog</h1>
          <p className="mt-0.5 text-sm text-muted">
            Drafts only. Nothing here publishes — review, schedule and publish happen in the editor.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Bot className="h-4 w-4" aria-hidden />
          {provider ? (
            <span>
              {provider.provider} · {provider.model}
              {!provider.live && (
                <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800">
                  mock — no model is being called
                </span>
              )}
            </span>
          ) : (
            <span>checking provider…</span>
          )}
        </div>
      </header>

      {hasProfile === false && (
        <div className="mt-4">
          <Banner tone="warn">
            No content brain yet, so generations will not follow the site&apos;s house style.{" "}
            <Link href="/admin/content-brain/" className="font-semibold underline">
              Build it
            </Link>{" "}
            first — it is analysed once and reused.
          </Banner>
        </div>
      )}

      {error && <div className="mt-4"><Banner tone="error">{error}</Banner></div>}
      {notice && <div className="mt-4"><Banner tone="info">{notice}</Banner></div>}

      <div className="mt-5 flex gap-1 border-b border-border">
        {([["single", "One article", Sparkles], ["monthly", "Monthly topics", CalendarRange]] as const).map(
          ([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={
                tab === key
                  ? "inline-flex items-center gap-1.5 border-b-2 border-navy-900 px-3 py-2 text-sm font-semibold text-navy-900"
                  : "inline-flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-sm text-muted hover:text-navy-900"
              }
            >
              <Icon className="h-4 w-4" aria-hidden /> {label}
            </button>
          ),
        )}
      </div>

      {tab === "single" ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <div className="flex flex-col gap-5 lg:col-span-2">
            <Panel title="Topic">
              <div className="flex flex-col gap-3">
                <Field label="Topic" htmlFor="gen-topic">
                  <Input
                    id="gen-topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Why does neck pain get worse while working?"
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Category" htmlFor="gen-category">
                    <Select id="gen-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="">Let the model choose</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Target audience" htmlFor="gen-audience">
                    <Input id="gen-audience" value={audience} onChange={(e) => setAudience(e.target.value)} />
                  </Field>
                </div>
                <Field label="Additional instructions" htmlFor="gen-instructions">
                  <Textarea
                    id="gen-instructions"
                    rows={3}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Keep it patient-friendly and medically accurate."
                  />
                </Field>

                {duplicates.length > 0 && !dismissedDuplicates && (
                  <DuplicateWarning
                    matches={duplicates}
                    onUseDifferent={() => setTopic("")}
                    onContinue={() => setDismissedDuplicates(true)}
                  />
                )}
              </div>
            </Panel>

            <Panel
              title="SEO & keywords"
              action={
                <label className="flex items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={researchKeywordsOn}
                    onChange={(e) => setResearchKeywordsOn(e.target.checked)}
                  />
                  Let the planning step choose keywords
                </label>
              }
            >
              <div className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Primary / focus keyword" htmlFor="gen-keyword">
                    <Input id="gen-keyword" value={focusKeyword} onChange={(e) => setFocusKeyword(e.target.value)} />
                  </Field>
                  <Field label="Secondary keywords (comma separated)" htmlFor="gen-secondary">
                    <Input id="gen-secondary" value={secondary} onChange={(e) => setSecondary(e.target.value)} />
                  </Field>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <AdminButton onClick={() => void doResearch()} disabled={!topic.trim() || researching}>
                    <Wand2 className="h-4 w-4" /> {researching ? "Researching…" : "Suggest keywords"}
                  </AdminButton>
                  <p className="text-xs text-muted">{AI_ESTIMATE_DISCLAIMER}</p>
                </div>
                <p className="text-xs text-muted">
                  The rule-based SEO score in the editor remains the authority on on-page SEO —
                  whatever is generated here is scored by it like anything else.
                </p>
              </div>
            </Panel>

            <Panel title="Content settings">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Target word count" htmlFor="gen-words">
                  <Input
                    id="gen-words"
                    type="number"
                    min={300}
                    max={4000}
                    step={100}
                    value={settings.targetWordCount}
                    onChange={(e) => set("targetWordCount", Number(e.target.value))}
                  />
                </Field>
                <Field label="Tone" htmlFor="gen-tone">
                  <Input id="gen-tone" value={settings.tone} onChange={(e) => set("tone", e.target.value)} />
                </Field>
                <Field label="Language" htmlFor="gen-language">
                  <Input id="gen-language" value={settings.language} onChange={(e) => set("language", e.target.value)} />
                </Field>
                <fieldset className="sm:col-span-2">
                  <legend className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                    Include
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {([
                      ["followHouseStyle", "Follow Dr. Jayesh style"],
                      ["includeFaq", "FAQ"],
                      ["includeCta", "CTA"],
                      ["includeImageSuggestions", "Image suggestions"],
                      ["includeInternalLinks", "Internal linking suggestions"],
                      ["includeExternalSources", "External source suggestions"],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 text-sm text-navy-900">
                        <input
                          type="checkbox"
                          checked={settings[key]}
                          onChange={(e) => set(key, e.target.checked)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            </Panel>
          </div>

          <div className="flex flex-col gap-5">
            <Panel title="Generation">
              <AdminButton
                variant="primary"
                className="w-full"
                onClick={() => void doGenerate()}
                disabled={busy || !topic.trim()}
              >
                <Sparkles className="h-4 w-4" /> {busy ? "Generating…" : "Generate blog"}
              </AdminButton>

              <div className="mt-4">
                <JobProgress steps={steps} busy={busy} />
              </div>

              {outcome?.blog && (
                <div className="mt-4 flex flex-col gap-2">
                  <AdminButton variant="primary" onClick={() => void saveDraft()} disabled={saving}>
                    {saving ? "Saving…" : "Save as draft & open editor"}
                  </AdminButton>
                  <AdminButton onClick={() => void doGenerate()} disabled={busy}>
                    Regenerate
                  </AdminButton>
                  <p className="text-xs text-muted">
                    Saved as a draft. Scheduling and publishing stay in the editor.
                  </p>
                </div>
              )}

              {outcome?.status === "failed" && (
                <div className="mt-3">
                  <Banner tone="error">
                    {outcome.error}{" "}
                    <button className="font-semibold underline" onClick={() => void doGenerate()}>
                      Retry
                    </button>
                  </Banner>
                </div>
              )}
            </Panel>

            {outcome?.blog && (
              <Panel title="Preview">
                <p className="text-sm font-semibold text-navy-900">{outcome.blog.title}</p>
                <p className="mt-1 text-xs text-muted">/{outcome.blog.slug}/</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{outcome.blog.excerpt}</p>
                <dl className="mt-3 flex flex-col gap-1 text-xs text-muted">
                  <div><dt className="inline font-medium">SEO title: </dt><dd className="inline">{outcome.blog.metaTitle}</dd></div>
                  <div><dt className="inline font-medium">Meta: </dt><dd className="inline">{outcome.blog.metaDescription}</dd></div>
                  <div><dt className="inline font-medium">Keyword: </dt><dd className="inline">{outcome.blog.primaryKeyword}</dd></div>
                  <div><dt className="inline font-medium">FAQ: </dt><dd className="inline">{outcome.blog.faq.length} item(s)</dd></div>
                </dl>
              </Panel>
            )}
          </div>

          {outcome?.blog && (
            <div className="flex flex-col gap-5 lg:col-span-3">
              <Panel title="Review">
                <div className="grid gap-5 sm:grid-cols-3">
                  <FindingList
                    title="Medical review"
                    findings={outcome.review?.medical ?? null}
                    emptyLabel="No obvious unsupported claims detected"
                  />
                  <FindingList
                    title="Style & originality"
                    findings={
                      outcome.review
                        ? [...outcome.review.style, ...outcome.review.originality, ...outcome.review.language]
                        : null
                    }
                    emptyLabel="Consistent with the house style"
                  />
                  <FindingList
                    title="Grammar"
                    findings={outcome.review?.grammar ?? null}
                    emptyLabel="No mechanical errors found"
                  />
                </div>
                {outcome.review && outcome.review.sources.length > 0 && (
                  <div className="mt-4 text-xs text-muted">
                    <p className="font-semibold text-slate-600">Cited sources</p>
                    <ul className="mt-1 flex flex-col gap-0.5">
                      {outcome.review.sources.map((s, i) => (
                        <li key={i}>
                          <a href={s.url} target="_blank" rel="noreferrer" className="underline">{s.url}</a> — {s.claim}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="mt-4 text-xs text-muted">
                  Flagged claims are for a human to verify. Nothing here blocks publishing, and
                  nothing here approves it.
                </p>
              </Panel>

              {outcome.blog.imageSuggestions.length > 0 && (
                <Panel title="Image suggestions">
                  <p className="mb-3 text-xs text-muted">
                    Prompts only — no image is generated. Copy a prompt, make the image, then
                    upload it as the featured image in the editor&apos;s media picker.
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {outcome.blog.imageSuggestions.map((image, i) => (
                      <ImageSuggestionCard key={i} image={image} />
                    ))}
                  </div>
                </Panel>
              )}

              {(outcome.blog.internalLinkSuggestions.length > 0 ||
                outcome.blog.externalSourceSuggestions.length > 0) && (
                <Panel title="Link suggestions">
                  <div className="grid gap-4 sm:grid-cols-2 text-sm">
                    {outcome.blog.internalLinkSuggestions.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-navy-900">Suggested related posts</h3>
                        <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-4 text-muted">
                          {outcome.blog.internalLinkSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                        <p className="mt-1.5 text-xs text-muted">
                          Add or remove these with the editor&apos;s related-posts picker.
                        </p>
                      </div>
                    )}
                    {outcome.blog.externalSourceSuggestions.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-navy-900">External sources to consider</h3>
                        <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-4 text-muted">
                          {outcome.blog.externalSourceSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                        <p className="mt-1.5 text-xs text-muted">Verify each before citing it.</p>
                      </div>
                    )}
                  </div>
                </Panel>
              )}

              {outcome.duplicates.length > 0 && (
                <DuplicateWarning matches={outcome.duplicates} />
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-5">
          <Panel title="Monthly topics">
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Blogs this month" htmlFor="gen-count" className="w-40">
                <Input
                  id="gen-count"
                  type="number"
                  min={1}
                  max={12}
                  value={perMonth}
                  onChange={(e) => setPerMonth(Number(e.target.value))}
                />
              </Field>
              <AdminButton onClick={() => void doTopics()} disabled={batchBusy}>
                <Wand2 className="h-4 w-4" /> {topicsBusy ? "Generating topic candidates…" : "Generate topic candidates"}
              </AdminButton>
              <p className="text-xs text-muted">
                Proposes {perMonth + 2} topics, shortlists {perMonth}. You approve before anything is written.
              </p>
            </div>
          </Panel>

          {candidates.length > 0 && (
            <Panel
              title={`Candidates (${candidates.length})`}
              action={
                <AdminButton variant="primary" onClick={() => void doBatch()} disabled={batchBusy}>
                  Generate selected ({selected.size})
                </AdminButton>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[60rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
                      <th className="w-8 py-2" />
                      <th className="py-2 pr-3">Topic</th>
                      <th className="py-2 pr-3">Focus keyword</th>
                      <th className="py-2 pr-3">Intent</th>
                      <th className="py-2 pr-3">Reason / gap</th>
                      <th className="py-2 pr-3">Estimate</th>
                      <th className="py-2">Similar existing content</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c) => (
                      <tr key={c.topic} className="border-b border-border/60 align-top">
                        <td className="py-2.5">
                          <input
                            type="checkbox"
                            checked={selected.has(c.topic)}
                            onChange={(e) => {
                              const next = new Set(selected);
                              if (e.target.checked) next.add(c.topic);
                              else next.delete(c.topic);
                              setSelected(next);
                            }}
                            aria-label={`Select ${c.topic}`}
                          />
                        </td>
                        <td className="py-2.5 pr-3">
                          <input
                            value={c.topic}
                            onChange={(e) => {
                              const next = e.target.value;
                              setCandidates((prev) =>
                                prev.map((item) => (item.topic === c.topic ? { ...item, topic: next } : item)),
                              );
                              setSelected((prev) => {
                                if (!prev.has(c.topic)) return prev;
                                const updated = new Set(prev);
                                updated.delete(c.topic);
                                updated.add(next);
                                return updated;
                              });
                            }}
                            className="w-full min-w-[14rem] rounded border border-transparent bg-transparent px-1 py-0.5 font-medium text-navy-900 hover:border-border focus:border-navy-300 focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 pr-3 text-muted">{c.focusKeyword}</td>
                        <td className="py-2.5 pr-3 text-muted">{c.intent}</td>
                        <td className="py-2.5 pr-3 text-xs text-muted">{c.reason || c.contentGap}</td>
                        <td className="py-2.5 pr-3"><AiEstimate value={c.aiEstimate} /></td>
                        <td className="py-2.5 text-xs">
                          {c.similar.length === 0 ? (
                            <span className="text-emerald-700">None</span>
                          ) : (
                            <ul className="flex flex-col gap-0.5">
                              {c.similar.map((s) => (
                                <li key={s.slug} className="text-amber-800">
                                  {s.title} ({Math.round(s.score * 100)}%)
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted">{AI_ESTIMATE_DISCLAIMER}</p>
            </Panel>
          )}

          {batchLog.length > 0 && (
            <Panel title="Batch">
              <ul className="flex flex-col gap-1 text-sm">
                {batchLog.map((line, i) => (
                  <li key={i} className={line.startsWith("✕") ? "text-red-700" : "text-navy-900"}>{line}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted">
                Every article is saved as a draft in <Link href="/admin/blogs/" className="underline">Posts</Link>,
                where the existing scheduler takes over.
              </p>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
