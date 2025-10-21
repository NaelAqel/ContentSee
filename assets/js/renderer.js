/* ==========================================================================
   RENDERER.JS — Generate Gallery Cards & Thumbnails
   ========================================================================== */

import { DEFAULT_THUMBNAIL, TAG_PARENT_DEFAULT } from "./constants.js";

/**
 * Create a single gallery card DOM element
 * @param {Object} item - media item from data.json
 * @param {Object} tagMapping - parent -> children mapping
 * @returns {HTMLElement} card element
 */
export function createCard(item, tagMapping) {
  const card = document.createElement("div");
  card.className = "card";
  card.title = item.title || "Untitled";  // Tooltip on entire card

  // ---------- Thumbnail ----------
  const thumb = document.createElement("a");
  thumb.className = "thumbnail";
  thumb.href = item.file_name?.startsWith("http") ? item.file_name : `media/${item.file_name}`;
  thumb.target = "_blank";
  thumb.rel = "noopener noreferrer";

  let thumbSrc = DEFAULT_THUMBNAIL;
  // For images, use the file itself
  if (item.media_type === "Image" && item.file_name) {
    thumbSrc = `media/${item.file_name}`;
  } else if (item.file_name && !item.file_name.startsWith("http")) {
    const thumbPath = `media/thumbnails/${item.file_name.replace(/\.[^/.]+$/, ".png")}`;
    // Assume file exists, else keep default
    thumbSrc = thumbPath;
  }

  const img = document.createElement("img");
  img.src = thumbSrc;
  img.alt = item.title || "Media thumbnail";
  // fallback if image not found
  img.onerror = () => {
    img.src = DEFAULT_THUMBNAIL;
  };

  thumb.appendChild(img);
  card.appendChild(thumb);


  // ---------- Card Content ----------
  const content = document.createElement("div");
  content.className = "card-content";

  // Title (clickable)
  const title = document.createElement("a");
  title.href = item.file_name?.startsWith("http") ? item.file_name : `media/${item.file_name}`;
  title.target = "_blank";
  title.rel = "noopener noreferrer";
  title.className = "title";
  title.textContent = item.title || "Untitled";
  content.appendChild(title);

  // Tags
  const tagsContainer = document.createElement("div");
  tagsContainer.className = "tags";

  const parentsSet = new Set();
  const childrenSet = new Set(item.tags || []);

  // assign parent tags based on mapping
  childrenSet.forEach(child => {
    for (const [parent, children] of Object.entries(tagMapping)) {
      if (children.includes(child)) parentsSet.add(parent);
    }
  });

  // Parent tags
  const parentArray = Array.from(parentsSet);
  let chosenParent = parentArray.find(p => p.toLowerCase() !== "general") || parentArray[0];

  if (chosenParent) {
    const span = document.createElement("span");
    span.className = "tag-parent";
    span.textContent = chosenParent || TAG_PARENT_DEFAULT;
    tagsContainer.appendChild(span);
  }

  // Child tags
  childrenSet.forEach(c => {
    const span = document.createElement("span");
    span.className = "tag-child";
    span.textContent = c;
    tagsContainer.appendChild(span);
  });

  content.appendChild(tagsContainer);

  // Overlay description
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.textContent = item.description || "";
  card.appendChild(overlay);

  card.appendChild(content);
  return card;
}

/**
 * Render the entire gallery into a container
 * @param {Array} data - array of media items
 * @param {Object} tagMapping - parent -> children mapping
 * @param {HTMLElement} container - DOM element to append cards
 */
export function renderGallery(data, tagMapping, container) {
  container.innerHTML = ""; // clear previous

  // Empty state
  if (data.length === 0) {
    container.innerHTML = '<div class="empty-state">No results found. Try adjusting your filters.</div>';
    return;
  }

  data.forEach(item => {
    const card = createCard(item, tagMapping);

    // Determine link (same logic used for title)
    const link = item.file_name?.startsWith("http")
      ? item.file_name
      : item.file_name
      ? `media/${item.file_name}`
      : null;

    // If there's a valid link, wrap the card in <a>
    if (link) {
      const anchor = document.createElement("a");
      anchor.href = link;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.appendChild(card);
      container.appendChild(anchor);
    } else {
      container.appendChild(card);
    }
  });
}


export function setPageDirection(config) {
  const html = document.documentElement;
  const isLTR = config.left_to_right === "1";
  
  html.setAttribute('dir', isLTR ? 'ltr' : 'rtl');
}


export function setLabels(config) {
  const isLTR = config.left_to_right === "1";
  const labels = isLTR ? (config.labels || {}) : (config.labels_rtl || {});

  // Set search placeholder with fallback
  document.getElementById('search-input').placeholder = 
    labels.search_placeholder || (isLTR ? "Search..." : "بحث...");
  
  // Set filter labels with fallbacks
  document.querySelector('.media-type-row .filter-label').textContent = 
    labels.media_type_label || (isLTR ? "Media Type:" : "نوع الوسائط:");
    
  document.querySelector('.parent-tags-row .filter-label').textContent = 
    labels.category_label || (isLTR ? "Category:" : "الفئة:");
    
  document.querySelector('.child-tags-row .filter-label').textContent = 
    labels.tags_label || (isLTR ? "Tags:" : "الوسوم:");
  
  // Set clear button text with fallback
  document.getElementById('clear-filters-btn').textContent = 
    labels.clear_filters || (isLTR ? "Clear All Filters" : "مسح جميع الفلاتر");
}