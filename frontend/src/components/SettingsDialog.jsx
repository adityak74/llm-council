import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/Dialog';
import { useToast } from './ui/Toast';
import { api } from '../api';
import './SettingsDialog.css';
import { Input } from './ui/Input';

function SettingsDialog({ isOpen, onClose, isEmbedded = false }) {
    const [ollamaUrl, setOllamaUrl] = useState('');
    const [openrouterApiKey, setOpenrouterApiKey] = useState('');
    const [userApiKey, setUserApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const { toast, ToastComponent } = useToast();

    useEffect(() => {
        if (isOpen || isEmbedded) {
            loadSettings();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, isEmbedded]);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const config = await api.getSettings();
            setOllamaUrl(config.ollama_base_url || '');
            setOpenrouterApiKey(config.openrouter_api_key || '');
            setUserApiKey(config.user_api_key || '');
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
            await api.updateSettings({
                ollama_base_url: ollamaUrl,
                openrouter_api_key: openrouterApiKey,
                user_api_key: userApiKey
            });
            toast({
                title: "Success",
                description: "Settings saved successfully.",
                type: "success"
            });
            if (!isEmbedded) {
                setTimeout(() => {
                    onClose();
                }, 1000);
            }
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

    const content = (
        <div className={isEmbedded ? "settings-embedded" : "settings-modal"}>
            {!isEmbedded && <h2>Settings</h2>}
            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="user-api-key">User API Key</label>
                        <Input
                            id="user-api-key"
                            type="password"
                            value={userApiKey}
                            onChange={(e) => setUserApiKey(e.target.value)}
                            placeholder="sk-..."
                        />
                        <p className="help-text">
                            Your personal API Key (e.g. OpenAI).
                        </p>
                    </div>

                    <div className="form-group">
                        <label htmlFor="openrouter-key">OpenRouter API Key</label>
                        <Input
                            id="openrouter-key"
                            type="password"
                            value={openrouterApiKey}
                            onChange={(e) => setOpenrouterApiKey(e.target.value)}
                            placeholder="sk-or-..."
                        />
                        <p className="help-text">
                            Optional. Override the default API key for OpenRouter models.
                        </p>
                    </div>

                    <div className="form-group">
                        <label htmlFor="ollama-url">Ollama Base URL</label>
                        <Input
                            id="ollama-url"
                            type="text"
                            value={ollamaUrl}
                            onChange={(e) => setOllamaUrl(e.target.value)}
                            placeholder="http://localhost:11434/api/chat"
                        />
                        <p className="help-text">
                            URL for your local Ollama instance. Ensure Ollama is running with <code>OLLAMA_ORIGINS="*"</code>.
                        </p>
                    </div>

                    <div className="dialog-actions">
                        {!isEmbedded && <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>}
                        <button type="submit" className="save-btn" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            )}
            {ToastComponent}
        </div>
    );

    if (isEmbedded) {
        return content;
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent title="Settings">
                {content}
            </DialogContent>
        </Dialog>
    );
}

export default SettingsDialog;
