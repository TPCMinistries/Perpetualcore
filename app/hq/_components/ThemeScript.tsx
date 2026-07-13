/**
 * Applies a stored theme choice to #hq-shell before paint, so a returning
 * visitor with an explicit light/dark preference (opposite of their system
 * setting) never sees a flash of the wrong theme. Must render as the first
 * child inside the shell.
 */
const SCRIPT = `(function(){try{var t=localStorage.getItem('hq-theme');if(t==='light'||t==='dark'){var el=document.getElementById('hq-shell');if(el)el.setAttribute('data-theme',t);}}catch(e){}})();`;

export function ThemeScript() {
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
