import { render, screen, fireEvent } from '@testing-library/react';
import { Autocomplete } from './Autocomplete';

describe('Autocomplete — string suggestions (existing behaviour)', () => {
    it('inserts the string on select', () => {
        const onChange = vi.fn();
        render(
            <Autocomplete
                value="web"
                onChange={onChange}
                suggestions={['Web Development', 'Web Design']}
            />
        );
        fireEvent.focus(screen.getByRole('textbox'));
        fireEvent.mouseDown(screen.getByText('Web Development'));
        expect(onChange).toHaveBeenCalledWith('Web Development');
    });
});

describe('Autocomplete — {label, value} suggestions', () => {
    it('renders the label in the dropdown', () => {
        render(
            <Autocomplete
                value="web"
                onChange={() => {}}
                suggestions={[
                    { label: 'Web Dev', value: 'Monthly web development retainer' },
                ]}
            />
        );
        fireEvent.focus(screen.getByRole('textbox'));
        expect(screen.getByText('Web Dev')).toBeInTheDocument();
    });

    it('inserts the value (not the label) on select', () => {
        const onChange = vi.fn();
        render(
            <Autocomplete
                value="web"
                onChange={onChange}
                suggestions={[
                    { label: 'Web Dev', value: 'Monthly web development retainer' },
                ]}
            />
        );
        fireEvent.focus(screen.getByRole('textbox'));
        fireEvent.mouseDown(screen.getByText('Web Dev'));
        expect(onChange).toHaveBeenCalledWith('Monthly web development retainer');
    });

    it('filters by label text, not value', () => {
        render(
            <Autocomplete
                value="monthly"
                onChange={() => {}}
                suggestions={[
                    { label: 'Web Dev', value: 'Monthly web development retainer' },
                    { label: 'Hosting', value: 'Monthly hosting fee' },
                ]}
            />
        );
        fireEvent.focus(screen.getByRole('textbox'));
        // "monthly" matches the value text but NOT the labels — neither should show
        expect(screen.queryByText('Web Dev')).not.toBeInTheDocument();
        expect(screen.queryByText('Hosting')).not.toBeInTheDocument();
    });

    it('falls back gracefully when description is null (label used as value)', () => {
        const onChange = vi.fn();
        render(
            <Autocomplete
                value="host"
                onChange={onChange}
                suggestions={[{ label: 'Hosting', value: 'Hosting' }]}
            />
        );
        fireEvent.focus(screen.getByRole('textbox'));
        fireEvent.mouseDown(screen.getByText('Hosting'));
        expect(onChange).toHaveBeenCalledWith('Hosting');
    });
});
