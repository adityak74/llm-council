import { useState, useEffect } from 'react';
import { api } from '../api';
import './SettingsDialog.css';

function SettingsDialog({ onClose }) {
    const [settings, setSettings] = useState({ ollama_base_url: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await api.getSettings();
            setSettings(data);
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.updateSettings(settings);
            onClose();
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="settings-overlay">
            <div className="settings-modal">
                <div className="modal-header">
                    <h2>Settings</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-content">
                    {isLoading ? (
                        <p>Loading...</p>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Ollama Base URL</label>
                                <input
                                    type="text"
                                    value={settings.ollama_base_url}
                                    onChange={(e) => setSettings({ ...settings, ollama_base_url: e.target.value })}
                                    required
                                    placeholder="http://localhost:11434/api/chat"
                                />
                                <p className="help-text">
                                    URL for the Ollama API chat endpoint. Use a remote IP if running Ollama on another machine.
                                </p>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                                <button type="submit" className="save-btn" disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SettingsDialog;
