import ImageCarousel from '@/components/ImageCarousel';

export default function Home() {
  return (
    <div className='flex flex-col items-center'>
      <h1>ACM Photobook</h1>
      <ImageCarousel imageWidth={250} imageHeight={300} images={
        Array.from({ length: 10 }, (_, i) => ({
          src: '/placeholder.png',
          caption: `Image number ${i + 1}`
        }))
      } />
    </div>
  );
}
