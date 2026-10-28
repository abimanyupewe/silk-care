type AdminPageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function AdminPageHeader({ eyebrow, title, description, action }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-semibold text-primary-hover">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold text-ink md:text-[32px]">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-ink-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
