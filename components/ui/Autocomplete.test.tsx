import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { Autocomplete } from './Autocomplete';

function Controlled({ suggestions, onSelect }: {
    suggestions: Parameters<typeof Autocomplete>[0]['suggestions'];
    onSelect?: Parameters<typeof Autocomplete>[0]['onSelect'];
}) {
    const [value, setValue] = useState('');
    return (
        <Autocomplete
            value={value}
            onChange={setValue}
            onSelect={onSelect}
            suggestions={suggestions}
        />
    );
}

describe('Autocomplete — string suggestions (existing behaviour)', () => {
    it('inserts the string on select', () => {
        const onSelect = vi.fn();
        render(<Controlled suggestions={['Web Development', 'Web Design']} onSelect={onSelect} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'web' } });
        expect(screen.getByText('Web Development')).toBeInTheDocument();
        fireEvent.mouseDown(screen.getByText('Web Development'));
        expect(screen.getByRole('textbox')).toHaveValue('Web Development');
    });
});

describe('Autocomplete — {label, value} suggestions', () => {
    it('renders the label in the dropdown', () => {
        render(
            <Controlled suggestions={[{ label: 'Web Dev', value: 'Monthly web development retainer' }]} />
        );
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'web' } });
        expect(screen.getByText('Web Dev')).toBeInTheDocument();
    });

    it('inserts the value (not the label) on select', () => {
        render(
            <Controlled suggestions={[{ label: 'Web Dev', value: 'Monthly web development retainer' }]} />
        );
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'web' } });
        fireEvent.mouseDown(screen.getByText('Web Dev'));
        expect(screen.getByRole('textbox')).toHaveValue('Monthly web development retainer');
    });

    it('filters by label text, not value', () => {
        render(
            <Controlled suggestions={[
                { label: 'Web Dev', value: 'Monthly web development retainer' },
                { label: 'Hosting', value: 'Monthly hosting fee' },
            ]} />
        );
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'monthly' } });
        // "monthly" matches value text but NOT labels — neither should show
        expect(screen.queryByText('Web Dev')).not.toBeInTheDocument();
        expect(screen.queryByText('Hosting')).not.toBeInTheDocument();
    });

    it('falls back gracefully when label equals value', () => {
        render(<Controlled suggestions={[{ label: 'Hosting', value: 'Hosting' }]} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'host' } });
        fireEvent.mouseDown(screen.getByText('Hosting'));
        expect(screen.getByRole('textbox')).toHaveValue('Hosting');
    });

    it('does not open on mount with pre-filled value', () => {
        function Prefilled() {
            const [value, setValue] = useState('Web Development Services');
            return (
                <Autocomplete
                    value={value}
                    onChange={setValue}
                    suggestions={[{ label: 'Web Development Services', value: 'Web Development Services' }]}
                />
            );
        }
        render(<Prefilled />);
        expect(screen.queryByText('Web Development Services', { selector: 'li' })).not.toBeInTheDocument();
    });
});
