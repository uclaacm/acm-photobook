import ImageCarousel from '@/components/ImageCarousel';

export default function Home() {
  return (
    <div className='flex flex-col items-center'>
      <h1>ACM Photobook</h1>
      <ImageCarousel />
    </div>
  );
}
