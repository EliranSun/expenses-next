import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams('account=private&month=09'),
    useRouter: () => ({ push: mockPush }),
    usePathname: () => '/',
}));

import { HomepageFilterControls } from './HomepageFilterControls';

const renderControls = (props = {}) => render(
    <HomepageFilterControls
        searchItems={[]}
        onSearch={jest.fn()}
        sortCriteria={['amount', 'desc']}
        setSortCriteria={jest.fn()}
        {...props}
    />
);

describe('HomepageFilterControls', () => {
    it('is labelled in Hebrew', () => {
        renderControls();

        expect(screen.getByPlaceholderText('חיפוש')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'סכום ↓' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^תאריך/ })).toBeInTheDocument();
        ['חשבון', 'שנה', 'חודש', 'קטגוריה'].forEach((label) =>
            expect(screen.getByText(label)).toBeInTheDocument());
        ['הכל', 'פרטי', 'משותף', 'אשתי'].forEach((name) =>
            expect(screen.getByRole('button', { name })).toBeInTheDocument());
        expect(screen.queryByText(/^(Search|Amount|Date|Account|Private)\b/)).not.toBeInTheDocument();
    });

    it('marks the active filters as pressed', () => {
        renderControls();

        expect(screen.getByRole('button', { name: 'פרטי' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'משותף' })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByRole('button', { name: 'ספטמבר' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('toggles sort direction from the translated button', () => {
        const setSortCriteria = jest.fn();
        renderControls({ setSortCriteria });

        fireEvent.click(screen.getByRole('button', { name: /^תאריך/ }));

        expect(setSortCriteria).toHaveBeenCalledWith(['date', 'asc']);
    });
});
