import { useEffect } from 'react';

/**
 * Hook para atalhos de teclado
 * @param {Object} shortcuts - Objeto com teclas e callbacks
 * Exemplo: { 'ctrl+n': () => console.log('Nova escritura') }
 */
export function useKeyboardShortcuts(shortcuts) {
    useEffect(() => {
        function handleKeyDown(event) {
            const key = [];

            if (event.ctrlKey) key.push('ctrl');
            if (event.altKey) key.push('alt');
            if (event.shiftKey) key.push('shift');
            key.push(event.key.toLowerCase());

            const combination = key.join('+');

            if (shortcuts[combination]) {
                event.preventDefault();
                shortcuts[combination]();
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
}

export default useKeyboardShortcuts;
