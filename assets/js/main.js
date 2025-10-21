/* ==========================================================================
   MAIN.JS — Entry point for Gallery Website
   ========================================================================== */
import { loadGalleryData, mapParentChildren } from "./dataloader.js";
import { setLabels, setPageDirection } from "./renderer.js"
import { initFilters, attachFilterChipListeners, filterState } from "./filters.js";
import { injectMeta, generateJSONLD } from './seo.js';
import { initGA4, initBanner, initSitePhoto, initContacts, initFooter, fadeInPage } from './initializers.js';

// START LOADING DATA IMMEDIATELY (before DOM is ready)
const dataPromise = loadGalleryData();

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", async () => {
  const galleryContainer = document.getElementById("gallery");
  if (!galleryContainer) {
    console.error("Gallery container not found in DOM!");
    return;
  }

  // 1. Load all data
  const { config, data, tags } = await dataPromise;
  setPageDirection(config);
  setLabels(config);

  // 2. SEO enhancements
  injectMeta(config);
  generateJSONLD(config);
  
  // 3. Initialize page elements
  initGA4(config.ga4_code);
  
  const imagePromises = [
    initBanner(config.banner),
    initSitePhoto(config.photo)
  ];
  
  initContacts(config.contacts);
  initFooter(config.name);

  // 4. Map parent -> children
  const tagMapping = mapParentChildren(tags);
  
  // 5. Initialize filters and gallery
  initFilters(data, tagMapping, galleryContainer);
  
  // 6. Attach filter chip listeners
  attachFilterChipListeners(data, tagMapping, galleryContainer);
  
  // 7. Wait for images to load, then measure and show
  fadeInPage(imagePromises, config.photo);
});
