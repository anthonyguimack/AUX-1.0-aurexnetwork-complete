import React, { useState, useEffect } from 'react';
import { useMember } from '../../lib/memberAuth';
import { memberAPI, publicAPI } from '../../lib/api';
import { User, Loader2 } from 'lucide-react';

const formatDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return `${String(dt.getMonth()+1).padStart(2,'0')}/${String(dt.getDate()).padStart(2,'0')}/${dt.getFullYear()}`;
};

export default function MentorshipProfile() {
  const { member } = useMember();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    Promise.all([
      memberAPI.getMentor().then(r => setMentor(r.data)).catch(() => setMentor(null)),
      publicAPI.getSettings().then(r => setSettings(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const defaultAvatar = settings.membership_default_avatar || '';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="mentorship-profile-page">
        <Loader2 className="w-6 h-6 text-[#c9a84c] animate-spin" />
      </div>
    );
  }

  // No mentor assigned
  if (!mentor) {
    return (
      <div data-testid="mentorship-profile-page">
        <h1 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'DM Serif Display', serif" }}>Mentorship Profile</h1>
        <div className="bg-[#13161e] border border-white/5 rounded-lg p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-[#c9a84c]/10 border-2 border-[#c9a84c]/20 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-[#c9a84c]/40" />
          </div>
          <p className="text-gray-400 text-sm">No mentor has been assigned to your account yet.</p>
          <p className="text-gray-500 text-xs mt-2">Please contact your administrator for mentor assignment.</p>
        </div>
      </div>
    );
  }

  const mentorAvatar = mentor.avatar || defaultAvatar;

  const fields = [
    { label: 'Name', value: `${mentor.first_name || ''} ${mentor.last_name || ''}`.trim() },
    { label: 'Membership Number', value: mentor.membership_id || '-' },
    { label: 'Email', value: mentor.email || '-' },
    { label: 'Phone Number', value: mentor.phone || '-' },
    { label: 'Address', value: mentor.address || '-' },
    { label: 'Country', value: mentor.country || '-' },
    { label: 'State', value: mentor.state || '-' },
    { label: 'City', value: mentor.city || '-' },
    { label: 'ZIP Code', value: mentor.zip_code || '-' },
    { label: 'Date of Birth', value: formatDate(mentor.date_of_birth) },
    { label: 'Google Account', value: mentor.google_account || '-' },
  ];

  return (
    <div data-testid="mentorship-profile-page">
      <h1 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'DM Serif Display', serif" }}>Mentorship Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Avatar */}
        <div className="bg-[#13161e] border border-white/5 rounded-lg p-6 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Your Mentor</h3>
          <div className="w-32 h-32 rounded-full bg-[#c9a84c]/10 border-2 border-[#c9a84c]/30 flex items-center justify-center overflow-hidden" data-testid="mentor-avatar">
            {mentorAvatar ?
              <img src={mentorAvatar} alt={`${mentor.first_name} ${mentor.last_name}`} className="w-full h-full object-cover" /> :
              <User className="w-12 h-12 text-[#c9a84c]/50" />}
          </div>
          <p className="mt-3 text-white font-medium" data-testid="mentor-name">{mentor.first_name} {mentor.last_name}</p>
          <p className="text-[#c9a84c] text-xs mt-1" data-testid="mentor-membership-id">{mentor.membership_id}</p>
          {mentor.is_mentor && <span className="mt-2 text-xs bg-[#c9a84c]/20 text-[#c9a84c] px-2 py-0.5 rounded">Mentor</span>}
        </div>

        {/* Right - Details */}
        <div className="lg:col-span-2 bg-[#13161e] border border-white/5 rounded-lg">
          <div className="border-b border-white/5 p-4">
            <span className="text-sm font-medium text-[#c9a84c] border-b-2 border-[#c9a84c] pb-2 px-1">General Info</span>
          </div>
          <div className="p-5 space-y-4">
            {fields.map(f => (
              <div key={f.label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4" data-testid={`mentor-field-${f.label.toLowerCase().replace(/\s+/g, '-')}`}>
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
