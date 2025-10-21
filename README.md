# 📂 ContentSee Template

A simple, customizable website template to showcase **images, PDFs, audios, videos, and links**.  
Built for **non-technical users**: configure everything in google sheets files and upload your media - no coding required.  

👉 [Full User Guide](GUIDE.pdf)

---

## 🚀 Quick Start

1. **Use Template in your Won Page**
   -  Click **Use this template** at the top of this repository.
   -  Name the new repository `{your-username}.github.io`, and make sure it is **Public**

2. **Prepare Media**: 
   - Put all your media files in a folder.  

3. **Get the template files**  
   - Make a copy of this [**Google Drive folder**](https://drive.google.com/drive/folders/1JeWgppPCqo7WOcyjWbE-CMRyQ3mbHXrg?usp=sharing) content to your own Google Drive. 

4. **Generate thumbnails**  
   - Open `generate_thumbnails.ipynb` in **Google Colab**.  
   - Follow the notebook instructions to process your media and create thumbnails.  
   - Download the generated `media.zip` and unzip it.
   - Copy the generated filenames for reference to fill in `data`.  

5. **Fill sheets**   
   - Fill `config` with your site name, description, banner, contacts, and language.  
   - Fill `tags` with categories/tags for your media.  
   - Open `data` and fill the filenames you copied to `file_name` column.
   - Copy the `tags` link to `import_tags` sheet
   - Fill `data` with media titles, tags, links, etc.  

6. **Download and replace**  
   - Download all files (`config.csv`, `tags.csv`, `data.csv`) from Google Drive.  
   - Place them in the `media/` folder.  

7. **Test locally**  
   - Run a **local web server** to preview your site (required for JavaScript to work correctly).  

   **Step 1: Install Python (if not already installed)**

   - **Windows:**  
     1. Open Command Prompt and check Python:
        ```bash
        python --version
        ```
     2. If not installed, download and install from [python.org](https://www.python.org/downloads/windows/) or install via **winget**:
        ```bash
        winget install Python.Python.3
        ```
   - **Linux:**  
     - Install via package manager:
       ```bash
       # Debian/Ubuntu
       sudo apt update
       sudo apt install python3
       # Fedora/RedHat
       sudo dnf install python3
       ```
   - **Mac:**  
     - Python 3 is usually pre-installed.  
     - If not, install via Homebrew:
       ```bash
       brew install python
       ```

   **Step 2: Run the local server**

   1. Open terminal / command prompt.  
   2. Navigate to the folder containing `index.html`.  
   3. Run the server:
      ```bash
      # Python 3.x
      python -m http.server 8000
      # or, if needed
      python3 -m http.server 8000
      ```
   4. Open your browser and go to: `http://localhost:8000`  
   5. Verify that thumbnails, banner, description, and contacts display correctly.
 

8. **Push to GitHub**  
   - Only upload the full **`media`** folder to the repo.  

> Full step-by-step instructions with screenshots and troubleshooting tips are in [GUIDE.pdf](GUIDE.pdf).
  

---

## ✨ Features

- Free for personal use. 
- Configurable.  
- Auto-thumbnails:  
  - PDFs → first page → `.png`  
  - Videos → 1-second frame → `.png`  
  - Images → used directly  
- SEO ready (`<title>`, `<meta description>`, `JSON-LD`).  
- Client-side only; no backend required for the website itself.
- Works locally via a simple local server (Python recommended) or hosted anywhere.


---

## 📁 Repo Structure

```

assets/                       → Template assets (do not modify unless you know what you’re doing)
├── css/
│ ├── base.css                → Basic styling for the template
│ ├── filters.css             → Styles for media filtering UI
│ ├── gallery.css             → Styles for gallery layout
│ └── theme.css               → Theme and color customization
├── js/
│ ├── constants.js            → Constant values used in the template
│ ├── dataloader.js           → Loads data from media
│ ├── filter.js               → Handles filtering functionality
│ ├── initializers.js         → Handles page initialization
│ ├── main.js                 → Main script to initialize the site
│ ├── renderer.js             → Handles rendering of media items
│ ├── seo.js                  → SEO-related functions
│ └── utils.js                → Utility functions
└── generic-icon.svg          → Default icon used for PDFs/videos

├── media/                    → All your work will be here
│ ├── thumbnails/ {files}     → Thumbnails photos for PDFs ans videos
│ ├── data.csv                → Media list with titles, tags, links
│ ├── config.csv              → Site settings (site name, banner, contacts, etc.)
│ ├── tags.csv                → Categories/tags for your media
│ ├── {your files}            → Your media files (images, PDFs, videos, links)

CONTRIBUTING.md               → Contribution guidelines
favicon.png                   → Website icon
GUIDE.pdf                     → Detailed step-by-step user guide
index.html                    → Main website file
LICENSE.md                    → Template license
README.md                     → Quick start and overview
```

---

## ⚠️ Important Notes

- The **ContentSee Template code** is © 2025 Nael Aqel. Free for **personal use only**.  
- Commercial use requires contacting the author: nael@naelaqel.com  
- All media, text, or files uploaded to your website remain **your property**.  
- You may modify styling, layout, and HTML/CSS, or embed the template into your website.  
- **Credit to Nael Aqel / ContentSee Template** must remain in documentation or source code. It may be removed from the website footer if embedding.  

---

## 📖 Documentation

👉 See [GUIDE.pdf](GUIDE.pdf) for the full step-by-step guide (with screenshots).  

---

## 🙌 Credits

Developed by **Nael Aqel**.  
Free for personal use only; commercial use requires contacting the author.
