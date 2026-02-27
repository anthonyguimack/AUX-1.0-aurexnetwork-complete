import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { publicAPI } from '../lib/api';
import PageBanner from '../components/layout/PageBanner';

export default function DynamicPage() {
  const { pageId } = useParams();
  const [navPages, setNavPages] = useState([]);
  const [page, setPage] = useState(null);

  useEffect(() => {
    publicAPI.getNavPages().then(r => {
      const pages = r.data || [];
      setNavPages(pages);
      const found = pages.find(p => p.id === pageId || p.url === `/page/${pageId}`);
      if (found) {
        setPage(found);
        // If page_type is set, also load the rich content from pages collection
        if (found.page_type) {
          publicAPI.getPage(found.page_type).then(res => {
            setPage(prev => ({ ...prev, ...res.data, title: found.title }));
          }).catch(() => {});
        }
      }
    }).catch(console.error);
  }, [pageId]);

  if (!page) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-[#0D9488] border-t-transparent rounded-full"></div></div>;

  return (
    <div data-testid="dynamic-page">
      <PageBanner title={page.title} image={page.banner_image} />
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-16">
        {page.summary && <p className="text-slate-500 mb-6">{page.summary}</p>}
        {page.content && <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: page.content }} />}
      </div>
    </div>
  );
}
