export type SocialName = "GitHub" | "LinkedIn" | "Instagram" | "Email";

const icons = {
"GitHub": (<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .9C5.87.9.9 5.87.9 12c0 4.9 3.18 9.06 7.59 10.52.55.1.76-.24.76-.53v-1.86c-3.09.67-3.74-1.31-3.74-1.31-.51-1.28-1.24-1.62-1.24-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.72 1.15 1.72 1.15.99 1.7 2.6 1.21 3.24.92.1-.72.39-1.21.71-1.49-2.47-.28-5.07-1.23-5.07-5.49 0-1.21.43-2.2 1.14-2.97-.11-.28-.5-1.41.11-2.93 0 0 .93-.3 3.05 1.13A10.66 10.66 0 0 1 12 6.16c.94 0 1.89.13 2.78.38 2.12-1.43 3.05-1.13 3.05-1.13.61 1.52.22 2.65.11 2.93.71.77 1.14 1.76 1.14 2.97 0 4.27-2.6 5.2-5.08 5.48.4.35.76 1.03.76 2.08v3.12c0 .29.21.64.77.53A11.1 11.1 0 0 0 23.1 12C23.1 5.87 18.13.9 12 .9Z"/></svg>),
"LinkedIn": (<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 2H3.55A1.55 1.55 0 0 0 2 3.55v16.9A1.55 1.55 0 0 0 3.55 22h16.9A1.55 1.55 0 0 0 22 20.45V3.55A1.55 1.55 0 0 0 20.45 2ZM8 18.7H4.88V9.2H8v9.5ZM6.45 7.9a1.8 1.8 0 1 1 .02-3.6 1.8 1.8 0 0 1-.02 3.6Zm12.25 10.8h-3.1v-4.62c0-1.1-.02-2.52-1.53-2.52-1.54 0-1.78 1.2-1.78 2.44v4.7H9.2V9.2h2.97v1.3h.04c.41-.78 1.43-1.6 2.93-1.6 3.14 0 3.56 2.07 3.56 4.75v5.05Z"/></svg>),
"Instagram": (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.1"/><circle cx="17.5" cy="6.6" r="1" fill="currentColor" stroke="none"/></svg>),
"Email": (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="1.7"/><path d="m3.5 6.5 8.5 7 8.5-7"/></svg>)
};

export function SocialIcon({ name }: { name: SocialName }) { return icons[name]; }

export function ThemeIcon() { return <>
<svg className="theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>
<svg className="theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M21 12.8A8.8 8.8 0 0 1 11.2 3 8.9 8.9 0 1 0 21 12.8Z"/></svg>
</>; }
