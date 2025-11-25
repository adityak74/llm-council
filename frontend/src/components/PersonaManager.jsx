import { useState, useEffect } from 'react';
import { api } from '../api';
import './PersonaManager.css';

function PersonaManager({ onClose }) {
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

    const handleProviderChange = (e) => {
        const newProvider = e.target.value;
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
        if (!confirm('Are you sure you want to delete this persona?')) return;
        try {
            await api.deletePersona(id);
            loadData();
        } catch (error) {
            console.error('Failed to delete persona:', error);
        }
    };

    return (
        <div className="persona-manager-overlay">
            <div className="persona-manager-modal">
                <div className="modal-header">
                    <h2>Manage Personas</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

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
                                            <div className="persona-avatar" style={{ backgroundColor: p.avatar_color }}>
                                                {p.name[0]}
                                            </div>
                                            <div>
                                                <strong>{p.name}</strong>
                                                <span className="model-badge">{p.model_id}</span>
                                            </div>
                                        </div>
                                        <button className="delete-btn" onClick={() => handleDelete(p.id)}>Delete</button>
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
                                <select
                                    value={selectedProvider}
                                    onChange={handleProviderChange}
                                >
                                    {providers.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Model</label>
                                <select
                                    value={modelId}
                                    onChange={(e) => setModelId(e.target.value)}
                                >
                                    {availableModels.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.name}
                                        </option>
                                    ))}
                                </select>
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
            </div>
        </div>
    );
}

export default PersonaManager;
