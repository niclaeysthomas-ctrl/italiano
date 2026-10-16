const PATHS = {
  home: 'M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z',
  cards: 'M7 4h11a1 1 0 0 1 1 1v13M4.5 7.5h11a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V8.5a1 1 0 0 1 1-1z',
  book: 'M12 6.5C10 5 7 4.5 4 5v13.5c3-.5 6 0 8 1.5m0-13.5c2-1.5 5-2 8-1.5v13.5c-3-.5-6 0-8 1.5m0-13.5V20',
  wave: 'M3 12h2m3-5v10m4-13v16m4-11v6m4-4v2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7.5 8.5c.8-3.5 3.8-6 7.5-6s6.7 2.5 7.5 6',
  speaker: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',
  stop: 'M7 7h10v10H7z',
  mic: 'M12 3.5a3 3 0 0 0-3 3V12a3 3 0 0 0 6 0V6.5a3 3 0 0 0-3-3zM6 11.5a6 6 0 0 0 12 0M12 17.5V21',
  record: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  close: 'M6 6l12 12M18 6 6 18',
  back: 'M15 5l-7 7 7 7',
  chevron: 'm9 5 7 7-7 7',
  plus: 'M12 5v14M5 12h14',
  read: 'M5 5h14M5 9.5h14M5 14h9M5 18.5h6',
  translate: 'M4 5h8M8 3v2m-3 0c.5 3 2.5 5.5 6 7M11 5c-.5 3-2.5 5.5-6 7m7 8 4-9 4 9m-6.5-3h5',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, label }: { name: IconName; size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={name === 'record' || name === 'stop' ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
