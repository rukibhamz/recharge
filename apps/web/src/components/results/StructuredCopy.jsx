export default function StructuredCopy({ report, className = '' }) {
  if (!report) return null;

  return (
    <div className={`space-y-5 text-left ${className}`}>
      <section>
        <h3 className="font-display text-lg font-medium text-ink">{report.heading}</h3>
        <p className="mt-2 font-sans text-body-md leading-relaxed text-ink-soft">{report.meaning}</p>
      </section>

      <section>
        <h3 className="font-display text-lg font-medium text-ink">{report.driverTitle}</h3>
        <p className="mt-2 font-sans text-body-md leading-relaxed text-ink-soft">{report.driverIntro}</p>
        {report.drivers?.length ? (
          <ol className="mt-3 list-decimal space-y-2 pl-5 font-sans text-body-md leading-relaxed text-ink-soft">
            {report.drivers.map((d) => (
              <li key={d.title}>
                <span className="font-semibold text-ink">{d.title}. </span>
                {d.body}
              </li>
            ))}
          </ol>
        ) : null}
      </section>

      {report.profileBody ? (
        <section>
          <h3 className="font-display text-lg font-medium text-ink">{report.profileTitle}</h3>
          <p className="mt-2 font-sans text-body-md leading-relaxed text-ink-soft">{report.profileBody}</p>
        </section>
      ) : null}

      <section>
        <h3 className="font-display text-lg font-medium text-ink">{report.adviceTitle}</h3>
        <p className="mt-2 font-sans text-body-md leading-relaxed text-ink-soft">{report.adviceIntro}</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 font-sans text-body-md leading-relaxed text-ink-soft">
          {(report.adviceItems ?? []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export function MoodboardCopy({ sections, className = '' }) {
  if (!sections?.length) return null;
  return (
    <div className={`space-y-4 ${className}`}>
      {sections.map((s) => (
        <section key={s.title}>
          <h4 className="font-sans text-[15px] font-semibold text-ink">{s.title}</h4>
          <p className="mt-1.5 font-sans text-body-md leading-relaxed text-ink-soft">{s.body}</p>
        </section>
      ))}
    </div>
  );
}
