export default function RecommendationCard({ icon, when, title, tip, className = '' }) {
  return (
    <div className={`demo-card ${className}`}>
      <p className="card-eyebrow relative z-[1]">
        <span aria-hidden="true">{icon}</span> {when || 'Recovery step'}
      </p>
      <h4 className="relative z-[1] font-display text-[1.05rem] font-normal text-ink">{title}</h4>
      <p className="relative z-[1] mt-2 font-sans text-[14px] leading-relaxed text-ink-soft">{tip}</p>
    </div>
  );
}
