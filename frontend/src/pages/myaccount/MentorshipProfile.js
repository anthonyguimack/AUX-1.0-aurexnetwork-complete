import React, { useState, useEffect } from 'react';
import { useMember } from '../../lib/memberAuth';
import { memberAPI, publicAPI } from '../../lib/api';
import { User } from 'lucide-react';

export default function MentorshipProfile() {
  const { member } = useMember();
  const [mentor, setMentor] = useState(null);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    memberAPI.getMentor().then(r => setMentor(r.data)).catch(() => {});
    publicAPI.getSettings().then(r => setSettings(r.data)).catch(() => {});
  }, []);

  const defaultAvatar = settings.membership_default_avatar || '';
  const displayData = mentor || {};

  const fields = [
    { label: 'Legal Name (as I.D.)', value: `${displayData.first_name || ''} ${displayData.last_name || ''}`.trim() },
    { label: 'Name', value: `${displayData.first_name || ''} ${displayData.last_name || ''}`.trim() },
    { label: 'Membership Number', value: displayData.membership_id || '-' },
    { label: 'Email', value: displayData.email || '-' },
    { label: 'Address', value: displayData.address || '-' },
    { label: 'Country / State', value: [displayData.country, displayData.state].filter(Boolean).join(' / ') || '-' },
    { label: 'ZIP Code', value: displayData.zip_code || '-' },
    { label: 'Phone Number', value: displayData.phone || '-' },
    { label: 'Google Account', value: displayData.google_account || '-' },
    { label: 'Date of Birth', value: displayData.date_of_birth || '-' },
  ];

  return (
    <div data-testid="mentorship-profile-page">
      <h1 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'DM Serif Display', serif" }}>Mentorship Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Avatar */}
        <div className="bg-[#13161e] border border-white/5 rounded-lg p-6 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Mentorship Profile</h3>
          <div className="w-32 h-32 rounded-full bg-[#c9a84c]/10 border-2 border-[#c9a84c]/30 flex items-center justify-center overflow-hidden">
            {(mentor?.avatar || defaultAvatar) ?
              <img src={mentor?.avatar || defaultAvatar} alt="" className="w-full h-full object-cover" /> :
              <User className="w-12 h-12 text-[#c9a84c]/50" />}
          </div>
          {mentor ? (
            <p className="mt-3 text-white font-medium">{mentor.first_name} {mentor.last_name}</p>
          ) : (
            <p className="mt-3 text-gray-500 text-sm">No mentor assigned</p>
          )}
        </div>

        {/* Right — Details */}
        <div className="lg:col-span-2 bg-[#13161e] border border-white/5 rounded-lg">
          <div className="border-b border-white/5 p-4">
            <div className="flex gap-4">
              <button className="text-sm font-medium text-[#c9a84c] border-b-2 border-[#c9a84c] pb-2 px-1">General Info</button>
              <button className="text-sm font-medium text-gray-500 pb-2 px-1 hover:text-gray-300">Calendar</button>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {fields.map(f => (
              <div key={f.label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <span className="text-xs text-gray-500 w-40 flex-shrink-0">{f.label}</span>
                <span className="text-sm text-white">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
