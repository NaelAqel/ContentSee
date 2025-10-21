/* ==========================================================================
   FILTERS.JS — Search, Media Type, Tag Filtering, Pagination
   ========================================================================== */

import { ITEMS_PER_PAGE, MEDIA_TYPES } from "./constants.js";
import { debounce } from "./utils.js";
import { renderGallery } from "./renderer.js";

/* Filters state */
export const filterState = {
  searchQuery: "",
  activeMediaType: null,  // single-select
  activeParent: null,      // single-select (changed from null to "all")
  activeChild: null,      // single-select (changed from null to "all")
  currentPage: 1
};

// ============================================================================
// DATA PROCESSING
// ============================================================================

/**
 * Helper to clean tags (trim, remove empty)
 * @param {Array} tags - array of tag strings
 * @returns {Array} cleaned tags
 */
function cleanTags(tags) {
  return (tags || [])
    .map(t => t && t.trim())
    .filter(t => t && t !== "");
}

/**
 * Extract all available filter options from data
 * @param {Array} data - array of media items
 * @param {Object} tagMapping - parent -> children mapping
 * @returns {Object} { mediaTypes: [], parents: [], children: [] }
 */
function getAllFilterOptions(data, tagMapping) {
  const mediaTypesSet = new Set();
  const parentsSet = new Set();
  const childrenSet = new Set();

  // Use MEDIA_TYPES from constants
  MEDIA_TYPES.forEach(type => mediaTypesSet.add(type));

  // Extract tags and parents from data
  data.forEach(item => {
    const cleanedTags = cleanTags(item.tags);
    cleanedTags.forEach(tag => {
      childrenSet.add(tag);
      
      // Find parent for this child
      for (const [parent, children] of Object.entries(tagMapping)) {
        if (children.includes(tag)) {
          parentsSet.add(parent);
        }
      }
    });
  });

  return {
    mediaTypes: Array.from(mediaTypesSet).sort(),
    parents: Array.from(parentsSet).sort(),
    children: Array.from(childrenSet).sort()
  };
}

/**
 * Count documents matching all filters
 * @param {Array} data - array of media items
 * @param {Object} tagMapping - parent -> children mapping
 * @param {String} mediaType - filter by media type (or null)
 * @param {String} parent - filter by parent (or null)
 * @param {String} child - filter by child tag (or null)
 * @param {String} searchQuery - search terms
 * @returns {Number} count of matching items
 */
function countDocuments(data, tagMapping, mediaType, parent, child, searchQuery) {
  return applyFilters(data, tagMapping, mediaType, parent, child, searchQuery).length;
}

/**
 * Apply all active filters to data
 * @param {Array} data - array of media items
 * @param {Object} tagMapping - parent -> children mapping
 * @param {String} mediaType - filter by media type (or null)
 * @param {String} parent - filter by parent (or null)
 * @param {String} child - filter by child tag (or null)
 * @param {String} searchQuery - search terms
 * @returns {Array} filtered array
 */
function applyFilters(data, tagMapping, mediaType = null, parent = null, child = null, searchQuery = "") {
  let filtered = [...data];

  // AND logic: apply each filter
  
  // Filter by media type
  if (mediaType) {
    filtered = filtered.filter(item => item.media_type === mediaType);
  }

  // Filter by parent category
  if (parent) {
    const validChildren = tagMapping[parent] || [];
    filtered = filtered.filter(item => {
      const itemTags = cleanTags(item.tags);
      return itemTags.some(tag => validChildren.includes(tag));
    });
  }

  // Filter by child tag
  if (child) {
    filtered = filtered.filter(item => {
      const itemTags = cleanTags(item.tags);
      return itemTags.includes(child);
    });
  }

  // Filter by search query (OR logic within search terms)
  if (searchQuery.trim()) {
    const searchTerms = searchQuery.trim().toLowerCase().split(/\s+/);
    filtered = filtered.filter(item => {
      const searchableText = (
        (item.title || "") + " " +
        (item.description || "") + " " +
        (item.tags || []).join(" ")
      ).toLowerCase();
      
      // OR logic: match if ANY search term is found
      return searchTerms.some(term => searchableText.includes(term));
    });
  }

  return filtered;
}

// ============================================================================
// DISABLING LOGIC
// ============================================================================

/**
 * Get disabled items for a specific filter type
 * Items are disabled if selecting them would result in 0 matching documents
 * @param {String} filterType - "mediaType", "parent", or "child"
 * @param {Array} data - array of media items
 * @param {Object} tagMapping - parent -> children mapping
 * @param {Object} currentFilters - { activeMediaType, activeParent, activeChild }
 * @param {String} searchQuery - current search query
 * @returns {Set} set of disabled item values
 */
function getDisabledItems(filterType, data, tagMapping, currentFilters, searchQuery) {
  const disabledSet = new Set();
  const filterOptions = getAllFilterOptions(data, tagMapping);
  
  let optionsToCheck = [];
  
  if (filterType === "mediaType") {
    optionsToCheck = filterOptions.mediaTypes;
  } else if (filterType === "parent") {
    optionsToCheck = filterOptions.parents;
  } else if (filterType === "child") {
    optionsToCheck = filterOptions.children;
  }

  // For each option, simulate selecting it and check if results would be 0
  optionsToCheck.forEach(option => {
    // If this option is already selected, never disable it
    if (
      (filterType === "mediaType" && option === currentFilters.activeMediaType) ||
      (filterType === "parent" && option === currentFilters.activeParent) ||
      (filterType === "child" && option === currentFilters.activeChild)
    ) {
      return; // Don't add to disabled set
    }

    // Simulate selecting this option
    const testFilters = {
      mediaType: filterType === "mediaType" ? option : currentFilters.activeMediaType,
      parent: filterType === "parent" ? option : currentFilters.activeParent,
      child: filterType === "child" ? option : currentFilters.activeChild
    };

    // Count matches with this simulated selection
    const count = countDocuments(
      data,
      tagMapping,
      testFilters.mediaType,
      testFilters.parent,
      testFilters.child,
      searchQuery
    );

    // If 0 matches, add to disabled set
    if (count === 0) {
      disabledSet.add(option);
    }
  });

  return disabledSet;
}

// ============================================================================
// UI RENDERING
// ============================================================================

/**
 * Update the gallery with filtered items
 * @param {Array} data - array of media items
 * @param {Object} tagMapping - parent -> children mapping
 * @param {HTMLElement} galleryContainer - DOM element to render into
 */
function updateGallery(data, tagMapping, galleryContainer) {
  // Get filtered data
  const filteredData = applyFilters(
    data,
    tagMapping,
    filterState.activeMediaType,
    filterState.activeParent,
    filterState.activeChild,
    filterState.searchQuery
  );

  // Apply pagination
  const startIndex = (filterState.currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageData = filteredData.slice(startIndex, endIndex);

  // Render gallery
  renderGallery(pageData, tagMapping, galleryContainer);

  // Update pagination controls
  updatePagination(data, tagMapping);
}


/**
 * Update filter button states (active/disabled/inactive)
 * @param {Array} data - array of media items
 * @param {Object} tagMapping - parent -> children mapping
 */
function updateFilterButtons(data, tagMapping) {
  const filterOptions = getAllFilterOptions(data, tagMapping);
  
  const disabledMediaTypes = getDisabledItems(
    "mediaType",
    data,
    tagMapping,
    {
      activeMediaType: filterState.activeMediaType,
      activeParent: filterState.activeParent,
      activeChild: filterState.activeChild
    },
    filterState.searchQuery
  );

  const disabledParents = getDisabledItems(
    "parent",
    data,
    tagMapping,
    {
      activeMediaType: filterState.activeMediaType,
      activeParent: filterState.activeParent,
      activeChild: filterState.activeChild
    },
    filterState.searchQuery
  );

  const disabledChildren = getDisabledItems(
    "child",
    data,
    tagMapping,
    {
      activeMediaType: filterState.activeMediaType,
      activeParent: filterState.activeParent,
      activeChild: filterState.activeChild
    },
    filterState.searchQuery
  );

  // Update media type buttons
  const mediaTypeContainer = document.querySelector("#media-type-filters");
  if (mediaTypeContainer) {
    filterOptions.mediaTypes.forEach(type => {
      const btn = mediaTypeContainer.querySelector(`[data-filter-value="${type}"]`);
      if (btn) {
        btn.classList.toggle("active", filterState.activeMediaType === type);
        btn.classList.toggle("disabled", disabledMediaTypes.has(type));
        btn.disabled = disabledMediaTypes.has(type);
      }
    });
  }

  // Update parent buttons
  const parentContainer = document.querySelector("#parent-tag-filters");
  if (parentContainer) {
    filterOptions.parents.forEach(parent => {
      const btn = parentContainer.querySelector(`[data-filter-value="${parent}"]`);
      if (btn) {
        btn.classList.toggle("active", filterState.activeParent === parent);
        btn.classList.toggle("disabled", disabledParents.has(parent));
        btn.disabled = disabledMediaTypes.has(parent);
      }
    });
  }

  // Update child buttons
  const childContainer = document.querySelector("#child-tag-filters");
  if (childContainer) {
    filterOptions.children.forEach(child => {
      const btn = childContainer.querySelector(`[data-filter-value="${child}"]`);
      if (btn) {
        btn.classList.toggle("active", filterState.activeChild === child);
        btn.classList.toggle("disabled", disabledChildren.has(child));      
        btn.disabled = disabledChildren.has(child);}
    });
  }
}

/**
 * Update filter summary (active filters display)
 * @param {Array} data - array of media items
 * @param {Object} tagMapping - parent -> children mapping
 */
function updateFilterSummary(data, tagMapping) {
  const summaryContainer = document.querySelector("#active-filters-summary");
  if (!summaryContainer) return;

  const chips = [];

  if (filterState.searchQuery) {
    chips.push({
      type: "search",
      label: `Search: "${filterState.searchQuery}"`,
      value: filterState.searchQuery
    });
  }

  if (filterState.activeMediaType) {
    chips.push({
      type: "mediaType",
      label: filterState.activeMediaType,
      value: filterState.activeMediaType
    });
  }

  if (filterState.activeParent) {
    chips.push({
      type: "parent",
      label: filterState.activeParent,
      value: filterState.activeParent
    });
  }

  if (filterState.activeChild) {
    chips.push({
      type: "child",
      label: filterState.activeChild,
      value: filterState.activeChild
    });
  }

  // Clear and rebuild chips
  summaryContainer.innerHTML = "";

  if (chips.length === 0) {
    summaryContainer.style.display = "none";
    summaryContainer.innerHTML = "";
    return;
  }

  summaryContainer.style.display = "flex";

  chips.forEach(chip => {
    const chipEl = document.createElement("span");
    chipEl.className = "filter-chip";
    chipEl.classList.add(`chip-${chip.type}`);
    chipEl.innerHTML = `
      ${chip.label}
      <button class="chip-remove" data-filter-type="${chip.type}" data-filter-value="${chip.value}">×</button>
    `;
    summaryContainer.appendChild(chipEl);
  });
}

/**
 * Update pagination controls
 * @param {Array} data - array of media items
 * @param {Object} tagMapping - parent -> children mapping
 */
function updatePagination(data, tagMapping) {
  const paginationContainer = document.getElementById("pagination");
  if (!paginationContainer) return;

  // Get filtered data to calculate total pages
  const filteredData = applyFilters(
    data,
    tagMapping,
    filterState.activeMediaType,
    filterState.activeParent,
    filterState.activeChild,
    filterState.searchQuery
  );

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Hide pagination if only one page or no items
  if (totalPages <= 1) {
    paginationContainer.style.display = "none";
    return;
  }

  paginationContainer.style.display = "flex";

  // Build pagination HTML
  let paginationHTML = `
    <button class="pagination-prev" ${filterState.currentPage === 1 ? 'disabled' : ''}>
      Previous
    </button>
    <span class="pagination-info">
      Page ${filterState.currentPage} of ${totalPages}
    </span>
    <button class="pagination-next" ${filterState.currentPage === totalPages ? 'disabled' : ''}>
      Next
    </button>
  `;

  paginationContainer.innerHTML = paginationHTML;
}

/**
 * Initialize filters UI and event listeners
 * @param {Array} data - array of media items
 * @param {Object} tagMapping - parent -> children mapping
 * @param {HTMLElement} galleryContainer - DOM element for gallery
 */
export function initFilters(data, tagMapping, galleryContainer) {
  const filterOptions = getAllFilterOptions(data, tagMapping);

  // Create media type filter buttons
  const mediaTypeContainer = document.querySelector("#media-type-filters");
  if (mediaTypeContainer) {
    mediaTypeContainer.innerHTML = "";
    filterOptions.mediaTypes.forEach(type => {
      const btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.textContent = type;
      btn.setAttribute("data-filter-value", type);
      btn.addEventListener("click", () => 
        handleFilterSelect("mediaType", type, data, tagMapping, galleryContainer)
      );
      mediaTypeContainer.appendChild(btn);
    });
  }

  // Create parent filter buttons
  const parentContainer = document.querySelector("#parent-tag-filters");
  if (parentContainer) {
    parentContainer.innerHTML = "";
    filterOptions.parents.forEach(parent => {
      const btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.textContent = parent;
      btn.setAttribute("data-filter-value", parent);
      btn.addEventListener("click", () =>
        handleFilterSelect("parent", parent, data, tagMapping, galleryContainer)
      );
      parentContainer.appendChild(btn);
    });
  }

  // Create child filter buttons
  const childContainer = document.querySelector("#child-tag-filters");
  if (childContainer) {
    childContainer.innerHTML = "";
    filterOptions.children.forEach(child => {
      const btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.textContent = child;
      btn.setAttribute("data-filter-value", child);
      btn.addEventListener("click", () =>
        handleFilterSelect("child", child, data, tagMapping, galleryContainer)
      );
      childContainer.appendChild(btn);
    });
  }

  // Setup search input with debounce
  const searchInput = document.querySelector("#search-input");
  if (searchInput) {
    const debouncedSearch = debounce((e) => 
      handleSearch(e, data, tagMapping, galleryContainer), 200
    );
    searchInput.addEventListener("input", debouncedSearch);
  }

  // Setup clear all button
  const clearAllBtn = document.querySelector("#clear-filters-btn");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => 
      handleClearAll(data, tagMapping, galleryContainer)
    );
  }

  // Setup pagination buttons
  // Attach filter chip listeners
  attachFilterChipListeners(data, tagMapping, galleryContainer);

  // Initial render
  updateFilterButtons(data, tagMapping);
  updateFilterSummary(data, tagMapping);
  updateGallery(data, tagMapping, galleryContainer);
  updatePagination(data, tagMapping);

  // Setup pagination click handlers (using event delegation)
  const paginationContainer = document.getElementById("pagination");
  if (paginationContainer) {
    paginationContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("pagination-prev")) {
        if (filterState.currentPage > 1) {
          handlePageChange(filterState.currentPage - 1, data, tagMapping, galleryContainer);
        }
      } else if (e.target.classList.contains("pagination-next")) {
        const filteredData = applyFilters(
          data,
          tagMapping,
          filterState.activeMediaType,
          filterState.activeParent,
          filterState.activeChild,
          filterState.searchQuery
        );
        const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
        if (filterState.currentPage < totalPages) {
          handlePageChange(filterState.currentPage + 1, data, tagMapping, galleryContainer);
        }
      }
    });
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle filter selection (media type, parent, or child)
 * @param {String} filterType - "mediaType", "parent", or "child"
 * @param {String} filterValue - the selected value
 * @param {Array} data - array of media items
 * @param {Object} tagMapping - parent -> children mapping
 * @param {HTMLElement} galleryContainer - DOM element for gallery
 */
function handleFilterSelect(filterType, filterValue, data, tagMapping, galleryContainer) {
  // Check if button is disabled before processing
  let container;
  if (filterType === "mediaType") {
    container = document.querySelector("#media-type-filters");
  } else if (filterType === "parent") {
    container = document.querySelector("#parent-tag-filters");
  } else if (filterType === "child") {
    container = document.querySelector("#child-tag-filters");
  }
  
  if (container) {
    const btn = container.querySelector(`[data-filter-value="${filterValue}"]`);
    if (btn && btn.classList.contains("disabled")) {
      return; // Exit early, don't process click
    }
  }

  // Toggle selection
  if (filterType === "mediaType") {
    filterState.activeMediaType = filterState.activeMediaType === filterValue ? null : filterValue;
  } else if (filterType === "parent") {
    filterState.activeParent = filterState.activeParent === filterValue ? null : filterValue;
  } else if (filterType === "child") {
    filterState.activeChild = filterState.activeChild === filterValue ? null : filterValue;
  }

  // Reset to page 1
  filterState.currentPage = 1;

  // Refresh UI
  updateFilterButtons(data, tagMapping);
  updateFilterSummary(data, tagMapping);
  updateGallery(data, tagMapping, galleryContainer);
}

/**
 * Handle search input
 * @param {Event} e - input event
 * @param {Array} data - array of media items
 * @param {Object} tagMapping - parent -> children mapping
 * @param {HTMLElement} galleryContainer - DOM element for gallery
 */
function handleSearch(e, data, tagMapping, galleryContainer) {
  filterState.searchQuery = e.target.value;
  filterState.currentPage = 1;

  updateFilterButtons(data, tagMapping);
  updateFilterSummary(data, tagMapping);
  updateGallery(data, tagMapping, galleryContainer);
}

/**
 * Handle removing individual filter chip
 * @param {String} filterType - "search", "mediaType", "parent", or "child"
 * @param {String} filterValue - the value to remove
 * @param {Array} data - array of media items
 * @param {Object} tagMapping - parent -> children mapping
 * @param {HTMLElement} galleryContainer - DOM element for gallery
 */
function handleRemoveFilter(filterType, filterValue, data, tagMapping, galleryContainer) {
  if (filterType === "search") {
    filterState.searchQuery = "";
    const searchInput = document.querySelector("#search-input");
  if (searchInput) {
    searchInput.value = ""; // Clear the input field
  }
  } else if (filterType === "mediaType") {
    filterState.activeMediaType = null;
  } else if (filterType === "parent") {
    filterState.activeParent = null;
  } else if (filterType === "child") {
    filterState.activeChild = null;
  }

  filterState.currentPage = 1;

  updateFilterButtons(data, tagMapping);
  updateFilterSummary(data, tagMapping);
  updateGallery(data, tagMapping, galleryContainer);
}

/**
 * Handle clear all filters
 * @param {Array} data - array of media items
 * @param {Object} tagMapping - parent -> children mapping
 * @param {HTMLElement} galleryContainer - DOM element for gallery
 */
function handleClearAll(data, tagMapping, galleryContainer) {
  filterState.searchQuery = "";
  filterState.activeMediaType = null;
  filterState.activeParent = null;
  filterState.activeChild = null;
  filterState.currentPage = 1;

  // Clear search input
  const searchInput = document.querySelector("#search-input");
  if (searchInput) {
    searchInput.value = "";
  }

  updateFilterButtons(data, tagMapping);
  updateFilterSummary(data, tagMapping);
  updateGallery(data, tagMapping, galleryContainer);
}

/**
 * Handle page change
 * @param {Number} newPage - new page number
 * @param {Array} data - array of media items
 * @param {Object} tagMapping - parent -> children mapping
 * @param {HTMLElement} galleryContainer - DOM element for gallery
 */
export function handlePageChange(newPage, data, tagMapping, galleryContainer) {
  filterState.currentPage = newPage;
  updateGallery(data, tagMapping, galleryContainer);
}

/**
 * Attach event listeners for filter chips (delegation)
 * @param {Array} data - array of media items
 * @param {Object} tagMapping - parent -> children mapping
 * @param {HTMLElement} galleryContainer - DOM element for gallery
 */
export function attachFilterChipListeners(data, tagMapping, galleryContainer) {
  const summaryContainer = document.querySelector("#active-filters-summary");
  if (!summaryContainer) return;

  summaryContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("chip-remove")) {
      const filterType = e.target.getAttribute("data-filter-type");
      const filterValue = e.target.getAttribute("data-filter-value");
      handleRemoveFilter(filterType, filterValue, data, tagMapping, galleryContainer);
    }
  });
}