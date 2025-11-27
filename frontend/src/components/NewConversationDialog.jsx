import { useState, useEffect } from 'react';
import { api } from '../api';
import './NewConversationDialog.css';

function NewConversationDialog({ onClose, onStart }) {
    const [personas, setPersonas] = useState([]);
    const [models, setModels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Selection state
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [selectedChairman, setSelectedChairman] = useState('');
    const [conversationType, setConversationType] = useState('standard');

    useEffect(() => {
        loadData();
    }, []);

    // Update chairman when selected members change
    useEffect(() => {
        if (selectedMembers.length > 0) {
            // If current chairman is no longer in the list, select the first member
            if (!selectedMembers.includes(selectedChairman)) {
                setSelectedChairman(selectedMembers[0]);
            }
        } else {
            setSelectedChairman('');
        }
    }, [selectedMembers, selectedChairman]);

    const loadData = async () => {
        try {
            const [personasData, modelsData] = await Promise.all([
                api.listPersonas(),
                api.listModels()
            ]);
            setPersonas(personasData);
            setModels(modelsData);

            // Default selection: Select first 3 models if available
            const defaults = modelsData.slice(0, 3).map(m => m.id);
            setSelectedMembers(defaults);

            if (defaults.length > 0) {
                setSelectedChairman(defaults[0]);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleMember = (id) => {
        setSelectedMembers(prev => {
            if (prev.includes(id)) {
                return prev.filter(m => m !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleStart = () => {
        if (selectedMembers.length === 0) {
            alert('Please select at least one council member.');
            return;
        }
        if (!selectedChairman) {
            alert('Please select a Chairman.');
            return;
        }
        onStart(selectedMembers, selectedChairman, conversationType);
    };

    // Combine models and personas for display
    const allOptions = [
        ...personas.map(p => ({ ...p, type: 'persona', label: p.name, sub: p.model_id })),
        ...models.map(m => ({ ...m, type: 'model', label: m.name, sub: m.provider }))
    ];

    return (
        <div className="new-chat-overlay">
            <div className="new-chat-modal">
                <div className="modal-header">
                    <h2>Start New Council</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-content-scroll">
                    {isLoading ? (
                        <p>Loading...</p>
                    ) : (
                        <>
                            <div className="section">
                                <h3>1. Select Council Members</h3>
                                <p className="subtitle">Choose who will participate in the debate.</p>
                                <div className="options-grid">
                                    {allOptions.map(opt => (
                                        <div
                                            key={opt.id}
                                            className={`option-card ${selectedMembers.includes(opt.id) ? 'selected' : ''}`}
                                            onClick={() => handleToggleMember(opt.id)}
                                        >
                                            <div className="option-header">
                                                <span className="option-name">{opt.label}</span>
                                                {opt.type === 'persona' && <span className="tag persona">Persona</span>}
                                            </div>
                                            <span className="option-sub">{opt.sub}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="section">
                                <h3>2. Select Chairman</h3>
                                <p className="subtitle">Choose who will synthesize the final answer.</p>
                                <select
                                    value={selectedChairman}
                                    onChange={(e) => setSelectedChairman(e.target.value)}
                                    className="chairman-select"
                                >
                                    <option value="" disabled>Select a Chairman</option>
                                    {allOptions.filter(opt => selectedMembers.includes(opt.id)).map(opt => (
                                        <option key={opt.id} value={opt.id}>
                                            {opt.label} ({opt.type === 'persona' ? 'Persona' : 'Model'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="section">
                                <h3>3. Conversation Type</h3>
                                <div className="options-grid">
                                    <div
                                        className={`option-card ${conversationType === 'standard' ? 'selected' : ''}`}
                                        onClick={() => setConversationType('standard')}
                                    >
                                        <div className="option-header">
                                            <span className="option-name">Standard Council</span>
                                        </div>
                                        <span className="option-sub">Single round of debate and synthesis.</span>
                                    </div>
                                    <div
                                        className={`option-card ${conversationType === 'agentic' ? 'selected' : ''}`}
                                        onClick={() => setConversationType('agentic')}
                                    >
                                        <div className="option-header">
                                            <span className="option-name">Agentic Council</span>
                                            <span className="tag persona">New</span>
                                        </div>
                                        <span className="option-sub">Multi-round debate with eviction and follow-ups.</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="start-btn" onClick={handleStart} disabled={isLoading}>
                        Start Conversation
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NewConversationDialog;
