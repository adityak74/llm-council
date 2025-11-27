import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/Dialog';
import { useToast } from './ui/Toast';
import { api } from '../api';
import './SettingsDialog.css';

function SettingsDialog({ isOpen, onClose }) {
    const [ollamaUrl, setOllamaUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const { toast, ToastComponent } = useToast();

    useEffect(() => {
        if (isOpen) {
            loadSettings();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const config = await api.getSettings();
            setOllamaUrl(config.ollama_base_url);
        } catch (error) {
            console.error('Failed to load settings:', error);
            toast({
                title: "Error",
                description: "Failed to load settings.",
                type: "error"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.updateSettings({ ollama_base_url: ollamaUrl });
            toast({
                title: "Success",
                description: "Settings saved successfully.",
                type: "success"
            });
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast({
                title: "Error",
                description: "Failed to save settings.",
                type: "error"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent title="Settings">
                {isLoading ? (
                    <p>Loading...</p>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="ollama-url">Ollama Base URL</label>
                            <input
                                id="ollama-url"
                                type="text"
                                value={settings.ollama_base_url || ''}
                                onChange={(e) => setSettings({ ...settings, ollama_base_url: e.target.value })}
                                placeholder="http://localhost:11434/api/chat"
                            />
                            <p className="help-text">
                                URL for your local Ollama instance. Ensure Ollama is running with <code>OLLAMA_ORIGINS="*"</code>.
                            </p>
                        </div>

                        <div className="form-group">
                            <label htmlFor="openrouter-key">OpenRouter API Key</label>
                            <input
                                id="openrouter-key"
                                type="password"
                                value={settings.openrouter_api_key || ''}
                                onChange={(e) => setSettings({ ...settings, openrouter_api_key: e.target.value })}
                                placeholder="sk-or-..."
                            />
                            <p className="help-text">
                                Optional. Override the default API key for OpenRouter models.
                            </p>
                        </div>
                        <div className="dialog-actions">
                            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                            <button type="submit" className="save-btn" disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                )}
                {ToastComponent}
            </DialogContent>
        </Dialog>
    );
}

export default SettingsDialog;
