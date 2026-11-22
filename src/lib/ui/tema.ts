export const CLAVE_TEMA = 'ferre.tema';

/** Script inline anti-parpadeo: aplica la clase `dark` antes del primer pintado. */
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem('${CLAVE_TEMA}');var d=t?t==='oscuro':window.matchMedia('(prefers-color-scheme: dark)').matches;var r=document.documentElement;if(d){r.classList.add('dark');}r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export function leerTema(): 'claro' | 'oscuro' {
  if (typeof document === 'undefined') return 'claro';
  return document.documentElement.classList.contains('dark') ? 'oscuro' : 'claro';
}

export function aplicarTema(t: 'claro' | 'oscuro') {
  const r = document.documentElement;
  r.classList.toggle('dark', t === 'oscuro');
  r.style.colorScheme = t === 'oscuro' ? 'dark' : 'light';
  try {
    localStorage.setItem(CLAVE_TEMA, t);
  } catch {
    /* almacenamiento no disponible */
  }
}
