import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/Dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/Select';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from './ui/AlertDialog';
import { Avatar, AvatarImage, AvatarFallback } from './ui/Avatar';
import { api } from '../api';
import './PersonaManager.css';

function PersonaManager({ isOpen, onClose }) {
    const [personas, setPersonas] = useState([]);
    const [models, setModels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form state
    const [name, setName] = useState('');
    const [selectedProvider, setSelectedProvider] = useState('');
    const [modelId, setModelId] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [avatarColor, setAvatarColor] = useState('#3b82f6');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [personasData, modelsData] = await Promise.all([
                api.listPersonas(),
                api.listModels()
            ]);
            setPersonas(personasData);
            setModels(modelsData);

            // Set initial provider if models exist
            if (modelsData.length > 0) {
                const firstProvider = modelsData[0].provider;
                setSelectedProvider(firstProvider);

                // Set initial model for that provider
                const providerModels = modelsData.filter(m => m.provider === firstProvider);
                if (providerModels.length > 0) {
                    setModelId(providerModels[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Get unique providers
    const providers = [...new Set(models.map(m => m.provider))];

    // Filter models by selected provider
    const availableModels = models.filter(m => m.provider === selectedProvider);

    const handleProviderChange = (newProvider) => {
        setSelectedProvider(newProvider);

        // Reset model to first available in new provider
        const newProviderModels = models.filter(m => m.provider === newProvider);
        if (newProviderModels.length > 0) {
            setModelId(newProviderModels[0].id);
        } else {
            setModelId('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.createPersona(name, modelId, systemPrompt, avatarColor);
            setName('');
            setSystemPrompt('');
            loadData(); // Reload list
        } catch (error) {
            console.error('Failed to create persona:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.deletePersona(id);
            loadData();
        } catch (error) {
            console.error('Failed to delete persona:', error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent title="Manage Personas" className="large-dialog">
                <div className="modal-content">
                    <div className="persona-list">
                        <h3>Existing Personas</h3>
                        {isLoading ? (
                            <p>Loading...</p>
                        ) : personas.length === 0 ? (
                            <p className="empty-state">No personas created yet.</p>
                        ) : (
                            <ul>
                                {personas.map(p => (
                                    <li key={p.id} className="persona-item">
                                        <div className="persona-info">
                                            <Avatar className="persona-avatar" style={{ backgroundColor: p.avatar_color }}>
                                                <AvatarFallback>{p.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <strong>{p.name}</strong>
                                                <span className="model-badge">{p.model_id}</span>
                                            </div>
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <button className="delete-btn">Delete</button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Persona</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to delete "{p.name}"? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(p.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="create-persona-form">
                        <h3>Create New Persona</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="e.g. Grumpy Critic"
                                />
                            </div>

                            <div className="form-group">
                                <label>Provider</label>
                                <Select value={selectedProvider} onValueChange={handleProviderChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Provider" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {providers.map(p => (
                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="form-group">
                                <label>Model</label>
                                <Select value={modelId} onValueChange={setModelId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableModels.map(m => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="form-group">
                                <label>System Prompt</label>
                                <textarea
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    required
                                    placeholder="You are a helpful assistant..."
                                    rows={4}
                                />
                            </div>

                            <div className="form-group">
                                <label>Avatar Color</label>
                                <input
                                    type="color"
                                    value={avatarColor}
                                    onChange={(e) => setAvatarColor(e.target.value)}
                                />
                            </div>

                            <button type="submit" className="create-btn">Create Persona</button>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default PersonaManager;
