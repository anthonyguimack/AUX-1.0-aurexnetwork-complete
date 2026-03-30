import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';

export default function HeroSection({ data, slides }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const allSlides = useMemo(() => slides && slides.length > 0 ? slides : (data?.title ? [data] : []), [slides, data]);

  useEffect(() => {
    if (allSlides.length <= 1) return;
    const s = allSlides[currentSlide];
    const delay = s?.delay || 9400;
    const timer = setTimeout(() => {
      setCurrentSlide(prev => (prev + 1) % allSlides.length);
      setAnimKey(prev => prev + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [currentSlide, allSlides]);

  if (allSlides.length === 0) return null;
  const slide = allSlides[currentSlide];
  const isLegacy = !slide.slide_type;
  const bg = slide.background || slide.background_image || '';
  const speed = slide.speed_per_layer || 400;

  const effectStyle = (effect, startDelay) => {
    const dir = effect || 'top';
    const transforms = { top: 'translateY(-40px)', bottom: 'translateY(40px)', left: 'translateX(-40px)', right: 'translateX(40px)' };
    return {
      animation: `heroLayerIn ${speed}ms ease-out ${startDelay || 0}ms both`,
      '--hero-from': transforms[dir] || 'translateY(-40px)',
    };
  };

  return (
    <section className="relative min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden" data-testid="hero-section">
      <style>{`
        @keyframes heroLayerIn {
          from { opacity: 0; transform: var(--hero-from); }
          to { opacity: 1; transform: translate(0,0); }
        }
      `}</style>
      <div className="absolute inset-0 bg-cover bg-center transition-all duration-700" style={{ backgroundImage: bg ? `url(${bg})` : 'none' }} />
      <div className="absolute inset-0" style={{ background: `linear-gradient(to right, var(--color-primary, #1a2332)ee, var(--color-primary, #1a2332)99)` }} />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-20 w-full" key={animKey}>
        {isLegacy ? (
          <>
            <p className="text-xs uppercase tracking-[0.3em] font-semibold mb-4" style={{ color: 'var(--color-accent, #0D9488)' }} data-testid="hero-subtitle">{slide.subtitle}</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-2xl" style={{ fontFamily: 'Playfair Display, serif' }} data-testid="hero-title">
              {slide.title?.split('\n').map((line, i) => <React.Fragment key={i}>{i > 0 && <br />}<span className={i > 0 ? 'italic' : ''}>{line}</span></React.Fragment>)}
            </h1>
            <p className="text-white/70 mt-6 max-w-xl text-base md:text-lg leading-relaxed" data-testid="hero-description">{slide.description}</p>
            <a href={slide.button_link || '#contact'} className="inline-flex items-center gap-2 mt-8 bg-white px-8 py-3 rounded-sm font-medium hover:opacity-90 transition-all text-sm" style={{ color: 'var(--color-primary, #1a2332)' }} data-testid="hero-cta-btn">
              {slide.button_text || 'Get Started'} <ArrowRight className="w-4 h-4" />
            </a>
          </>
        ) : (
          <>
            {/* Desktop (lg+): Absolute positioning from CMS coordinates */}
            <div className="relative w-full hidden lg:block" style={{ minHeight: '400px' }}>
              {slide.title && (
                <div className="absolute max-w-[55%]" style={{ left: `${(slide.title_x || 100) / 7}%`, top: `${(slide.title_y || 50) / 3}%`, ...effectStyle(slide.title_effect, slide.title_start) }} data-testid="hero-title">
                  <div className="text-5xl xl:text-6xl font-bold text-white leading-tight [&_strong]:text-white [&_em]:italic" style={{ fontFamily: 'Playfair Display, serif' }} dangerouslySetInnerHTML={{ __html: slide.title }} />
                </div>
              )}
              {slide.subtitle && (
                <div className="absolute max-w-[55%]" style={{ left: `${(slide.subtitle_x || 100) / 7}%`, top: `${(slide.subtitle_y || 80) / 3}%`, ...effectStyle(slide.subtitle_effect, slide.subtitle_start) }} data-testid="hero-subtitle-lg">
                  <div className="text-xl font-semibold text-white [&_strong]:font-bold [&_em]:italic" style={{ fontFamily: 'Playfair Display, serif' }} dangerouslySetInnerHTML={{ __html: slide.subtitle }} />
                </div>
              )}
              {slide.description && (
                <div className="absolute max-w-[45%]" style={{ left: `${(slide.description_x || 100) / 7}%`, top: `${(slide.description_y || 120) / 3}%`, ...effectStyle(slide.description_effect, slide.description_start) }} data-testid="hero-description-lg">
                  <div className="text-white/70 text-lg leading-relaxed [&_strong]:text-white/90" dangerouslySetInnerHTML={{ __html: slide.description }} />
                </div>
              )}
              {slide.button_text && (
                <div className="absolute" style={{ left: `${(slide.button_x || 100) / 7}%`, top: `${(slide.button_y || 180) / 3}%`, ...effectStyle(slide.button_effect, slide.button_start) }}>
                  <a href={slide.button_url || '#'} target={slide.window_open === 'new' ? '_blank' : '_self'} rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white px-8 py-3 rounded-sm font-medium hover:opacity-90 transition-all text-sm"
                    style={{ color: 'var(--color-primary, #1a2332)' }} data-testid="hero-cta-btn-lg">
                    {slide.button_text} <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}
              {(slide.slide_type === 'video' && slide.video_embed) && (
                <div className="absolute w-[420px]" style={{ left: `${(slide.media_x || 400) / 7}%`, top: `${(slide.media_y || 50) / 3}%`, ...effectStyle(slide.media_effect, slide.media_start) }}>
                  <div className="rounded-lg overflow-hidden shadow-2xl aspect-video" dangerouslySetInnerHTML={{ __html: slide.video_embed }} />
                </div>
              )}
              {(slide.slide_type === 'photo' && slide.photo) && (
                <div className="absolute w-[420px]" style={{ left: `${(slide.media_x || 400) / 7}%`, top: `${(slide.media_y || 50) / 3}%`, ...effectStyle(slide.media_effect, slide.media_start) }}>
                  <img src={slide.photo} alt="" className="rounded-lg shadow-2xl w-full object-cover max-h-[400px]" />
                </div>
              )}
            </div>

            {/* Mobile & Tablet (below lg): Stacked flow layout */}
            <div className="lg:hidden flex flex-col items-start gap-4">
              {(slide.slide_type === 'photo' && slide.photo) && (
                <div className="w-full max-w-sm mx-auto mb-2" style={effectStyle(slide.media_effect, slide.media_start)}>
                  <img src={slide.photo} alt="" className="rounded-lg shadow-2xl w-full object-cover max-h-[250px]" />
                </div>
              )}
              {(slide.slide_type === 'video' && slide.video_embed) && (
                <div className="w-full max-w-sm mx-auto mb-2" style={effectStyle(slide.media_effect, slide.media_start)}>
                  <div className="rounded-lg overflow-hidden shadow-2xl aspect-video" dangerouslySetInnerHTML={{ __html: slide.video_embed }} />
                </div>
              )}
              {slide.title && (
                <div style={effectStyle(slide.title_effect, slide.title_start)} data-testid="hero-title">
                  <div className="text-3xl sm:text-4xl font-bold text-white leading-tight [&_strong]:text-white [&_em]:italic" style={{ fontFamily: 'Playfair Display, serif' }} dangerouslySetInnerHTML={{ __html: slide.title }} />
                </div>
              )}
              {slide.subtitle && (
                <div style={effectStyle(slide.subtitle_effect, slide.subtitle_start)} data-testid="hero-subtitle">
                  <div className="text-base sm:text-lg font-semibold text-white [&_strong]:font-bold [&_em]:italic" style={{ fontFamily: 'Playfair Display, serif' }} dangerouslySetInnerHTML={{ __html: slide.subtitle }} />
                </div>
              )}
              {slide.description && (
                <div style={effectStyle(slide.description_effect, slide.description_start)} data-testid="hero-description">
                  <div className="text-white/70 text-sm sm:text-base leading-relaxed [&_strong]:text-white/90" dangerouslySetInnerHTML={{ __html: slide.description }} />
                </div>
              )}
              {slide.button_text && (
                <div style={effectStyle(slide.button_effect, slide.button_start)} className="mt-2">
                  <a href={slide.button_url || '#'} target={slide.window_open === 'new' ? '_blank' : '_self'} rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white px-6 py-2.5 rounded-sm font-medium hover:opacity-90 transition-all text-sm"
                    style={{ color: 'var(--color-primary, #1a2332)' }} data-testid="hero-cta-btn">
                    {slide.button_text} <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Slide indicators */}
      {allSlides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {allSlides.map((_, i) => (
            <button key={i} onClick={() => { setCurrentSlide(i); setAnimKey(p => p + 1); }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentSlide ? 'bg-white scale-110' : 'bg-white/30 hover:bg-white/50'}`}
              data-testid={`hero-dot-${i}`} />
          ))}
        </div>
      )}
    </section>
  );
}
