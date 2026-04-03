import React, { useState } from 'react';
import { LAYOUTS, BLOCK_TYPES, getDefaultBlockConfig } from '../../lib/layoutDefinitions';
import { Plus, Trash2, ArrowUp, ArrowDown, Edit2, Type, Image, Video, Briefcase, Images, User, MousePointerClick, Minus, Code } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import BlockConfigModal from './BlockConfigModal';

const genId = () => Math.random().toString(36).substr(2, 9);

const BLOCK_ICONS = {
  rich_text: Type,
  image: Image,
  video: Video,
  service_list: Briefcase,
  gallery: Images,
  profile_card: User,
  button: MousePointerClick,
  separator: Minus,
  custom_html: Code,
};

export default function PageBuilder({ zones, layout, onChange }) {
  const [editingBlock, setEditingBlock] = useState(null);
  const [editingZone, setEditingZone] = useState(null);
  const [showBlockPicker, setShowBlockPicker] = useState(null);

  const layoutDef = LAYOUTS[layout];
  if (!layoutDef) return <div className="text-center text-slate-400 py-8">Select a layout to start building</div>;

  const currentZones = zones || {};

  const addBlock = (zoneId, blockType) => {
    const newZones = { ...currentZones };
    if (!newZones[zoneId]) newZones[zoneId] = [];
    const newBlock = {
      id: genId(),
      type: blockType,
      order: newZones[zoneId].length,
      config: getDefaultBlockConfig(blockType),
    };
    newZones[zoneId] = [...newZones[zoneId], newBlock];
    onChange(newZones);
    setShowBlockPicker(null);
    if (!['service_list', 'gallery', 'separator'].includes(blockType)) {
      setEditingBlock(newBlock);
      setEditingZone(zoneId);
    }
  };

  const updateBlock = (zoneId, blockId, updates) => {
    const newZones = { ...currentZones };
    newZones[zoneId] = (newZones[zoneId] || []).map(b => b.id === blockId ? { ...b, ...updates } : b);
    onChange(newZones);
  };

  const deleteBlock = (zoneId, blockId) => {
    const newZones = { ...currentZones };
    newZones[zoneId] = (newZones[zoneId] || []).filter(b => b.id !== blockId).map((b, i) => ({ ...b, order: i }));
    onChange(newZones);
  };

  const moveBlock = (zoneId, blockId, direction) => {
    const newZones = { ...currentZones };
    const blocks = [...(newZones[zoneId] || [])].sort((a, b) => a.order - b.order);
    const idx = blocks.findIndex(b => b.id === blockId);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    [blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]];
    newZones[zoneId] = blocks.map((b, i) => ({ ...b, order: i }));
    onChange(newZones);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-xs font-medium text-slate-600">
          Layout: {layoutDef.label} &mdash; {layoutDef.zones.length} zone{layoutDef.zones.length > 1 ? 's' : ''}
        </span>
      </div>

      {layoutDef.zones.map(zoneId => {
        const zoneBlocks = [...(currentZones[zoneId] || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
        const zoneLabel = layoutDef.zoneLabels[zoneId] || zoneId;

        return (
          <div key={zoneId} className="border-2 border-dashed border-slate-200 rounded-lg p-4 bg-slate-50/50" data-testid={`zone-${zoneId}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{zoneLabel}</span>
              <button
                onClick={() => setShowBlockPicker(zoneId)}
                className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-[#0D9488] text-white hover:bg-[#0D9488]/80 transition-colors"
                data-testid={`add-block-${zoneId}`}
              >
                <Plus className="w-3 h-3" /> Add Block
              </button>
            </div>

            {zoneBlocks.length === 0 && (
              <div className="text-center py-6 text-slate-300 text-sm border border-dashed border-slate-200 rounded bg-white">
                No blocks yet. Click "Add Block" to start.
              </div>
            )}

            <div className="space-y-2">
              {zoneBlocks.map((block, idx) => {
                const BlockIcon = BLOCK_ICONS[block.type] || Type;
                const typeDef = BLOCK_TYPES[block.type];
                return (
                  <div key={block.id}
                    className="flex items-center gap-3 bg-white border border-slate-200 rounded px-3 py-2 group hover:border-[#0D9488]/30 transition-colors"
                    data-testid={`block-${block.id}`}
                  >
                    <BlockIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-700">{typeDef?.label || block.type}</span>
                      {block.type === 'rich_text' && block.config?.content && (
                        <p className="text-xs text-slate-400 truncate">{block.config.content.replace(/<[^>]*>/g, '').substring(0, 60)}</p>
                      )}
                      {block.type === 'image' && block.config?.alt && (
                        <p className="text-xs text-slate-400 truncate">{block.config.alt}</p>
                      )}
                      {block.type === 'button' && (
                        <p className="text-xs text-slate-400 truncate">{block.config?.text || 'Button'}</p>
                      )}
                      {block.type === 'profile_card' && block.config?.name && (
                        <p className="text-xs text-slate-400 truncate">{block.config.name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveBlock(zoneId, block.id, -1)} disabled={idx === 0}
                        className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-30" data-testid={`move-up-${block.id}`}><ArrowUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => moveBlock(zoneId, block.id, 1)} disabled={idx === zoneBlocks.length - 1}
                        className="p-1 text-slate-300 hover:text-slate-600 disabled:opacity-30" data-testid={`move-down-${block.id}`}><ArrowDown className="w-3.5 h-3.5" /></button>
                      {!['service_list', 'gallery'].includes(block.type) && (
                        <button onClick={() => { setEditingBlock({ ...block }); setEditingZone(zoneId); }}
                          className="p-1 text-slate-300 hover:text-[#0D9488]" data-testid={`edit-block-${block.id}`}><Edit2 className="w-3.5 h-3.5" /></button>
                      )}
                      <button onClick={() => deleteBlock(zoneId, block.id)}
                        className="p-1 text-slate-300 hover:text-red-500" data-testid={`delete-block-${block.id}`}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Block Type Picker Dialog */}
      <Dialog open={!!showBlockPicker} onOpenChange={() => setShowBlockPicker(null)}>
        <DialogContent className="sm:max-w-[500px]" data-testid="block-picker-dialog">
          <DialogHeader><DialogTitle style={{ fontFamily: 'Playfair Display, serif' }}>Add Content Block</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(BLOCK_TYPES).map(([key, bt]) => {
              const Icon = BLOCK_ICONS[key] || Type;
              return (
                <button key={key}
                  onClick={() => addBlock(showBlockPicker, key)}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-slate-200 hover:border-[#0D9488] hover:bg-[#0D9488]/5 transition-all text-center"
                  data-testid={`pick-block-${key}`}
                >
                  <Icon className="w-5 h-5 text-slate-500" />
                  <span className="text-xs font-medium text-slate-700">{bt.label}</span>
                  <span className="text-[10px] text-slate-400 leading-tight">{bt.desc}</span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Block Config Modal */}
      {editingBlock && (
        <BlockConfigModal
          block={editingBlock}
          open={!!editingBlock}
          onClose={() => { setEditingBlock(null); setEditingZone(null); }}
          onSave={(updated) => {
            updateBlock(editingZone, editingBlock.id, { config: updated });
            setEditingBlock(null);
            setEditingZone(null);
          }}
        />
      )}
    </div>
  );
}
