import React from 'react';
import { render, screen, fireEvent, prettyDOM, logRoles } from '@testing-library/react';
import '@testing-library/jest-dom';
import TextToExpensesTable from './index'; // Adjust the import path as necessary

describe('TextToExpensesTable', () => {
    it('should render the correct number of rows after pasting', () => {
        render(<TextToExpensesTable />);

        const input = screen.getByTestId('pasteable-expenses-table'); // Adjust the selector as necessary
        fireEvent.paste(input, {
            clipboardData: {
                getData: () => 'APPLE.COM/BILL	28/01/25	3361	foo	69.90 ₪	',
            },
        });

        const rows = screen.getAllByRole('row');
        expect(rows).toHaveLength(3); // 1 for headers, 1 for data, 1 for footer
    });

    it('should not paste duplicate rows', () => {
        const expenses = [
            { id: 1, name: 'APPLE.COM/BILL', amount: 69.90, account: '3361', date: '28/01/25' },
            { id: 2, name: 'Expense 2', amount: 200, account: 'Account 2', date: '2023-01-02' },
        ];

        render(<TextToExpensesTable expenses={expenses} />);

        const input = screen.getByTestId('pasteable-expenses-table'); // Adjust the selector as necessary
        fireEvent.paste(input, {
            clipboardData: {
                getData: () => `
                APPLE.COM/BILL	28/01/25	3361	foo	69.90 ₪	
                APPLE.COM/BILL	28/01/25	3361	foo	31.90 ₪
                APPLE.COM/BILL	28/01/25	3361	foo	31.90 ₪	
                APPLE.COM/BILL	28/01/25	3361	foo	31.90 ₪	`,
            },
        });

        const rows = screen.getAllByRole('row');
        expect(rows).toHaveLength(5); // 1 for headers, 3 for data, 1 for footer
    });

    it("Should sum the amounts correctly", () => {
        const expenses = [
            { id: 1, name: 'APPLE.COM/BILL', amount: 10, account: '3361', date: '28/01/25' },
            { id: 2, name: 'Expense 2', amount: 200, account: 'Account 2', date: '2023-01-02' },
        ];

        render(<TextToExpensesTable expenses={expenses} />);

        const currencyAmounts = screen.getAllByTestId('currency-amount');
        expect(currencyAmounts).not.toHaveLength(0);
        const lastCurrencyAmount = currencyAmounts[currencyAmounts.length - 1];
        expect(lastCurrencyAmount).toHaveTextContent('‏210 ‏₪');

        const input = screen.getByTestId('pasteable-expenses-table'); // Adjust the selector as necessary
        fireEvent.paste(input, {
            clipboardData: {
                getData: () => `
                APPLE.COM/BILL2	28/01/25	3361	foo	20 ₪`,
            },
        });

        const currencyAmounts2 = screen.getAllByTestId('currency-amount');
        expect(currencyAmounts2).not.toHaveLength(0);
        const lastCurrencyAmount2 = currencyAmounts2[currencyAmounts2.length - 1];
        expect(lastCurrencyAmount2).toHaveTextContent('‏230 ‏₪');
    });
}); 