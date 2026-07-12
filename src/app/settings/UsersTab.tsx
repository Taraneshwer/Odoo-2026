import React from 'react';

export default function UsersTab() {
  const demo = [
    { id: 'u1', name: 'Fleet Manager', email: 'fleet.manager@transitops.in', role: 'Fleet Manager' },
    { id: 'u2', name: 'Driver', email: 'driver@transitops.in', role: 'Driver' },
    { id: 'u3', name: 'Finance', email: 'finance@transitops.in', role: 'Financial Analyst' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Users</h2>
        <button className="bg-primary text-primary-foreground px-3 py-1 rounded">Add user</button>
      </div>

      <div className="mt-4 border border-border rounded-md p-4">
        <div className="text-sm text-muted-foreground mb-4">Manage platform users and roles.</div>

        <div className="overflow-auto">
          <table className="w-full text-[0.8125rem]">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {demo.map(u => (
                <tr key={u.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 truncate text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="px-2 py-0.5 rounded bg-muted text-muted-foreground">Edit</button>
                      <button className="px-2 py-0.5 rounded bg-destructive/10 text-destructive">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
