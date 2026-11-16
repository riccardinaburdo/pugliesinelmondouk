export function antibotMessage(reason: string, isEn: boolean): string {
  switch (reason) {
    case 'email':
      return isEn ? 'This email address does not look valid. Please check it.' : 'Questo indirizzo email non sembra valido. Controllalo.';
    case 'expired':
      return isEn ? 'The page has expired. Please reload it and try again.' : 'La pagina è scaduta. Ricaricala e riprova.';
    case 'rate':
      return isEn ? 'Too many attempts. Please try again in a few minutes.' : 'Troppi tentativi. Riprova tra qualche minuto.';
    default:
      return isEn ? 'An error occurred. Please try again.' : 'Si è verificato un errore. Riprova.';
  }
}

