import { useState, useEffect } from "react";
import { parseTextToRows } from "@/utils";

export default function usePasteToRows(expenses = [], pasteFilterLogic = () => { }) {
    const [rows, setRows] = useState([]);

    useEffect(() => {
        const handlePaste = (event) => {
            const pastedData = event.clipboardData.getData('Text');
            const parsedRows = parseTextToRows(pastedData);
            setRows([
                ...expenses,
                ...parsedRows.filter(pasteFilterLogic)
            ]);
        };

        document.addEventListener('paste', handlePaste);

        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [expenses, pasteFilterLogic]);

    return [rows];
}