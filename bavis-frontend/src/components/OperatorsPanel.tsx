import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Key } from 'lucide-react';
import type { UserRole } from '../types/bavis';

export const OperatorsPanel: React.FC = () => {
  const { role, setRole, user } = useAuth();

  const operatorList = [
    { id: 'usr_op_77', name: 'Constable R. Kumar', badgeId: 'SSB-OPS-4029', role: 'operator' as UserRole, unit: '14th Battalion SSB, Sector North', status: 'ACTIVE ON DUTY', lastLogin: '18:14:02 UTC' },
    { id: 'usr_sup_12', name: 'Inspector A. Sharma', badgeId: 'SSB-SUP-1102', role: 'supervisor' as UserRole, unit: 'Police II Division, MHA Command', status: 'ACTIVE ON DUTY', lastLogin: '17:30:15 UTC' },
    { id: 'usr_adm_01', name: 'Cmdt. S. Varma', badgeId: 'SSB-DIR-001', role: 'admin' as UserRole, unit: 'BAVIS Directorate, New Delhi', status: 'STANDBY', lastLogin: '16:02:40 UTC' },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-3 select-none font-mono text-xs">
      <div className="flex items-center justify-between p-2.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
              OPERATORS, WATCH DUTY & ROLE-BASED ACCESS CONTROL (RBAC)
            </h2>
            <p className="text-[10px] text-[var(--text-secondary)]">
              Authorized surveillance operators, supervisors, and directorate administrators
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
            CURRENT SESSION: {user.name} ({role.toUpperCase()})
          </span>
        </div>
      </div>

      {/* RBAC Permission Matrix */}
      <div className="p-3 bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded space-y-2">
        <div className="flex items-center justify-between border-b border-[var(--border-tactical)] pb-1.5">
          <h3 className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" />
            ROLE PERMISSION MATRIX
          </h3>
          <span className="text-[10px] text-[var(--text-muted)]">SIH26187 CYBERSECURITY COMPLIANT</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
          <div className={`p-2.5 rounded border ${role === 'operator' ? 'bg-cyan-950/40 border-cyan-500' : 'bg-[var(--bg-panel-elevated)] border-[var(--border-tactical)]'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[var(--text-primary)]">OPERATOR ROLE</span>
              {role === 'operator' && <span className="text-[9px] text-cyan-400 font-bold">[ACTIVE]</span>}
            </div>
            <ul className="text-[10px] text-[var(--text-secondary)] space-y-0.5">
              <li>• Monitor live multi-camera matrices</li>
              <li>• Acknowledge & resolve security incidents</li>
              <li>• View evidence dossiers & search tracks</li>
              <li className="text-red-400">• Zone editing restricted</li>
            </ul>
          </div>

          <div className={`p-2.5 rounded border ${role === 'supervisor' ? 'bg-cyan-950/40 border-cyan-500' : 'bg-[var(--bg-panel-elevated)] border-[var(--border-tactical)]'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[var(--text-primary)]">SUPERVISOR ROLE</span>
              {role === 'supervisor' && <span className="text-[9px] text-cyan-400 font-bold">[ACTIVE]</span>}
            </div>
            <ul className="text-[10px] text-[var(--text-secondary)] space-y-0.5">
              <li>• All Operator capabilities</li>
              <li>• Draw & configure polygon geofences</li>
              <li>• Modify dwell thresholds & active hours</li>
              <li>• Export forensic evidence reports</li>
            </ul>
          </div>

          <div className={`p-2.5 rounded border ${role === 'admin' ? 'bg-cyan-950/40 border-cyan-500' : 'bg-[var(--bg-panel-elevated)] border-[var(--border-tactical)]'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[var(--text-primary)]">ADMIN / CMDT ROLE</span>
              {role === 'admin' && <span className="text-[9px] text-cyan-400 font-bold">[ACTIVE]</span>}
            </div>
            <ul className="text-[10px] text-[var(--text-secondary)] space-y-0.5">
              <li>• Full system & gateway configuration</li>
              <li>• Provision new CCTV camera streams</li>
              <li>• Audit log review & evidence retention</li>
              <li>• User management & access grants</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Operator Fleet Table */}
      <div className="p-3 bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded space-y-2">
        <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase pb-1.5 border-b border-[var(--border-tactical)]">
          AUTHORIZED BORDER FORCE PERSONNEL
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] text-[9px] uppercase">
              <tr>
                <th className="p-2">Badge ID</th>
                <th className="p-2">Name</th>
                <th className="p-2">Assigned Unit</th>
                <th className="p-2">Role Clearance</th>
                <th className="p-2">Status</th>
                <th className="p-2">Last Login</th>
                <th className="p-2 text-right">Switch Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-tactical)]">
              {operatorList.map((op) => (
                <tr key={op.id} className="hover:bg-[var(--bg-panel-elevated)] transition-colors">
                  <td className="p-2 font-bold text-cyan-400">{op.badgeId}</td>
                  <td className="p-2 text-[var(--text-primary)] font-semibold">{op.name}</td>
                  <td className="p-2 text-[var(--text-secondary)]">{op.unit}</td>
                  <td className="p-2">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {op.role}
                    </span>
                  </td>
                  <td className="p-2 text-emerald-400 font-bold text-[10px]">{op.status}</td>
                  <td className="p-2 text-[var(--text-secondary)]">{op.lastLogin}</td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => setRole(op.role)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                        role === op.role
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-700 opacity-60'
                          : 'bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] text-[var(--text-primary)] hover:border-cyan-500'
                      }`}
                    >
                      {role === op.role ? 'ACTIVE' : 'SELECT'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
