import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { memberAPI } from './api';

const MemberCtx = createContext(null);

export function MemberProvider({ children }) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    const token = localStorage.getItem('member_token');
    if (!token) { setLoading(false); return; }
    try {
      const r = await memberAPI.me();
      setMember(r.data);
    } catch { localStorage.removeItem('member_token'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { check(); }, [check]);

  const login = async (username, password) => {
    const r = await memberAPI.login({ username, password });
    localStorage.setItem('member_token', r.data.token);
    setMember(r.data.member);
    return r.data;
  };

  const logout = () => {
    localStorage.removeItem('member_token');
    setMember(null);
  };

  return <MemberCtx.Provider value={{ member, loading, login, logout, refresh: check }}>{children}</MemberCtx.Provider>;
}

export function useMember() {
  const ctx = useContext(MemberCtx);
  if (!ctx) throw new Error('useMember must be used within MemberProvider');
  return ctx;
}
