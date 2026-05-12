import React, { useEffect, useRef } from 'react';

export default function LivePreview({ code = { html: '', css: '', js: '' } }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!iframeRef.current) return;
    
    const documentContents = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          html, body { 
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: auto !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: sans-serif;
            /* Firefox support */
            scrollbar-width: thin;
            scrollbar-color: #888888 #f1f1f1;
          }
          body {
            padding: 1rem;
            box-sizing: border-box;
          }
          /* Standard high-contrast scrollbars for Webkit/Chrome */
          ::-webkit-scrollbar {
            width: 10px !important;
            height: 10px !important;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1 !important;
          }
          ::-webkit-scrollbar-thumb {
            background: #888888 !important;
            border-radius: 5px !important;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #555555 !important;
          }
          ${code.css}
        </style>
      </head>
      <body>
        ${code.html}
        <script>
          // Self-contained scroll persistence using window.name
          (function() {
            try {
              const saved = window.name.split(',');
              if (saved.length === 2) {
                window.scrollTo(parseInt(saved[0]), parseInt(saved[1]));
                // Extra check for async content
                setTimeout(() => window.scrollTo(parseInt(saved[0]), parseInt(saved[1])), 50);
              }
            } catch (e) {}

            window.addEventListener('scroll', () => {
              window.name = window.scrollX + ',' + window.scrollY;
            });
          })();

          try {
            ${code.js}
          } catch (e) {
            console.error(e);
          }
        </script>
      </body>
      </html>
    `;

    const iframe = iframeRef.current;
    iframe.srcdoc = documentContents;
  }, [code]);

  return (
    <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', height: '100%', background: '#fff' }}>
      <iframe
        ref={iframeRef}
        title="preview"
        sandbox="allow-scripts allow-same-origin"
        style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}
      />
    </div>
  );
}
