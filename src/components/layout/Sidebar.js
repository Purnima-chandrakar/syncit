import React from 'react';
import Client from '../Client';

const Sidebar = ({
  clients,
  adminId,
  permissions,
  hands,
  mySocketId,
  activeEditorId,
  isAdmin,
  showUserPanel,
  setShowUserPanel,
  onTogglePermission,
  onRaiseHand,
  onKickUser
}) => {
  const sortedClients = [...clients].sort((a, b) => {
    const aIsAdmin = a.socketId === adminId ? -1 : 0;
    const bIsAdmin = b.socketId === adminId ? -1 : 0;
    if (aIsAdmin !== bIsAdmin) return aIsAdmin - bIsAdmin;
    return (a.username || "").localeCompare(b.username || "");
  });

  return (
    <aside className="w-60 bg-surface-container-low precision-border border-y-0 border-l-0 flex flex-col flex-shrink-0 z-20">
      <div className="p-4 flex flex-col h-full">
        <h2 className="font-headline text-[0.6875rem] tracking-[0.1em] uppercase text-on-surface-variant mb-6 flex items-center justify-between">
          Classroom Members
          <span className="bg-primary-dim/20 text-primary px-2 py-0.5 rounded-full text-[10px] cursor-pointer" onClick={() => setShowUserPanel(!showUserPanel)}>
            {clients.length} Live
          </span>
        </h2>
        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          <div className="space-y-1 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {sortedClients.map((client) => {
              const canEdit = permissions?.[client.socketId] !== false;
              const handRaised = hands?.includes(client.socketId);
              const isSelf = client.socketId === mySocketId;
              const clientIsAdmin = client.socketId === adminId;
              const isActiveEditor = client.socketId === activeEditorId;
              return (
                <Client
                  key={client.socketId}
                  username={client.username}
                  isAdminView={isAdmin}
                  isAdminUser={clientIsAdmin}
                  canEdit={canEdit}
                  isSelf={isSelf}
                  handRaised={handRaised}
                  isActiveEditor={isActiveEditor}
                  onTogglePermission={
                    isAdmin ? () => onTogglePermission(client.socketId) : undefined
                  }
                  onRaiseHand={!clientIsAdmin && isSelf ? onRaiseHand : undefined}
                  onRemoveUser={isAdmin && !clientIsAdmin && !isSelf ? () => onKickUser(client.socketId) : undefined}
                />
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
