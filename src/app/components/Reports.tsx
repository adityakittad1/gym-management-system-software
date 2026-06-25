import { useState } from 'react';
import { TrendingUp, DollarSign, Users, Calendar, Download, Star, Sparkles, Award, FileText, Table as TableIcon, File as FileIcon, ChevronDown } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { api } from '../services/api';
import { useRealtimeAnalytics } from '../hooks/useRealtimeAnalytics';

// Import exporters — jspdf v4 uses named export; jspdf-autotable v5 is a side-effect plugin
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Extend jsPDF type to include autoTable (added by jspdf-autotable plugin)
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}



export default function Reports() {
  const { data, isLoading: storeLoading } = useRealtimeAnalytics(api.analytics.getReports, null);

  const generatePDF = (reportType: string) => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(40, 40, 40);
      doc.text('TTZ FITNESS CLUB', 14, 22);
      
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text(`${reportType} Report`, 14, 30);
      
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 36);

      let head = [];
      let body = [];

      if (reportType === 'Revenue') {
        head = [['Month', 'Revenue', 'Expenses', 'Profit']];
        body = data?.monthlyRevenueData.map(d => [d.month, `INR ${d.revenue}`, `INR ${d.expenses}`, `INR ${d.revenue - d.expenses}`]) || [];
      } else if (reportType === 'Attendance') {
        head = [['Week', 'Total Attendance']];
        body = data?.attendanceTrend.map(d => [d.week, d.attendance.toString()]) || [];
      } else if (reportType === 'Membership') {
        head = [['Plan Type', 'Percentage']];
        body = data?.membershipDistribution.map(d => [d.name, `${d.value}%`]) || [];
      }

      doc.autoTable({
        startY: 45,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [251, 191, 36], textColor: [0, 0, 0] },
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
      }

      doc.save(`TTZ_${reportType}_Report.pdf`);
      toast.success(`PDF ${reportType} Report exported successfully.`);
    } catch (e) {
      toast.error('Failed to generate PDF. Make sure jspdf is installed.');
    }
  };

  const generateExcel = (reportType: string) => {
    try {
      let sheetData: any[] = [];
      
      if (reportType === 'Revenue') {
        sheetData = data?.monthlyRevenueData || [];
      } else if (reportType === 'Attendance') {
        sheetData = data?.attendanceTrend || [];
      } else if (reportType === 'Membership') {
        sheetData = data?.membershipDistribution || [];
      }

      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, reportType);
      
      // Auto-size columns
      const wscols = Object.keys(sheetData[0] || {}).map(() => ({ wch: 15 }));
      worksheet['!cols'] = wscols;

      XLSX.writeFile(workbook, `TTZ_${reportType}_Report.xlsx`);
      toast.success(`Excel ${reportType} Report exported successfully.`);
    } catch (e) {
      toast.error('Failed to generate Excel. Make sure xlsx is installed.');
    }
  };

  const handleExport = (type: 'pdf' | 'excel' | 'csv', reportType: string) => {
    if (type === 'pdf') generatePDF(reportType);
    if (type === 'excel') generateExcel(reportType);
    if (type === 'csv') generateExcel(reportType); // XLSX handles CSV too if we change extension
  };

  if (storeLoading || !data) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2 animate-pulse">
            <div className="h-8 w-48 bg-zinc-900 rounded"></div>
            <div className="h-4 w-72 bg-zinc-900 rounded"></div>
          </div>
          <div className="h-12 w-32 bg-zinc-900 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="animate-fade-up" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '26px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.03em', margin: 0 }}>Analytics Suite</h1>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', fontSize: '10px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <Sparkles style={{ width: 9, height: 9 }} /> Financials
            </span>
          </div>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '13px', margin: 0 }}>Comprehensive overview of memberships, revenues, and growth trends.</p>
        </div>
        
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', border: 'none', color: '#000', fontSize: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(251,191,36,0.25)', transition: 'all 0.2s ease', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              <Download style={{ width: 14, height: 14 }} /> Export Reports <ChevronDown style={{ width: 14, height: 14 }} />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', width: '220px', zIndex: 50, boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }} align="end" sideOffset={8}>
              <div style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue Reports</div>
              <DropdownMenu.Item onClick={() => handleExport('pdf', 'Revenue')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', fontSize: '13px', color: 'var(--foreground)', borderRadius: '8px', cursor: 'pointer', outline: 'none' }} className="hover:bg-zinc-800">
                <FileText style={{ width: 14, height: 14, color: '#ef4444' }} /> Export as PDF
              </DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => handleExport('excel', 'Revenue')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', fontSize: '13px', color: 'var(--foreground)', borderRadius: '8px', cursor: 'pointer', outline: 'none' }} className="hover:bg-zinc-800">
                <TableIcon style={{ width: 14, height: 14, color: '#22c55e' }} /> Export as Excel
              </DropdownMenu.Item>

              <DropdownMenu.Separator style={{ height: '1px', background: 'rgba(63,63,70,0.5)', margin: '8px 0' }} />
              
              <div style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attendance Reports</div>
              <DropdownMenu.Item onClick={() => handleExport('pdf', 'Attendance')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', fontSize: '13px', color: 'var(--foreground)', borderRadius: '8px', cursor: 'pointer', outline: 'none' }} className="hover:bg-zinc-800">
                <FileText style={{ width: 14, height: 14, color: '#ef4444' }} /> Export as PDF
              </DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => handleExport('excel', 'Attendance')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', fontSize: '13px', color: 'var(--foreground)', borderRadius: '8px', cursor: 'pointer', outline: 'none' }} className="hover:bg-zinc-800">
                <TableIcon style={{ width: 14, height: 14, color: '#22c55e' }} /> Export as Excel
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center border border-amber-400/10">
              <TrendingUp className="w-5.5 h-5.5 text-amber-400" />
            </div>
            <span className="text-green-400 text-xs font-mono">+15%</span>
          </div>
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Total Revenue</p>
          <p className="text-white text-2xl font-black font-mono">₹{data.totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-10 h-10 bg-red-400/10 rounded-xl flex items-center justify-center border border-red-500/10">
              <DollarSign className="w-5.5 h-5.5 text-red-400" />
            </div>
            <span className="text-red-400 text-xs font-mono">+8%</span>
          </div>
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Total Expenses</p>
          <p className="text-white text-2xl font-black font-mono">₹{data.totalExpenses.toLocaleString()}</p>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-10 h-10 bg-emerald-400/10 rounded-xl flex items-center justify-center border border-emerald-500/10">
              <TrendingUp className="w-5.5 h-5.5 text-emerald-400" />
            </div>
            <span className="text-green-400 text-xs font-mono font-bold">+22%</span>
          </div>
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Net Profit</p>
          <p className="text-emerald-400 text-2xl font-black font-mono">₹{data.netProfit.toLocaleString()}</p>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-10 h-10 bg-blue-400/10 rounded-xl flex items-center justify-center border border-blue-500/10">
              <Users className="w-5.5 h-5.5 text-blue-400" />
            </div>
            <span className="text-zinc-400 text-xs font-mono font-bold">AVG</span>
          </div>
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Daily Attendance</p>
          <p className="text-blue-400 text-2xl font-black font-mono">{data.avgAttendance}</p>
        </div>

      </div>

      {/* Main Charts block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue vs Expenses */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white text-base font-bold">Revenue vs Operating Expenses</h3>
            <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 font-semibold px-2 py-1 rounded">Last 6 Months</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="month" stroke="#71717a" style={{ fontSize: '11px', fontWeight: 'bold' }} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px', fontWeight: 'bold' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  color: 'var(--foreground)',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
              <Bar dataKey="revenue" fill="#fbbf24" radius={[6, 6, 0, 0]} name="Gross Revenue" />
              <Bar dataKey="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Membership distribution */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-6 shadow-sm">
          <h3 className="text-white text-base font-bold mb-6">Membership Packages Distribution</h3>
          
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.membershipDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name.substring(0,6)}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={85}
                fill="#8884d8"
                dataKey="value"
              >
                {data.membershipDistribution.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  color: 'var(--foreground)',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="flex items-center justify-center gap-6 mt-2">
            {data.membershipDistribution.map((item: any) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-zinc-400 text-xs font-semibold">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance line */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-6 shadow-sm">
          <h3 className="text-white text-base font-bold mb-6">Weekly Member Retention Check-in Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="week" stroke="#71717a" style={{ fontSize: '11px', fontWeight: 'bold' }} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px', fontWeight: 'bold' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  color: 'var(--foreground)',
                  fontSize: '12px'
                }}
              />
              <Line
                type="monotone"
                dataKey="attendance"
                name="Checked In"
                stroke="#fbbf24"
                strokeWidth={3}
                dot={{ fill: '#fbbf24', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Performance metrics & Trainer Ratings */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-white text-base font-bold mb-5 flex items-center gap-1.5">
            <Award className="w-5 h-5 text-amber-400" /> Trainer & Client Satisfaction
          </h3>
          
          <div className="space-y-4">
            {[
              { name: 'Coach Rajesh Patil', members: 25, rating: 4.9 },
              { name: 'Coach Priyanka Shah', members: 32, rating: 4.8 },
              { name: 'Coach Vikram Joshi', members: 18, rating: 4.7 },
              { name: 'Coach Neha Kulkarni', members: 28, rating: 4.9 }
            ].map((coach) => (
              <div key={coach.name} className="flex items-center justify-between p-3.5 bg-zinc-900/30 border border-zinc-850 rounded-2xl">
                <div>
                  <span className="text-white text-xs font-bold block">{coach.name}</span>
                  <span className="text-zinc-550 text-[10px] block mt-0.5">{coach.members} active clients</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-white text-xs font-bold font-mono">{coach.rating}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-zinc-850">
            <div>
              <span className="text-zinc-550 text-[10px] uppercase font-bold tracking-wider">Retention Rate</span>
              <span className="text-emerald-400 text-lg font-black block mt-0.5">94.5%</span>
            </div>
            <div>
              <span className="text-zinc-550 text-[10px] uppercase font-bold tracking-wider">Membership Churn</span>
              <span className="text-rose-500 text-lg font-black block mt-0.5">5.5%</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
