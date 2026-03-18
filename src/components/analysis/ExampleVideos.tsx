import { useEffect, useState, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { getStorageUrl } from '../../lib/media'
import { formatNumber } from './helpers'

interface ExampleVideoCardProps {
  video: any
  videos: any[]
  index: number
  onOpenCarousel: (videos: any[], index: number) => void
}

export function ExampleVideoCard({ video, videos, index, onOpenCarousel }: ExampleVideoCardProps) {
  const thumb = getStorageUrl(video.local_thumbnail_path);
  return (
    <div
      onClick={() => onOpenCarousel(videos, index)}
      className="group relative w-[120px] flex-shrink-0 block cursor-pointer"
    >
      <div className="aspect-[9/16] rounded-xl overflow-hidden border border-white/5 group-hover:border-pink-500/30 transition-all">
        {thumb ? (
          <img src={thumb} alt={`@${video.username}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-slate-900 flex items-center justify-center"><i className="fas fa-film text-slate-700 text-lg"></i></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-2">
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
              <i className={`fab fa-${video.platform === 'tiktok' ? 'tiktok' : 'instagram'} text-[8px] text-white`}></i>
            </div>
          </div>
          <div>
            <div className="text-[9px] font-black text-white truncate mb-1">@{video.username}</div>
            <div className="flex gap-1">
              <div className="bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-black text-white">
                <i className="fas fa-eye mr-0.5 text-[6px] text-slate-400"></i>{formatNumber(video.views)}
              </div>
              <div className="bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-black text-teal-400">
                {Number(video.engagement_rate).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-5 h-5 rounded-full bg-pink-500/80 backdrop-blur-md flex items-center justify-center">
            <i className="fas fa-play text-[7px] text-white"></i>
          </div>
        </div>
      </div>
      <p className="mt-1.5 px-0.5 text-[9px] text-slate-500 leading-tight line-clamp-2">{video.match_reason}</p>
    </div>
  );
}

interface VideoCarouselProps {
  videos: any[]
  onOpenCarousel: (videos: any[], index: number) => void
}

export function VideoCarousel({ videos, onOpenCarousel }: VideoCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', dragFree: true });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => { emblaApi.off('select', onSelect); emblaApi.off('reInit', onSelect); };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative group/carousel">
      {canScrollPrev && (
        <button
          onClick={() => emblaApi?.scrollPrev()}
          className="absolute left-0 top-0 bottom-8 z-10 w-8 flex items-center justify-start bg-gradient-to-r from-black/60 to-transparent rounded-l-xl opacity-0 group-hover/carousel:opacity-100 transition-opacity"
        >
          <i className="fas fa-chevron-left text-xs text-white/80 ml-1.5"></i>
        </button>
      )}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex gap-3">
          {videos.map((v: any, i: number) => (
            <div key={v.video_id} className="flex-[0_0_120px] min-w-0">
              <ExampleVideoCard video={v} videos={videos} index={i} onOpenCarousel={onOpenCarousel} />
            </div>
          ))}
        </div>
      </div>
      {canScrollNext && (
        <button
          onClick={() => emblaApi?.scrollNext()}
          className="absolute right-0 top-0 bottom-8 z-10 w-8 flex items-center justify-end bg-gradient-to-l from-black/60 to-transparent rounded-r-xl opacity-0 group-hover/carousel:opacity-100 transition-opacity"
        >
          <i className="fas fa-chevron-right text-xs text-white/80 mr-1.5"></i>
        </button>
      )}
      {videos.length > 4 && (
        <div className="flex items-center justify-center mt-2">
          <span className="text-[9px] text-slate-600">{videos.length} videos — scroll to see more</span>
        </div>
      )}
    </div>
  );
}

export interface ExampleVideoRowProps {
  videos: any[] | undefined
  label?: string
  onOpenCarousel: (videos: any[], index: number) => void
}

export function ExampleVideoRow({ videos, label, onOpenCarousel }: ExampleVideoRowProps) {
  if (!videos || !Array.isArray(videos) || videos.length === 0) return null;
  // Flatten if nested arrays
  const flat = Array.isArray(videos[0]) ? videos.flat() : videos;
  if (flat.length === 0) return null;
  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">
        <i className="fas fa-play-circle mr-1.5 text-pink-400/50"></i>{label || 'See it done right'}
      </div>
      <VideoCarousel videos={flat} onOpenCarousel={onOpenCarousel} />
    </div>
  );
}
