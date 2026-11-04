// Email clients need inline, email-safe equivalents of the site's design tokens.
export const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
export const container = { padding: '40px 28px', maxWidth: '560px' }
export const brand = { fontSize: '16px', fontWeight: 'bold', color: '#322d29', margin: '0 0 32px' }
export const h1 = { fontFamily: 'Georgia, serif', fontSize: '30px', fontWeight: 'normal' as const, color: '#322d29', margin: '0 0 24px' }
export const text = { fontSize: '15px', color: '#625b55', lineHeight: '1.6', margin: '0 0 24px', overflowWrap: 'anywhere' as const }
export const link = { color: '#b9542d', textDecoration: 'underline' }
export const button = { backgroundColor: '#322d29', color: '#ffffff', fontSize: '15px', border: '1px solid #322d29', borderRadius: '6px', padding: '14px 24px', textDecoration: 'none' }
export const footer = { fontSize: '12px', color: '#77716c', lineHeight: '1.6', margin: '32px 0 0' }