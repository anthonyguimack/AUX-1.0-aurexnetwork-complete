import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { publicAPI } from '../lib/api';
import PageBanner from '../components/layout/PageBanner';
import HeroSection from '../components/HeroSection';

export default function DynamicPage() {
  const { pageId } = useParams();
  const location = useLocation();
  const [page, setPage] = useState(null);
  const [heroSlides, setHeroSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setPage(null);
    setHeroSlides([]);

    publicAPI.getNavPages().then(r => {
      const pages = r.data || [];
      // Find page by: 1) ID param, 2) /page/:id URL match, 3) current pathname match
      const currentPath = location.pathname;
      const found = pages.find(p =>
        (pageId && p.id === pageId) ||
        (pageId && p.url === `/page/${pageId}`) ||
        (!pageId && p.url === currentPath)
      );

      if (found) {
        setPage(found);
        // Fetch hero slides for this page
        publicAPI.getHeroSlides(found.id).then(hs => {
          setHeroSlides(hs.data || []);
        }).catch(() => {});
        // If page_type is set, also load the rich content from pages collection
        if (found.page_type) {
          publicAPI.getPage(found.page_type).then(res => {
            setPage(prev => ({ ...prev, ...res.data, title: found.title }));
          }).catch(() => {});
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [pageId, location.pathname]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-[#0D9488] border-t-transparent rounded-full"></div></div>;

  if (!page) return (
    <div className="min-h-screen flex items-center justify-center" data-testid="page-not-found">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#1a2332] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>404</h1>
        <p className="text-slate-500">Page not found</p>
      </div>
    </div>
  );

  return (
    <div data-testid="dynamic-page">
      {heroSlides.length > 0 ? (
        <HeroSection slides={heroSlides} />
      ) : (
        <PageBanner title={page.title} image={page.banner_image} />
      )}
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-16">
        {page.summary && <p className="text-slate-500 mb-6">{page.summary}</p>}
        {page.content && <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: page.content }} />}
      </div>
    </div>
  );
}
