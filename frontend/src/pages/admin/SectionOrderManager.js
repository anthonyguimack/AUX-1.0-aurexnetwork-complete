import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { Switch } from '../../components/ui/switch';

const sectionLabels = {
  hero: 'Hero Banner', about: 'About Us', services: 'Services',
  news: 'Company News', blog: 'External Blog', reading_list: 'Reading List',
  map: 'Travel Map', portfolio: 'Portfolio', gallery: 'Gallery',
  testimonials: 'Testimonials', contact: 'Contact Form',
};

function SortableItem({ id, label, enabled, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-white border border-slate-100 rounded-sm p-4 mb-2" data-testid={`section-item-${id}`}>
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="flex-1">
        <p className="text-sm font-medium text-[#1a2332]">{label}</p>
        <p className="text-xs text-slate-400">{id}</p>
      </div>
      <div className="flex items-center gap-2">
        {enabled ? <Eye className="w-4 h-4 text-[#0D9488]" /> : <EyeOff className="w-4 h-4 text-slate-300" />}
        <Switch checked={enabled} onCheckedChange={() => onToggle(id)} data-testid={`section-toggle-${id}`} />
      </div>
    </div>
  );
}

export default function SectionOrderManager() {
  const [order, setOrder] = useState([]);
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    Promise.all([adminAPI.getSectionOrder(), adminAPI.getSettings()]).then(([orderRes, settingsRes]) => {
      setOrder(orderRes.data || []);
      setSections(settingsRes.data?.sections || {});
    }).catch(console.error);
  }, []);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setOrder(prev => {
        const oldIndex = prev.indexOf(active.id);
        const newIndex = prev.indexOf(over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleToggle = (key) => {
    setSections(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled: !(prev[key]?.enabled !== false) }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await adminAPI.updateSectionOrder(order);
      await adminAPI.updateSettings({ sections });
      toast.success('Section order saved!');
    } catch { toast.error('Error saving'); }
    finally { setLoading(false); }
  };

  return (
    <div data-testid="section-order-manager">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2332]" style={{ fontFamily: 'Playfair Display, serif' }}>Homepage Sections</h1>
          <p className="text-sm text-slate-500 mt-1">Drag to reorder, toggle to show/hide sections</p>
        </div>
        <button onClick={handleSave} disabled={loading} className="bg-[#0D9488] text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2 disabled:opacity-50" data-testid="section-save-btn">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Order
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          {order.map(key => (
            <SortableItem
              key={key}
              id={key}
              label={sectionLabels[key] || key}
              enabled={sections[key]?.enabled !== false}
              onToggle={handleToggle}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
