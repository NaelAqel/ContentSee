/* ==========================================================================
   INITIALIZERS.JS — Handle page initialization tasks
   ========================================================================== */

/**
 * Initialize Google Analytics 4
 */
export function initGA4(ga4Code) {
  if (!ga4Code) return;
  
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Code}`;
  document.head.appendChild(script);
  
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', ga4Code);
}

/**
 * Initialize banner image with loading promise
 */
export function initBanner(bannerFilename) {
  if (!bannerFilename) return null;
  
  const bannerDiv = document.getElementById("site-banner");
  const bannerImg = new Image();
  bannerImg.width = 1200;
  bannerImg.height = 400;
  bannerImg.className = 'banner-image';
  bannerImg.alt = 'Banner';
  bannerImg.loading = 'eager';
  
  const bannerPromise = new Promise((resolve) => {
    bannerImg.onload = resolve;
    bannerImg.onerror = resolve;
  });
  
  bannerImg.src = `media/${bannerFilename}`;
  bannerDiv.appendChild(bannerImg);
  
  return bannerPromise;
}

/**
 * Initialize site photo with loading promise
 */
export function initSitePhoto(photoFilename) {
  const photoImg = document.getElementById("site-photo");
  
  if (!photoFilename) {
    photoImg.style.display = 'none';
    return null;
  }
  
  const isMobile = window.innerWidth <= 480;
  photoImg.width = isMobile ? 120 : 180;
  photoImg.height = isMobile ? 120 : 180;
  photoImg.loading = "eager";
  
  const photoPromise = new Promise((resolve) => {
    photoImg.onload = resolve;
    photoImg.onerror = resolve;
  });
  
  photoImg.src = `media/${photoFilename}`;
  
  return photoPromise;
}

/**
 * Populate contact links
 */
export function initContacts(contacts) {
  if (!contacts || !Array.isArray(contacts)) return;
  
  const contactsDiv = document.getElementById("site-contacts");
  const contactsHTML = contacts.map(contact => {
    const isEmail = contact.value.includes('@') && !contact.value.startsWith('http');
    const href = isEmail ? `mailto:${contact.value}` : contact.value;
    const target = isEmail ? '' : 'target="_blank" rel="noopener"';
    return `<a href="${href}" ${target}>${contact.label}</a>`;
  }).join(" | ");
  contactsDiv.innerHTML = contactsHTML;
}

/**
 * Populate footer with current year and site name
 */
export function initFooter(siteName) {
  document.getElementById("footer-year").textContent = new Date().getFullYear();
  document.getElementById("footer-site-name").textContent = siteName || "Content See";
}

/**
 * Show page after images load
 */
export function fadeInPage(imagePromises, hasPhoto) {
  Promise.all(imagePromises.filter(p => p !== null)).then(() => {
    requestAnimationFrame(() => {
      if (hasPhoto) {
        const photoImg = document.getElementById("site-photo");
        photoImg.style.visibility = 'visible';
      }
      
      document.body.style.transition = 'opacity 0.3s ease';
      document.body.style.opacity = '1';
      
      const mainContainer = document.querySelector('.main-container');
      mainContainer.style.transition = 'opacity 0.3s ease';
      mainContainer.style.opacity = '1';
    });
  });
}