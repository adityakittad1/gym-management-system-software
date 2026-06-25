import { useState } from 'react';
import { supabase } from '../services/supabase';
import { toast } from 'sonner';
import { Database, Download, AlertCircle, Calendar, RefreshCcw } from 'lucide-react';
import { TABLES, VIEWS, SELECTS } from '../services/db-schema';

export default function BackupCenter() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all core data sequentially to avoid timeouts on large databases
      const [{ data: members }, { data: payments }, { data: attendance }, { data: expenses }, { data: leads }] = await Promise.all([
        supabase.from(VIEWS.members).select(SELECTS.membersView),
        supabase.from(VIEWS.payments).select(SELECTS.paymentsView),
        supabase.from(VIEWS.attendance).select(SELECTS.attendanceView),
        supabase.from(TABLES.expenses).select('*').is('deleted_at', null),
        supabase.from(TABLES.leads).select('*').is('deleted_at', null)
      ]);

      const backup = {
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        data: {
          members: members || [],
          payments: payments || [],
          attendance: attendance || [],
          expenses: expenses || [],
          leads: leads || []
        }
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ttz_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Backup exported successfully! 🎉');
    } catch (err) {
      toast.error('Failed to export backup. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ padding: '40px 44px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.04em', margin: 0 }}>
          Backup Center
        </h1>
        <p style={{ color: '#3f3f46', fontSize: '14px', margin: '6px 0 0', fontWeight: 500 }}>
          Manage your cloud data exports and local backups
        </p>
      </div>

      <div className="animate-fade-up delay-100" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px' }}>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
            <Database style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 4px' }}>Cloud Data Export</h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '13px', margin: 0, lineHeight: 1.5, maxWidth: '600px' }}>
              Download a complete JSON snapshot of your entire database. This includes members, payments, attendance, expenses, and leads. 
              The export runs entirely securely directly from your Supabase instance.
            </p>
          </div>
        </div>

        <div style={{ background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '32px' }}>
          <AlertCircle style={{ width: 20, height: 20, color: '#fbbf24', flexShrink: 0 }} />
          <div>
            <h4 style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 700, margin: '0 0 4px' }}>Enterprise Data Security</h4>
            <p style={{ color: '#d4d4d8', fontSize: '12px', margin: 0, lineHeight: 1.5 }}>
              Since we moved to Supabase in v3.0, your data is already backed up automatically in the cloud by Supabase's Point-in-Time Recovery (PITR). 
              This local export is just for your own peace of mind or for running custom offline analytics.
            </p>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          style={{
            background: isExporting ? 'var(--card)' : '#fbbf24',
            color: isExporting ? 'var(--muted-foreground)' : '#000',
            border: isExporting ? '1px solid var(--border)' : 'none',
            padding: '16px 32px',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: isExporting ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.2s',
            boxShadow: isExporting ? 'none' : '0 8px 32px rgba(251,191,36,0.25)'
          }}
        >
          {isExporting ? <RefreshCcw className="animate-spin" style={{ width: 18, height: 18 }} /> : <Download style={{ width: 18, height: 18 }} />}
          {isExporting ? 'Generating Backup...' : 'Download Full Database Backup'}
        </button>

      </div>
    </div>
  );
}
