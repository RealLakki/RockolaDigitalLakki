interface Props<T extends string> {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}

export function Tabs<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <div
      className="flex gap-1 rounded-xl p-1"
      style={{
        background: 'rgba(19, 19, 28, 0.75)',
        border: '1px solid rgba(240, 90, 26, 0.25)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-heading uppercase tracking-wider transition-all"
            style={
              active
                ? {
                    background: 'linear-gradient(135deg, #FF7A3D 0%, #F05A1A 50%, #C44A14 100%)',
                    color: '#061B4A',
                    fontWeight: 700,
                    boxShadow: '0 0 14px rgba(240, 90, 26, 0.55)',
                  }
                : { color: '#8B6E50', fontWeight: 500 }
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
