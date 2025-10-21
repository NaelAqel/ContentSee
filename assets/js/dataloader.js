/* ==========================================================================
   DATALOADER.JS — Load Data for Gallery
   ========================================================================== */

/**
 * Load and parse CSV or Excel file
 * @param {string} path - Path to CSV/Excel file
 * @returns {Promise<Array<Object>>} Parsed rows as array of objects
 */
async function loadFile(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    
    const isExcel = path.endsWith('.xlsx') || path.endsWith('.xls');
    
    if (isExcel) {
      // Handle Excel
      const arrayBuffer = await res.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      return XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
    } else {
      // Handle CSV
      const text = await res.text();
      return new Promise((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          transformHeader: (h) => h.trim(),
          complete: (results) => resolve(results.data),
          error: (error) => reject(error)
        });
      });
    }
  } catch (err) {
    console.error(err);
    return [];
  }
}

/**
 * Process config file into desired format
 * @param {Array<Object>} rows - Raw rows from config file
 * @returns {Object} Processed config object
 */
function processConfig(rows) {
  const config = {};
  const contacts = [];
  
  rows.forEach(row => {
    const field = (row.field || '').trim();
    const value = (row.value || '').trim();
    
    // Skip if value is empty
    if (!value) return;
    
    // Handle contact fields
    if (field.includes('contact')) {
      const name = field.replace('contact', '');
      contacts.push({ label: name, value: value });
    } else {
      config[field] = value;
    }
  });
  
  // Add contacts array if any exist
  if (contacts.length > 0) {
    config.contacts = contacts;
  }

  // Defaults
  if (!config.language || config.language.trim() === '') {
    config.language = 'en';
  } else {
    config.language = config.language.trim();
  }

  // Apply to <html lang="">
  document.documentElement.lang = config.language;

  if (!config.left_to_right) {
    config.left_to_right = 1;
  }

  // Header display title
  let displayTitle = config.name || 'Media Showcase';
  if (config.title && config.title.trim() !== '') {
    displayTitle = `${config.name} | ${config.title}`;
  }

  // Inject into DOM
  const titleEl = document.getElementById('site-title');
  const descEl = document.getElementById('site-description');
  if (titleEl) titleEl.textContent = displayTitle;
  if (descEl) descEl.textContent = config.description || '';

  // Set document title
  document.title = displayTitle;

  return config;
}

/**
 * Process tags file into desired format
 * @param {Array<Object>} rows - Raw rows from tags file
 * @returns {Array<Object>} Processed tags array
 */
function processTags(rows) {
  const tags = [];
  
  rows.forEach(row => {
    const parent = (row.parent || '').trim();
    const childs = (row.child || '').trim();
    
    // Skip if childs is empty
    if (!childs) return;
    
    // Split childs by comma if multiple exist
    const childArray = childs.split(',').map(c => c.trim()).filter(c => c);
    
    childArray.forEach(child => {
      tags.push({
        parent: parent || '',  // Changed from null to empty string
        child: child
      });
    });
  });
  
  return tags;
}

/**
 * Process data file into desired format
 * @param {Array<Object>} rows - Raw rows from data file
 * @returns {Array<Object>} Processed data array
 */
function processData(rows) {
  return rows.map(row => {
    // Parse tags - could be comma-separated or semicolon-separated
    const tagsString = (row.tags || '').trim();
    const tagsArray = tagsString 
      ? tagsString.split(/[,;]/).map(t => t.trim()).filter(t => t)
      : [];
    
    return {
      title: (row.title || '').trim(),
      file_name: (row.file_name || '').trim(),
      media_type: (row.media_type || '').trim(),
      description: (row.description || '').trim(),
      tags: tagsArray
    };
  }).filter(item => item.title || item.file_name); // Filter out completely empty rows
}

/**
 * Load all gallery data from CSV/Excel files
 * @param {string} basePath - Base path to files (default: "media/")
 * @returns {Promise<{config:Object, data:Array, tags:Array}>}
 */
export async function loadGalleryData(basePath = "media/") {
  // Try both .csv and .xlsx extensions
  const tryLoadFile = async (filename) => {
    // Try CSV first
    let data = await loadFile(`${basePath}${filename}.csv`);
    if (data.length > 0) return data;
    
    // Try XLSX if CSV failed
    data = await loadFile(`${basePath}${filename}.xlsx`);
    if (data.length > 0) return data;
    
    // Try XLS if XLSX failed
    return await loadFile(`${basePath}${filename}.xls`);
  };
  
  const [configRows, dataRows, tagsRows] = await Promise.all([
    tryLoadFile("config"),
    tryLoadFile("data"),
    tryLoadFile("tags")
  ]);
  
  return {
    config: processConfig(configRows),
    data: processData(dataRows),
    tags: processTags(tagsRows)
  };
}

/**
 * Get media types from data (for filters)
 * @param {Array} data - Array of items
 * @returns {Set} Set of available media types
 */
export function getAvailableMediaTypes(data) {
  const types = new Set();
  data.forEach(item => {
    if (item.media_type) types.add(item.media_type.toLowerCase());
  });
  return types;
}

/**
 * Get parent->children mapping from tags.json
 * @param {Array} tags - Array of {child, parent} objects
 * @returns {Object} { parentName: [child1, child2, ...] }
 */
export function mapParentChildren(tags) {
  const mapping = {};
  tags.forEach(t => {
    const parent = t.parent || "General";
    if (!mapping[parent]) mapping[parent] = [];
    mapping[parent].push(t.child);
  });
  return mapping;
}
