// Smart navigation utility for maintaining app state
export function handleNavigation(href: string, currentPath: string) {
  const isOnApp = currentPath === '/app/fetch-patterns';
  const isInternalLink = href.startsWith('/') && !href.startsWith('//');
  const isExternalLink = href.startsWith('http') || href.startsWith('//');
  
  if (isOnApp && isInternalLink) {
    // When on app, open internal links in new tab to preserve app state
    window.open(href, '_blank');
  } else if (isExternalLink) {
    // External links always open in new tab
    window.open(href, '_blank');
  } else {
    // Normal navigation for non-app pages
    window.location.href = href;
  }
}