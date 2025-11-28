import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/Dialog';
import SettingsDialog from './SettingsDialog';
import PersonaManager from './PersonaManager';
import './SettingsPage.css';

export default function SettingsPage({ isOpen, onClose, initialTab = 'general' }) {
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="settings-page-dialog" showClose={true}>
                <div className="settings-page-container">
                    <div className="settings-sidebar">
                        <h2>Settings</h2>
                        <nav>
                            <button
                                className={`nav-item ${activeTab === 'general' ? 'active' : ''}`}
                                onClick={() => setActiveTab('general')}
                            >
                                General
                            </button>
                            <button
                                className={`nav-item ${activeTab === 'personas' ? 'active' : ''}`}
                                onClick={() => setActiveTab('personas')}
                            >
                                Personas
                            </button>
                        </nav>
                    </div>
                    <div className="settings-content">
                        {activeTab === 'general' && <SettingsDialog isEmbedded={true} />}
                        {activeTab === 'personas' && <PersonaManager isEmbedded={true} />}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
