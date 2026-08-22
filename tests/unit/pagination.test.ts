import {
  parseOffsetParams,
  buildOffsetResponse,
  buildCursorResponse,
} from '../../src/utils/pagination';

describe('Unit Test: Pagination Helper', () => {
  it('should parse offset pagination parameters correctly', () => {
    const { page, limit, skip } = parseOffsetParams('2', '10');
    expect(page).toBe(2);
    expect(limit).toBe(10);
    expect(skip).toBe(10);
  });

  it('should enforce default fallbacks for invalid or missing page/limit', () => {
    const { page, limit, skip } = parseOffsetParams(undefined, undefined);
    expect(page).toBe(1);
    expect(limit).toBe(20);
    expect(skip).toBe(0);
  });

  it('should cap max limit to 100', () => {
    const { limit } = parseOffsetParams(1, 500);
    expect(limit).toBe(100);
  });

  it('should construct standardized offset response structure', () => {
    const data = [{ id: '1' }, { id: '2' }];
    const response = buildOffsetResponse(data, 10, 1, 2);

    expect(response).toEqual({
      data,
      total: 10,
      page: 1,
      limit: 2,
    });
  });

  it('should construct standardized cursor response structure', () => {
    const items = [{ id: 'item-1' }, { id: 'item-2' }, { id: 'item-3' }];
    const limit = 2;

    const response = buildCursorResponse([...items], limit);

    expect(response.data.length).toBe(2);
    expect(response.data).toEqual([{ id: 'item-1' }, { id: 'item-2' }]);
    expect(response.next_cursor).toBe('item-3');
  });
});
