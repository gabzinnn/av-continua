'use client';

import {
    useState,
    useRef,
    useCallback,
    useEffect,
    type CSSProperties,
} from 'react';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Link as LinkIcon,
    Unlink,
    RemoveFormatting,
    Palette,
    Highlighter,
    Quote,
    Code,
    Minus,
    Undo,
    Redo,
    Plus,
    Check,
    Sigma,
} from 'lucide-react';
import EquationModal from './EquationModal';
import 'katex/dist/katex.min.css';

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: number;
    maxHeight?: number;
    label?: string;
    helperText?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Inline Style Definitions (portable HTML output)
   ═══════════════════════════════════════════════════════════════════════════ */

const INLINE_STYLES: Record<string, Record<string, string>> = {
    BLOCKQUOTE: {
        borderLeft: '4px solid #0cc3e4',
        padding: '8px 16px',
        fontStyle: 'italic',
        color: '#6b7280',
        margin: '12px 0',
        backgroundColor: '#f9fafb',
        borderRadius: '0 8px 8px 0',
    },
    H1: {
        fontSize: '1.5rem',
        fontWeight: '700',
        marginBottom: '12px',
        color: '#1f2937',
    },
    H2: {
        fontSize: '1.25rem',
        fontWeight: '700',
        marginBottom: '8px',
        color: '#1f2937',
    },
    H3: {
        fontSize: '1.125rem',
        fontWeight: '700',
        marginBottom: '8px',
        color: '#1f2937',
    },
    PRE: {
        backgroundColor: '#111827',
        color: '#4ade80',
        padding: '16px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        margin: '12px 0',
        overflowX: 'auto',
    },
    UL: {
        listStyleType: 'disc',
        marginLeft: '24px',
        marginBottom: '8px',
    },
    OL: {
        listStyleType: 'decimal',
        marginLeft: '24px',
        marginBottom: '8px',
    },
    LI: {
        marginBottom: '4px',
    },
    HR: {
        borderColor: '#e5e7eb',
        margin: '16px 0',
    },
};

/** Convert a camelCase style object to a CSS string */
function stylesToCssText(styles: Record<string, string>): string {
    return Object.entries(styles)
        .map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v}`)
        .join('; ');
}

/**
 * Process raw editor HTML to embed inline styles on known block elements.
 * User-applied inline styles (foreColor, hiliteColor) on other elements are preserved.
 */
function processHtmlForOutput(html: string): string {
    if (!html || typeof window === 'undefined') return html;
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        for (const [tag, styles] of Object.entries(INLINE_STYLES)) {
            doc.body.querySelectorAll(tag).forEach(el => {
                const htmlEl = el as HTMLElement;
                // Preserve user-applied styles (like foreColor) by merging
                const existing = htmlEl.style.cssText || '';
                const base = stylesToCssText(styles);
                // Build merged: our base styles + any existing user styles not in our base
                htmlEl.setAttribute('style', base + (existing ? '; ' + existing : ''));
            });
        }

        // Links: preserve href, add styling
        doc.body.querySelectorAll('a').forEach(el => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.color = '#0cc3e4';
            htmlEl.style.textDecoration = 'underline';
        });

        return doc.body.innerHTML;
    } catch {
        return html;
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Color Presets
   ═══════════════════════════════════════════════════════════════════════════ */

const TEXT_COLORS = [
    '#101718', '#dddddd', '#ef4444', '#f97316', '#fad419',
    '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

const HIGHLIGHT_COLORS = [
    'transparent', '#fef3c7', '#fce7f3', '#dbeafe',
    '#dcfce7', '#f3e8ff', '#ffedd5', '#e0f2fe',
    '#fef9c3', '#ede9fe',
];

/* ═══════════════════════════════════════════════════════════════════════════
   Toolbar Button
   ═══════════════════════════════════════════════════════════════════════════ */

interface ToolbarBtnProps {
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
}

function ToolbarBtn({ icon, title, onClick, active, disabled }: ToolbarBtnProps) {
    return (
        <button
            type="button"
            title={title}
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            disabled={disabled}
            className={`p-1.5 rounded-md transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${active
                ? 'bg-primary/20 text-primary ring-1 ring-primary/30'
                : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                }`}
        >
            {icon}
        </button>
    );
}

function ToolbarSep() {
    return <div className="w-px h-6 bg-border-light mx-0.5 shrink-0" />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Color Picker Dropdown
   ═══════════════════════════════════════════════════════════════════════════ */

interface ColorDropdownProps {
    colors: string[];
    onSelect: (color: string) => void;
    onClose: () => void;
    title: string;
    storageKey: string;
}

function ColorDropdown({ colors, onSelect, onClose, title, storageKey }: ColorDropdownProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [customColors, setCustomColors] = useState<string[]>([]);
    const [tempColor, setTempColor] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                setCustomColors(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse custom colors', e);
            }
        }
    }, [storageKey]);

    const addCustomColor = (color: string) => {
        if (!color || customColors.includes(color)) return;
        const newColors = [...customColors, color];
        setCustomColors(newColors);
        localStorage.setItem(storageKey, JSON.stringify(newColors));
    };

    const removeCustomColor = (colorToRemove: string) => {
        const newColors = customColors.filter(c => c !== colorToRemove);
        setCustomColors(newColors);
        localStorage.setItem(storageKey, JSON.stringify(newColors));
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    return (
        <div
            ref={ref}
            className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-border-ui p-3 z-50 animate-in fade-in zoom-in-95 duration-150 min-w-[200px] max-h-64 overflow-y-auto"
        >
            <div className="flex flex-col gap-3">
                {/* Cabeçalho */}
                <div className="px-1">
                    <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                        {title}
                    </p>
                </div>

                {/* Grid de Presets */}
                <div className="grid grid-cols-5 gap-1.5">
                    {colors.map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => { onSelect(color); onClose(); }}
                            className="w-8 h-8 rounded-lg border border-border-ui hover:scale-110 hover:shadow-sm transition-all cursor-pointer relative group"
                            style={{
                                backgroundColor: color === 'transparent' ? '#fff' : color,
                                backgroundImage: color === 'transparent'
                                    ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                                    : undefined,
                                backgroundSize: '8px 8px',
                                backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                            }}
                            title={color === 'transparent' ? 'Sem cor' : color}
                        />
                    ))}
                </div>

                {/* Cores Personalizadas */}
                {customColors.length > 0 && (
                    <>
                        <div className="h-px bg-border-ui w-full" />
                        <div className="px-1">
                            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                                Minhas Cores
                            </p>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                            {customColors.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => { onSelect(color); onClose(); }}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        removeCustomColor(color);
                                    }}
                                    className="w-8 h-8 rounded-lg border border-border-ui hover:scale-110 hover:shadow-sm transition-all cursor-pointer relative group"
                                    style={{ backgroundColor: color }}
                                    title={`${color} (Clique direito para remover)`}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Divisor */}
                <div className="h-px bg-border-ui w-full" />

                {/* Cor Personalizada input */}
                {/* Cor Personalizada input */}
                <div className="flex items-center gap-2 p-1 rounded-lg hover:bg-bg-secondary transition-colors relative">
                    <div className="relative group">
                        <label className="cursor-pointer block relative">
                            <div
                                className="w-8 h-8 rounded-lg border border-border-ui flex items-center justify-center transition-transform group-hover:scale-105"
                                style={{
                                    background: tempColor ? tempColor : 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)'
                                }}
                            >
                                {!tempColor && <Plus size={16} className="text-white drop-shadow-md" strokeWidth={3} />}
                            </div>
                            <input
                                type="color"
                                className="sr-only"
                                value={tempColor || '#000000'}
                                onChange={(e) => {
                                    const newColor = e.target.value;
                                    setTempColor(newColor);
                                    onSelect(newColor);
                                }}
                            />
                        </label>

                        {/* Botão de salvar (Badge overlay) */}
                        {tempColor && !customColors.includes(tempColor) && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    addCustomColor(tempColor);
                                    setTempColor(null);
                                }}
                                className="absolute -top-1.5 -right-1.5 bg-green-500 text-white p-0.5 rounded-full shadow-md hover:scale-110 transition-transform z-10 border border-white flex items-center justify-center cursor-pointer"
                                title="Salvar"
                                style={{ width: 18, height: 18 }}
                            >
                                <Check size={10} strokeWidth={4} />
                            </button>
                        )}
                    </div>

                    <span className="text-xs text-text-secondary font-medium truncate flex-1 cursor-default">
                        {tempColor || "Nova cor..."}
                    </span>
                </div>
            </div>


        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Rich Text Editor
   ═══════════════════════════════════════════════════════════════════════════ */

export default function RichTextEditor({
    value,
    onChange,
    placeholder = 'Comece a escrever...',
    minHeight = 200,
    maxHeight = 600,
    label,
    helperText,
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [showTextColor, setShowTextColor] = useState(false);
    const [showHighlight, setShowHighlight] = useState(false);
    const [showEquationModal, setShowEquationModal] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isEmpty, setIsEmpty] = useState(!value || value === '<br>' || value === '<p><br></p>');

    // Active states
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        strikeThrough: false,
        unorderedList: false,
        orderedList: false,
        justifyLeft: false,
        justifyCenter: false,
        justifyRight: false,
        h1: false,
        h2: false,
        h3: false,
        blockquote: false,
        pre: false,
        foreColor: '#000000',
        hiliteColor: 'transparent',
    });

    const savedSelectionRef = useRef<Range | null>(null);
    /** Tracks the last HTML we emitted via onChange so we can skip feedback loops */
    const lastEmittedRef = useRef<string>('');

    // Update active states based on selection
    const updateActiveStates = useCallback(() => {
        if (typeof document === 'undefined') return;

        setActiveFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikeThrough: document.queryCommandState('strikeThrough'),
            unorderedList: document.queryCommandState('insertUnorderedList'),
            orderedList: document.queryCommandState('insertOrderedList'),
            justifyLeft: document.queryCommandState('justifyLeft'),
            justifyCenter: document.queryCommandState('justifyCenter'),
            justifyRight: document.queryCommandState('justifyRight'),
            // Block formats are trickier, checking parent tags for headings
            h1: document.queryCommandValue('formatBlock') === 'h1',
            h2: document.queryCommandValue('formatBlock') === 'h2',
            h3: document.queryCommandValue('formatBlock') === 'h3',
            blockquote: document.queryCommandValue('formatBlock') === 'blockquote',
            pre: document.queryCommandValue('formatBlock') === 'pre',
            foreColor: document.queryCommandValue('foreColor') || '#000000',
            hiliteColor: document.queryCommandValue('hiliteColor') || 'transparent',
        });
    }, []);

    // Selection change listener
    useEffect(() => {
        document.addEventListener('selectionchange', updateActiveStates);
        return () => document.removeEventListener('selectionchange', updateActiveStates);
    }, [updateActiveStates]);

    // ─── Sync external value into the editor ─────────────────────────────────
    useEffect(() => {
        if (!editorRef.current) return;
        // Only overwrite when the value truly changed externally (not from our own onChange)
        if (value !== lastEmittedRef.current) {
            editorRef.current.innerHTML = value || '';
            lastEmittedRef.current = value || '';
            setIsEmpty(!value || value === '<br>' || value === '<p><br></p>');
            updateActiveStates();
        }
    }, [value, updateActiveStates]);

    const saveSelection = useCallback(() => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
        }
    }, []);

    const restoreSelection = useCallback(() => {
        if (savedSelectionRef.current) {
            const sel = window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(savedSelectionRef.current);
            }
        }
    }, []);

    const exec = useCallback((command: string, value?: string) => {
        restoreSelection();
        document.execCommand(command, false, value);
        if (editorRef.current) {
            const processed = processHtmlForOutput(editorRef.current.innerHTML);
            lastEmittedRef.current = processed;
            onChange(processed);
            setIsEmpty(
                !editorRef.current.textContent?.trim() &&
                !editorRef.current.querySelector('img'),
            );
            updateActiveStates();
        }
        saveSelection();
    }, [onChange, restoreSelection, saveSelection, updateActiveStates]);

    const handleInput = useCallback(() => {
        if (editorRef.current) {
            const processed = processHtmlForOutput(editorRef.current.innerHTML);
            lastEmittedRef.current = processed;
            onChange(processed);
            setIsEmpty(
                !editorRef.current.textContent?.trim() &&
                !editorRef.current.querySelector('img'),
            );
            updateActiveStates();
        }
    }, [onChange, updateActiveStates]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b': e.preventDefault(); exec('bold'); break;
                    case 'i': e.preventDefault(); exec('italic'); break;
                    case 'u': e.preventDefault(); exec('underline'); break;
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) exec('redo');
                        else exec('undo');
                        break;
                }
                return;
            }

            // Enter inside blockquote/pre: always exit the block and continue as normal paragraph
            if (e.key === 'Enter' && !e.shiftKey) {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                    let node: Node | null = sel.anchorNode;
                    let blockEl: HTMLElement | null = null;

                    while (node && node !== editorRef.current) {
                        if (node instanceof HTMLElement && (node.tagName === 'BLOCKQUOTE' || node.tagName === 'PRE')) {
                            blockEl = node;
                            break;
                        }
                        node = node.parentNode;
                    }

                    if (blockEl) {
                        e.preventDefault();
                        // Insert a paragraph after the block element
                        const p = document.createElement('p');
                        p.innerHTML = '<br>';
                        blockEl.insertAdjacentElement('afterend', p);
                        // Move caret into the new paragraph
                        const range = document.createRange();
                        range.setStart(p, 0);
                        range.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(range);
                        handleInput();
                        return;
                    }
                }
            }
        },
        [exec, handleInput],
    );

    const handlePaste = useCallback(
        (e: React.ClipboardEvent) => {
            // Força colar como texto simples para sanitizar
            e.preventDefault();
            const html = e.clipboardData.getData('text/html');
            const text = e.clipboardData.getData('text/plain');

            if (html) {
                // Remove estilos inline perigosos mas mantém formatação
                const clean = html
                    .replace(/class="[^"]*"/gi, '')
                    .replace(/style="[^"]*"/gi, '')
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
                document.execCommand('insertHTML', false, clean);
            } else {
                document.execCommand('insertText', false, text);
            }
            handleInput();
        },
        [handleInput],
    );

    const insertLink = useCallback(() => {
        restoreSelection();
        const url = prompt('Cole a URL do link:');
        if (url) {
            exec('createLink', url);
        }
    }, [exec, restoreSelection]);

    const removeLink = useCallback(() => {
        exec('unlink');
    }, [exec]);

    /** Toggle a block format: if the cursor is already inside the same block type, revert to <p> */
    const toggleFormatBlock = useCallback(
        (tag: string) => {
            restoreSelection();
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                let node: Node | null = sel.anchorNode;
                const tagName = tag.replace(/[<>]/g, '').toUpperCase();
                while (node && node !== editorRef.current) {
                    if (node instanceof HTMLElement && node.tagName === tagName) {
                        // Already inside this block — revert to normal paragraph
                        exec('formatBlock', '<p>');
                        return;
                    }
                    node = node.parentNode;
                }
            }
            exec('formatBlock', tag);
        },
        [exec, restoreSelection],
    );

    const insertHR = useCallback(() => {
        exec('insertHorizontalRule');
    }, [exec]);

    const editorStyle: CSSProperties = {
        minHeight,
        maxHeight,
        overflowY: 'auto',
    };

    return (
        <div className="flex flex-col gap-2">
            {label && (
                <label className="text-sm text-text-primary font-medium font-lexend">
                    {label}
                </label>
            )}

            <div
                className={`border rounded-xl transition-all duration-200 ${isFocused
                    ? 'border-primary ring-4 ring-primary/20'
                    : 'border-border-ui'
                    }`}
            >
                {/* ─── Toolbar ─────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border-ui bg-bg-secondary/50 rounded-t-xl">
                    {/* Undo / Redo */}
                    <ToolbarBtn icon={<Undo size={16} />} title="Desfazer (Ctrl+Z)" onClick={() => exec('undo')} />
                    <ToolbarBtn icon={<Redo size={16} />} title="Refazer (Ctrl+Shift+Z)" onClick={() => exec('redo')} />

                    <ToolbarSep />

                    {/* Formatação básica */}
                    <ToolbarBtn icon={<Bold size={16} />} title="Negrito (Ctrl+B)" onClick={() => exec('bold')} active={activeFormats.bold} />
                    <ToolbarBtn icon={<Italic size={16} />} title="Itálico (Ctrl+I)" onClick={() => exec('italic')} active={activeFormats.italic} />
                    <ToolbarBtn icon={<Underline size={16} />} title="Sublinhado (Ctrl+U)" onClick={() => exec('underline')} active={activeFormats.underline} />
                    <ToolbarBtn icon={<Strikethrough size={16} />} title="Tachado" onClick={() => exec('strikeThrough')} active={activeFormats.strikeThrough} />

                    <ToolbarSep />

                    {/* Cores */}
                    <div className="relative">
                        <ToolbarBtn
                            icon={
                                <div className="flex flex-col items-center">
                                    <Palette size={16} />
                                    <div className="w-full h-1 mt-0.5 rounded-full" style={{ backgroundColor: activeFormats.foreColor }} />
                                </div>
                            }
                            title="Cor do texto"
                            onClick={() => { saveSelection(); setShowTextColor((v) => !v); setShowHighlight(false); }}
                        />
                        {showTextColor && (
                            <ColorDropdown
                                colors={TEXT_COLORS}
                                title="Cor do texto"
                                storageKey="ert_text_colors"
                                onSelect={(c) => exec('foreColor', c)}
                                onClose={() => setShowTextColor(false)}
                            />
                        )}
                    </div>
                    <div className="relative">
                        <ToolbarBtn
                            icon={
                                <div className="flex flex-col items-center">
                                    <Highlighter size={16} />
                                    <div className="w-full h-1 mt-0.5 rounded-full" style={{ backgroundColor: activeFormats.hiliteColor === 'transparent' ? '#f3f4f6' : activeFormats.hiliteColor }} />
                                </div>
                            }
                            title="Cor de destaque"
                            onClick={() => { saveSelection(); setShowHighlight((v) => !v); setShowTextColor(false); }}
                        />
                        {showHighlight && (
                            <ColorDropdown
                                colors={HIGHLIGHT_COLORS}
                                title="Destaque"
                                storageKey="ert_highlight_colors"
                                onSelect={(c) => exec('hiliteColor', c === 'transparent' ? 'transparent' : c)}
                                onClose={() => setShowHighlight(false)}
                            />
                        )}
                    </div>

                    <ToolbarSep />

                    {/* Headings */}
                    <ToolbarBtn icon={<Heading1 size={16} />} title="Título 1" onClick={() => toggleFormatBlock('<h1>')} active={activeFormats.h1} />
                    <ToolbarBtn icon={<Heading2 size={16} />} title="Título 2" onClick={() => toggleFormatBlock('<h2>')} active={activeFormats.h2} />
                    <ToolbarBtn icon={<Heading3 size={16} />} title="Título 3" onClick={() => toggleFormatBlock('<h3>')} active={activeFormats.h3} />

                    <ToolbarSep />

                    {/* Listas */}
                    <ToolbarBtn icon={<List size={16} />} title="Lista com marcadores" onClick={() => exec('insertUnorderedList')} active={activeFormats.unorderedList} />
                    <ToolbarBtn icon={<ListOrdered size={16} />} title="Lista numerada" onClick={() => exec('insertOrderedList')} active={activeFormats.orderedList} />

                    <ToolbarSep />

                    {/* Alinhamento */}
                    <ToolbarBtn icon={<AlignLeft size={16} />} title="Alinhar à esquerda" onClick={() => exec('justifyLeft')} active={activeFormats.justifyLeft} />
                    <ToolbarBtn icon={<AlignCenter size={16} />} title="Centralizar" onClick={() => exec('justifyCenter')} active={activeFormats.justifyCenter} />
                    <ToolbarBtn icon={<AlignRight size={16} />} title="Alinhar à direita" onClick={() => exec('justifyRight')} active={activeFormats.justifyRight} />

                    <ToolbarSep />

                    {/* Extras */}
                    <ToolbarBtn icon={<Quote size={16} />} title="Citação" onClick={() => toggleFormatBlock('<blockquote>')} active={activeFormats.blockquote} />
                    <ToolbarBtn icon={<Code size={16} />} title="Código" onClick={() => toggleFormatBlock('<pre>')} active={activeFormats.pre} />
                    <ToolbarBtn icon={<Sigma size={16} />} title="Inserir Equação" onClick={() => { saveSelection(); setShowEquationModal(true); }} />
                    <ToolbarBtn icon={<Minus size={16} />} title="Linha horizontal" onClick={insertHR} />

                    <ToolbarSep />

                    {/* Links */}
                    <ToolbarBtn icon={<LinkIcon size={16} />} title="Inserir link" onClick={insertLink} />
                    <ToolbarBtn icon={<Unlink size={16} />} title="Remover link" onClick={removeLink} />

                    <ToolbarSep />

                    {/* Limpar formatação */}
                    <ToolbarBtn
                        icon={<RemoveFormatting size={16} />}
                        title="Limpar formatação"
                        onClick={() => exec('removeFormat')}
                    />
                </div>

                {/* ─── Editor ──────────────────────────────────────────── */}
                <div className="relative">
                    {isEmpty && !isFocused && (
                        <div
                            className="absolute top-0 left-0 right-0 px-5 py-4 text-text-secondary/60 pointer-events-none text-base font-lexend"
                            style={{ minHeight }}
                        >
                            {placeholder}
                        </div>
                    )}

                    <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleInput}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        onFocus={() => { setIsFocused(true); }}
                        onBlur={() => { setIsFocused(false); saveSelection(); }}
                        onMouseUp={saveSelection}
                        onKeyUp={saveSelection}
                        className="px-5 py-4 text-base text-text-primary font-lexend focus:outline-none prose prose-sm max-w-none
                            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:text-text-primary
                            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:text-text-primary
                            [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:text-text-primary
                            [&_p]:mb-2
                            [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-2
                            [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-2
                            [&_li]:mb-1
                            [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-text-secondary [&_blockquote]:my-3
                            [&_pre]:bg-gray-900 [&_pre]:text-green-400 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-3 [&_pre]:overflow-x-auto
                            [&_a]:text-primary [&_a]:underline
                            [&_hr]:border-border-ui [&_hr]:my-4"
                        style={editorStyle}
                    />
                </div>
            </div>

            {helperText && (
                <p className="text-xs text-text-tertiary font-lexend">{helperText}</p>
            )}

            <EquationModal
                isOpen={showEquationModal}
                onClose={() => setShowEquationModal(false)}
                onInsert={(latex) => {
                    restoreSelection();
                    exec('insertHTML', latex + '&nbsp;');
                }}
            />
        </div>
    );
}
