const photos = [
  { src: '/images/chapter-life/chapter-1.webp', alt: 'KTP members together outside Ryan Field' },
  { src: '/images/chapter-life/chapter-2.webp', alt: 'Members attending a chapter presentation' },
  { src: '/images/chapter-life/chapter-3.webp', alt: 'KTP members together outdoors' },
  { src: '/images/chapter-life/chapter-4.webp', alt: 'Members playing cards together' },
  { src: '/images/chapter-life/chapter-5.webp', alt: 'KTP members gathered at sunset' },
  { src: '/images/chapter-life/chapter-6.webp', alt: 'Members enjoying a game of pool' },
  { src: '/images/chapter-life/chapter-7.webp', alt: 'Members attending a technology workshop' },
];

export default function ChapterLife() {
  return (
    <div id="chapter-life" className="studio-container chapter-life" role="group" aria-label="KTP member photos">
        <div className="chapter-life-grid">
          {photos.map((photo) => (
            <div className="chapter-life-photo" key={photo.src}>
              <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" />
            </div>
          ))}
        </div>
    </div>
  );
}
