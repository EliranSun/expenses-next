import { useState, useEffect } from "react";
import { parseTextToRows } from "@/utils";

export default function usePasteToRows(expenses = [], pasteFilterLogic = () => { }) {
    const [rows, setRows] = useState(expenses);

    useEffect(() => {
        const handlePaste = (event) => {
            const pastedData = event.clipboardData.getData('Text');
            const parsedRows = parseTextToRows(pastedData);

            setRows([
                ...expenses,
                ...parsedRows.filter(pasteFilterLogic).map(row => {
                    const splitDate = row.date.split("/");
                    const year = splitDate[2];
                    const month = splitDate[1];
                    const day = splitDate[0];

                    return {
                        ...row,
                        id: crypto.randomUUID(),
                        date: `20${year}-${month}-${day}`,
                        timestamp: new Date(`20${year}`, month - 1, day).getTime()
                    };
                })

            ]);
        };


        document.addEventListener('paste', handlePaste);

        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [expenses, pasteFilterLogic]);

    return [rows];
}