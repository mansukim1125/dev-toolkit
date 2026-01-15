'use strict';

class ImageConverterTool {
  static originalImage = null;
  static originalFileName = '';
  static convertedBlob = null;

  static init() {
    ImageConverterTool.setupDropZone();
    ImageConverterTool.setupQualitySlider();
    ImageConverterTool.setupResizeToggle();
    ImageConverterTool.setupAspectRatioLock();
  }

  static setupDropZone() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        ImageConverterTool.loadImage(e.target.files[0]);
      }
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        ImageConverterTool.loadImage(files[0]);
      }
    });
  }

  static setupQualitySlider() {
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('quality-value');

    qualitySlider.addEventListener('input', () => {
      qualityValue.textContent = qualitySlider.value;
    });
  }

  static setupResizeToggle() {
    const resizeEnabled = document.getElementById('resize-enabled');
    const resizeOptions = document.getElementById('resize-options');

    resizeEnabled.addEventListener('change', () => {
      resizeOptions.style.display = resizeEnabled.checked ? 'grid' : 'none';
    });
  }

  static setupAspectRatioLock() {
    const widthInput = document.getElementById('resize-width');
    const heightInput = document.getElementById('resize-height');
    const maintainAspect = document.getElementById('maintain-aspect');

    widthInput.addEventListener('input', () => {
      if (maintainAspect.checked && ImageConverterTool.originalImage) {
        const aspectRatio =
          ImageConverterTool.originalImage.naturalWidth /
          ImageConverterTool.originalImage.naturalHeight;
        heightInput.value = Math.round(widthInput.value / aspectRatio);
      }
    });

    heightInput.addEventListener('input', () => {
      if (maintainAspect.checked && ImageConverterTool.originalImage) {
        const aspectRatio =
          ImageConverterTool.originalImage.naturalWidth /
          ImageConverterTool.originalImage.naturalHeight;
        widthInput.value = Math.round(heightInput.value * aspectRatio);
      }
    });
  }

  static loadImage(file) {
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      document.getElementById('error').textContent =
        'Invalid file type. Please select PNG, JPG, or WebP.';
      return;
    }

    document.getElementById('error').textContent = '';
    ImageConverterTool.originalFileName = file.name;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        ImageConverterTool.originalImage = img;

        const previewImg = document.getElementById('preview-img');
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';

        document.getElementById('image-info').style.display = 'block';
        document.getElementById('original-info').textContent =
          `${file.name} | ${img.naturalWidth}x${img.naturalHeight} | ${ImageConverterTool.formatFileSize(file.size)}`;

        document.getElementById('resize-width').value = img.naturalWidth;
        document.getElementById('resize-height').value = img.naturalHeight;

        document.getElementById('output-img').style.display = 'none';
        document.getElementById('output-info').style.display = 'none';
        ImageConverterTool.convertedBlob = null;
      };
      img.onerror = () => {
        document.getElementById('error').textContent = 'Failed to load image.';
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      document.getElementById('error').textContent = 'Failed to read file.';
    };
    reader.readAsDataURL(file);
  }

  static convert() {
    try {
      document.getElementById('error').textContent = '';

      if (!ImageConverterTool.originalImage) {
        document.getElementById('error').textContent =
          'Please select an image first.';
        return;
      }

      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');

      let width = ImageConverterTool.originalImage.naturalWidth;
      let height = ImageConverterTool.originalImage.naturalHeight;

      const resizeEnabled = document.getElementById('resize-enabled').checked;
      if (resizeEnabled) {
        const newWidth = parseInt(
          document.getElementById('resize-width').value,
          10
        );
        const newHeight = parseInt(
          document.getElementById('resize-height').value,
          10
        );

        if (
          isNaN(newWidth) ||
          isNaN(newHeight) ||
          newWidth < 1 ||
          newHeight < 1
        ) {
          document.getElementById('error').textContent =
            'Invalid resize dimensions.';
          return;
        }

        width = newWidth;
        height = newHeight;
      }

      canvas.width = width;
      canvas.height = height;

      const outputFormat = document.getElementById('output-format').value;
      if (outputFormat === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(ImageConverterTool.originalImage, 0, 0, width, height);

      const quality =
        parseInt(document.getElementById('quality').value, 10) / 100;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            document.getElementById('error').textContent = 'Conversion failed.';
            return;
          }

          ImageConverterTool.convertedBlob = blob;

          const outputImg = document.getElementById('output-img');
          outputImg.src = URL.createObjectURL(blob);
          outputImg.style.display = 'block';

          document.getElementById('output-info').style.display = 'block';
          document.getElementById('converted-info').textContent =
            `${width}x${height} | ${ImageConverterTool.formatFileSize(blob.size)} | ${ImageConverterTool.getFormatName(outputFormat)}`;
        },
        outputFormat,
        quality
      );
    } catch (e) {
      document.getElementById('error').textContent =
        'Conversion error: ' + e.message;
    }
  }

  static download() {
    if (!ImageConverterTool.convertedBlob) {
      document.getElementById('error').textContent =
        'Please convert an image first.';
      return;
    }

    const outputFormat = document.getElementById('output-format').value;
    const extension = ImageConverterTool.getExtension(outputFormat);

    const baseName = ImageConverterTool.originalFileName.replace(
      /\.[^.]+$/,
      ''
    );
    const fileName = `${baseName}_converted.${extension}`;

    const url = URL.createObjectURL(ImageConverterTool.convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static clear() {
    ImageConverterTool.originalImage = null;
    ImageConverterTool.originalFileName = '';
    ImageConverterTool.convertedBlob = null;

    document.getElementById('file-input').value = '';
    document.getElementById('preview-img').style.display = 'none';
    document.getElementById('preview-img').src = '';
    document.getElementById('output-img').style.display = 'none';
    document.getElementById('output-img').src = '';
    document.getElementById('image-info').style.display = 'none';
    document.getElementById('output-info').style.display = 'none';
    document.getElementById('error').textContent = '';
    document.getElementById('resize-width').value = '';
    document.getElementById('resize-height').value = '';
    document.getElementById('resize-enabled').checked = false;
    document.getElementById('resize-options').style.display = 'none';
    document.getElementById('quality').value = 90;
    document.getElementById('quality-value').textContent = '90';
  }

  static formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  static getExtension(mimeType) {
    const map = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
    };
    return map[mimeType] || 'png';
  }

  static getFormatName(mimeType) {
    const map = {
      'image/png': 'PNG',
      'image/jpeg': 'JPG',
      'image/webp': 'WebP',
    };
    return map[mimeType] || 'Unknown';
  }
}

setTimeout(() => ImageConverterTool.init(), 0);
