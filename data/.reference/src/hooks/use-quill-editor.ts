import React from 'react';

export const useQuillEditor = () => {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const stylesRef = React.useRef<{quillCss: HTMLLinkElement | null, customStyle: HTMLStyleElement | null}>({
    quillCss: null,
    customStyle: null
  });
  
  React.useEffect(() => {
    if (!editorRef.current) return;
    
    // Add Quill CSS without storing references for cleanup
    const addQuillStyles = () => {
      // Check if Quill CSS is already added
      if (!document.querySelector('link[href="https://cdn.quilljs.com/1.3.7/quill.snow.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.quilljs.com/1.3.7/quill.snow.css';
        document.head.appendChild(link);
      }
      
      // Add custom styles as a class instead of inline styles
      const style = document.createElement('style');
      style.textContent = `
        .quill-editor-custom .ql-editor {
          min-height: 500px;
          font-size: 16px;
          line-height: 1.5;
        }
        .quill-editor-custom .ql-container.ql-snow {
          border: none;
        }
      `;
      document.head.appendChild(style);
      
      // Add the custom class to the editor
      if (editorRef.current) {
        editorRef.current.classList.add('quill-editor-custom');
      }
      
      return style;
    };
    
    // Add the custom style and get reference
    const customStyle = addQuillStyles();
    
    // Import and initialize Quill
    import('quill').then(module => {
      if (!editorRef.current) return;
      
      const Quill = module.default;
      
      // Initialize Quill
      const quill = new Quill(editorRef.current, {
        modules: {
          toolbar: toolbarRef.current,
          history: {
            delay: 2000,
            maxStack: 500,
            userOnly: true
          }
        },
        placeholder: 'Start typing...',
        theme: 'snow'
      });
      
      // Make Quill instance available globally for the image uploader
      (window as any).quillInstance = quill;
      
      // Remove default toolbar after a short delay
      setTimeout(() => {
        try {
          const toolbar = document.querySelector('.ql-toolbar:not([ref="toolbarRef"])');
          if (toolbar && toolbar.parentNode) {
            toolbar.parentNode.removeChild(toolbar);
          }
        } catch (error) {
          console.warn('Could not remove default toolbar:', error);
        }
      }, 100);
    }).catch(error => {
      console.error('Error loading Quill:', error);
    });
    
    // Cleanup function
    return () => {
      // Clean up Quill instance
      delete (window as any).quillInstance;
      
      // Remove custom style if it exists and has a parent
      if (customStyle && customStyle.parentNode) {
        try {
          customStyle.parentNode.removeChild(customStyle);
        } catch (error) {
          console.warn('Error removing custom style:', error);
        }
      }
      
      // We don't remove the Quill CSS link as it might be used by other instances
    };
  }, []);
  
  return { editorRef, toolbarRef };
};