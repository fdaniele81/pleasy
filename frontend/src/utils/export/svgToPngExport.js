export const exportSvgToPng = async (svgElement, filename = 'gantt.png') => {
  return new Promise((resolve, reject) => {
    try {
      const svgString = new XMLSerializer().serializeToString(svgElement);

      const blob = new Blob([svgString], {
        type: 'image/svg+xml;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);

      const img = new Image();

      img.onload = () => {
        try {
          const svgWidth = svgElement.width.baseVal.value;
          const svgHeight = svgElement.height.baseVal.value;

          const canvas = document.createElement('canvas');
          const scale = 2;
          canvas.width = svgWidth * scale;
          canvas.height = svgHeight * scale;

          const ctx = canvas.getContext('2d');
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);

          canvas.toBlob((pngBlob) => {
            if (!pngBlob) {
              reject(new Error('Errore nella conversione Canvas → PNG'));
              return;
            }

            const downloadUrl = URL.createObjectURL(pngBlob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
            URL.revokeObjectURL(downloadUrl);

            resolve();
          }, 'image/png');

        } catch (error) {
          reject(new Error(`Errore durante il rendering Canvas: ${error.message}`));
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Errore nel caricamento SVG come immagine'));
      };

      img.src = url;

    } catch (error) {
      reject(new Error(`Errore nella serializzazione SVG: ${error.message}`));
    }
  });
};

export const getSvgDimensions = (svgElement) => {
  return {
    width: svgElement.width.baseVal.value,
    height: svgElement.height.baseVal.value
  };
};
