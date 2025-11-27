import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/Dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/Select';
import { ScrollArea } from './ui/ScrollArea';
import { useToast } from './ui/Toast';
import { api } from '../api';
import './NewConversationDialog.css';

function NewConversationDialog({
    isOpen,
    onClose,
    onStart,
    confirmText = "Start Conversation",
    initialSelectedMembers = [],
    initialSelectedChairman = '',
    initialConversationType = 'standard'
}) {
    const [personas, setPersonas] = useState([]);
    const [models, setModels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Selection state
    const [selectedMembers, setSelectedMembers] = useState(initialSelectedMembers);
    const [selectedChairman, setSelectedChairman] = useState(initialSelectedChairman);
    const [conversationType, setConversationType] = useState(initialConversationType);

    const { toast, ToastComponent } = useToast();

    useEffect(() => {
        if (isOpen) {
            loadData();
            // Reset to initial values when opened
            if (initialSelectedMembers.length > 0) setSelectedMembers(initialSelectedMembers);
            if (initialSelectedChairman) setSelectedChairman(initialSelectedChairman);
            if (initialConversationType) setConversationType(initialConversationType);
        }
    }, [isOpen, initialSelectedMembers, initialSelectedChairman, initialConversationType]);

    // Update chairman when selected members change
    useEffect(() => {
        if (selectedMembers.length > 0) {
            // If current chairman is no longer in the list, select the first member
            // But only if we have loaded data (to avoid premature switching)
            if (selectedChairman && !selectedMembers.includes(selectedChairman)) {
                setSelectedChairman(selectedMembers[0]);
            } else if (!selectedChairman) {
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

            // Default selection only if no initial selection provided
            if (initialSelectedMembers.length === 0) {
                const defaults = modelsData.slice(0, 3).map(m => m.id);
                setSelectedMembers(defaults);
                if (defaults.length > 0) {
                    setSelectedChairman(defaults[0]);
                }
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStart = () => {
        if (selectedMembers.length === 0) {
            toast({
                title: "Selection Required",
                description: "Please select at least one council member.",
                type: "error"
            });
            return;
        }
        if (!selectedChairman) {
            toast({
                title: "Selection Required",
                description: "Please select a Chairman.",
                type: "error"
            });
            return;
        }
        onStart(selectedMembers, selectedChairman, conversationType);
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

    // Combine models and personas for display
    const allOptions = [
        ...personas.map(p => ({ ...p, type: 'persona', label: p.name, sub: p.model_id })),
        ...models.map(m => ({ ...m, type: 'model', label: m.name, sub: m.provider }))
    ];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent title="Start New Council" className="large-dialog">
                <ScrollArea className="modal-content-scroll">
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
                                <Select value={selectedChairman} onValueChange={setSelectedChairman}>
                                    <SelectTrigger className="chairman-select">
                                        <SelectValue placeholder="Select a Chairman" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allOptions.filter(opt => selectedMembers.includes(opt.id)).map(opt => (
                                            <SelectItem key={opt.id} value={opt.id}>
                                                {opt.label} ({opt.type === 'persona' ? 'Persona' : 'Model'})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                </ScrollArea>

                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="start-btn" onClick={handleStart} disabled={isLoading}>
                        {confirmText}
                    </button>
                </div>
                {ToastComponent}
            </DialogContent>
        </Dialog>
    );
}

export default NewConversationDialog;
