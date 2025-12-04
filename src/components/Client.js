import React, { useState } from 'react';
import Avatar from 'react-avatar';

const Client = ({ username, isAdminView, canEdit, isSelf, onTogglePermission, onRaiseHand, handRaised, isAdminUser, isActiveEditor, onRemoveUser }) => {
    const [showConfirmRemove, setShowConfirmRemove] = useState(false);
    const [showAdminMenu, setShowAdminMenu] = useState(false);

    const handleRemoveConfirm = () => {
        setShowConfirmRemove(false);
        setShowAdminMenu(false);
        if (onRemoveUser) onRemoveUser();
    };

    const handleTogglePermission = () => {
        setShowAdminMenu(false);
        if (onTogglePermission) onTogglePermission();
    };

    return (
        <div className={`client-card${isActiveEditor ? ' active-editor' : ''}`}>
            <div style={{display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%'}}>
                <div className="client-avatar">
                    <Avatar name={username} size={44} round={"12px"} />
                    {/* Hand indicator top-right */}
                    {!isAdminUser && isSelf && (
                        <button
                            className={`hand-btn ${handRaised ? 'raised' : ''}`}
                            title={handRaised ? 'Lower hand' : 'Raise hand'}
                            onClick={(e) => { e.stopPropagation(); onRaiseHand && onRaiseHand(!handRaised); }}
                        >
                            <span>✋</span>
                        </button>
                    )}
                    {!isSelf && handRaised && (
                        <span className="hand-badge" title="Hand raised"><span>✋</span></span>
                    )}
                </div>
                <div style={{flex: 1, minWidth: 0}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8}}>
                        <div>
                            <div className="client-name" title={username}>{username}{isSelf && ' (you)'}</div>
                            {isAdminView && !isSelf && (
                                <div className={`perm-badge ${canEdit ? 'allow' : 'block'}`} style={{marginTop: 4}}>
                                    {canEdit ? 'Can edit' : 'Blocked'}
                                </div>
                            )}
                            {isActiveEditor && (
                                <div className="active-badge" style={{marginTop: 4}}>editing</div>
                            )}
                        </div>
                        {isAdminView && !isSelf && (onTogglePermission || onRemoveUser) && !isAdminUser && (
                            <div style={{position: 'relative'}}>
                                <button
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#a0a9b8',
                                        cursor: 'pointer',
                                        padding: '2px 6px',
                                        fontSize: 16,
                                        transition: 'color 0.2s',
                                        borderRadius: 4,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) => e.target.style.color = '#e6e6e6'}
                                    onMouseLeave={(e) => e.target.style.color = '#a0a9b8'}
                                    onClick={(e) => { e.stopPropagation(); setShowAdminMenu(!showAdminMenu); }}
                                    title="Options"
                                >
                                    ⋮
                                </button>
                                {showAdminMenu && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        background: '#282a36',
                                        border: '1px solid #3a3e52',
                                        borderRadius: 6,
                                        marginTop: 2,
                                        minWidth: 180,
                                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.6)',
                                        zIndex: 1000,
                                        overflow: 'hidden'
                                    }}>
                                        {onTogglePermission && (
                                            <button
                                                style={{
                                                    display: 'block',
                                                    width: '100%',
                                                    padding: '10px 14px',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#e6e6e6',
                                                    textAlign: 'left',
                                                    cursor: 'pointer',
                                                    fontSize: 13,
                                                    transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={(e) => e.target.style.background = '#3a3e52'}
                                                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                onClick={(e) => { e.stopPropagation(); handleTogglePermission(); }}
                                            >
                                                {canEdit ? '🚫 Block' : '✓ Allow'} editing
                                            </button>
                                        )}
                                        {onRemoveUser && !isAdminUser && (
                                            <>
                                                {onTogglePermission && <div style={{height: 1, background: '#2d2f3b'}}></div>}
                                                <button
                                                    style={{
                                                        display: 'block',
                                                        width: '100%',
                                                        padding: '10px 14px',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: '#e74c3c',
                                                        textAlign: 'left',
                                                        cursor: 'pointer',
                                                        fontSize: 13,
                                                        transition: 'background 0.15s'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = '#3a2525'}
                                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                    onClick={(e) => { e.stopPropagation(); setShowAdminMenu(false); setShowConfirmRemove(true); }}
                                                >
                                                    ✕ Remove user
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {showConfirmRemove && (
              <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 9999
              }} onClick={() => setShowConfirmRemove(false)}>
                <div style={{
                  background: '#282a36',
                  border: '1px solid #3a3e52',
                  borderRadius: 8,
                  padding: 24,
                  minWidth: 300,
                  color: '#e6e6e6',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)'
                }} onClick={(e) => e.stopPropagation()}>
                  <h3 style={{margin: '0 0 12px', fontSize: 16, fontWeight: 600}}>Remove user?</h3>
                  <p style={{margin: '0 0 20px', fontSize: 14, color: '#a0a9b8'}}>Are you sure you want to remove <strong style={{color: '#e6e6e6'}}>{username}</strong> from the room?</p>
                  <div style={{display: 'flex', gap: 10, justifyContent: 'flex-end'}}>
                    <button
                      className="btn"
                      style={{padding: '8px 16px', fontSize: 13, background: '#2d2f3b', color: '#e6e6e6'}}
                      onClick={() => setShowConfirmRemove(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn"
                      style={{padding: '8px 16px', fontSize: 13, background: '#e74c3c', color: '#fff', fontWeight: 600}}
                      onClick={(e) => { e.stopPropagation(); handleRemoveConfirm(); }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
    );
};

export default Client;
