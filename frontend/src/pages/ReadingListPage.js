import React, { useState, useEffect } from 'react';
import { publicAPI } from '../lib/api';
import PageBanner from '../components/layout/PageBanner';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { BookOpen, ExternalLink, X } from 'lucide-react';

export default function ReadingListPage() {
  const [books, setBooks] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    publicAPI.getBooks().then(r => setBooks(r.data)).catch(console.error);
  }, []);

  return (
    <div data-testid="reading-list-page">
      <PageBanner title="Reading List" image="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800" />
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[#0D9488] text-xs uppercase tracking-[0.3em] font-semibold mb-3">CURATED RECOMMENDATIONS</p>
          <h2 className="text-3xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>Books That Shape Our Thinking</h2>
          <p className="text-slate-500 mt-4 leading-relaxed">These carefully selected books have profoundly influenced our consulting philosophy. Each one offers unique insights into leadership, strategy, and business transformation.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {books.map(book => (
            <div key={book.id} className="bg-white rounded-sm border border-slate-100 p-6 hover:shadow-lg transition-all cursor-pointer group" onClick={() => setSelected(book)} data-testid={`book-card-${book.id}`}>
              <div className="flex gap-5">
                <img src={book.image} alt={book.title} className="w-24 h-36 object-cover rounded-sm shadow-md group-hover:shadow-lg transition-shadow" />
                <div>
                  <h3 className="text-lg font-semibold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>{book.title}</h3>
                  <p className="text-[#0D9488] text-sm font-medium mt-1">by {book.author}</p>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-3">{book.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-[550px]" data-testid="book-detail-modal">
          {selected && (
            <div className="flex flex-col md:flex-row gap-6">
              <img src={selected.image} alt={selected.title} className="w-40 h-56 object-cover rounded-sm shadow-lg mx-auto md:mx-0" />
              <div>
                <h3 className="text-xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>{selected.title}</h3>
                <p className="text-[#0D9488] text-sm font-medium mt-1">by {selected.author}</p>
                <p className="text-sm text-slate-600 mt-4 leading-relaxed">{selected.description}</p>
                <div className="mt-6 space-y-2">
                  {selected.amazon_link && (
                    <a href={selected.amazon_link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#0D9488] hover:underline" data-testid="book-amazon-link">
                      <ExternalLink className="w-4 h-4" /> Buy on Amazon
                    </a>
                  )}
                  {selected.other_links?.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#0D9488] hover:underline">
                      <ExternalLink className="w-4 h-4" /> {link.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
