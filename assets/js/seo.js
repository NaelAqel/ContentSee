/**
 * seo.js — generate meta tags, social tags, and JSON-LD for SEO
 */

export function injectMeta(config) {
  if (!config) return;

  const head = document.head;

  // Description
  if (config.description) {
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.name = 'description';
      head.appendChild(descMeta);
    }
    descMeta.content = config.description;
  }

  // Keywords (optional)
  if (config.keywords) {
    let keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (!keywordsMeta) {
      keywordsMeta = document.createElement('meta');
      keywordsMeta.name = 'keywords';
      head.appendChild(keywordsMeta);
    }
    keywordsMeta.content = Array.isArray(config.keywords) ? config.keywords.join(', ') : config.keywords;
  }

  // Open Graph / Facebook
  const ogData = {
    'og:title': config.title ? `${config.name} | ${config.title}` : config.name,
    'og:description': config.description || '',
    'og:image': config.photo ? `media/${config.photo}` : '',
    'og:url': window.location.href,
    'og:type': 'website'
  };

  Object.entries(ogData).forEach(([prop, content]) => {
    if (!content) return;
    let meta = document.querySelector(`meta[property="${prop}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', prop);
      head.appendChild(meta);
    }
    meta.content = content;
  });

  // Twitter Card
  const twitterData = {
    'twitter:card': 'summary_large_image',
    'twitter:title': ogData['og:title'],
    'twitter:description': ogData['og:description'],
    'twitter:image': ogData['og:image']
  };
  Object.entries(twitterData).forEach(([name, content]) => {
    if (!content) return;
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      head.appendChild(meta);
    }
    meta.content = content;
  });
}

export function generateJSONLD(config) {
  if (!config) return;

  const jsonLD = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": config.name,
    "image": config.photo ? `media/${config.photo}` : undefined,
    "description": config.description || undefined,
    "url": window.location.href,
    "sameAs": config.contacts?.map(c => c.value) || []
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(jsonLD, null, 2);
  document.head.appendChild(script);
}
