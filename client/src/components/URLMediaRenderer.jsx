import React from 'react';


const getMediaType = (src) => {
 // console.log(src);
  if (!src || typeof src !== 'string') return 'unknown';
  const imageExtensions = ['jpg', 'jpeg','avif', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'];
  const videoExtensions = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'flv', 'wmv'];
  const extension = src.split('?')[0].split('.').pop().toLowerCase();
  if (imageExtensions.includes(extension)) return 'image';
  if (videoExtensions.includes(extension)) return 'video';
  return 'unknown';
};

const URLMediaRenderer = ({ src, alt,className,onClick }) => {
  const mediaType = getMediaType(src);

  return (
    <>
      {mediaType === 'image' && <img src={src} alt={alt}
      // className="media-preview" 
      className={className}
      onClick={onClick}
       />}
      {mediaType === 'video' && (
        <video autoPlay muted  playsInline loop src={src} 
     //   className="media-preview"
     className={className}
     onClick={onClick}
        >
          Your browser does not support the video tag.
        </video>
      )}
      {mediaType === 'unknown' && <p>Unsupported file type</p>}
    </>
  );
};
export default URLMediaRenderer;