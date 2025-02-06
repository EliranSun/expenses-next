import { useEffect } from 'react';

export const useKeyboardControl = (tableRef) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            const { key } = event;
            const focusableElements = tableRef.current.querySelectorAll('input');
            const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);

            let nextIndex;
            switch (key) {
                case 'ArrowUp':
                    nextIndex = currentIndex - 1;
                    break;
                case 'ArrowDown':
                    nextIndex = currentIndex + 1;
                    break;
                case 'ArrowLeft':
                    nextIndex = currentIndex - 1;
                    break;
                case 'ArrowRight':
                    nextIndex = currentIndex + 1;
                    break;
                default:
                    return;
            }

            if (nextIndex >= 0 && nextIndex < focusableElements.length) {
                focusableElements[nextIndex].focus();
                event.preventDefault();
            }
        };

        const tableElement = tableRef.current;
        tableElement.addEventListener('keydown', handleKeyDown);

        return () => {
            tableElement.removeEventListener('keydown', handleKeyDown);
        };
    }, [tableRef]);
};