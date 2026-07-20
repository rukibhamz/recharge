export default function RecommendationCard({ icon, title, tip, className = 'surface-card' }) {
  return (
    <div className={`flex gap-4 p-5 ${className}`}>
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-secondary-container text-xl"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div>
        <h4 className="font-sans text-body-md font-semibold text-on-surface">{title}</h4>
        <p className="mt-1 font-sans text-body-md text-on-surface-variant">{tip}</p>
      </div>
    </div>
  );
}
