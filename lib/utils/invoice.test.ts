import { getTotalDue } from './invoice';

describe('getTotalDue', () => {
    it('returns total when use_unique_code is false', () => {
        expect(getTotalDue({ total: 1000000, use_unique_code: false, unique_code: 123 })).toBe(1000000);
    });

    it('returns total + unique_code when use_unique_code is true', () => {
        expect(getTotalDue({ total: 1000000, use_unique_code: true, unique_code: 123 })).toBe(1000123);
    });

    it('returns total when use_unique_code is true but unique_code is null', () => {
        expect(getTotalDue({ total: 1000000, use_unique_code: true, unique_code: null })).toBe(1000000);
    });

    it('returns total + 0 when use_unique_code is true and unique_code is 0', () => {
        expect(getTotalDue({ total: 1000000, use_unique_code: true, unique_code: 0 })).toBe(1000000);
    });
});
