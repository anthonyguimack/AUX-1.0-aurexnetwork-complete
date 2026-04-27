import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../lib/api';
import { toast } from 'sonner';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { Switch } from '../../components/ui/switch';

function SortableRow({ item, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white border border-slate-100 rounded-sm p-4 mb-2"
      data-testid={`manav-row-${item.id}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500"
        aria-label={`Drag ${item.label}`}
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1a2332] truncate">{item.label}</p>
        <p className="text-xs text-slate-400 font-mono">{item.id}</p>
      </div>
      <div className="flex items-center gap-2">
        {item.visible !== false
          ? <Eye className="w-4 h-4 text-[#0D9488]" />
          : <EyeOff className="w-4 h-4 text-slate-300" />}
        <Switch
          checked={item.visible !== false}
          onCheckedChange={() => onToggle(item)}
          data-testid={`manav-toggle-${item.id}`}
        />
      </div>
    </div>
  );
}

export default function MyAccountNavManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.getMyAccountNav()
      .then(r => setItems(r.data || []))
      .catch(() => toast.error('Failed to load navigation'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems(prev => {
      const oldIdx = prev.findIndex(p => p.id === active.id);
      const newIdx = prev.findIndex(p => p.id === over.id);
      if (oldIdx < 0 || newIdx < 0) return prev;
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  const toggleVisible = async (item) => {
    const nextVisible = !(item.visible !== false);
    // optimistic
    setItems(prev => prev.map(p => p.id === item.id ? { ...p, visible: nextVisible } : p));
    try {
      await adminAPI.updateMyAccountNav(item.id, { visible: nextVisible });
    } catch {
      toast.error('Failed to update visibility'); load();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.reorderMyAccountNav(items.map(i => i.id));
      toast.success('Order saved');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error saving order');
    } finally { setSaving(false); }
  };

  return (
    <div data-testid="myaccount-nav-manager">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--ad-heading, #1a2332)', fontFamily: 'Playfair Display, serif' }}
          >
            My Account Navigation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Drag to reorder. Toggle the switch to hide an item from every member&apos;s sidebar globally.
            To restrict per level instead, use <strong>Member Levels &rarr; Permissions</strong>.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: 'var(--ad-button-bg, #0D9488)' }}
          data-testid="manav-save-btn"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save order
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm bg-white rounded-sm border border-slate-100">
          No nav items.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {items.map(item => (
              <SortableRow key={item.id} item={item} onToggle={toggleVisible} />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
