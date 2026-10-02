import { useEffect, useRef, useState } from 'react'
import askBare from '../../mocks/ask_bare.json'
import askHarness from '../../mocks/ask_harness.json'
import { getHealth, getLatestEval, USE_MOCKS } from '../api/client.js'
import { BANNER } from '../banner.js'
import AsciiBars from '../components/AsciiBars.jsx'
import Headline from '../components/Headline.jsx'
import ResultPanel from '../components/ResultPanel.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import AsciiDatabase from '../components/landing/AsciiDatabase.jsx'
import BootSequence from '../components/landing/BootSequence.jsx'
import LoopDiagram from '../components/landing/LoopDiagram.jsx'
import Marquee from '../components/landing/Marquee.jsx'
import Scramble from '../components/landing/Scramble.jsx'
import { pct } from '../components/modeLabels.js'
import { useInView } from '../lib/useInView.js'

const REPO = 'https://github.com/aryan285patyal/SmallSQL'
const MODEL_LICENSE = 'https://www.llama.com/llama3_1/license/'

const TICKER = [
  'CUSTOMER',
  'ORDERS',
  'LINEITEM',
  'SUPPLIER',
  'PART',
  'PARTSUPP',
  'NATION',
  'REGION',
  'single SELECT only',
  'max 3 attempts',
  'open-weight ≤10B',
  'execution accuracy',
  'MIT licensed',
]

export default function Landing({ theme, onToggleTheme, go }) {
  const [evalData, setEvalData] = useState(null)
  const [health, setHealth] = useState(null)

  useEffect(() => {
    getLatestEval()
      .then(setEvalData)
      .catch(() => setEvalData(false))
    getHealth()
      .then(setHealth)
      .catch(() => setHealth(false))
  }, [])

  return (
    <>
      <BootSequence />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <TopBar theme={theme} onToggleTheme={onToggleTheme} go={go} />
        <Hero go={go} evalData={evalData} />
      </div>

      <Marquee
        items={TICKER}
        className="border-y border-line bg-panel/70 py-3 text-[12px] tracking-[0.2em] text-dim uppercase"
      />

      <div className="mx-auto max-w-7xl space-y-28 px-4 py-24 sm:px-6">
        <Section n="01" id="loop" title="the loop" kicker="one model. four checks. three tries.">
          <p className="mb-10 max-w-2xl text-dim">
            A small model on its own guesses a column name, gets it wrong, and the answer is gone. The harness grounds
            the prompt in the real schema, rejects anything that isn&apos;t a single{' '}
            <span className="text-accent">SELECT</span>, runs it, and when Snowflake complains, hands the error straight
            back to the model to fix.
          </p>
          <Reveal>{(inView) => <LoopDiagram play={inView} />}</Reveal>
        </Section>

        <Section n="02" id="compare" title="side by side" kicker="same model. same schema. same question.">
          <CompareReplay />
        </Section>

        <Section n="03" id="receipts" title="the receipts" kicker="numbers from a benchmark, not a vibe.">
          <Receipts data={evalData} go={go} />
        </Section>

        <Section n="04" id="verify" title="verify everything" kicker="everything here is checkable.">
          <Verify health={health} />
        </Section>

        <FinalCta go={go} />
      </div>

      <footer className="mx-auto flex max-w-7xl flex-wrap gap-x-5 gap-y-1 border-t border-line px-4 py-6 text-[11px] text-dim sm:px-6">
        <span>SmallSQL · MIT license</span>
        <a className="hover:text-accent" href={REPO} target="_blank" rel="noreferrer">
          source ↗
        </a>
        <a className="hover:text-accent" href={MODEL_LICENSE} target="_blank" rel="noreferrer">
          model license ↗
        </a>
        <span className="ml-auto">built for hacktoberfest · snowflake track</span>
      </footer>
    </>
  )
}

/* ─────────────────────────────── top bar ─────────────────────────────── */

function TopBar({ theme, onToggleTheme, go }) {
  return (
    <div className="flex items-center justify-between gap-4 py-5">
      <a href="#/" className="font-display text-3xl leading-none text-accent glow">
        smallsql<span className="animate-blink">_</span>
      </a>
      <div className="flex items-center gap-3 text-[12px] sm:gap-5">
        <a href={REPO} target="_blank" rel="noreferrer" className="hidden text-dim hover:text-accent sm:inline">
          [ source ↗ ]
        </a>
        <button onClick={() => go('eval')} className="hidden text-dim hover:text-accent sm:inline">
          [ benchmark ]
        </button>
        <button
          onClick={() => go('ask')}
          className="border border-accent/70 px-3 py-2 font-semibold tracking-[0.15em] text-accent uppercase transition-colors hover:bg-accent hover:text-bg"
        >
          console →
        </button>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </div>
  )
}

/* ──────────────────────────────── hero ───────────────────────────────── */

function Hero({ go, evalData }) {
  const first = evalData?.modes?.[0]
  const last = evalData?.modes?.at(-1)

  return (
    <section className="grid min-h-[calc(100svh-5.5rem)] items-center gap-10 pb-16 pt-6 lg:grid-cols-[1.15fr_1fr]">
      <div>
        <p className="mb-6 text-[11px] tracking-[0.25em] text-dim uppercase">
          <span className="text-accent">//</span> open-source ai · snowflake cortex · text-to-sql
        </p>

        <h1 className="font-display text-[clamp(3.6rem,10.5vw,9.5rem)] leading-[0.82]">
          <Scramble text="SMALL MODEL." className="block text-fg" duration={700} />
          <Scramble text="BIG SQL." className="block text-accent glow" duration={1000} />
        </h1>

        <p className="mt-8 max-w-xl text-[15px] leading-7 text-dim">
          SmallSQL wraps a <span className="text-fg">≤10B open-weight model</span> in a harness:{' '}
          <span className="text-fg">schema grounding, validation, error feedback and retries</span>. Plain-English
          questions in, Snowflake SQL that actually runs out.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <button
            onClick={() => go('ask')}
            className="group relative bg-accent px-6 py-3.5 text-[13px] font-semibold tracking-[0.2em] text-bg uppercase shadow-[0_0_30px_-6px_var(--color-accent)] transition-transform hover:-translate-y-0.5"
          >
            ▶ launch console
          </button>
          <button
            onClick={() => go('eval')}
            className="border border-line px-6 py-3.5 text-[13px] tracking-[0.2em] text-fg uppercase transition-colors hover:border-accent/70 hover:text-accent"
          >
            see the benchmark
          </button>
        </div>

        <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-dashed border-line pt-6 text-[12px]">
          <HeroStat
            label={USE_MOCKS ? 'accuracy · mock' : 'accuracy'}
            value={
              first && last
                ? `${pct(first.accuracy)}% → ${pct(last.accuracy)}%`
                : evalData === false
                  ? 'pending'
                  : '···'
            }
            accent
          />
          <HeroStat label="questions" value={first ? first.per_question.length : '···'} />
          <HeroStat label="attempts / question" value="≤ 3" />
          <HeroStat label="statements allowed" value="SELECT" />
        </dl>
      </div>

      <figure className="relative mx-auto w-full max-w-[34rem]">
        <div className="relative overflow-hidden border border-line bg-panel/70 px-2 py-6 sm:px-6">
          <Ticks />
          <div className="mb-2 flex justify-between px-2 text-[10px] tracking-[0.2em] text-faint uppercase">
            <span>TPCH_SF1</span>
            <span>
              <span className="animate-blink text-accent">●</span> live
            </span>
          </div>
          <div className="flex justify-center">
            <AsciiDatabase className="text-[7.5px] sm:text-[10px] lg:text-[11px]" />
          </div>
        </div>
        <figcaption className="mt-3 text-[11px] text-faint">
          fig.1 · your warehouse, ray-cast in ascii at 30fps. no images were harmed.
        </figcaption>
      </figure>
    </section>
  )
}

function HeroStat({ label, value, accent }) {
  return (
    <div>
      <dt className="text-[10.5px] tracking-[0.2em] text-faint uppercase">{label}</dt>
      <dd className={`mt-1 font-display text-3xl leading-none ${accent ? 'text-accent glow' : 'text-fg'}`}>{value}</dd>
    </div>
  )
}

function Ticks() {
  const t = 'pointer-events-none absolute size-2.5 border-accent/80'
  return (
    <>
      <span className={`${t} -left-px -top-px border-l border-t`} />
      <span className={`${t} -right-px -top-px border-r border-t`} />
      <span className={`${t} -bottom-px -left-px border-b border-l`} />
      <span className={`${t} -bottom-px -right-px border-b border-r`} />
    </>
  )
}

/* ─────────────────────────────── sections ────────────────────────────── */

function Section({ n, id, title, kicker, children }) {
  const [ref, inView] = useInView({ threshold: 0.15 })
  return (
    <section
      id={id}
      ref={ref}
      className={`transition-[opacity,translate] duration-700 ${inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
    >
      <header className="mb-8">
        <div className="flex items-center gap-4 text-[12px] tracking-[0.25em] uppercase">
          <span className="text-accent glow">[{n}]</span>
          <Scramble text={title} play={inView} className="text-fg" duration={600} />
          <span className="h-px flex-1 bg-line" />
        </div>
        <h2 className="mt-4 font-display text-[clamp(2.2rem,5.5vw,4rem)] leading-none text-accent glow">{kicker}</h2>
      </header>
      {children}
    </section>
  )
}

// Render-prop wrapper so children can start animating when they scroll into view.
function Reveal({ children, threshold = 0.3 }) {
  const [ref, inView] = useInView({ threshold })
  return <div ref={ref}>{children(inView)}</div>
}

/* ─────────────────────────── 02 · side by side ───────────────────────── */

function CompareReplay() {
  const [ref, inView] = useInView({ threshold: 0.3 })
  const [run, setRun] = useState(0)
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState({})
  const started = useRef(false)

  useEffect(() => {
    if (inView && !started.current) {
      started.current = true
      setRun(1)
    }
  }, [inView])

  useEffect(() => {
    if (!run) return
    setResults({})
    setLoading({ bare: true, harness: true })
    const t1 = setTimeout(() => {
      setResults((r) => ({ ...r, bare: askBare }))
      setLoading((l) => ({ ...l, bare: false }))
    }, 900)
    const t2 = setTimeout(() => {
      setResults((r) => ({ ...r, harness: askHarness }))
      setLoading((l) => ({ ...l, harness: false }))
    }, 1900)
    return () => [t1, t2].forEach(clearTimeout)
  }, [run])

  return (
    <div ref={ref}>
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
        <span className="text-faint">sql&gt;</span>
        <span className="text-fg">{askHarness.question}</span>
        <span className="ml-auto flex items-center gap-4 text-[11px]">
          <span className="tracking-[0.15em] text-faint uppercase">example trace</span>
          <button onClick={() => setRun((r) => r + 1)} className="text-dim hover:text-accent">
            [ ↻ replay ]
          </button>
        </span>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ResultPanel mode="bare" result={results.bare} loading={loading.bare} />
        <ResultPanel mode="harness" result={results.harness} loading={loading.harness} />
      </div>
    </div>
  )
}

/* ─────────────────────────── 03 · the receipts ───────────────────────── */

function Receipts({ data, go }) {
  const [ref, inView] = useInView({ threshold: 0.3 })

  if (data === false) {
    return (
      <p className="text-dim">
        benchmark results are not published yet. they&apos;ll appear here once{' '}
        <span className="text-fg">benchmark/results.json</span> exists.
      </p>
    )
  }

  const n = data?.modes?.[0]?.per_question.length

  return (
    <div ref={ref} className="space-y-10">
      {data && <Headline modes={data.modes} />}
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <p className="max-w-lg text-dim">
            Execution accuracy on {n ?? '…'} hand-verified TPC-H questions: the generated SQL and the gold SQL are both
            run on Snowflake, and the result sets must match. Each step of the harness is switched on one at a time, so
            you can see what every piece is worth.
          </p>
          {USE_MOCKS && (
            <p className="mt-3 text-[11px] text-note">
              showing mock data · real numbers land after the first benchmark run
            </p>
          )}
          <button
            onClick={() => go('eval')}
            className="mt-6 text-[12px] tracking-[0.15em] text-accent uppercase hover:underline"
          >
            open the full benchmark →
          </button>
        </div>
        <div className="border border-line bg-panel/80 p-6">
          <div className="mb-5 text-[11px] tracking-[0.2em] text-faint uppercase">accuracy by harness stage</div>
          {data && inView ? <AsciiBars modes={data.modes} /> : <div className="h-36" />}
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────── 04 · verify everything ───────────────────── */

function Verify({ health }) {
  const model = health?.model ?? 'llama3.1-8b'
  const items = [
    { k: 'open-weight model', v: model, note: 'served by snowflake cortex', href: MODEL_LICENSE, link: 'license ↗' },
    { k: 'free dataset', v: 'TPCH_SF1', note: 'SNOWFLAKE_SAMPLE_DATA, in every trial account' },
    { k: 'snowflake coco', v: 'benchmark drafting', note: 'questions + gold SQL drafted with CoCo, then hand-checked' },
    { k: 'read-only', v: 'single SELECT', note: 'parsed with sqlglot before anything reaches snowflake' },
    { k: 'open source', v: 'MIT', note: 'harness, benchmark and ui', href: REPO, link: 'source ↗' },
    { k: 'honest numbers', v: 'execution accuracy', note: 'cached from real runs, never hand-edited' },
  ]

  return (
    <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it, i) => (
        <div key={it.k} className="group bg-bg/90 p-6 transition-colors hover:bg-panel">
          <div className="flex items-center justify-between text-[11px] tracking-[0.2em] text-dim uppercase">
            <span>
              <span className="text-accent">[x]</span> {it.k}
            </span>
            <span className="text-faint">0{i + 1}</span>
          </div>
          <div className="mt-4 font-display text-4xl leading-none text-fg transition-colors group-hover:text-accent">
            {it.v}
          </div>
          <p className="mt-3 text-[12px] text-dim">{it.note}</p>
          {it.href && (
            <a
              href={it.href}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-[12px] text-accent hover:underline"
            >
              {it.link}
            </a>
          )}
        </div>
      ))}
    </div>
  )
}

/* ──────────────────────────────── final cta ──────────────────────────── */

function FinalCta({ go }) {
  const [ref, inView] = useInView({ threshold: 0.4 })
  return (
    <section ref={ref} className="relative overflow-hidden border border-line bg-panel/80 px-6 py-16 text-center">
      <Ticks />
      <pre
        className="mx-auto hidden w-fit text-[9px] leading-[1.05] text-accent glow select-none md:block lg:text-[11px]"
        aria-hidden
      >
        {BANNER}
      </pre>
      <p className="mt-8 font-display text-[clamp(2rem,5vw,3.5rem)] leading-none text-fg">
        <Scramble text="ask it something." play={inView} duration={800} />
      </p>
      <p className="mt-3 text-dim">two panels. one question. watch the harness earn its keep.</p>
      <button
        onClick={() => go('ask')}
        className="mt-10 bg-accent px-8 py-4 text-[13px] font-semibold tracking-[0.2em] text-bg uppercase shadow-[0_0_40px_-6px_var(--color-accent)] transition-transform hover:-translate-y-0.5"
      >
        $ open console ▌
      </button>
    </section>
  )
}
