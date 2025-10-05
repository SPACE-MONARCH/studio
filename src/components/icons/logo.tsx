export const Logo = (props: React.ComponentProps<'svg'>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <title>Deadlock Defender Logo</title>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 11.14V15" />
    <path d="M10 13h4" />
    <path d="M12 11.14a2 2 0 0 0-2-2.14h0a2 2 0 1 0 4 0h0a2 2 0 0 0-2 2.14z" />
  </svg>
);
